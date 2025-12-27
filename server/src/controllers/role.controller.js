const { v4: uuidv4 } = require('uuid');
const { Role, User } = require('../database/models');
const { success, created } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');

exports.getAll = async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    return success(res, roles);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) throw new NotFoundError('Role not found');
    return success(res, role);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const role = await Role.create({ id: uuidv4(), ...req.body });
    return created(res, role);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) throw new NotFoundError('Role not found');
    await role.update(req.body);
    return success(res, role);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) throw new NotFoundError('Role not found');

    const usersCount = await User.count({ where: { role_id: req.params.id } });
    if (usersCount > 0) {
      throw new BusinessError('Cannot delete role with assigned users');
    }

    await role.destroy();
    return success(res, null, 'Role deleted');
  } catch (error) {
    next(error);
  }
};
