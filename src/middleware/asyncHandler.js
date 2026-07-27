/**
 * Wraps an async controller/middleware function so any rejected promise
 * is forwarded to Express's error handling middleware via next(err).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
