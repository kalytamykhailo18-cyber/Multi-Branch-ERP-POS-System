const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.controller');
const { authenticate, requirePermission, verifyManagerPin } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  decimalField,
  integerField,
  enumField,
  paginationQuery,
  query
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// ===== Cash Register Routes =====

/**
 * @route   GET /api/v1/registers
 * @desc    Get all cash registers
 * @access  Private
 */
router.get(
  '/',
  [
    query('branch_id').optional().isUUID(4),
    query('is_active').optional().isBoolean(),
    validate
  ],
  registerController.getAllRegisters
);

/**
 * @route   GET /api/v1/registers/:id
 * @desc    Get cash register by ID
 * @access  Private
 */
router.get(
  '/:id',
  [uuidParam('id'), validate],
  registerController.getRegisterById
);

/**
 * @route   POST /api/v1/registers
 * @desc    Create new cash register
 * @access  Private (Owner/Manager)
 */
router.post(
  '/',
  requirePermission('canManageUsers'),
  [
    uuidField('branch_id'),
    integerField('register_number', { min: 1 }),
    stringField('name', { maxLength: 50, required: false }),
    validate
  ],
  registerController.createRegister
);

/**
 * @route   PUT /api/v1/registers/:id
 * @desc    Update cash register
 * @access  Private (Owner/Manager)
 */
router.put(
  '/:id',
  requirePermission('canManageUsers'),
  [
    uuidParam('id'),
    stringField('name', { maxLength: 50, required: false }),
    validate
  ],
  registerController.updateRegister
);

// ===== Register Session Routes =====

/**
 * @route   GET /api/v1/registers/sessions
 * @desc    Get register sessions with filters
 * @access  Private
 */
router.get(
  '/sessions/list',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('register_id').optional().isUUID(4),
    query('status').optional().isIn(['OPEN', 'CLOSED', 'REOPENED']),
    query('business_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    validate
  ],
  registerController.getSessions
);

/**
 * @route   GET /api/v1/registers/:registerId/current-session
 * @desc    Get current open session for register
 * @access  Private
 */
router.get(
  '/:registerId/current-session',
  [uuidParam('registerId'), validate],
  registerController.getCurrentSession
);

/**
 * @route   POST /api/v1/registers/:registerId/open
 * @desc    Open a new register session
 * @access  Private
 */
router.post(
  '/:registerId/open',
  [
    uuidParam('registerId'),
    enumField('shift_type', ['MORNING', 'AFTERNOON', 'FULL_DAY']),
    decimalField('opening_cash', { min: 0 }),
    stringField('opening_notes', { required: false }),
    stringField('local_id', { maxLength: 50, required: false }),
    validate
  ],
  registerController.openSession
);

/**
 * @route   POST /api/v1/registers/sessions/:sessionId/close
 * @desc    Close register session (Blind Closing)
 * @access  Private (can_close_register)
 */
router.post(
  '/sessions/:sessionId/close',
  requirePermission('canCloseRegister'),
  [
    uuidParam('sessionId'),
    decimalField('declared_cash', { min: 0 }),
    decimalField('declared_card', { min: 0 }),
    decimalField('declared_qr', { min: 0 }),
    decimalField('declared_transfer', { min: 0 }),
    stringField('closing_notes', { required: false }),
    validate
  ],
  registerController.closeSession
);

/**
 * @route   POST /api/v1/registers/sessions/:sessionId/reopen
 * @desc    Reopen a closed session (requires manager authorization)
 * @access  Private (can_reopen_closing)
 */
router.post(
  '/sessions/:sessionId/reopen',
  [
    uuidParam('sessionId'),
    stringField('reason', { minLength: 1, maxLength: 500 }),
    stringField('manager_pin', { minLength: 4, maxLength: 6 }),
    validate
  ],
  verifyManagerPin('can_reopen_closing'),
  registerController.reopenSession
);

/**
 * @route   GET /api/v1/registers/sessions/:sessionId
 * @desc    Get session details
 * @access  Private
 */
router.get(
  '/sessions/:sessionId',
  [uuidParam('sessionId'), validate],
  registerController.getSessionById
);

/**
 * @route   GET /api/v1/registers/sessions/:sessionId/summary
 * @desc    Get session summary with payment breakdown
 * @access  Private
 */
router.get(
  '/sessions/:sessionId/summary',
  [uuidParam('sessionId'), validate],
  registerController.getSessionSummary
);

// ===== Daily Report Routes =====

/**
 * @route   GET /api/v1/registers/daily-reports
 * @desc    Get daily reports
 * @access  Private (can_view_reports)
 */
router.get(
  '/daily-reports/list',
  requirePermission('canViewReports'),
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('from_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('to_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('is_finalized').optional().isBoolean(),
    validate
  ],
  registerController.getDailyReports
);

/**
 * @route   GET /api/v1/registers/daily-reports/:branchId/:date
 * @desc    Get daily report for specific branch and date
 * @access  Private (can_view_reports)
 */
router.get(
  '/daily-reports/:branchId/:date',
  requirePermission('canViewReports'),
  [
    uuidParam('branchId'),
    validate
  ],
  registerController.getDailyReportByDate
);

/**
 * @route   POST /api/v1/registers/daily-reports/:branchId/:date/finalize
 * @desc    Finalize daily report
 * @access  Private (Owner/Manager)
 */
router.post(
  '/daily-reports/:branchId/:date/finalize',
  requirePermission('canViewReports'),
  [uuidParam('branchId'), validate],
  registerController.finalizeDailyReport
);

module.exports = router;
