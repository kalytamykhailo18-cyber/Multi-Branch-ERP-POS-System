const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Customer, User, Sale, LoyaltyTransaction, CreditTransaction, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');
const { parsePagination, generateCustomerQRCode } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { is_wholesale, is_active, loyalty_tier, search, has_credit } = req.query;

    const where = {};
    if (is_wholesale !== undefined) where.is_wholesale = is_wholesale === 'true';
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (loyalty_tier) where.loyalty_tier = loyalty_tier;
    if (has_credit === 'true') where.credit_balance = { [Op.gt]: 0 };
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { company_name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { document_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.quickSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    const customers = await Customer.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { phone: { [Op.iLike]: `%${q}%` } },
          { qr_code: { [Op.iLike]: `%${q}%` } },
          { document_number: { [Op.iLike]: `%${q}%` } },
          { customer_code: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: 10
    });

    const results = customers.map((c) => ({
      id: c.id,
      customer_code: c.customer_code,
      display_name: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      phone: c.phone,
      loyalty_points: c.loyalty_points,
      credit_balance: c.credit_balance,
      is_wholesale: c.is_wholesale,
      wholesale_discount_percent: c.wholesale_discount_percent,
      qr_code: c.qr_code
    }));

    return success(res, results);
  } catch (error) {
    next(error);
  }
};

exports.getByQRCode = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { qr_code: req.params.qrCode, is_active: true }
    });

    if (!customer) throw new NotFoundError('Customer not found');
    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [{ model: User, as: 'assigned_vendor', attributes: ['first_name', 'last_name'] }]
    });

    if (!customer) throw new NotFoundError('Customer not found');
    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const customerData = {
      id: uuidv4(),
      qr_code: generateCustomerQRCode(),
      ...req.body
    };

    const customer = await Customer.create(customerData);
    return created(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    await customer.update(req.body);
    return success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    await customer.update({ is_active: false });
    return success(res, null, 'Customer deactivated');
  } catch (error) {
    next(error);
  }
};

exports.getLoyaltyTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await LoyaltyTransaction.findAndCountAll({
      where: { customer_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.addLoyaltyPoints = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    const { points, description } = req.body;
    const newBalance = customer.loyalty_points + points;

    await customer.update({ loyalty_points: newBalance }, { transaction: t });

    const transaction = await LoyaltyTransaction.create({
      id: uuidv4(),
      customer_id: customer.id,
      transaction_type: points > 0 ? 'EARN' : 'ADJUST',
      points,
      points_balance_after: newBalance,
      description: description || 'Ajuste manual',
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return success(res, { transaction, new_balance: newBalance });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getCreditTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await CreditTransaction.findAndCountAll({
      where: { customer_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.addCredit = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) throw new NotFoundError('Customer not found');

    const { amount, description } = req.body;
    const newBalance = parseFloat(customer.credit_balance) + amount;

    await customer.update({ credit_balance: newBalance }, { transaction: t });

    const transaction = await CreditTransaction.create({
      id: uuidv4(),
      customer_id: customer.id,
      transaction_type: amount > 0 ? 'CREDIT' : 'ADJUST',
      amount,
      balance_after: newBalance,
      description: description || 'Ajuste manual',
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return success(res, { transaction, new_balance: newBalance });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getSalesHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await Sale.findAndCountAll({
      where: { customer_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};
