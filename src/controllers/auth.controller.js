const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const generateToken = require('../utils/generateToken');

// @desc    Register a new admin account for a society
// @route   POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { fullName, societyName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    throw new ApiError(400, 'fullName, email, phone and password are all required');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: fullName.trim(),
    societyName: societyName?.trim() || 'Royal Avenue',
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    passwordHash,
  });

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