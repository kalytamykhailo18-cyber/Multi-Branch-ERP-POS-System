const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Alert, AlertConfig, Branch, User } = require('../database/models');
const { getIO } = require('../socket');
const logger = require('../utils/logger');

// Alert Types
const ALERT_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  CASH_DISCREPANCY: 'CASH_DISCREPANCY',
  HIGH_VOID_RATE: 'HIGH_VOID_RATE',
  SHRINKAGE_HIGH: 'SHRINKAGE_HIGH',
  OFFLINE_BRANCH: 'OFFLINE_BRANCH',
  SESSION_OVERTIME: 'SESSION_OVERTIME',
  LARGE_TRANSACTION: 'LARGE_TRANSACTION',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  PRICE_CHANGE: 'PRICE_CHANGE',
  INVENTORY_COUNT: 'INVENTORY_COUNT'
};

// Severity Levels
const SEVERITIES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

class AlertService {
  constructor() {
    this.ALERT_TYPES = ALERT_TYPES;
    this.SEVERITIES = SEVERITIES;
  }

  async createAlert(alertData) {
    try {
      // Check if alert should be created based on config
      const config = await this.getAlertConfig(alertData.branch_id, alertData.alert_type);

      if (!config) {
        logger.debug(`Alert config not found for ${alertData.alert_type}, skipping alert`);
        return null;
      }

      // Check threshold if applicable
      if (config.threshold && alertData.value !== undefined) {
        if (alertData.value < config.threshold) {
          return null;
        }
      }

      const alert = await Alert.create({
        id: uuidv4(),
        branch_id: alertData.branch_id,
        alert_type: alertData.alert_type,
        severity: alertData.severity || SEVERITIES.INFO,
        title: alertData.title,
        message: alertData.message,
        data: alertData.data ? JSON.stringify(alertData.data) : null,
        reference_type: alertData.reference_type,
        reference_id: alertData.reference_id,
        is_read: false
      });

      // Emit via WebSocket
      this.emitAlert(alert);

      logger.info(`Alert created: [${alert.severity}] ${alert.title}`);

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      return null;
    }
  }

  async getAlertConfig(branchId, alertType) {
    // First try branch-specific config
    let config = await AlertConfig.findOne({
      where: {
        branch_id: branchId,
        alert_type: alertType,
        is_active: true
      }
    });

    // Fall back to global config
    if (!config) {
      config = await AlertConfig.findOne({
        where: {
          branch_id: null,
          alert_type: alertType,
          is_active: true
        }
      });
    }

    return config;
  }

  emitAlert(alert) {
    const io = getIO();
    if (!io) return;

    const alertData = {
      id: alert.id,
      alert_type: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      branch_id: alert.branch_id,
      created_at: alert.created_at
    };

    // Emit to branch room
    if (alert.branch_id) {
      io.to(`branch_${alert.branch_id}`).emit('ALERT_CREATED', alertData);
    }

    // Always emit to owners
    io.to('owners').emit('ALERT_CREATED', alertData);
  }

  // Convenience methods for common alerts
  async createLowStockAlert(branchId, productName, currentStock, minStock) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.LOW_STOCK,
      severity: SEVERITIES.WARNING,
      title: 'Stock bajo',
      message: `${productName} tiene stock bajo. Actual: ${currentStock}, Mínimo: ${minStock}`,
      data: {
        product_name: productName,
        current_stock: currentStock,
        min_stock: minStock
      },
      value: minStock - currentStock
    });
  }

  async createCashDiscrepancyAlert(branchId, sessionId, expectedAmount, declaredAmount) {
    const discrepancy = declaredAmount - expectedAmount;
    const severity = Math.abs(discrepancy) > 1000 ? SEVERITIES.ERROR : SEVERITIES.WARNING;

    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.CASH_DISCREPANCY,
      severity,
      title: 'Diferencia de caja',
      message: `Diferencia de $${discrepancy.toFixed(2)} detectada al cerrar caja`,
      data: {
        session_id: sessionId,
        expected: expectedAmount,
        declared: declaredAmount,
        discrepancy
      },
      reference_type: 'SESSION',
      reference_id: sessionId,
      value: Math.abs(discrepancy)
    });
  }

  async createShrinkageAlert(branchId, productName, quantity, costLoss) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.SHRINKAGE_HIGH,
      severity: SEVERITIES.WARNING,
      title: 'Merma registrada',
      message: `${quantity} unidades de ${productName} registradas como merma. Pérdida: $${costLoss.toFixed(2)}`,
      data: {
        product_name: productName,
        quantity,
        cost_loss: costLoss
      },
      value: costLoss
    });
  }

  async createLargeTransactionAlert(branchId, saleNumber, amount, threshold) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.LARGE_TRANSACTION,
      severity: SEVERITIES.INFO,
      title: 'Venta grande',
      message: `Venta ${saleNumber} de $${amount.toFixed(2)} supera el umbral de $${threshold.toFixed(2)}`,
      data: {
        sale_number: saleNumber,
        amount,
        threshold
      },
      value: amount
    });
  }

  async createHighVoidRateAlert(branchId, cashierId, cashierName, voidRate) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.HIGH_VOID_RATE,
      severity: SEVERITIES.WARNING,
      title: 'Alta tasa de anulaciones',
      message: `${cashierName} tiene una tasa de anulaciones del ${(voidRate * 100).toFixed(1)}%`,
      data: {
        cashier_id: cashierId,
        cashier_name: cashierName,
        void_rate: voidRate
      },
      value: voidRate
    });
  }

  async createSessionOvertimeAlert(branchId, sessionId, hours) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.SESSION_OVERTIME,
      severity: SEVERITIES.WARNING,
      title: 'Sesión prolongada',
      message: `La sesión lleva ${hours} horas abierta`,
      data: {
        session_id: sessionId,
        hours
      },
      reference_type: 'SESSION',
      reference_id: sessionId,
      value: hours
    });
  }

  async createOfflineBranchAlert(branchId, branchName, lastSeen) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.OFFLINE_BRANCH,
      severity: SEVERITIES.ERROR,
      title: 'Sucursal desconectada',
      message: `${branchName} no tiene conexión desde ${lastSeen}`,
      data: {
        branch_name: branchName,
        last_seen: lastSeen
      }
    });
  }

  async createPriceChangeAlert(branchId, productName, oldPrice, newPrice, changedBy) {
    const changePercent = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);

    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.PRICE_CHANGE,
      severity: SEVERITIES.INFO,
      title: 'Cambio de precio',
      message: `${productName}: $${oldPrice} → $${newPrice} (${changePercent}%)`,
      data: {
        product_name: productName,
        old_price: oldPrice,
        new_price: newPrice,
        change_percent: changePercent,
        changed_by: changedBy
      }
    });
  }

  async createSystemErrorAlert(branchId, errorType, errorMessage, details) {
    return this.createAlert({
      branch_id: branchId,
      alert_type: ALERT_TYPES.SYSTEM_ERROR,
      severity: SEVERITIES.CRITICAL,
      title: `Error del sistema: ${errorType}`,
      message: errorMessage,
      data: details
    });
  }

  // Get alerts with filtering
  async getAlerts(filters = {}) {
    const where = {};

    if (filters.branch_id) where.branch_id = filters.branch_id;
    if (filters.alert_type) where.alert_type = filters.alert_type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.is_read !== undefined) where.is_read = filters.is_read;

    if (filters.start_date || filters.end_date) {
      where.created_at = {};
      if (filters.start_date) where.created_at[Op.gte] = new Date(filters.start_date);
      if (filters.end_date) where.created_at[Op.lte] = new Date(filters.end_date);
    }

    return Alert.findAll({
      where,
      include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }],
      order: [['created_at', 'DESC']],
      limit: filters.limit || 100,
      offset: filters.offset || 0
    });
  }

  // Get unread count
  async getUnreadCount(branchId = null) {
    const where = { is_read: false };
    if (branchId) where.branch_id = branchId;

    return Alert.count({ where });
  }

  // Mark alerts as read
  async markAsRead(alertId, userId) {
    const alert = await Alert.findByPk(alertId);
    if (!alert) return null;

    await alert.update({
      is_read: true,
      read_by: userId,
      read_at: new Date()
    });

    return alert;
  }

  async markAllAsRead(filters, userId) {
    const where = { is_read: false };
    if (filters.branch_id) where.branch_id = filters.branch_id;
    if (filters.alert_type) where.alert_type = filters.alert_type;

    await Alert.update(
      { is_read: true, read_by: userId, read_at: new Date() },
      { where }
    );
  }

  // Delete old alerts
  async deleteOldAlerts(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await Alert.destroy({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        is_read: true
      }
    });

    logger.info(`Deleted ${deleted} old alerts`);
    return deleted;
  }

  // Setup default alert configs
  async setupDefaultConfigs(branchId = null) {
    const defaultConfigs = [
      { alert_type: ALERT_TYPES.LOW_STOCK, threshold: 0, is_active: true },
      { alert_type: ALERT_TYPES.CASH_DISCREPANCY, threshold: 100, is_active: true },
      { alert_type: ALERT_TYPES.HIGH_VOID_RATE, threshold: 0.1, is_active: true },
      { alert_type: ALERT_TYPES.SHRINKAGE_HIGH, threshold: 0, is_active: true },
      { alert_type: ALERT_TYPES.LARGE_TRANSACTION, threshold: 50000, is_active: true },
      { alert_type: ALERT_TYPES.SESSION_OVERTIME, threshold: 12, is_active: true },
      { alert_type: ALERT_TYPES.SYSTEM_ERROR, threshold: 0, is_active: true }
    ];

    for (const config of defaultConfigs) {
      await AlertConfig.findOrCreate({
        where: {
          branch_id: branchId,
          alert_type: config.alert_type
        },
        defaults: {
          id: uuidv4(),
          branch_id: branchId,
          ...config
        }
      });
    }
  }
}

module.exports = new AlertService();
