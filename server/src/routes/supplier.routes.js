const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supplierController = require('../controllers/supplier.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  emailField,
  stringField,
  booleanField,
  decimalField,
  integerField,
  enumField,
  paginationQuery,
  query
} = require('../middleware/validate');

// Configure multer for price list uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pricelist-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Excel, CSV'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/suppliers
 * @desc    Get all suppliers
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('is_active').optional().isBoolean(),
    query('search').optional().isString(),
    validate
  ],
  supplierController.getAll
);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  supplierController.getById
);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create new supplier
 * @access  Private (can_manage_suppliers)
 */
router.post(
  '/',
  requirePermission('canManageSuppliers'),
  [
    stringField('code', { minLength: 1, maxLength: 20 }),
    stringField('name', { minLength: 1, maxLength: 200 }),
    stringField('legal_name', { maxLength: 200, required: false }),
    stringField('cuit', { maxLength: 20, required: false }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('city', { maxLength: 100, required: false }),
    stringField('phone', { maxLength: 50, required: false }),
    emailField('email', false),
    stringField('website', { maxLength: 200, required: false }),
    stringField('contact_name', { maxLength: 100, required: false }),
    stringField('contact_phone', { maxLength: 50, required: false }),
    emailField('contact_email', false),
    integerField('payment_terms_days', { min: 0, required: false }),
    decimalField('credit_limit', { min: 0, required: false }),
    enumField('price_list_format', ['PDF', 'EXCEL', 'CSV'], false),
    decimalField('default_margin_percent', { min: 0, max: 100, required: false }),
    stringField('notes', { required: false }),
    validate
  ],
  supplierController.create
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Update supplier
 * @access  Private (can_manage_suppliers)
 */
router.put(
  '/:id',
  requirePermission('canManageSuppliers'),
  [
    uuidParam('id'),
    stringField('code', { minLength: 1, maxLength: 20, required: false }),
    stringField('name', { minLength: 1, maxLength: 200, required: false }),
    stringField('legal_name', { maxLength: 200, required: false }),
    stringField('cuit', { maxLength: 20, required: false }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('city', { maxLength: 100, required: false }),
    stringField('phone', { maxLength: 50, required: false }),
    emailField('email', false),
    stringField('website', { maxLength: 200, required: false }),
    stringField('contact_name', { maxLength: 100, required: false }),
    stringField('contact_phone', { maxLength: 50, required: false }),
    emailField('contact_email', false),
    integerField('payment_terms_days', { min: 0, required: false }),
    decimalField('credit_limit', { min: 0, required: false }),
    enumField('price_list_format', ['PDF', 'EXCEL', 'CSV'], false),
    decimalField('default_margin_percent', { min: 0, max: 100, required: false }),
    booleanField('is_active'),
    stringField('notes', { required: false }),
    validate
  ],
  supplierController.update
);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Deactivate supplier (soft delete)
 * @access  Private (can_manage_suppliers)
 */
router.delete(
  '/:id',
  requirePermission('canManageSuppliers'),
  [uuidParam('id'), validate],
  supplierController.deactivate
);

/**
 * @route   GET /api/v1/suppliers/:id/products
 * @desc    Get products from supplier
 * @access  Private
 */
router.get(
  '/:id/products',
  [uuidParam('id'), ...paginationQuery, validate],
  supplierController.getSupplierProducts
);

/**
 * @route   POST /api/v1/suppliers/:id/products
 * @desc    Link product to supplier
 * @access  Private (can_manage_suppliers)
 */
router.post(
  '/:id/products',
  requirePermission('canManageSuppliers'),
  [
    uuidParam('id'),
    uuidField('product_id'),
    stringField('supplier_sku', { maxLength: 50, required: false }),
    stringField('supplier_product_name', { maxLength: 200, required: false }),
    decimalField('supplier_price', { min: 0 }),
    booleanField('is_preferred'),
    validate
  ],
  supplierController.create
);

// ===== Price Import Routes =====

/**
 * @route   POST /api/v1/suppliers/:id/import
 * @desc    Upload price list for import
 * @access  Private (can_import_prices)
 */
router.post(
  '/:id/import',
  requirePermission('canImportPrices'),
  [uuidParam('id'), validate],
  upload.single('file'),
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/suppliers/import/batches
 * @desc    Get import batches with filters
 * @access  Private (can_import_prices)
 */
router.get(
  '/import/batches',
  requirePermission('canImportPrices'),
  [
    ...paginationQuery,
    query('supplier_id').optional().isUUID(4),
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
    validate
  ],
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/suppliers/import/batches/:batchId
 * @desc    Get import batch details with items
 * @access  Private (can_import_prices)
 */
router.get(
  '/import/batches/:batchId',
  requirePermission('canImportPrices'),
  [uuidParam('batchId'), validate],
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   POST /api/v1/suppliers/import/batches/:batchId/process
 * @desc    Process import batch (OCR/parse file)
 * @access  Private (can_import_prices)
 */
router.post(
  '/import/batches/:batchId/process',
  requirePermission('canImportPrices'),
  [uuidParam('batchId'), validate],
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   PUT /api/v1/suppliers/import/items/:itemId
 * @desc    Update import item (match/skip/set prices)
 * @access  Private (can_import_prices)
 */
router.put(
  '/import/items/:itemId',
  requirePermission('canImportPrices'),
  [
    uuidParam('itemId'),
    uuidField('matched_product_id', false),
    decimalField('new_cost_price', { min: 0, required: false }),
    decimalField('new_selling_price', { min: 0, required: false }),
    booleanField('skip'),
    validate
  ],
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   POST /api/v1/suppliers/import/batches/:batchId/apply
 * @desc    Apply all matched items in batch
 * @access  Private (can_import_prices)
 */
router.post(
  '/import/batches/:batchId/apply',
  requirePermission('canImportPrices'),
  [uuidParam('batchId'), validate],
  async (req, res) => res.status(501).json({ message: 'Not implemented' })
);

module.exports = router;
