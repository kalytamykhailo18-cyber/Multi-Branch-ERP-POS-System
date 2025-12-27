const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Alert, AlertConfig, User, Branch, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');
const { getIO } = require('../socket');
const logger = require('../utils/logger');

// Alert Configurations
exports.getConfigs = async (req, res, next) => {
  try {
    const { branch_id, is_active } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const configs = await AlertConfig.findAll({
      where,
      include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }],
      order: [['alert_type', 'ASC']]
    });

    return success(res, configs);
  } catch (error) {
    next(error);
  }
};

exports.getConfigById = async (req, res, next) => {
  try {
    const config = await AlertConfig.findByPk(req.params.id, {
      include: [{ model: Branch, as: 'branch' }]
    });
    if (!config) throw new NotFoundError('Alert config not found');
    return success(res, config);
  } catch (error) {
    next(error);
  }
};

exports.createConfig = async (req, res, next) => {
  try {
    const config = await AlertConfig.create({ id: uuidv4(), ...req.body });
    return created(res, config);
  } catch (error) {
    next(error);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const config = await AlertConfig.findByPk(req.params.id);
    if (!config) throw new NotFoundError('Alert config not found');
    await config.update(req.body);
    return success(res, config);
  } catch (error) {
    next(error);
  }
};

exports.deleteConfig = async (req, res, next) => {
  try {
    const config = await AlertConfig.findByPk(req.params.id);
    if (!config) throw new NotFoundError('Alert config not found');
    await config.destroy();
    return success(res, null, 'Alert config deleted');
  } catch (error) {
    next(error);
  }
};

// Alerts
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, alert_type, severity, is_read, start_date, end_date } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (alert_type) where.alert_type = alert_type;
    if (severity) where.severity = severity;
    if (is_read !== undefined) where.is_read = is_read === 'true';
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await Alert.findAndCountAll({
      where,
      include: [
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'reader', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: User, as: 'reader' }
      ]
    });
    if (!alert) throw new NotFoundError('Alert not found');
    return success(res, alert);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) throw new NotFoundError('Alert not found');

    await alert.update({
      is_read: true,
      read_by: req.user.id,
      read_at: new Date()
    });

    return success(res, alert);
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const { branch_id, alert_type } = req.body;

    const where = { is_read: false };
    if (branch_id) where.branch_id = branch_id;
    if (alert_type) where.alert_type = alert_type;

    await Alert.update(
      {
        is_read: true,
        read_by: req.user.id,
        read_at: new Date()
      },
      { where }
    );

    return success(res, null, 'All alerts marked as read');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) throw new NotFoundError('Alert not found');
    await alert.destroy();
    return success(res, null, 'Alert deleted');
  } catch (error) {
    next(error);
  }
};

exports.deleteOld = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const deleted = await Alert.destroy({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        is_read: true
      }
    });

    return success(res, { deleted_count: deleted }, `Deleted ${deleted} old alerts`);
  } catch (error) {
    next(error);
  }
};

// Get unread count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { branch_id } = req.query;

    const where = { is_read: false };
    if (branch_id) where.branch_id = branch_id;

    const count = await Alert.count({ where });

    // Count by severity
    const bySeverity = await Alert.findAll({
      where,
      attributes: [
        'severity',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity']
    });

    // Count by type
    const byType = await Alert.findAll({
      where,
      attributes: [
        'alert_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['alert_type']
    });

    return success(res, {
      total: count,
      by_severity: bySeverity,
      by_type: byType
    });
  } catch (error) {
    next(error);
  }
};

// Create alert (internal use or manual)
exports.create = async (req, res, next) => {
  try {
    const alert = await Alert.create({
      id: uuidv4(),
      ...req.body
    });

    // Emit via WebSocket
    const io = getIO();
    if (io) {
      io.to(`branch_${alert.branch_id}`).emit('ALERT_CREATED', alert);
      io.to('owners').emit('ALERT_CREATED', alert);
    }

    return created(res, alert);
  } catch (error) {
    next(error);
  }
};

// Helper function to create alerts (used by other controllers)
exports.createAlert = async (alertData) => {
  try {
    // Check if alert should be created based on config
    const config = await AlertConfig.findOne({
      where: {
        branch_id: alertData.branch_id,
        alert_type: alertData.alert_type,
        is_active: true
      }
    });

    if (!config) {
      // Check global config
      const globalConfig = await AlertConfig.findOne({
        where: {
          branch_id: null,
          alert_type: alertData.alert_type,
          is_active: true
        }
      });
      if (!globalConfig) return null;
    }

    const alert = await Alert.create({
      id: uuidv4(),
      ...alertData
    });

    // Emit via WebSocket
    const io = getIO();
    if (io) {
      io.to(`branch_${alert.branch_id}`).emit('ALERT_CREATED', alert);
      io.to('owners').emit('ALERT_CREATED', alert);
    }

    logger.info(`Alert created: ${alert.alert_type} - ${alert.title}`);

    return alert;
  } catch (error) {
    logger.error('Error creating alert:', error);
    return null;
  }
};

// Predefined alert types
exports.ALERT_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  CASH_DISCREPANCY: 'CASH_DISCREPANCY',
  HIGH_VOID_RATE: 'HIGH_VOID_RATE',
  SHRINKAGE_HIGH: 'SHRINKAGE_HIGH',
  OFFLINE_BRANCH: 'OFFLINE_BRANCH',
  SESSION_OVERTIME: 'SESSION_OVERTIME',
  LARGE_TRANSACTION: 'LARGE_TRANSACTION',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

exports.SEVERITIES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Create common alerts
exports.createLowStockAlert = async (branchId, productName, currentStock, minStock) => {
  return exports.createAlert({
    branch_id: branchId,
    alert_type: exports.ALERT_TYPES.LOW_STOCK,
    severity: exports.SEVERITIES.WARNING,
    title: 'Low Stock Alert',
    message: `${productName} is running low. Current: ${currentStock}, Minimum: ${minStock}`,
    data: { product_name: productName, current_stock: currentStock, min_stock: minStock }
  });
};

exports.createCashDiscrepancyAlert = async (branchId, sessionId, expectedAmount, declaredAmount) => {
  const discrepancy = declaredAmount - expectedAmount;
  const severity = Math.abs(discrepancy) > 1000 ? exports.SEVERITIES.ERROR : exports.SEVERITIES.WARNING;

  return exports.createAlert({
    branch_id: branchId,
    alert_type: exports.ALERT_TYPES.CASH_DISCREPANCY,
    severity,
    title: 'Cash Discrepancy Detected',
    message: `Cash discrepancy of $${discrepancy.toFixed(2)} found at session close`,
    data: { session_id: sessionId, expected: expectedAmount, declared: declaredAmount, discrepancy },
    reference_type: 'SESSION',
    reference_id: sessionId
  });
};

exports.createShrinkageAlert = async (branchId, productName, quantity, costLoss) => {
  return exports.createAlert({
    branch_id: branchId,
    alert_type: exports.ALERT_TYPES.SHRINKAGE_HIGH,
    severity: exports.SEVERITIES.WARNING,
    title: 'Shrinkage Recorded',
    message: `${quantity} units of ${productName} recorded as shrinkage. Cost loss: $${costLoss.toFixed(2)}`,
    data: { product_name: productName, quantity, cost_loss: costLoss }
  });
};

exports.createLargeTransactionAlert = async (branchId, saleNumber, amount, threshold) => {
  return exports.createAlert({
    branch_id: branchId,
    alert_type: exports.ALERT_TYPES.LARGE_TRANSACTION,
    severity: exports.SEVERITIES.INFO,
    title: 'Large Transaction',
    message: `Sale ${saleNumber} of $${amount.toFixed(2)} exceeds threshold of $${threshold.toFixed(2)}`,
    data: { sale_number: saleNumber, amount, threshold }
  });
};
