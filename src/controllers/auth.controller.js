const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Resident = require('../models/Resident.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const generateToken = require('../utils/generateToken');

// @desc    Register a new admin account for a society
// @route   POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { fullName, societyName, houseNo, email, phone, password, role } = req.body;

  if (!fullName || !houseNo || !email || !phone || !password) {
    throw new ApiError(400, 'fullName, houseNo, email, phone and password are all required');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trimmedName = fullName.trim();
  const trimmedPhone = phone.trim();
  const trimmedHouseNo = houseNo.trim();

  // Role chosen on the pre-signup role-selection page ("Resident User" vs
  // "Admin User"), passed through from the client. Validated against the
  // same enum as the User schema (see User.model.js) rather than trusted
  // outright — anything missing or unrecognized safely falls back to the
  // least-privileged role.
  const ALLOWED_SIGNUP_ROLES = ['user', 'admin'];
  const resolvedRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'user';

  // Cap self-service admin signup at exactly one account. This app is
  // single-society (Residents/Payments aren't scoped per society), so
  // "one admin" is a sensible global limit rather than per-society. Once
  // that first admin exists, anyone else picking "Admin User" gets a
  // clear error instead of silently becoming a second admin — they can
  // still sign up as a Resident User, or the existing admin can add
  // more admins directly in the database if that's ever needed.
  if (resolvedRole === 'admin') {
    const adminAlreadyExists = await User.exists({ role: 'admin' });
    if (adminAlreadyExists) {
      throw new ApiError(
        409,
        'An admin account already exists for this society. Please contact your existing admin, or sign up as a Resident User instead.',
      );
    }
  }

  const user = await User.create({
    fullName: trimmedName,
    societyName: societyName?.trim() || 'Royal Avenue',
    houseNo: trimmedHouseNo,
    email: email.toLowerCase().trim(),
    phone: trimmedPhone,
    passwordHash,
    role: resolvedRole,
  });

  // Keep the Residents Directory in sync: if this house number is already
  // there (e.g. imported from an Excel sheet), update it with the signed-up
  // owner's name/phone; otherwise create a fresh resident entry for them.
  const existingResident = await Resident.findOne({ flat: trimmedHouseNo });
  if (existingResident) {
    existingResident.name = trimmedName;
    existingResident.phone = trimmedPhone;
    await existingResident.save();
  } else {
    await Resident.create({
      name: trimmedName,
      flat: trimmedHouseNo,
      phone: trimmedPhone,
      status: 'pending',
    });
  }

  const token = generateToken(user._id);

  res.status(201).json(new ApiResponse(201, { user, token }, 'Account created successfully'));
});

// @desc    Log in with email + password
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // .select('+passwordHash') needed since the schema hides it by default
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json(new ApiResponse(200, { user, token }, 'Logged in successfully'));
});

// @desc    Get the currently authenticated user (used to restore a session on page reload)
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.status(200).json(new ApiResponse(200, req.user));
});

module.exports = { signup, login, getMe };