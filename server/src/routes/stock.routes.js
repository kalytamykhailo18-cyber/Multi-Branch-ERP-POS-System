const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { authenticate, requirePermission, requireBranchAccess } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  decimalField,
  arrayField,
  enumField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/stock
 * @desc    Get stock levels with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('product_id').optional().isUUID(4),
    query('below_minimum').optional().isBoolean(),
    query('has_stock').optional().isBoolean(),
    query('search').optional().isString(),
    validate
  ],
  stockController.getBranchStock
);

/**
 * @route   GET /api/v1/stock/branch/:branchId
 * @desc    Get stock for specific branch
 * @access  Private
 */
router.get(
  '/branch/:branchId',
  [
    uuidParam('branchId'),
    ...paginationQuery,
    query('below_minimum').optional().isBoolean(),
    query('search').optional().isString(),
    validate
  ],
  requireBranchAccess('branchId'),
  stockController.getBranchStock
);

/**
 * @route   GET /api/v1/stock/product/:productId
 * @desc    Get stock for specific product across all branches
 * @access  Private
 */
router.get(
  '/product/:productId',
  [uuidParam('productId'), validate],
  stockController.getProductStock
);

/**
 * @route   POST /api/v1/stock/adjustment
 * @desc    Create stock adjustment
 * @access  Private (can_adjust_stock)
 */
router.post(
  '/adjustment',
  requirePermission('canAdjustStock'),
  [
    uuidField('branch_id'),
    uuidField('product_id'),
    enumField('adjustment_type', ['PLUS', 'MINUS']),
    decimalField('quantity', { min: 0.001 }),
    stringField('reason', { minLength: 1, maxLength: 255 }),
    stringField('notes', { required: false }),
    validate
  ],
  stockController.adjustStock
);

/**
 * @route   POST /api/v1/stock/inventory-count
 * @desc    Submit inventory count
 * @access  Private (can_adjust_stock)
 */
router.post(
  '/inventory-count',
  requirePermission('canAdjustStock'),
  [
    uuidField('branch_id'),
    arrayField('entries', { minLength: 1 }),
    body('entries.*.product_id').isUUID(4).withMessage('product_id must be a valid UUID'),
    body('entries.*.counted_quantity').isFloat({ min: 0 }).withMessage('counted_quantity must be >= 0'),
    stringField('notes', { required: false }),
    validate
  ],
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/stock/movements
 * @desc    Get stock movements with filters
 * @access  Private
 */
router.get(
  '/movements',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('product_id').optional().isUUID(4),
    query('movement_type').optional().isIn([
      'SALE', 'RETURN', 'PURCHASE', 'TRANSFER_OUT', 'TRANSFER_IN',
      'ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'SHRINKAGE', 'INITIAL', 'INVENTORY_COUNT'
    ]),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  stockController.getMovements
);

// ===== Stock Transfers =====

/**
 * @route   GET /api/v1/stock/transfers
 * @desc    Get stock transfers with filters
 * @access  Private
 */
router.get(
  '/transfers',
  [
    ...paginationQuery,
    query('from_branch_id').optional().isUUID(4),
    query('to_branch_id').optional().isUUID(4),
    query('status').optional().isIn(['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']),
    validate
  ],
  stockController.getTransfers
);

/**
 * @route   GET /api/v1/stock/transfers/:id
 * @desc    Get transfer by ID
 * @access  Private
 */
router.get(
  '/transfers/:id',
  [uuidParam('id'), validate],
  stockController.getTransferById
);

/**
 * @route   POST /api/v1/stock/transfers
 * @desc    Create stock transfer
 * @access  Private (can_adjust_stock)
 */
router.post(
  '/transfers',
  requirePermission('canAdjustStock'),
  [
    uuidField('from_branch_id'),
    uuidField('to_branch_id'),
    stringField('notes', { required: false }),
    arrayField('items', { minLength: 1 }),
    body('items.*.product_id').isUUID(4).withMessage('product_id must be a valid UUID'),
    body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('quantity must be > 0'),
    validate
  ],
  stockController.createTransfer
);

/**
 * @route   POST /api/v1/stock/transfers/:id/approve
 * @desc    Approve transfer (start transit)
 * @access  Private (can_adjust_stock)
 */
router.post(
  '/transfers/:id/approve',
  requirePermission('canAdjustStock'),
  [uuidParam('id'), validate],
  stockController.approveTransfer
);

/**
 * @route   POST /api/v1/stock/transfers/:id/receive
 * @desc    Receive transfer at destination
 * @access  Private
 */
router.post(
  '/transfers/:id/receive',
  [
    uuidParam('id'),
    arrayField('items', { minLength: 1 }),
    body('items.*.item_id').isUUID(4).withMessage('item_id must be a valid UUID'),
    body('items.*.quantity_received').isFloat({ min: 0 }).withMessage('quantity_received must be >= 0'),
    stringField('notes', { required: false }),
    validate
  ],
  stockController.receiveTransfer
);

/**
 * @route   POST /api/v1/stock/transfers/:id/cancel
 * @desc    Cancel transfer
 * @access  Private (can_adjust_stock)
 */
router.post(
  '/transfers/:id/cancel',
  requirePermission('canAdjustStock'),
  [
    uuidParam('id'),
    stringField('reason', { minLength: 1, maxLength: 255 }),
    validate
  ],
  stockController.cancelTransfer
);

/**
 * @route   GET /api/v1/stock/low-stock
 * @desc    Get products with low stock
 * @access  Private
 */
router.get(
  '/low-stock',
  [
    query('branch_id').optional().isUUID(4),
    ...paginationQuery,
    validate
  ],
  stockController.getBranchStock
);

/**
 * @route   POST /api/v1/stock/shrinkage
 * @desc    Record shrinkage for product
 * @access  Private (can_adjust_stock)
 */
router.post(
  '/shrinkage',
  requirePermission('canAdjustStock'),
  [
    uuidField('branch_id'),
    uuidField('product_id'),
    decimalField('quantity', { min: 0.001 }),
    stringField('notes', { required: false }),
    validate
  ],
  stockController.recordShrinkage
);

module.exports = router;
