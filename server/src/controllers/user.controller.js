const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { User, Role, Branch, sequelize } = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { role_id, branch_id, is_active, search } = req.query;

    const where = {};
    if (role_id) where.role_id = role_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    return paginated(res, rows.map((u) => u.toJSON()), { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' },
        { model: Branch, as: 'branches' }
      ]
    });

    if (!user) throw new NotFoundError('User not found');

    return success(res, user.toJSON());
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_ids, password, ...userData } = req.body;

    const user = await User.create({
      id: uuidv4(),
      ...userData,
      password_hash: password
    }, { transaction: t });

    if (branch_ids?.length) {
      await user.setBranches(branch_ids, { transaction: t });
    }

    await t.commit();

    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }, { model: Branch, as: 'branches' }]
    });

    return created(res, createdUser.toJSON());
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branch_ids, ...updateData } = req.body;

    // Check if updating self or has permission
    if (id !== req.user.id && !req.user.permissions.canManageUsers) {
      throw new ForbiddenError('Cannot update other users');
    }

    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError('User not found');

    await user.update(updateData);

    if (branch_ids && req.user.permissions.canManageUsers) {
      await user.setBranches(branch_ids);
    }

    return success(res, user.toJSON());
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    await user.update({ is_active: false });
    return success(res, null, 'User deactivated');
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    user.password_hash = req.body.new_password;
    await user.save();

    return success(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

exports.unlock = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    await user.update({ failed_login_attempts: 0, locked_until: null });
    return success(res, null, 'User unlocked');
  } catch (error) {
    next(error);
  }
};

exports.getBranches = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Branch, as: 'branches' }]
    });
    if (!user) throw new NotFoundError('User not found');

    return success(res, user.branches);
  } catch (error) {
    next(error);
  }
};

exports.updateBranches = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    await user.setBranches(req.body.branch_ids);
    return success(res, null, 'Branches updated');
  } catch (error) {
    next(error);
  }
};
