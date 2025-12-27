const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Category, Product } = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { parent_id, is_active, search } = req.query;

    const where = {};
    if (parent_id) where.parent_id = parent_id;
    if (parent_id === 'null') where.parent_id = null;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getTree = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Build tree structure
    const buildTree = (parentId = null) => {
      return categories
        .filter((c) => c.parent_id === parentId)
        .map((c) => ({
          ...c.toJSON(),
          subcategories: buildTree(c.id)
        }));
    };

    return success(res, buildTree());
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'parent' },
        { model: Category, as: 'subcategories' }
      ]
    });
    if (!category) throw new NotFoundError('Category not found');
    return success(res, category);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const category = await Category.create({ id: uuidv4(), ...req.body });
    return created(res, category);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) throw new NotFoundError('Category not found');
    await category.update(req.body);
    return success(res, category);
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) throw new NotFoundError('Category not found');
    await category.update({ is_active: false });
    return success(res, null, 'Category deactivated');
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await Product.findAndCountAll({
      where: { category_id: req.params.id, is_active: true },
      order: [['name', 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};
