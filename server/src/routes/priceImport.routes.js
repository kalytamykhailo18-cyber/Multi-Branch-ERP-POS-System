const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const priceImportController = require('../controllers/priceImport.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  decimalField,
  booleanField,
  enumField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/price-imports'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/prices/upload
 * @desc    Upload price list file for processing
 * @access  Private (can_import_prices)
 */
router.post(
  '/upload',
  requirePermission('canImportPrices'),
  upload.single('file'),
  [
    body('supplier_id').optional().isUUID(4),
    body('margin_percentage').optional().isFloat({ min: 0, max: 500 }),
    body('rounding_rule').optional().isIn(['NONE', 'UP', 'DOWN', 'NEAREST']),
    body('rounding_value').optional().isInt({ min: 0 }),
    validate
  ],
  priceImportController.uploadFile
);

/**
 * @route   GET /api/v1/prices/batch/:id
 * @desc    Get import batch details
 * @access  Private
 */
router.get(
  '/batch/:id',
  [uuidParam('id'), validate],
  priceImportController.getBatch
);

/**
 * @route   GET /api/v1/prices/batch/:id/items
 * @desc    Get import batch items
 * @access  Private
 */
router.get(
  '/batch/:id/items',
  [
    uuidParam('id'),
    ...paginationQuery,
    query('match_status').optional().isIn(['MATCHED', 'SUGGESTED', 'NOT_FOUND', 'MANUAL']),
    query('search').optional().isString(),
    validate
  ],
  priceImportController.getBatchItems
);

/**
 * @route   GET /api/v1/prices/batches
 * @desc    Get all import batches
 * @access  Private
 */
router.get(
  '/batches',
  [
    ...paginationQuery,
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'READY', 'APPLIED', 'CANCELLED', 'REVERTED']),
    query('supplier_id').optional().isUUID(4),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  priceImportController.getBatches
);

/**
 * @route   PUT /api/v1/prices/batch/:id/config
 * @desc    Update batch configuration (margin, rounding)
 * @access  Private (can_import_prices)
 */
router.put(
  '/batch/:id/config',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    body('margin_percentage').optional().isFloat({ min: 0, max: 500 }),
    body('rounding_rule').optional().isIn(['NONE', 'UP', 'DOWN', 'NEAREST']),
    body('rounding_value').optional().isInt({ min: 0 }),
    validate
  ],
  priceImportController.updateBatchConfig
);

/**
 * @route   POST /api/v1/prices/batch/:id/recalculate
 * @desc    Recalculate prices with current config
 * @access  Private (can_import_prices)
 */
router.post(
  '/batch/:id/recalculate',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.recalculate
);

/**
 * @route   PUT /api/v1/prices/item/:id/match
 * @desc    Match import item to product
 * @access  Private (can_import_prices)
 */
router.put(
  '/item/:id/match',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    uuidField('product_id'),
    validate
  ],
  priceImportController.matchItem
);

/**
 * @route   PUT /api/v1/prices/item/:id/select
 * @desc    Toggle item selection
 * @access  Private (can_import_prices)
 */
router.put(
  '/item/:id/select',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    booleanField('is_selected'),
    validate
  ],
  priceImportController.toggleItemSelection
);

/**
 * @route   PUT /api/v1/prices/batch/:id/select-all
 * @desc    Select/deselect all items in batch
 * @access  Private (can_import_prices)
 */
router.put(
  '/batch/:id/select-all',
  requirePermission('canImportPrices'),
  [
    uuidParam('id'),
    booleanField('is_selected'),
    body('match_status').optional().isIn(['MATCHED', 'SUGGESTED', 'NOT_FOUND', 'MANUAL']),
    validate
  ],
  priceImportController.selectAllItems
);

/**
 * @route   POST /api/v1/prices/batch/:id/apply
 * @desc    Apply selected price changes
 * @access  Private (can_import_prices)
 */
router.post(
  '/batch/:id/apply',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.applyPrices
);

/**
 * @route   DELETE /api/v1/prices/batch/:id
 * @desc    Cancel/delete import batch
 * @access  Private (can_import_prices)
 */
router.delete(
  '/batch/:id',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.cancelBatch
);

/**
 * @route   POST /api/v1/prices/batch/:id/revert
 * @desc    Revert applied prices
 * @access  Private (can_import_prices)
 */
router.post(
  '/batch/:id/revert',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  priceImportController.revertPrices
);

/**
 * @route   GET /api/v1/prices/history
 * @desc    Get price change history
 * @access  Private
 */
router.get(
  '/history',
  [
    ...paginationQuery,
    query('product_id').optional().isUUID(4),
    query('import_batch_id').optional().isUUID(4),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  priceImportController.getHistory
);

module.exports = router;
