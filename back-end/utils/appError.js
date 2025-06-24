/**
 * Custom error class for operational errors (predictable runtime errors)
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx or 5xx)
   * @param {Object} [details] - Additional error metadata
   * @param {boolean} [isOperational=true] - Marks if error is operational (vs programmer error)
   */
  constructor(message, statusCode, details = {}, isOperational = true) {
    super(message);
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Creates a "Bad Request" (400) error
   * @static
   * @param {string} message - Error description
   * @param {Object} [details] - Additional context
   * @returns {AppError}
   */
  static badRequest(message, details) {
    return new AppError(message, 400, details);
  }

  /**
   * Creates an "Unauthorized" (401) error
   * @static
   * @param {string} [message='Unauthorized'] - Error description
   * @returns {AppError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  /**
   * Creates a "Not Found" (404) error
   * @static
   * @param {string} resource - Name of missing resource
   * @returns {AppError}
   */
  static notFound(resource) {
    return new AppError(`${resource} not found`, 404);
  }

  /**
   * Creates a "Conflict" (409) error
   * @static
   * @param {string} message - Conflict description
   * @returns {AppError}
   */
  static conflict(message) {
    return new AppError(message, 409);
  }

  /**
   * Creates an "Internal Server Error" (500)
   * @static
   * @param {string} [message='Internal server error'] 
   * @returns {AppError}
   */
  static internal(message = 'Internal server error') {
    return new AppError(message, 500, {}, false);
  }
}

export default AppError;