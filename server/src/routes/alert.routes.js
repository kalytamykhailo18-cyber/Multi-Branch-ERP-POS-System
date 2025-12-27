const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  arrayField,
  stringField,
  enumField,
  booleanField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/alerts
 * @desc    Get alerts with filters
 * @access  Private
 */
router.get(
  '/',
  [
    ...paginationQuery,
    query('alert_type').optional().isIn([
      'VOIDED_SALE', 'CASH_DISCREPANCY', 'LOW_STOCK', 'LATE_CLOSING',
      'REOPEN_REGISTER', 'FAILED_INVOICE', 'LARGE_DISCOUNT', 'HIGH_VALUE_SALE',
      'SYNC_ERROR', 'LOGIN_FAILED', 'PRICE_CHANGE'
    ]),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('branch_id').optional().isUUID(4),
    query('is_read').optional().isBoolean(),
    query('is_resolved').optional().isBoolean(),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  alertController.getAll
);

/**
 * @route   GET /api/v1/alerts/unread
 * @desc    Get unread alerts count and recent alerts
 * @access  Private
 */
router.get('/unread', alertController.getUnreadCount);

/**
 * @route   GET /api/v1/alerts/counts
 * @desc    Get alert counts by severity
 * @access  Private
 */
router.get('/counts', async (_req, res) => res.status(501).json({ message: 'Not implemented' }));

/**
 * @route   GET /api/v1/alerts/:id
 * @desc    Get alert by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  alertController.getById
);

/**
 * @route   POST /api/v1/alerts/mark-read
 * @desc    Mark alerts as read
 * @access  Private
 */
router.post(
  '/mark-read',
  [
    arrayField('alert_ids', { minLength: 1 }),
    validate
  ],
  alertController.markAsRead
);

/**
 * @route   POST /api/v1/alerts/:id/resolve
 * @desc    Resolve an alert
 * @access  Private
 */
router.post(
  '/:id/resolve',
  [
    uuidParam('id'),
    stringField('resolution_notes', { required: false }),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   POST /api/v1/alerts/mark-all-read
 * @desc    Mark all alerts as read for current user
 * @access  Private
 */
router.post('/mark-all-read', alertController.markAllAsRead);

/**
 * @route   GET /api/v1/alerts/config
 * @desc    Get alert configuration
 * @access  Private (Owner/Manager)
 */
router.get(
  '/config',
  requirePermission('canViewReports'),
  alertController.getConfigById
);

/**
 * @route   PUT /api/v1/alerts/config
 * @desc    Update alert configuration
 * @access  Private (Owner only)
 */
router.put(
  '/config',
  requirePermission('canManageUsers'),
  alertController.updateConfig
);

module.exports = router;
