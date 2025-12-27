const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  stringField,
  enumField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/invoices
 * @desc    Get invoices with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('invoice_type_id').optional().isUUID(4),
    query('status').optional().isIn(['PENDING', 'ISSUED', 'FAILED', 'CANCELLED']),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    query('customer_document_number').optional().isString(),
    validate
  ],
  invoiceController.getAll
);

/**
 * @route   GET /api/v1/invoices/types
 * @desc    Get invoice types (A, B, C)
 * @access  Private
 */
router.get('/types', async (_req, res) => res.status(501).json({ message: 'Not implemented' }));

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  invoiceController.getById
);

/**
 * @route   GET /api/v1/invoices/:id/pdf
 * @desc    Get invoice PDF
 * @access  Private
 */
router.get(
  '/:id/pdf',
  [uuidParam('id'), validate],
  invoiceController.getPrintData
);

/**
 * @route   POST /api/v1/invoices/:id/retry
 * @desc    Retry failed invoice
 * @access  Private
 */
router.post(
  '/:id/retry',
  [uuidParam('id'), validate],
  invoiceController.submitToAFIP
);

/**
 * @route   POST /api/v1/invoices/:id/cancel
 * @desc    Cancel invoice (issue credit note)
 * @access  Private (Owner/Manager)
 */
router.post(
  '/:id/cancel',
  requirePermission('canVoidSale'),
  [
    uuidParam('id'),
    stringField('reason', { minLength: 1, maxLength: 255 }),
    validate
  ],
  invoiceController.createCreditNote
);

/**
 * @route   GET /api/v1/invoices/pending
 * @desc    Get pending invoices that need attention
 * @access  Private
 */
router.get('/status/pending', async (_req, res) => res.status(501).json({ message: 'Not implemented' }));

/**
 * @route   GET /api/v1/invoices/failed
 * @desc    Get failed invoices
 * @access  Private
 */
router.get('/status/failed', async (_req, res) => res.status(501).json({ message: 'Not implemented' }));

/**
 * @route   GET /api/v1/invoices/credit-notes
 * @desc    Get credit notes
 * @access  Private
 */
router.get(
  '/credit-notes/list',
  [
    ...paginationQuery,
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/invoices/credit-notes/:id
 * @desc    Get credit note by ID
 * @access  Private
 */
router.get(
  '/credit-notes/:id',
  [uuidParam('id'), validate],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

module.exports = router;
