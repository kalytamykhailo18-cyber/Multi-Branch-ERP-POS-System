/**
 * Standard API response utilities
 * Following the type definitions in types/api.ts
 */

/**
 * Send success response with data
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const success = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    data
  };
  if (message) {
    response.message = message;
  }
  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Optional success message
 */
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Send paginated list response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 */
const paginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total_items: pagination.total_items,
      total_pages: Math.ceil(pagination.total_items / pagination.limit),
      has_next: pagination.page < Math.ceil(pagination.total_items / pagination.limit),
      has_prev: pagination.page > 1
    }
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Array} errors - Validation errors array
 */
const error = (res, message, code = 'E201', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    code
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 'E301', 404);
};

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 */
const unauthorized = (res, message = 'Unauthorized', code = 'E101') => {
  return error(res, message, code, 401);
};

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Access denied') => {
  return error(res, message, 'E105', 403);
};

/**
 * Send validation error response (422)
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 */
const validationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    code: 'E201',
    errors
  });
};

/**
 * Send internal server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 'E901', 500);
};

module.exports = {
  success,
  created,
  paginated,
  error,
  notFound,
  unauthorized,
  forbidden,
  validationError,
  serverError
};
