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
  const { fullName, societyName, houseNo, email, phone, password } = req.body;

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

  // Public signup NEVER accepts a client-supplied role — every account
  // created through this endpoint is a normal resident ('user'). Admin
  // accounts must be granted explicitly (e.g. directly in the database
  // or via a separate admin-only endpoint), never through self-signup.
  const user = await User.create({
    fullName: trimmedName,
    societyName: societyName?.trim() || 'Royal Avenue',
    houseNo: trimmedHouseNo,
    email: email.toLowerCase().trim(),
    phone: trimmedPhone,
    passwordHash,
    role: 'user',
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