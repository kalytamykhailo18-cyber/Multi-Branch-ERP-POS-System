const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { authenticate, requirePermission, requireRole } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  stringField,
  booleanField,
  integerField,
  enumField,
  paginationQuery
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/branches
 * @desc    Get all branches (filtered by user access)
 * @access  Private
 */
router.get(
  '/',
  paginationQuery,
  validate,
  branchController.getAll
);

/**
 * @route   GET /api/v1/branches/:id
 * @desc    Get branch by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  branchController.getById
);

/**
 * @route   POST /api/v1/branches
 * @desc    Create new branch
 * @access  Private (Owner only)
 */
router.post(
  '/',
  requireRole(['OWNER']),
  [
    stringField('code', { minLength: 1, maxLength: 10 }),
    stringField('name', { minLength: 1, maxLength: 100 }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('neighborhood', { maxLength: 100, required: false }),
    stringField('city', { maxLength: 100, required: false }),
    stringField('postal_code', { maxLength: 20, required: false }),
    stringField('phone', { maxLength: 50, required: false }),
    stringField('email', { maxLength: 100, required: false }),
    stringField('midday_closing_time', { required: false }),
    stringField('evening_closing_time', { required: false }),
    booleanField('has_shift_change'),
    integerField('factuhoy_point_of_sale', { min: 1, required: false }),
    enumField('default_invoice_type', ['A', 'B', 'C'], false),
    enumField('device_type', ['PC', 'TABLET'], false),
    stringField('printer_model', { maxLength: 100, required: false }),
    enumField('printer_type', ['THERMAL', 'LASER', 'PDF'], false),
    stringField('timezone', { maxLength: 50, required: false }),
    validate
  ],
  branchController.create
);

/**
 * @route   PUT /api/v1/branches/:id
 * @desc    Update branch
 * @access  Private (Owner/Manager)
 */
router.put(
  '/:id',
  requireRole(['OWNER', 'MANAGER']),
  [
    uuidParam('id'),
    stringField('code', { minLength: 1, maxLength: 10, required: false }),
    stringField('name', { minLength: 1, maxLength: 100, required: false }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('neighborhood', { maxLength: 100, required: false }),
    stringField('city', { maxLength: 100, required: false }),
    stringField('postal_code', { maxLength: 20, required: false }),
    stringField('phone', { maxLength: 50, required: false }),
    stringField('email', { maxLength: 100, required: false }),
    stringField('midday_closing_time', { required: false }),
    stringField('evening_closing_time', { required: false }),
    booleanField('has_shift_change'),
    integerField('factuhoy_point_of_sale', { min: 1, required: false }),
    enumField('default_invoice_type', ['A', 'B', 'C'], false),
    enumField('device_type', ['PC', 'TABLET'], false),
    stringField('printer_model', { maxLength: 100, required: false }),
    enumField('printer_type', ['THERMAL', 'LASER', 'PDF'], false),
    stringField('timezone', { maxLength: 50, required: false }),
    booleanField('is_active'),
    validate
  ],
  branchController.update
);

/**
 * @route   DELETE /api/v1/branches/:id
 * @desc    Deactivate branch (soft delete)
 * @access  Private (Owner only)
 */
router.delete(
  '/:id',
  requireRole(['OWNER']),
  [uuidParam('id'), validate],
  branchController.deactivate
);

/**
 * @route   GET /api/v1/branches/:id/users
 * @desc    Get users assigned to branch
 * @access  Private
 */
router.get(
  '/:id/users',
  [uuidParam('id'), ...paginationQuery, validate],
  branchController.getUsers
);

/**
 * @route   GET /api/v1/branches/:id/registers
 * @desc    Get cash registers for branch
 * @access  Private
 */
router.get(
  '/:id/registers',
  [uuidParam('id'), validate],
  branchController.getRegisters
);

/**
 * @route   GET /api/v1/branches/:id/sessions
 * @desc    Get register sessions for branch (today by default)
 * @access  Private
 */
router.get(
  '/:id/sessions',
  [uuidParam('id'), ...paginationQuery, validate],
  branchController.getSessions
);

/**
 * @route   GET /api/v1/branches/:id/stock
 * @desc    Get stock levels for branch
 * @access  Private
 */
router.get(
  '/:id/stock',
  [uuidParam('id'), ...paginationQuery, validate],
  branchController.getStock
);

module.exports = router;
