/**
 * Standardized application error used across controllers.
 * Thrown errors of this type are caught by the global error handler
 * and turned into a consistent JSON response.
 */
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
