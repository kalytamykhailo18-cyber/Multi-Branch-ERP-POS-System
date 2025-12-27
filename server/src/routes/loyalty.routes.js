const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyalty.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  decimalField,
  integerField,
  booleanField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// ===== Loyalty Accounts =====

/**
 * @route   GET /api/v1/loyalty/accounts
 * @desc    Get all loyalty accounts
 * @access  Private
 */
router.get(
  '/accounts',
  [
    ...paginationQuery,
    query('search').optional().isString(),
    query('tier').optional().isIn(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']),
    query('is_active').optional().isBoolean(),
    validate
  ],
  loyaltyController.getAccounts
);

/**
 * @route   GET /api/v1/loyalty/accounts/:id
 * @desc    Get loyalty account by ID
 * @access  Private
 */
router.get(
  '/accounts/:id',
  [uuidParam('id'), validate],
  loyaltyController.getAccount
);

/**
 * @route   GET /api/v1/loyalty/customer/:customer_id
 * @desc    Get loyalty account by customer ID
 * @access  Private
 */
router.get(
  '/customer/:customer_id',
  [uuidParam('customer_id'), validate],
  loyaltyController.getAccountByCustomer
);

/**
 * @route   GET /api/v1/loyalty/qr/:qr_code
 * @desc    Get loyalty account by QR code
 * @access  Private
 */
router.get(
  '/qr/:qr_code',
  loyaltyController.getAccountByQR
);

/**
 * @route   POST /api/v1/loyalty/accounts
 * @desc    Create loyalty account for customer
 * @access  Private
 */
router.post(
  '/accounts',
  [
    uuidField('customer_id'),
    validate
  ],
  loyaltyController.createAccount
);

/**
 * @route   POST /api/v1/loyalty/accounts/:id/regenerate-qr
 * @desc    Generate new QR code for account
 * @access  Private (can_manage_loyalty)
 */
router.post(
  '/accounts/:id/regenerate-qr',
  requirePermission('canManageLoyalty'),
  [uuidParam('id'), validate],
  loyaltyController.regenerateQR
);

/**
 * @route   PUT /api/v1/loyalty/accounts/:id/deactivate
 * @desc    Deactivate loyalty account
 * @access  Private (can_manage_loyalty)
 */
router.put(
  '/accounts/:id/deactivate',
  requirePermission('canManageLoyalty'),
  [uuidParam('id'), validate],
  loyaltyController.deactivateAccount
);

/**
 * @route   PUT /api/v1/loyalty/accounts/:id/reactivate
 * @desc    Reactivate loyalty account
 * @access  Private (can_manage_loyalty)
 */
router.put(
  '/accounts/:id/reactivate',
  requirePermission('canManageLoyalty'),
  [uuidParam('id'), validate],
  loyaltyController.reactivateAccount
);

// ===== Points =====

/**
 * @route   POST /api/v1/loyalty/points/earn
 * @desc    Earn points from sale
 * @access  Private
 */
router.post(
  '/points/earn',
  [
    uuidField('customer_id'),
    uuidField('sale_id'),
    decimalField('sale_total', { min: 0 }),
    validate
  ],
  loyaltyController.earnPoints
);

/**
 * @route   POST /api/v1/loyalty/points/redeem
 * @desc    Redeem points
 * @access  Private
 */
router.post(
  '/points/redeem',
  [
    uuidField('customer_id'),
    integerField('points', { min: 1 }),
    body('sale_id').optional().isUUID(4),
    validate
  ],
  loyaltyController.redeemPoints
);

/**
 * @route   POST /api/v1/loyalty/points/adjust
 * @desc    Manual points adjustment
 * @access  Private (can_manage_loyalty)
 */
router.post(
  '/points/adjust',
  requirePermission('canManageLoyalty'),
  [
    uuidField('customer_id'),
    integerField('points'),
    stringField('reason', { minLength: 1, maxLength: 500 }),
    validate
  ],
  loyaltyController.adjustPoints
);

/**
 * @route   GET /api/v1/loyalty/points/transactions
 * @desc    Get points transactions
 * @access  Private
 */
router.get(
  '/points/transactions',
  [
    ...paginationQuery,
    query('customer_id').optional().isUUID(4),
    query('transaction_type').optional().isIn(['EARN', 'REDEEM', 'ADJUST', 'EXPIRE']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  loyaltyController.getPointsTransactions
);

// ===== Credit =====

/**
 * @route   POST /api/v1/loyalty/credit/give
 * @desc    Give credit (change as credit)
 * @access  Private
 */
router.post(
  '/credit/give',
  [
    uuidField('customer_id'),
    decimalField('amount', { min: 0.01 }),
    body('sale_id').optional().isUUID(4),
    stringField('reason', { required: false, maxLength: 500 }),
    validate
  ],
  loyaltyController.giveCredit
);

/**
 * @route   POST /api/v1/loyalty/credit/use
 * @desc    Use credit
 * @access  Private
 */
router.post(
  '/credit/use',
  [
    uuidField('customer_id'),
    decimalField('amount', { min: 0.01 }),
    body('sale_id').optional().isUUID(4),
    validate
  ],
  loyaltyController.useCredit
);

/**
 * @route   POST /api/v1/loyalty/credit/adjust
 * @desc    Manual credit adjustment
 * @access  Private (can_manage_loyalty)
 */
router.post(
  '/credit/adjust',
  requirePermission('canManageLoyalty'),
  [
    uuidField('customer_id'),
    decimalField('amount'),
    stringField('reason', { minLength: 1, maxLength: 500 }),
    validate
  ],
  loyaltyController.adjustCredit
);

/**
 * @route   GET /api/v1/loyalty/credit/transactions
 * @desc    Get credit transactions
 * @access  Private
 */
router.get(
  '/credit/transactions',
  [
    ...paginationQuery,
    query('customer_id').optional().isUUID(4),
    query('transaction_type').optional().isIn(['CREDIT', 'DEBIT', 'ADJUST']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  loyaltyController.getCreditTransactions
);

// ===== Configuration =====

/**
 * @route   GET /api/v1/loyalty/config
 * @desc    Get loyalty configuration
 * @access  Private
 */
router.get('/config', loyaltyController.getConfig);

/**
 * @route   PUT /api/v1/loyalty/config
 * @desc    Update loyalty configuration
 * @access  Private (can_manage_loyalty)
 */
router.put(
  '/config',
  requirePermission('canManageLoyalty'),
  [
    body('points_per_peso').optional().isFloat({ min: 0 }),
    body('peso_per_point_redemption').optional().isFloat({ min: 0 }),
    body('minimum_points_to_redeem').optional().isInt({ min: 0 }),
    body('points_expiry_days').optional().isInt({ min: 0 }),
    body('credit_expiry_days').optional().isInt({ min: 0 }),
    body('min_change_for_credit').optional().isFloat({ min: 0 }),
    body('tier_thresholds').optional().isObject(),
    body('tier_multipliers').optional().isObject(),
    body('is_active').optional().isBoolean(),
    validate
  ],
  loyaltyController.updateConfig
);

// ===== Helpers =====

/**
 * @route   GET /api/v1/loyalty/calculate-points
 * @desc    Calculate points for a purchase amount
 * @access  Private
 */
router.get(
  '/calculate-points',
  [
    query('amount').isFloat({ min: 0 }).withMessage('amount is required'),
    query('tier').optional().isIn(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']),
    validate
  ],
  loyaltyController.calculatePoints
);

/**
 * @route   GET /api/v1/loyalty/calculate-redemption
 * @desc    Calculate redemption value for points
 * @access  Private
 */
router.get(
  '/calculate-redemption',
  [
    query('points').isInt({ min: 0 }).withMessage('points is required'),
    validate
  ],
  loyaltyController.calculateRedemptionValue
);

/**
 * @route   GET /api/v1/loyalty/summary
 * @desc    Get loyalty summary/stats
 * @access  Private
 */
router.get(
  '/summary',
  [
    query('branch_id').optional().isUUID(4),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  loyaltyController.getSummary
);

module.exports = router;
