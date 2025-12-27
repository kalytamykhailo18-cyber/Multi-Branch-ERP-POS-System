const logger = require('../utils/logger');

/**
 * Custom error class with code
 */
class AppError extends Error {
  constructor(message, code = 'E901', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
  constructor(errors) {
    super('Validation failed', 'E201', 422);
    this.errors = errors;
  }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'E301', 404);
  }
}

/**
 * Unauthorized error
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'E101') {
    super(message, code, 401);
  }
}

/**
 * Forbidden error
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'E105', 403);
  }
}

/**
 * Business logic error
 */
class BusinessError extends AppError {
  constructor(message, code = 'E401') {
    super(message, code, 400);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`${err.message}`, {
    code: err.code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'E201',
      errors
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
      code: 'E302'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'E103'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'E102'
    });
  }

  // Custom operational errors
  if (err.isOperational) {
    const response = {
      success: false,
      message: err.message,
      code: err.code
    };

    if (err.errors) {
      response.errors = err.errors;
    }

    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Unknown errors
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'E901'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(500).json(response);
};

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.BusinessError = BusinessError;
