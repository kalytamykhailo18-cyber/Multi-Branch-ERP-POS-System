const { Op } = require('sequelize');
const {
  Branch, User, CashRegister, RegisterSession, BranchStock, Product, UnitOfMeasure
} = require('../database/models');
const { success, created, paginated, notFound } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');
const { parsePagination, getBusinessDate } = require('../utils/helpers');

/**
 * Get all branches (filtered by user access)
 * GET /api/v1/branches
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { is_active, search } = req.query;

    const where = {};

    // Filter by active status
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Search by name or code
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // If user can't view all branches, filter by their assigned branches
    if (!req.user.permissions.canViewAllBranches) {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Branch, as: 'branches' }]
      });
      const branchIds = user.branches.map((b) => b.id);
      if (user.primary_branch_id) branchIds.push(user.primary_branch_id);
      where.id = { [Op.in]: branchIds };
    }

    const { count, rows } = await Branch.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    return paginated(res, rows, {
      page,
      limit,
      total_items: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get branch by ID
 * GET /api/v1/branches/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findByPk(id);

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    return success(res, branch);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new branch
 * POST /api/v1/branches
 */
exports.create = async (req, res, next) => {
  try {
    const branch = await Branch.create(req.body);

    // Create default cash register
    await CashRegister.create({
      branch_id: branch.id,
      register_number: 1,
      name: 'Caja 1'
    });

    return created(res, branch);
  } catch (error) {
    next(error);
  }
};

/**
 * Update branch
 * PUT /api/v1/branches/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findByPk(id);

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    await branch.update(req.body);

    return success(res, branch);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate branch (soft delete)
 * DELETE /api/v1/branches/:id
 */
exports.deactivate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findByPk(id);

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    await branch.update({ is_active: false });

    return success(res, null, 'Branch deactivated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get users assigned to branch
 * GET /api/v1/branches/:id/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { primary_branch_id: id }
        ],
        is_active: true
      },
      include: [{ model: require('../database/models').Role, as: 'role' }],
      limit,
      offset,
      order: [['first_name', 'ASC']]
    });

    return paginated(res, rows.map((u) => u.toJSON()), {
      page,
      limit,
      total_items: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cash registers for branch
 * GET /api/v1/branches/:id/registers
 */
exports.getRegisters = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registers = await CashRegister.findAll({
      where: { branch_id: id },
      order: [['register_number', 'ASC']]
    });

    // Get current sessions for each register
    const registersWithSessions = await Promise.all(
      registers.map(async (reg) => {
        const currentSession = await RegisterSession.findOne({
          where: {
            register_id: reg.id,
            status: 'OPEN'
          },
          include: [
            { model: User, as: 'opener', attributes: ['id', 'first_name', 'last_name'] }
          ]
        });

        return {
          ...reg.toJSON(),
          current_session: currentSession ? {
            id: currentSession.id,
            session_number: currentSession.session_number,
            shift_type: currentSession.shift_type,
            opened_at: currentSession.opened_at,
            opened_by_name: `${currentSession.opener.first_name} ${currentSession.opener.last_name}`
          } : null
        };
      })
    );

    return success(res, registersWithSessions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get register sessions for branch
 * GET /api/v1/branches/:id/sessions
 */
exports.getSessions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);
    const { date, status } = req.query;

    const where = { branch_id: id };

    if (date) {
      where.business_date = date;
    } else {
      // Default to today
      where.business_date = getBusinessDate();
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await RegisterSession.findAndCountAll({
      where,
      include: [
        { model: CashRegister, as: 'register', attributes: ['register_number', 'name'] },
        { model: User, as: 'opener', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'closer', attributes: ['first_name', 'last_name'] }
      ],
      order: [['opened_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, {
      page,
      limit,
      total_items: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stock levels for branch
 * GET /api/v1/branches/:id/stock
 */
exports.getStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);
    const { below_minimum, search } = req.query;

    const productWhere = { is_active: true };

    if (search) {
      productWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await BranchStock.findAndCountAll({
      where: { branch_id: id },
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhere,
          include: [{ model: UnitOfMeasure, as: 'unit' }]
        }
      ],
      limit,
      offset
    });

    // Filter by below minimum if requested
    let results = rows.map((stock) => ({
      id: stock.id,
      product_id: stock.product_id,
      product_name: stock.product.name,
      product_sku: stock.product.sku,
      unit_code: stock.product.unit?.code,
      quantity: stock.quantity,
      reserved_quantity: stock.reserved_quantity,
      available_quantity: parseFloat(stock.quantity) - parseFloat(stock.reserved_quantity),
      minimum_stock: stock.product.minimum_stock,
      is_below_minimum: parseFloat(stock.quantity) < parseFloat(stock.product.minimum_stock)
    }));

    if (below_minimum === 'true') {
      results = results.filter((r) => r.is_below_minimum);
    }

    return paginated(res, results, {
      page,
      limit,
      total_items: below_minimum === 'true' ? results.length : count
    });
  } catch (error) {
    next(error);
  }
};
