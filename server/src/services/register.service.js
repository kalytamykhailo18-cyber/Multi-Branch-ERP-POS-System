const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  RegisterSession, Register, Sale, SalePayment, PaymentMethod, DailyReport,
  Branch, User, sequelize
} = require('../database/models');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { getIO } = require('../socket');
const alertService = require('./alert.service');
const logger = require('../utils/logger');

class RegisterService {
  async openSession(data) {
    const t = await sequelize.transaction();

    try {
      const { register_id, cashier_id, opening_amount, shift_type, notes } = data;

      // Check if register exists and is available
      const register = await Register.findByPk(register_id);
      if (!register) {
        throw new NotFoundError('Register not found');
      }

      if (!register.is_active) {
        throw new BusinessError('Register is not active');
      }

      // Check for existing open session on this register
      const existingSession = await RegisterSession.findOne({
        where: {
          register_id,
          status: 'OPEN'
        }
      });

      if (existingSession) {
        throw new BusinessError('Register already has an open session');
      }

      // Check for existing open session for this cashier
      const cashierSession = await RegisterSession.findOne({
        where: {
          cashier_id,
          status: 'OPEN'
        }
      });

      if (cashierSession) {
        throw new BusinessError('Cashier already has an open session on another register');
      }

      // Create session
      const session = await RegisterSession.create({
        id: uuidv4(),
        register_id,
        branch_id: register.branch_id,
        cashier_id,
        opening_amount: opening_amount || 0,
        shift_type: shift_type || 'FULL_DAY',
        status: 'OPEN',
        opened_at: new Date(),
        notes
      }, { transaction: t });

      // Update register status
      await register.update({ current_session_id: session.id }, { transaction: t });

      await t.commit();

      logger.info(`Session opened for register ${register.register_number} by cashier ${cashier_id}`);

      return session;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async closeSession(sessionId, closingData, userId) {
    const t = await sequelize.transaction();

    try {
      const session = await RegisterSession.findByPk(sessionId, {
        include: [
          { model: Register, as: 'register' }
        ]
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      if (session.status !== 'OPEN') {
        throw new BusinessError('Session is not open');
      }

      const {
        declared_cash, declared_card, declared_qr, declared_transfer,
        notes, is_blind = true
      } = closingData;

      // Calculate expected amounts from sales
      const expectedAmounts = await this.calculateExpectedAmounts(sessionId);

      // Calculate discrepancies (BLIND CLOSING - cashier declares first)
      const discrepancies = {
        cash: declared_cash - expectedAmounts.cash,
        card: declared_card - expectedAmounts.card,
        qr: declared_qr - expectedAmounts.qr,
        transfer: declared_transfer - expectedAmounts.transfer
      };

      const totalDeclared = declared_cash + declared_card + declared_qr + declared_transfer;
      const totalExpected = expectedAmounts.total;
      const totalDiscrepancy = totalDeclared - totalExpected;

      // Calculate closing amount (cash in drawer)
      const closingAmount = parseFloat(session.opening_amount) + declared_cash;

      // Update session with closing data
      await session.update({
        status: 'CLOSED',
        closed_at: new Date(),
        closed_by: userId,
        closing_amount: closingAmount,
        declared_cash: declared_cash,
        declared_card: declared_card,
        declared_qr: declared_qr,
        declared_transfer: declared_transfer,
        expected_cash: expectedAmounts.cash,
        expected_card: expectedAmounts.card,
        expected_qr: expectedAmounts.qr,
        expected_transfer: expectedAmounts.transfer,
        discrepancy_cash: discrepancies.cash,
        discrepancy_card: discrepancies.card,
        discrepancy_qr: discrepancies.qr,
        discrepancy_transfer: discrepancies.transfer,
        total_sales: expectedAmounts.salesCount,
        total_revenue: expectedAmounts.total,
        total_discrepancy: totalDiscrepancy,
        notes: notes ? `${session.notes || ''}\n${notes}` : session.notes
      }, { transaction: t });

      // Update register
      await session.register.update({ current_session_id: null }, { transaction: t });

      // Update or create daily report
      await this.updateDailyReport(session.branch_id, new Date(), t);

      await t.commit();

      // Create alerts for significant discrepancies
      const CASH_DISCREPANCY_THRESHOLD = 100;
      if (Math.abs(discrepancies.cash) > CASH_DISCREPANCY_THRESHOLD) {
        alertService.createCashDiscrepancyAlert(
          session.branch_id,
          sessionId,
          expectedAmounts.cash,
          declared_cash
        );
      }

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`branch_${session.branch_id}`).emit('SESSION_CLOSED', {
          session_id: sessionId,
          register_id: session.register_id,
          discrepancy: totalDiscrepancy
        });
        io.to('owners').emit('SESSION_CLOSED', {
          session_id: sessionId,
          branch_id: session.branch_id,
          discrepancy: totalDiscrepancy
        });
      }

      logger.info(`Session ${sessionId} closed - Discrepancy: $${totalDiscrepancy}`);

      return session;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async calculateExpectedAmounts(sessionId) {
    // Get all completed sales for this session
    const sales = await Sale.findAll({
      where: {
        session_id: sessionId,
        status: 'COMPLETED'
      },
      include: [
        {
          model: SalePayment,
          as: 'payments',
          where: { status: 'APPROVED' },
          required: false,
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        }
      ]
    });

    const amounts = {
      cash: 0,
      card: 0,
      qr: 0,
      transfer: 0,
      other: 0,
      total: 0,
      salesCount: sales.length
    };

    for (const sale of sales) {
      for (const payment of (sale.payments || [])) {
        const methodCode = payment.payment_method?.code?.toUpperCase();
        const amount = parseFloat(payment.amount);

        switch (methodCode) {
          case 'CASH':
          case 'EFECTIVO':
            amounts.cash += amount;
            break;
          case 'CARD':
          case 'DEBIT':
          case 'CREDIT':
          case 'TARJETA':
          case 'DEBITO':
          case 'CREDITO':
            amounts.card += amount;
            break;
          case 'QR':
          case 'MERCADOPAGO':
            amounts.qr += amount;
            break;
          case 'TRANSFER':
          case 'TRANSFERENCIA':
            amounts.transfer += amount;
            break;
          default:
            amounts.other += amount;
        }

        amounts.total += amount;
      }
    }

    return amounts;
  }

  async getSessionSummary(sessionId) {
    const session = await RegisterSession.findByPk(sessionId, {
      include: [
        { model: Register, as: 'register' },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'cashier', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Get sales statistics
    const salesStats = await Sale.findOne({
      where: {
        session_id: sessionId,
        status: 'COMPLETED'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average']
      ]
    });

    // Get voided sales
    const voidedStats = await Sale.findOne({
      where: {
        session_id: sessionId,
        status: 'VOIDED'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ]
    });

    // Get payment breakdown
    const paymentBreakdown = await SalePayment.findAll({
      attributes: [
        'payment_method_id',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          where: { session_id: sessionId, status: 'COMPLETED' },
          attributes: []
        },
        { model: PaymentMethod, as: 'payment_method', attributes: ['name', 'code'] }
      ],
      where: { status: 'APPROVED' },
      group: ['payment_method_id', 'payment_method.id', 'payment_method.name', 'payment_method.code']
    });

    return {
      session: session.toJSON(),
      sales: {
        count: parseInt(salesStats?.toJSON().count) || 0,
        total: parseFloat(salesStats?.toJSON().total) || 0,
        average: parseFloat(salesStats?.toJSON().average) || 0
      },
      voided: {
        count: parseInt(voidedStats?.toJSON().count) || 0,
        total: parseFloat(voidedStats?.toJSON().total) || 0
      },
      payments: paymentBreakdown.map((p) => ({
        method: p.payment_method?.name,
        code: p.payment_method?.code,
        total: parseFloat(p.toJSON().total)
      }))
    };
  }

  async updateDailyReport(branchId, date, transaction) {
    const dateString = date.toISOString().split('T')[0];

    // Get or create daily report
    let report = await DailyReport.findOne({
      where: { branch_id: branchId, report_date: dateString }
    });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate totals
    const salesData = await Sale.findOne({
      where: {
        branch_id: branchId,
        status: 'COMPLETED',
        created_at: { [Op.between]: [startOfDay, endOfDay] }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'tax'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'discounts']
      ]
    });

    const sessionData = await RegisterSession.findOne({
      where: {
        branch_id: branchId,
        status: 'CLOSED',
        closed_at: { [Op.between]: [startOfDay, endOfDay] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('discrepancy_cash')), 'cash_discrepancy']
      ]
    });

    const reportData = {
      total_sales: parseInt(salesData?.toJSON().count) || 0,
      total_revenue: parseFloat(salesData?.toJSON().total) || 0,
      total_tax: parseFloat(salesData?.toJSON().tax) || 0,
      total_discounts: parseFloat(salesData?.toJSON().discounts) || 0,
      cash_discrepancy: parseFloat(sessionData?.toJSON().cash_discrepancy) || 0
    };

    if (report) {
      await report.update(reportData, { transaction });
    } else {
      await DailyReport.create({
        id: uuidv4(),
        branch_id: branchId,
        report_date: dateString,
        ...reportData
      }, { transaction });
    }
  }

  async forceCloseSession(sessionId, reason, userId) {
    const t = await sequelize.transaction();

    try {
      const session = await RegisterSession.findByPk(sessionId, {
        include: [{ model: Register, as: 'register' }]
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      if (session.status !== 'OPEN') {
        throw new BusinessError('Session is not open');
      }

      // Get expected amounts
      const expected = await this.calculateExpectedAmounts(sessionId);

      await session.update({
        status: 'FORCE_CLOSED',
        closed_at: new Date(),
        closed_by: userId,
        expected_cash: expected.cash,
        expected_card: expected.card,
        expected_qr: expected.qr,
        expected_transfer: expected.transfer,
        total_sales: expected.salesCount,
        total_revenue: expected.total,
        notes: `${session.notes || ''}\nFORCE CLOSED: ${reason}`
      }, { transaction: t });

      await session.register.update({ current_session_id: null }, { transaction: t });

      await t.commit();

      logger.warn(`Session ${sessionId} force closed: ${reason}`);

      return session;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getActiveSession(registerId) {
    return RegisterSession.findOne({
      where: {
        register_id: registerId,
        status: 'OPEN'
      },
      include: [
        { model: User, as: 'cashier', attributes: ['first_name', 'last_name'] }
      ]
    });
  }

  async getCashierActiveSession(cashierId) {
    return RegisterSession.findOne({
      where: {
        cashier_id: cashierId,
        status: 'OPEN'
      },
      include: [
        { model: Register, as: 'register' },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] }
      ]
    });
  }
}

module.exports = new RegisterService();
