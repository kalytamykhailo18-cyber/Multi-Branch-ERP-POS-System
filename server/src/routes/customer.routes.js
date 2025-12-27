const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate } = require('../middleware/auth');
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

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('is_wholesale').optional().isBoolean(),
    query('is_active').optional().isBoolean(),
    query('loyalty_tier').optional().isIn(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']),
    query('search').optional().isString(),
    query('has_credit').optional().isBoolean(),
    validate
  ],
  customerController.getAll
);

/**
 * @route   GET /api/v1/customers/search
 * @desc    Quick search for POS (by phone, QR, document)
 * @access  Private
 */
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    validate
  ],
  customerController.quickSearch
);

/**
 * @route   GET /api/v1/customers/qr/:qrCode
 * @desc    Get customer by QR code
 * @access  Private
 */
router.get('/qr/:qrCode', customerController.getByQRCode);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  customerController.getById
);

/**
 * @route   POST /api/v1/customers
 * @desc    Create new customer
 * @access  Private
 */
router.post(
  '/',
  [
    stringField('customer_code', { maxLength: 20, required: false }),
    stringField('first_name', { maxLength: 100, required: false }),
    stringField('last_name', { maxLength: 100, required: false }),
    stringField('company_name', { maxLength: 200, required: false }),
    enumField('document_type', ['DNI', 'CUIT', 'CUIL', 'PASSPORT', 'OTHER'], false),
    stringField('document_number', { maxLength: 20, required: false }),
    enumField('tax_condition', ['CONSUMIDOR_FINAL', 'MONOTRIBUTO', 'RESP_INSCRIPTO', 'EXENTO'], false),
    emailField('email', false),
    stringField('phone', { maxLength: 50, required: false }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('neighborhood', { maxLength: 100, required: false }),
    stringField('city', { maxLength: 100, required: false }),
    stringField('postal_code', { maxLength: 20, required: false }),
    booleanField('is_wholesale'),
    decimalField('wholesale_discount_percent', { min: 0, max: 100, required: false }),
    uuidField('assigned_vendor_id', false),
    stringField('notes', { required: false }),
    validate
  ],
  customerController.create
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private
 */
router.put(
  '/:id',
  [
    uuidParam('id'),
    stringField('customer_code', { maxLength: 20, required: false }),
    stringField('first_name', { maxLength: 100, required: false }),
    stringField('last_name', { maxLength: 100, required: false }),
    stringField('company_name', { maxLength: 200, required: false }),
    enumField('document_type', ['DNI', 'CUIT', 'CUIL', 'PASSPORT', 'OTHER'], false),
    stringField('document_number', { maxLength: 20, required: false }),
    enumField('tax_condition', ['CONSUMIDOR_FINAL', 'MONOTRIBUTO', 'RESP_INSCRIPTO', 'EXENTO'], false),
    emailField('email', false),
    stringField('phone', { maxLength: 50, required: false }),
    stringField('address', { maxLength: 255, required: false }),
    stringField('neighborhood', { maxLength: 100, required: false }),
    stringField('city', { maxLength: 100, required: false }),
    stringField('postal_code', { maxLength: 20, required: false }),
    booleanField('is_wholesale'),
    decimalField('wholesale_discount_percent', { min: 0, max: 100, required: false }),
    uuidField('assigned_vendor_id', false),
    booleanField('is_active'),
    stringField('notes', { required: false }),
    validate
  ],
  customerController.update
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Deactivate customer (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  [uuidParam('id'), validate],
  customerController.deactivate
);

/**
 * @route   GET /api/v1/customers/:id/loyalty
 * @desc    Get loyalty transactions for customer
 * @access  Private
 */
router.get(
  '/:id/loyalty',
  [uuidParam('id'), ...paginationQuery, validate],
  customerController.getLoyaltyTransactions
);

/**
 * @route   POST /api/v1/customers/:id/loyalty
 * @desc    Add/adjust loyalty points
 * @access  Private
 */
router.post(
  '/:id/loyalty',
  [
    uuidParam('id'),
    integerField('points'),
    stringField('description', { maxLength: 255, required: false }),
    validate
  ],
  customerController.addLoyaltyPoints
);

/**
 * @route   GET /api/v1/customers/:id/credit
 * @desc    Get credit transactions for customer
 * @access  Private
 */
router.get(
  '/:id/credit',
  [uuidParam('id'), ...paginationQuery, validate],
  customerController.getCreditTransactions
);

/**
 * @route   POST /api/v1/customers/:id/credit
 * @desc    Add/adjust credit balance
 * @access  Private
 */
router.post(
  '/:id/credit',
  [
    uuidParam('id'),
    decimalField('amount'),
    stringField('description', { maxLength: 255, required: false }),
    validate
  ],
  customerController.addCredit
);

/**
 * @route   GET /api/v1/customers/:id/sales
 * @desc    Get sales history for customer
 * @access  Private
 */
router.get(
  '/:id/sales',
  [uuidParam('id'), ...paginationQuery, validate],
  customerController.getSalesHistory
);

module.exports = router;
