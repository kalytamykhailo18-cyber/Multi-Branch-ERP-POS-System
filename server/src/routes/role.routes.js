const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  stringField,
  booleanField,
  decimalField
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles
 * @access  Private
 */
router.get('/', roleController.getAll);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  roleController.getById
);

/**
 * @route   POST /api/v1/roles
 * @desc    Create new role
 * @access  Private (Owner only)
 */
router.post(
  '/',
  requireRole(['OWNER']),
  [
    stringField('name', { minLength: 1, maxLength: 50 }),
    stringField('description', { maxLength: 255, required: false }),
    booleanField('can_void_sale'),
    booleanField('can_give_discount'),
    booleanField('can_view_all_branches'),
    booleanField('can_close_register'),
    booleanField('can_reopen_closing'),
    booleanField('can_adjust_stock'),
    booleanField('can_import_prices'),
    booleanField('can_manage_users'),
    booleanField('can_view_reports'),
    booleanField('can_view_financials'),
    booleanField('can_manage_suppliers'),
    booleanField('can_manage_products'),
    booleanField('can_issue_invoice_a'),
    decimalField('max_discount_percent', { min: 0, max: 100, required: false }),
    validate
  ],
  roleController.create
);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update role
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  requireRole(['OWNER']),
  [
    uuidParam('id'),
    stringField('name', { minLength: 1, maxLength: 50, required: false }),
    stringField('description', { maxLength: 255, required: false }),
    booleanField('can_void_sale'),
    booleanField('can_give_discount'),
    booleanField('can_view_all_branches'),
    booleanField('can_close_register'),
    booleanField('can_reopen_closing'),
    booleanField('can_adjust_stock'),
    booleanField('can_import_prices'),
    booleanField('can_manage_users'),
    booleanField('can_view_reports'),
    booleanField('can_view_financials'),
    booleanField('can_manage_suppliers'),
    booleanField('can_manage_products'),
    booleanField('can_issue_invoice_a'),
    decimalField('max_discount_percent', { min: 0, max: 100, required: false }),
    validate
  ],
  roleController.update
);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete role (only if no users assigned)
 * @access  Private (Owner only)
 */
router.delete(
  '/:id',
  requireRole(['OWNER']),
  [uuidParam('id'), validate],
  roleController.remove
);

module.exports = router;
