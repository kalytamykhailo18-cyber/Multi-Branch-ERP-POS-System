const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const {
  Customer, LoyaltyTransaction, CreditTransaction,
  Branch, User, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

// Generate QR Code string
const generateQRCode = () => {
  return `LOYALTY-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

// Hardcoded loyalty configuration
const LOYALTY_CONFIG = {
  points_per_peso: 1,
  peso_per_point_redemption: 0.1,
  minimum_points_to_redeem: 100,
  points_expiry_days: 365,
  credit_expiry_days: 180,
  min_change_for_credit: 10,
  tier_thresholds: { SILVER: 1000, GOLD: 3000, PLATINUM: 20000 },
  tier_multipliers: { STANDARD: 1, SILVER: 1.25, GOLD: 1.5, PLATINUM: 2 }
};

// Get tier based on lifetime points
const getTier = (lifetimePoints) => {
  const thresholds = LOYALTY_CONFIG.tier_thresholds;
  if (lifetimePoints >= thresholds.PLATINUM) return 'PLATINUM';
  if (lifetimePoints >= thresholds.GOLD) return 'GOLD';
  if (lifetimePoints >= thresholds.SILVER) return 'SILVER';
  return 'STANDARD';
};

// Get tier multiplier
const getTierMultiplier = (tier) => {
  const multipliers = LOYALTY_CONFIG.tier_multipliers;
  return multipliers[tier] || 1;
};

exports.getAccounts = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { search, tier, is_active } = req.query;

    const where = {};
    if (tier) where.loyalty_tier = tier;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'loyalty_points', 'loyalty_tier', 'qr_code', 'credit_balance', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getAccount = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'loyalty_points', 'loyalty_tier', 'qr_code', 'credit_balance', 'is_active', 'created_at']
    });

    if (!customer) throw new NotFoundError('Customer not found');
    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.getAccountByCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.customer_id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'loyalty_points', 'loyalty_tier', 'qr_code', 'credit_balance', 'is_active', 'created_at']
    });

    if (!customer) throw new NotFoundError('Customer not found');
    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.getAccountByQR = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { qr_code: req.params.qr_code },
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'loyalty_points', 'loyalty_tier', 'qr_code', 'credit_balance', 'is_active', 'created_at']
    });

    if (!customer) throw new NotFoundError('QR code not found');
    if (!customer.is_active) throw new BusinessError('Customer account is inactive');

    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.createAccount = async (req, res, next) => {
  try {
    const { customer_id } = req.body;

    // Check if customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');

    // Check if already has loyalty setup
    if (customer.qr_code) throw new BusinessError('Customer already has loyalty setup');

    // Update customer with loyalty fields
    await customer.update({
      qr_code: generateQRCode(),
      loyalty_points: 0,
      loyalty_tier: 'STANDARD',
      credit_balance: 0
    });

    return created(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.earnPoints = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, sale_id, sale_total } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');
    if (!customer.is_active) throw new BusinessError('Customer account is inactive');

    const pointsPerPeso = LOYALTY_CONFIG.points_per_peso;

    // Calculate points with tier multiplier
    const multiplier = getTierMultiplier(customer.loyalty_tier);
    const earnedPoints = Math.floor(sale_total * pointsPerPeso * multiplier);

    const newBalance = (customer.loyalty_points || 0) + earnedPoints;

    // Check for tier upgrade
    const newTier = getTier(newBalance);

    await customer.update({
      loyalty_points: newBalance,
      loyalty_tier: newTier
    }, { transaction: t });

    const transaction = await LoyaltyTransaction.create({
      id: uuidv4(),
      customer_id,
      transaction_type: 'EARN',
      points: earnedPoints,
      points_balance_after: newBalance,
      sale_id,
      description: `Earned ${earnedPoints} points from sale`,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, transaction);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.redeemPoints = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, points, sale_id } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');
    if (!customer.is_active) throw new BusinessError('Customer account is inactive');

    const minPoints = LOYALTY_CONFIG.minimum_points_to_redeem;
    const pesoPerPoint = LOYALTY_CONFIG.peso_per_point_redemption;

    if (points < minPoints) {
      throw new BusinessError(`Minimum ${minPoints} points required to redeem`);
    }

    if ((customer.loyalty_points || 0) < points) {
      throw new BusinessError('Insufficient points balance');
    }

    const discountAmount = points * pesoPerPoint;
    const newBalance = (customer.loyalty_points || 0) - points;

    await customer.update({
      loyalty_points: newBalance
    }, { transaction: t });

    const transaction = await LoyaltyTransaction.create({
      id: uuidv4(),
      customer_id,
      transaction_type: 'REDEEM',
      points: -points,
      points_balance_after: newBalance,
      sale_id,
      description: `Redeemed ${points} points for $${discountAmount.toFixed(2)} discount`,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return success(res, { transaction, discount_amount: discountAmount });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.adjustPoints = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, points, reason } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');

    const newBalance = (customer.loyalty_points || 0) + points;
    if (newBalance < 0) throw new BusinessError('Adjustment would result in negative balance');

    await customer.update({
      loyalty_points: newBalance
    }, { transaction: t });

    const transaction = await LoyaltyTransaction.create({
      id: uuidv4(),
      customer_id,
      transaction_type: 'ADJUST',
      points,
      points_balance_after: newBalance,
      description: reason,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, transaction);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getPointsTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { customer_id, transaction_type, start_date, end_date } = req.query;

    const where = {};
    if (customer_id) where.customer_id = customer_id;
    if (transaction_type) where.transaction_type = transaction_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await LoyaltyTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['first_name', 'last_name', 'email']
        },
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] }
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

exports.giveCredit = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, amount, sale_id, reason } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');
    if (!customer.is_active) throw new BusinessError('Customer account is inactive');

    const newBalance = parseFloat(customer.credit_balance || 0) + amount;

    await customer.update({
      credit_balance: newBalance
    }, { transaction: t });

    const transaction = await CreditTransaction.create({
      id: uuidv4(),
      customer_id,
      transaction_type: 'CREDIT',
      amount,
      balance_after: newBalance,
      sale_id,
      description: reason || 'Change as credit',
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, transaction);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.useCredit = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, amount, sale_id } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');
    if (!customer.is_active) throw new BusinessError('Customer account is inactive');

    if (parseFloat(customer.credit_balance || 0) < amount) {
      throw new BusinessError('Insufficient credit balance');
    }

    const newBalance = parseFloat(customer.credit_balance || 0) - amount;

    await customer.update({
      credit_balance: newBalance
    }, { transaction: t });

    const transaction = await CreditTransaction.create({
      id: uuidv4(),
      customer_id,
      transaction_type: 'DEBIT',
      amount: -amount,
      balance_after: newBalance,
      sale_id,
      description: `Used credit in sale`,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, transaction);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.adjustCredit = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, amount, reason } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw new NotFoundError('Customer not found');

    const newBalance = parseFloat(customer.credit_balance || 0) + amount;
    if (newBalance < 0) throw new BusinessError('Adjustment would result in negative balance');

    await customer.update({
      credit_balance: newBalance
    }, { transaction: t });

    const transaction = await CreditTransaction.create({
      id: uuidv4(),
      customer_id,
      transaction_type: 'ADJUST',
      amount,
      balance_after: newBalance,
      description: reason,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, transaction);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getCreditTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { customer_id, transaction_type, start_date, end_date } = req.query;

    const where = {};
    if (customer_id) where.customer_id = customer_id;
    if (transaction_type) where.transaction_type = transaction_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await CreditTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['first_name', 'last_name', 'email']
        },
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] }
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

exports.getConfig = async (req, res, next) => {
  try {
    // Return hardcoded config
    return success(res, LOYALTY_CONFIG);
  } catch (error) {
    next(error);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    // Config is hardcoded, so this would need to be changed in code
    // For now, return the current config
    return success(res, { message: 'Config is hardcoded. To update, modify LOYALTY_CONFIG in the controller.', current_config: LOYALTY_CONFIG });
  } catch (error) {
    next(error);
  }
};

exports.regenerateQR = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    const newQR = generateQRCode();
    await customer.update({ qr_code: newQR });

    return success(res, { qr_code: newQR });
  } catch (error) {
    next(error);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const dateWhere = {};
    if (start_date || end_date) {
      if (start_date) dateWhere[Op.gte] = new Date(start_date);
      if (end_date) dateWhere[Op.lte] = new Date(end_date);
    }

    // Total customers with loyalty
    const totalAccounts = await Customer.count({ where: { qr_code: { [Op.ne]: null } } });
    const activeAccounts = await Customer.count({ where: { is_active: true, qr_code: { [Op.ne]: null } } });

    // Points issued
    const pointsWhere = { transaction_type: 'EARN' };
    if (Object.keys(dateWhere).length) pointsWhere.created_at = dateWhere;

    const pointsIssued = await LoyaltyTransaction.sum('points', { where: pointsWhere }) || 0;

    // Points redeemed
    const redeemedWhere = { transaction_type: 'REDEEM' };
    if (Object.keys(dateWhere).length) redeemedWhere.created_at = dateWhere;

    const pointsRedeemed = Math.abs(await LoyaltyTransaction.sum('points', { where: redeemedWhere }) || 0);

    // Credit given
    const creditGivenWhere = { transaction_type: 'CREDIT' };
    if (Object.keys(dateWhere).length) creditGivenWhere.created_at = dateWhere;

    const creditGiven = await CreditTransaction.sum('amount', { where: creditGivenWhere }) || 0;

    // Credit used
    const creditUsedWhere = { transaction_type: 'DEBIT' };
    if (Object.keys(dateWhere).length) creditUsedWhere.created_at = dateWhere;

    const creditUsed = Math.abs(await CreditTransaction.sum('amount', { where: creditUsedWhere }) || 0);

    // By tier
    const byTier = await Customer.findAll({
      attributes: [
        'loyalty_tier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { is_active: true, qr_code: { [Op.ne]: null } },
      group: ['loyalty_tier']
    });

    return success(res, {
      total_accounts: totalAccounts,
      active_accounts: activeAccounts,
      total_points_issued: pointsIssued,
      total_points_redeemed: pointsRedeemed,
      total_credit_given: creditGiven,
      total_credit_used: creditUsed,
      by_tier: byTier.map(t => ({ tier: t.loyalty_tier, count: parseInt(t.get('count')) }))
    });
  } catch (error) {
    next(error);
  }
};

exports.calculatePoints = async (req, res, next) => {
  try {
    const { amount, tier } = req.query;

    const pointsPerPeso = LOYALTY_CONFIG.points_per_peso;
    const multiplier = getTierMultiplier(tier || 'STANDARD');

    const pointsToEarn = Math.floor(parseFloat(amount) * pointsPerPeso * multiplier);

    return success(res, { points_to_earn: pointsToEarn, multiplier });
  } catch (error) {
    next(error);
  }
};

exports.calculateRedemptionValue = async (req, res, next) => {
  try {
    const { points } = req.query;

    const pesoPerPoint = LOYALTY_CONFIG.peso_per_point_redemption;

    const discountAmount = parseInt(points) * pesoPerPoint;

    return success(res, { discount_amount: discountAmount, peso_per_point: pesoPerPoint });
  } catch (error) {
    next(error);
  }
};

exports.deactivateAccount = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    await customer.update({ is_active: false });

    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.reactivateAccount = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    await customer.update({ is_active: true });

    return success(res, customer);
  } catch (error) {
    next(error);
  }
};
