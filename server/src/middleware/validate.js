const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Middleware to check validation results
 * Throws ValidationError if validation failed
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg
    }));
    return next(new ValidationError(formattedErrors));
  }

  next();
};

// Common validation chains

/**
 * UUID parameter validation
 */
const uuidParam = (paramName = 'id') =>
  param(paramName)
    .isUUID(4)
    .withMessage(`${paramName} must be a valid UUID`);

/**
 * UUID body field validation
 */
const uuidField = (fieldName, required = true) => {
  const chain = body(fieldName).isUUID(4).withMessage(`${fieldName} must be a valid UUID`);
  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Email validation
 */
const emailField = (fieldName = 'email', required = true) => {
  const chain = body(fieldName)
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail();
  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Password validation
 */
const passwordField = (fieldName = 'password') =>
  body(fieldName)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');

/**
 * PIN validation (4-6 digits)
 */
const pinField = (fieldName = 'pin_code') =>
  body(fieldName)
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be 4-6 characters')
    .isNumeric()
    .withMessage('PIN must contain only numbers');

/**
 * Decimal/number field validation
 */
const decimalField = (fieldName, { min, max, required = true } = {}) => {
  let chain = body(fieldName)
    .isFloat()
    .withMessage(`${fieldName} must be a valid number`);

  if (min !== undefined) {
    chain = chain.isFloat({ min }).withMessage(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined) {
    chain = chain.isFloat({ max }).withMessage(`${fieldName} must be at most ${max}`);
  }

  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Integer field validation
 */
const integerField = (fieldName, { min, max, required = true } = {}) => {
  let chain = body(fieldName)
    .isInt()
    .withMessage(`${fieldName} must be an integer`);

  if (min !== undefined) {
    chain = chain.isInt({ min }).withMessage(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined) {
    chain = chain.isInt({ max }).withMessage(`${fieldName} must be at most ${max}`);
  }

  return required ? chain : chain.optional({ nullable: true });
};

/**
 * String field validation
 */
const stringField = (fieldName, { minLength, maxLength, required = true } = {}) => {
  let chain = body(fieldName)
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim();

  if (minLength !== undefined) {
    chain = chain.isLength({ min: minLength }).withMessage(`${fieldName} must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined) {
    chain = chain.isLength({ max: maxLength }).withMessage(`${fieldName} must be at most ${maxLength} characters`);
  }

  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Boolean field validation
 */
const booleanField = (fieldName, required = false) => {
  const chain = body(fieldName)
    .isBoolean()
    .withMessage(`${fieldName} must be a boolean`);
  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Enum field validation
 */
const enumField = (fieldName, validValues, required = true) => {
  const chain = body(fieldName)
    .isIn(validValues)
    .withMessage(`${fieldName} must be one of: ${validValues.join(', ')}`);
  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Date field validation
 */
const dateField = (fieldName, required = true) => {
  const chain = body(fieldName)
    .isISO8601()
    .withMessage(`${fieldName} must be a valid ISO 8601 date`);
  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Date only field validation (YYYY-MM-DD)
 */
const dateOnlyField = (fieldName, required = true) => {
  const chain = body(fieldName)
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${fieldName} must be in YYYY-MM-DD format`);
  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Array field validation
 */
const arrayField = (fieldName, { minLength, maxLength, required = true } = {}) => {
  let chain = body(fieldName)
    .isArray()
    .withMessage(`${fieldName} must be an array`);

  if (minLength !== undefined) {
    chain = chain.isArray({ min: minLength }).withMessage(`${fieldName} must have at least ${minLength} items`);
  }

  if (maxLength !== undefined) {
    chain = chain.isArray({ max: maxLength }).withMessage(`${fieldName} must have at most ${maxLength} items`);
  }

  return required ? chain : chain.optional({ nullable: true });
};

/**
 * Pagination query validation
 */
const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('sort_by')
    .optional()
    .isString()
    .withMessage('sort_by must be a string'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC')
];

module.exports = {
  validate,
  uuidParam,
  uuidField,
  emailField,
  passwordField,
  pinField,
  decimalField,
  integerField,
  stringField,
  booleanField,
  enumField,
  dateField,
  dateOnlyField,
  arrayField,
  paginationQuery,
  body,
  param,
  query
};
