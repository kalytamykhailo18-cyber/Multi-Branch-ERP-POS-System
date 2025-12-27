const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  emailField,
  passwordField,
  stringField,
  booleanField,
  arrayField,
  paginationQuery
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (can_manage_users or own branch users)
 */
router.get(
  '/',
  paginationQuery,
  validate,
  userController.getAll
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  userController.getById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (can_manage_users)
 */
router.post(
  '/',
  requirePermission('canManageUsers'),
  [
    stringField('employee_code', { maxLength: 20, required: false }),
    emailField('email'),
    passwordField('password'),
    stringField('first_name', { minLength: 1, maxLength: 50 }),
    stringField('last_name', { minLength: 1, maxLength: 50 }),
    stringField('phone', { maxLength: 50, required: false }),
    uuidField('role_id'),
    uuidField('primary_branch_id', false),
    stringField('pin_code', { minLength: 4, maxLength: 6, required: false }),
    stringField('language', { maxLength: 10, required: false }),
    arrayField('branch_ids', { required: false }),
    validate
  ],
  userController.create
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (can_manage_users or self)
 */
router.put(
  '/:id',
  [
    uuidParam('id'),
    stringField('employee_code', { maxLength: 20, required: false }),
    emailField('email', false),
    stringField('first_name', { maxLength: 50, required: false }),
    stringField('last_name', { maxLength: 50, required: false }),
    stringField('phone', { maxLength: 50, required: false }),
    uuidField('role_id', false),
    uuidField('primary_branch_id', false),
    booleanField('is_active'),
    stringField('language', { maxLength: 10, required: false }),
    arrayField('branch_ids', { required: false }),
    validate
  ],
  userController.update
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Deactivate user (soft delete)
 * @access  Private (can_manage_users)
 */
router.delete(
  '/:id',
  requirePermission('canManageUsers'),
  [uuidParam('id'), validate],
  userController.deactivate
);

/**
 * @route   POST /api/v1/users/:id/reset-password
 * @desc    Reset user password (admin action)
 * @access  Private (can_manage_users)
 */
router.post(
  '/:id/reset-password',
  requirePermission('canManageUsers'),
  [
    uuidParam('id'),
    passwordField('new_password'),
    validate
  ],
  userController.resetPassword
);

/**
 * @route   POST /api/v1/users/:id/unlock
 * @desc    Unlock locked user account
 * @access  Private (can_manage_users)
 */
router.post(
  '/:id/unlock',
  requirePermission('canManageUsers'),
  [uuidParam('id'), validate],
  userController.unlock
);

/**
 * @route   GET /api/v1/users/:id/branches
 * @desc    Get branches assigned to user
 * @access  Private
 */
router.get(
  '/:id/branches',
  [uuidParam('id'), validate],
  userController.getBranches
);

/**
 * @route   PUT /api/v1/users/:id/branches
 * @desc    Update user's branch assignments
 * @access  Private (can_manage_users)
 */
router.put(
  '/:id/branches',
  requirePermission('canManageUsers'),
  [
    uuidParam('id'),
    arrayField('branch_ids', { minLength: 1 }),
    validate
  ],
  userController.updateBranches
);

module.exports = router;
