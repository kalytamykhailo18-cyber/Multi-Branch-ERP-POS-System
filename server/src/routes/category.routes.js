const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  booleanField,
  integerField,
  paginationQuery
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories (flat list)
 * @access  Private
 */
router.get(
  '/',
  paginationQuery,
  validate,
  categoryController.getAll
);

/**
 * @route   GET /api/v1/categories/tree
 * @desc    Get categories as tree structure
 * @access  Private
 */
router.get('/tree', categoryController.getTree);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  categoryController.getById
);

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Private (can_manage_products)
 */
router.post(
  '/',
  requirePermission('canManageProducts'),
  [
    uuidField('parent_id', false),
    stringField('name', { minLength: 1, maxLength: 100 }),
    stringField('description', { required: false }),
    integerField('sort_order', { min: 0, required: false }),
    validate
  ],
  categoryController.create
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (can_manage_products)
 */
router.put(
  '/:id',
  requirePermission('canManageProducts'),
  [
    uuidParam('id'),
    uuidField('parent_id', false),
    stringField('name', { minLength: 1, maxLength: 100, required: false }),
    stringField('description', { required: false }),
    integerField('sort_order', { min: 0, required: false }),
    booleanField('is_active'),
    validate
  ],
  categoryController.update
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Deactivate category
 * @access  Private (can_manage_products)
 */
router.delete(
  '/:id',
  requirePermission('canManageProducts'),
  [uuidParam('id'), validate],
  categoryController.deactivate
);

/**
 * @route   GET /api/v1/categories/:id/products
 * @desc    Get products in category
 * @access  Private
 */
router.get(
  '/:id/products',
  [uuidParam('id'), ...paginationQuery, validate],
  categoryController.getProducts
);

module.exports = router;
