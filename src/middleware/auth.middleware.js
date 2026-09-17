const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User.model');

/**
 * Protects a route: requires a valid Bearer token in the Authorization
 * header, verifies it, and attaches the corresponding user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized — no token provided');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized — invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized — user no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Must be used AFTER `protect`, since
 * it relies on req.user already being set.
 *
 * Usage: router.delete('/:id', protect, restrictTo('admin'), deleteResident);
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized — no user on request');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
};

module.exports = { protect, restrictTo };