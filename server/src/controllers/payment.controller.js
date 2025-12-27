const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  PaymentMethod, SalePayment, Sale, Branch, User, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

// Payment Methods CRUD
exports.getAllMethods = async (req, res, next) => {
  try {
    const { is_active } = req.query;

    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const methods = await PaymentMethod.findAll({
      where,
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    return success(res, methods);
  } catch (error) {
    next(error);
  }
};

exports.getMethodById = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) throw new NotFoundError('Payment method not found');
    return success(res, method);
  } catch (error) {
    next(error);
  }
};

exports.createMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.create({ id: uuidv4(), ...req.body });
    return created(res, method);
  } catch (error) {
    next(error);
  }
};

exports.updateMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) throw new NotFoundError('Payment method not found');

    if (method.is_system && req.body.code) {
      throw new BusinessError('Cannot change code of system payment method');
    }

    await method.update(req.body);
    return success(res, method);
  } catch (error) {
    next(error);
  }
};

exports.deactivateMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) throw new NotFoundError('Payment method not found');

    if (method.is_system) {
      throw new BusinessError('Cannot deactivate system payment method');
    }

    await method.update({ is_active: false });
    return success(res, null, 'Payment method deactivated');
  } catch (error) {
    next(error);
  }
};

exports.reorderMethods = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { order } = req.body; // Array of { id, sort_order }

    for (const item of order) {
      await PaymentMethod.update(
        { sort_order: item.sort_order },
        { where: { id: item.id }, transaction: t }
      );
    }

    await t.commit();

    const methods = await PaymentMethod.findAll({
      order: [['sort_order', 'ASC']]
    });

    return success(res, methods);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Payment Transactions
exports.getPayments = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, payment_method_id, start_date, end_date, status } = req.query;

    const saleWhere = {};
    if (branch_id) saleWhere.branch_id = branch_id;

    const where = {};
    if (payment_method_id) where.payment_method_id = payment_method_id;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await SalePayment.findAndCountAll({
      where,
      include: [
        {
          model: Sale,
          as: 'sale',
          where: Object.keys(saleWhere).length ? saleWhere : undefined,
          attributes: ['sale_number', 'branch_id'],
          include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }]
        },
        { model: PaymentMethod, as: 'payment_method', attributes: ['name', 'code', 'type'] }
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

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await SalePayment.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            { model: Branch, as: 'branch' },
            { model: User, as: 'cashier', attributes: ['first_name', 'last_name'] }
          ]
        },
        { model: PaymentMethod, as: 'payment_method' }
      ]
    });

    if (!payment) throw new NotFoundError('Payment not found');
    return success(res, payment);
  } catch (error) {
    next(error);
  }
};

// Payment Summary Reports
exports.getPaymentSummary = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;

    const saleWhere = { status: 'COMPLETED' };
    if (branch_id) saleWhere.branch_id = branch_id;
    if (start_date || end_date) {
      saleWhere.created_at = {};
      if (start_date) saleWhere.created_at[Op.gte] = new Date(start_date);
      if (end_date) saleWhere.created_at[Op.lte] = new Date(end_date);
    }

    const payments = await SalePayment.findAll({
      attributes: [
        'payment_method_id',
        [sequelize.fn('COUNT', sequelize.col('SalePayment.id')), 'transaction_count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          where: saleWhere,
          attributes: []
        },
        {
          model: PaymentMethod,
          as: 'payment_method',
          attributes: ['name', 'code', 'type']
        }
      ],
      where: { status: 'APPROVED' },
      group: ['payment_method_id', 'payment_method.id', 'payment_method.name', 'payment_method.code', 'payment_method.type'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });

    const totals = await SalePayment.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('SalePayment.id')), 'total_transactions'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
      ],
      include: [{
        model: Sale,
        as: 'sale',
        where: saleWhere,
        attributes: []
      }],
      where: { status: 'APPROVED' }
    });

    return success(res, {
      by_method: payments,
      totals: totals?.toJSON() || { total_transactions: 0, total_amount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailyCashFlow = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const saleWhere = {
      status: 'COMPLETED',
      created_at: { [Op.between]: [startOfDay, endOfDay] }
    };
    if (branch_id) saleWhere.branch_id = branch_id;

    // Get cash payments
    const cashMethod = await PaymentMethod.findOne({ where: { code: 'CASH' } });

    const cashIn = await SalePayment.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      include: [{
        model: Sale,
        as: 'sale',
        where: saleWhere,
        attributes: []
      }],
      where: {
        payment_method_id: cashMethod?.id,
        status: 'APPROVED'
      }
    });

    // Get cash returns/refunds
    const cashOut = await SalePayment.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      include: [{
        model: Sale,
        as: 'sale',
        where: {
          ...saleWhere,
          status: 'RETURNED'
        },
        attributes: []
      }],
      where: {
        payment_method_id: cashMethod?.id
      }
    });

    return success(res, {
      date: startOfDay.toISOString().split('T')[0],
      cash_in: parseFloat(cashIn?.toJSON().total) || 0,
      cash_out: parseFloat(cashOut?.toJSON().total) || 0,
      net_cash: (parseFloat(cashIn?.toJSON().total) || 0) - (parseFloat(cashOut?.toJSON().total) || 0)
    });
  } catch (error) {
    next(error);
  }
};

// Payment reconciliation
exports.reconcilePayments = async (req, res, next) => {
  try {
    const { branch_id, session_id, payment_method_id, expected_amount, actual_amount, notes } = req.body;

    const discrepancy = actual_amount - expected_amount;

    // Log the reconciliation
    const reconciliation = {
      id: uuidv4(),
      branch_id,
      session_id,
      payment_method_id,
      expected_amount,
      actual_amount,
      discrepancy,
      notes,
      reconciled_by: req.user.id,
      reconciled_at: new Date()
    };

    // In a real implementation, you would save this to a reconciliation table
    // For now, return the reconciliation data

    return success(res, {
      ...reconciliation,
      status: discrepancy === 0 ? 'BALANCED' : discrepancy > 0 ? 'OVER' : 'SHORT'
    });
  } catch (error) {
    next(error);
  }
};
