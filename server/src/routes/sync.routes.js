const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  arrayField,
  enumField,
  paginationQuery,
  query,
  body
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/sync/push
 * @desc    Push local changes to server
 * @access  Private
 */
router.post(
  '/push',
  [
    uuidField('branch_id'),
    uuidField('register_id'),
    arrayField('items', { minLength: 1 }),
    body('items.*.entity_type').isString().notEmpty().withMessage('entity_type is required'),
    body('items.*.local_id').isString().notEmpty().withMessage('local_id is required'),
    body('items.*.operation').isIn(['INSERT', 'UPDATE', 'DELETE']).withMessage('Invalid operation'),
    body('items.*.data').isObject().withMessage('data must be an object'),
    body('items.*.local_created_at').isISO8601().withMessage('local_created_at must be ISO8601'),
    body('last_sync_at').optional().isISO8601(),
    validate
  ],
  syncController.uploadOfflineSales
);

/**
 * @route   POST /api/v1/sync/pull
 * @desc    Pull server changes to local
 * @access  Private
 */
router.post(
  '/pull',
  [
    uuidField('branch_id'),
    body('last_sync_at').optional().isISO8601(),
    arrayField('entity_types', { required: false }),
    validate
  ],
  syncController.downloadForOffline
);

/**
 * @route   GET /api/v1/sync/status
 * @desc    Get sync status overview
 * @access  Private
 */
router.get(
  '/status',
  [
    query('branch_id').optional().isUUID(4),
    validate
  ],
  syncController.getSyncStatus
);

/**
 * @route   GET /api/v1/sync/queue
 * @desc    Get sync queue items
 * @access  Private
 */
router.get(
  '/queue',
  [
    ...paginationQuery,
    query('branch_id').optional().isUUID(4),
    query('register_id').optional().isUUID(4),
    query('entity_type').optional().isString(),
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'SYNCED', 'FAILED', 'CONFLICT']),
    validate
  ],
  syncController.getPendingSync
);

/**
 * @route   GET /api/v1/sync/conflicts
 * @desc    Get unresolved conflicts
 * @access  Private
 */
router.get(
  '/conflicts',
  [
    query('branch_id').optional().isUUID(4),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   POST /api/v1/sync/conflicts/:id/resolve
 * @desc    Resolve a sync conflict
 * @access  Private
 */
router.post(
  '/conflicts/:id/resolve',
  [
    uuidParam('id'),
    enumField('resolution', ['LOCAL_WINS', 'SERVER_WINS', 'MERGED']),
    body('merged_data').optional().isObject(),
    validate
  ],
  syncController.resolveConflict
);

/**
 * @route   POST /api/v1/sync/retry
 * @desc    Retry failed sync items
 * @access  Private
 */
router.post(
  '/retry',
  [
    arrayField('queue_ids', { minLength: 1 }),
    validate
  ],
  async (_req, res) => res.status(501).json({ message: 'Not implemented' })
);

/**
 * @route   GET /api/v1/sync/audit
 * @desc    Get audit log
 * @access  Private
 */
router.get(
  '/audit',
  [
    ...paginationQuery,
    query('table_name').optional().isString(),
    query('record_id').optional().isUUID(4),
    query('action').optional().isIn(['INSERT', 'UPDATE', 'DELETE']),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
    validate
  ],
  syncController.getSyncLogs
);

module.exports = router;
