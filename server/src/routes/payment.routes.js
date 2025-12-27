const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  stringField,
  booleanField,
  integerField
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/payment-methods
 * @desc    Get all payment methods
 * @access  Private
 */
router.get('/', paymentController.getAllMethods);

/**
 * @route   GET /api/v1/payment-methods/active
 * @desc    Get active payment methods only
 * @access  Private
 */
router.get('/active', async (_req, res) => res.status(501).json({ message: 'Not implemented' }));

/**
 * @route   GET /api/v1/payment-methods/:id
 * @desc    Get payment method by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  paymentController.getMethodById
);

/**
 * @route   POST /api/v1/payment-methods
 * @desc    Create new payment method
 * @access  Private (Owner only)
 */
router.post(
  '/',
  requireRole(['OWNER']),
  [
    stringField('code', { minLength: 1, maxLength: 20 }),
    stringField('name', { minLength: 1, maxLength: 50 }),
    booleanField('requires_reference'),
    integerField('sort_order', { min: 0, required: false }),
    validate
  ],
  paymentController.createMethod
);

/**
 * @route   PUT /api/v1/payment-methods/:id
 * @desc    Update payment method
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  requireRole(['OWNER']),
  [
    uuidParam('id'),
    stringField('name', { minLength: 1, maxLength: 50, required: false }),
    booleanField('requires_reference'),
    booleanField('is_active'),
    integerField('sort_order', { min: 0, required: false }),
    validate
  ],
  paymentController.updateMethod
);

/**
 * @route   DELETE /api/v1/payment-methods/:id
 * @desc    Deactivate payment method
 * @access  Private (Owner only)
 */
router.delete(
  '/:id',
  requireRole(['OWNER']),
  [uuidParam('id'), validate],
  paymentController.deactivateMethod
);

module.exports = router;
