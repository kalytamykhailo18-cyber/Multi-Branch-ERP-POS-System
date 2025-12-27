const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  query
} = require('../middleware/validate');

// All routes require authentication and report viewing permission
router.use(authenticate);
router.use(requirePermission('canViewReports'));

/**
 * @route   GET /api/v1/reports/owner-dashboard
 * @desc    Get owner dashboard summary
 * @access  Private (can_view_reports)
 */
router.get(
  '/owner-dashboard',
  [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    validate
  ],
  reportController.getOwnerDashboard
);

/**
 * @route   GET /api/v1/reports/daily-report
 * @desc    Get daily report for a branch
 * @access  Private (can_view_reports)
 */
router.get(
  '/daily-report',
  [
    query('branch_id').isUUID(4).withMessage('branch_id is required'),
    query('date').optional().isISO8601(),
    validate
  ],
  reportController.getDailyReport
);

/**
 * @route   GET /api/v1/reports/sales
 * @desc    Get sales report
 * @access  Private (can_view_reports)
 */
router.get(
  '/sales',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    query('group_by').optional().isIn(['day', 'week', 'month']),
    validate
  ],
  reportController.getSalesReport
);

/**
 * @route   GET /api/v1/reports/products
 * @desc    Get products performance report
 * @access  Private (can_view_reports)
 */
router.get(
  '/products',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
  ],
  reportController.getProductReport
);

/**
 * @route   GET /api/v1/reports/categories
 * @desc    Get sales by category report
 * @access  Private (can_view_reports)
 */
router.get(
  '/categories',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/reports/cashiers
 * @desc    Get cashier performance report
 * @access  Private (can_view_reports)
 */
router.get(
  '/cashiers',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  reportController.getCashierReport
);

/**
 * @route   GET /api/v1/reports/discrepancies
 * @desc    Get cash discrepancy report
 * @access  Private (can_view_reports)
 */
router.get(
  '/discrepancies',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/reports/payments
 * @desc    Get payments breakdown report
 * @access  Private (can_view_reports)
 */
router.get(
  '/payments',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/reports/inventory
 * @desc    Get inventory valuation report
 * @access  Private (can_view_reports)
 */
router.get(
  '/inventory',
  [
    query('branch_id').optional().isUUID(4),
    validate
  ],
  reportController.getInventoryReport
);

/**
 * @route   GET /api/v1/reports/shrinkage
 * @desc    Get shrinkage report
 * @access  Private (can_view_reports)
 */
router.get(
  '/shrinkage',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/reports/hourly
 * @desc    Get hourly sales pattern report
 * @access  Private (can_view_reports)
 */
router.get(
  '/hourly',
  [
    query('branch_id').optional().isUUID(4),
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/reports/comparison
 * @desc    Get branch comparison report
 * @access  Private (can_view_all_branches)
 */
router.get(
  '/comparison',
  requirePermission('canViewAllBranches'),
  [
    query('from_date').isISO8601().withMessage('from_date is required'),
    query('to_date').isISO8601().withMessage('to_date is required'),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

module.exports = router;
