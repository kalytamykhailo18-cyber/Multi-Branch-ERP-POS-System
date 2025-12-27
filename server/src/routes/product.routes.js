const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  booleanField,
  decimalField,
  integerField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('category_id').optional().isUUID(4),
    query('is_active').optional().isBoolean(),
    query('is_weighable').optional().isBoolean(),
    query('low_stock').optional().isBoolean(),
    query('search').optional().isString(),
    query('branch_id').optional().isUUID(4),
    validate
  ],
  productController.getAll
);

/**
 * @route   GET /api/v1/products/pos
 * @desc    Get products formatted for POS (simplified)
 * @access  Private
 */
router.get(
  '/pos',
  [
    query('branch_id').isUUID(4).withMessage('branch_id is required'),
    query('category_id').optional().isUUID(4),
    query('search').optional().isString(),
    validate
  ],
  productController.getForPOS
);

/**
 * @route   GET /api/v1/products/barcode/:barcode
 * @desc    Get product by barcode
 * @access  Private
 */
router.get('/barcode/:barcode', productController.getByBarcode);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  productController.getById
);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (can_manage_products)
 */
router.post(
  '/',
  requirePermission('canManageProducts'),
  [
    stringField('sku', { minLength: 1, maxLength: 50 }),
    stringField('barcode', { maxLength: 50, required: false }),
    stringField('name', { minLength: 1, maxLength: 200 }),
    stringField('short_name', { maxLength: 50, required: false }),
    stringField('description', { required: false }),
    uuidField('category_id', false),
    uuidField('unit_id'),
    decimalField('cost_price', { min: 0, required: false }),
    decimalField('selling_price', { min: 0 }),
    decimalField('margin_percent', { required: false }),
    decimalField('tax_rate', { min: 0, max: 100, required: false }),
    booleanField('is_tax_included'),
    booleanField('track_stock'),
    decimalField('minimum_stock', { min: 0, required: false }),
    booleanField('is_weighable'),
    decimalField('shrinkage_percent', { min: 0, max: 100, required: false }),
    integerField('scale_plu', { min: 1, required: false }),
    booleanField('export_to_scale'),
    booleanField('is_featured'),
    stringField('image_url', { maxLength: 500, required: false }),
    stringField('thumbnail_url', { maxLength: 500, required: false }),
    validate
  ],
  productController.create
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (can_manage_products)
 */
router.put(
  '/:id',
  requirePermission('canManageProducts'),
  [
    uuidParam('id'),
    stringField('sku', { minLength: 1, maxLength: 50, required: false }),
    stringField('barcode', { maxLength: 50, required: false }),
    stringField('name', { minLength: 1, maxLength: 200, required: false }),
    stringField('short_name', { maxLength: 50, required: false }),
    stringField('description', { required: false }),
    uuidField('category_id', false),
    uuidField('unit_id', false),
    decimalField('cost_price', { min: 0, required: false }),
    decimalField('selling_price', { min: 0, required: false }),
    decimalField('margin_percent', { required: false }),
    decimalField('tax_rate', { min: 0, max: 100, required: false }),
    booleanField('is_tax_included'),
    booleanField('track_stock'),
    decimalField('minimum_stock', { min: 0, required: false }),
    booleanField('is_weighable'),
    decimalField('shrinkage_percent', { min: 0, max: 100, required: false }),
    integerField('scale_plu', { min: 1, required: false }),
    booleanField('export_to_scale'),
    booleanField('is_active'),
    booleanField('is_featured'),
    stringField('image_url', { maxLength: 500, required: false }),
    stringField('thumbnail_url', { maxLength: 500, required: false }),
    validate
  ],
  productController.update
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Deactivate product (soft delete)
 * @access  Private (can_manage_products)
 */
router.delete(
  '/:id',
  requirePermission('canManageProducts'),
  [uuidParam('id'), validate],
  productController.deactivate
);

/**
 * @route   GET /api/v1/products/:id/stock
 * @desc    Get stock levels across all branches
 * @access  Private
 */
router.get(
  '/:id/stock',
  [uuidParam('id'), validate],
  productController.getStock
);

/**
 * @route   GET /api/v1/products/:id/price-history
 * @desc    Get price history for product
 * @access  Private
 */
router.get(
  '/:id/price-history',
  [uuidParam('id'), ...paginationQuery, validate],
  productController.getPriceHistory
);

/**
 * @route   PUT /api/v1/products/:id/prices
 * @desc    Update product prices
 * @access  Private (can_manage_products)
 */
router.put(
  '/:id/prices',
  requirePermission('canManageProducts'),
  [
    uuidParam('id'),
    decimalField('cost_price', { min: 0, required: false }),
    decimalField('selling_price', { min: 0, required: false }),
    stringField('reason', { maxLength: 255, required: false }),
    validate
  ],
  productController.updatePrices
);

module.exports = router;
