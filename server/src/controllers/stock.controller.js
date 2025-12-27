const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  BranchStock, Product, Branch, StockMovement, StockTransfer, StockTransferItem,
  User, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

exports.getBranchStock = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    // Support both :branchId param and branch_id query param
    const branch_id = req.params.branchId || req.params.branch_id || req.query.branch_id;
    const { low_stock, search, category_id } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;

    const productWhere = { is_active: true };
    if (category_id) productWhere.category_id = category_id;
    if (search) {
      productWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (low_stock === 'true') {
      where[Op.and] = [
        sequelize.where(
          sequelize.col('quantity'),
          Op.lte,
          sequelize.col('min_stock')
        )
      ];
    }

    const { count, rows } = await BranchStock.findAndCountAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        where: productWhere,
        required: true
      }],
      order: [[{ model: Product, as: 'product' }, 'name', 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getProductStock = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const stocks = await BranchStock.findAll({
      where: { product_id },
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }]
    });

    return success(res, stocks);
  } catch (error) {
    next(error);
  }
};

exports.adjustStock = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, product_id, quantity, reason, notes } = req.body;

    let stock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (!stock) {
      stock = await BranchStock.create({
        id: uuidv4(),
        branch_id,
        product_id,
        quantity: 0,
        reserved_quantity: 0,
        expected_shrinkage: 0,
        actual_shrinkage: 0
      }, { transaction: t });
    }

    const previousQuantity = parseFloat(stock.quantity);
    const newQuantity = previousQuantity + quantity;

    if (newQuantity < 0) {
      throw new BusinessError('Stock cannot be negative');
    }

    await stock.update({ quantity: newQuantity }, { transaction: t });

    const movement = await StockMovement.create({
      id: uuidv4(),
      branch_id,
      product_id,
      movement_type: quantity > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
      quantity: Math.abs(quantity),
      quantity_before: previousQuantity,
      quantity_after: newQuantity,
      adjustment_reason: reason,
      notes,
      performed_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return success(res, { stock, movement });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updateMinMax = async (req, res, next) => {
  try {
    const { branch_id, product_id, min_stock, max_stock } = req.body;

    let stock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (!stock) {
      stock = await BranchStock.create({
        id: uuidv4(),
        branch_id,
        product_id,
        quantity: 0,
        min_stock: min_stock || 0,
        max_stock: max_stock || 0
      });
    } else {
      await stock.update({ min_stock, max_stock });
    }

    return success(res, stock);
  } catch (error) {
    next(error);
  }
};

exports.getMovements = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, product_id, movement_type, start_date, end_date } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (product_id) where.product_id = product_id;
    if (movement_type) where.movement_type = movement_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'performer', attributes: ['first_name', 'last_name'] }
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

// Stock Transfers
exports.getTransfers = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { from_branch_id, to_branch_id, status } = req.query;

    const where = {};
    if (from_branch_id) where.from_branch_id = from_branch_id;
    if (to_branch_id) where.to_branch_id = to_branch_id;
    if (status) where.status = status;

    const { count, rows } = await StockTransfer.findAndCountAll({
      where,
      include: [
        { model: Branch, as: 'from_branch', attributes: ['name', 'code'] },
        { model: Branch, as: 'to_branch', attributes: ['name', 'code'] },
        { model: User, as: 'requested_by_user', attributes: ['first_name', 'last_name'] }
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

exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [
        { model: Branch, as: 'from_branch' },
        { model: Branch, as: 'to_branch' },
        { model: User, as: 'requested_by_user', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'approved_by_user', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'received_by_user', attributes: ['first_name', 'last_name'] },
        {
          model: StockTransferItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }]
        }
      ]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    return success(res, transfer);
  } catch (error) {
    next(error);
  }
};

exports.createTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { from_branch_id, to_branch_id, items, notes } = req.body;

    const transfer = await StockTransfer.create({
      id: uuidv4(),
      transfer_number: `TR-${Date.now()}`,
      from_branch_id,
      to_branch_id,
      status: 'PENDING',
      notes,
      requested_by: req.user.id,
      requested_at: new Date()
    }, { transaction: t });

    for (const item of items) {
      await StockTransferItem.create({
        id: uuidv4(),
        transfer_id: transfer.id,
        product_id: item.product_id,
        quantity_requested: item.quantity,
        quantity_sent: 0,
        quantity_received: 0
      }, { transaction: t });
    }

    await t.commit();

    const createdTransfer = await StockTransfer.findByPk(transfer.id, {
      include: [
        { model: Branch, as: 'from_branch' },
        { model: Branch, as: 'to_branch' },
        { model: StockTransferItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    return created(res, createdTransfer);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.approveTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [{ model: StockTransferItem, as: 'items' }]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status !== 'PENDING') {
      throw new BusinessError('Transfer is not pending approval');
    }

    // Update items with sent quantities and deduct from source branch
    for (const item of req.body.items) {
      const transferItem = transfer.items.find((i) => i.id === item.id);
      if (!transferItem) continue;

      await transferItem.update({ quantity_sent: item.quantity_sent }, { transaction: t });

      // Deduct from source branch
      const sourceStock = await BranchStock.findOne({
        where: { branch_id: transfer.from_branch_id, product_id: transferItem.product_id }
      });

      if (!sourceStock || sourceStock.quantity < item.quantity_sent) {
        throw new BusinessError(`Insufficient stock for product ${transferItem.product_id}`);
      }

      const newQuantity = parseFloat(sourceStock.quantity) - item.quantity_sent;
      await sourceStock.update({ quantity: newQuantity }, { transaction: t });

      // Create movement record
      await StockMovement.create({
        id: uuidv4(),
        branch_id: transfer.from_branch_id,
        product_id: transferItem.product_id,
        movement_type: 'TRANSFER_OUT',
        quantity: item.quantity_sent,
        quantity_before: sourceStock.quantity,
        quantity_after: newQuantity,
        reference_type: 'TRANSFER',
        reference_id: transfer.id,
        performed_by: req.user.id
      }, { transaction: t });
    }

    await transfer.update({
      status: 'IN_TRANSIT',
      approved_by: req.user.id,
      approved_at: new Date()
    }, { transaction: t });

    await t.commit();
    return success(res, transfer, 'Transfer approved and in transit');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.receiveTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [{ model: StockTransferItem, as: 'items' }]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status !== 'IN_TRANSIT') {
      throw new BusinessError('Transfer is not in transit');
    }

    // Update items with received quantities and add to destination branch
    for (const item of req.body.items) {
      const transferItem = transfer.items.find((i) => i.id === item.id);
      if (!transferItem) continue;

      await transferItem.update({ quantity_received: item.quantity_received }, { transaction: t });

      // Add to destination branch
      let destStock = await BranchStock.findOne({
        where: { branch_id: transfer.to_branch_id, product_id: transferItem.product_id }
      });

      const previousQuantity = destStock ? parseFloat(destStock.quantity) : 0;
      const newQuantity = previousQuantity + item.quantity_received;

      if (!destStock) {
        destStock = await BranchStock.create({
          id: uuidv4(),
          branch_id: transfer.to_branch_id,
          product_id: transferItem.product_id,
          quantity: newQuantity,
          min_stock: 0,
          max_stock: 0
        }, { transaction: t });
      } else {
        await destStock.update({ quantity: newQuantity }, { transaction: t });
      }

      // Create movement record
      await StockMovement.create({
        id: uuidv4(),
        branch_id: transfer.to_branch_id,
        product_id: transferItem.product_id,
        movement_type: 'TRANSFER_IN',
        quantity: item.quantity_received,
        quantity_before: previousQuantity,
        quantity_after: newQuantity,
        reference_type: 'TRANSFER',
        reference_id: transfer.id,
        performed_by: req.user.id
      }, { transaction: t });
    }

    await transfer.update({
      status: 'COMPLETED',
      received_by: req.user.id,
      received_at: new Date()
    }, { transaction: t });

    await t.commit();
    return success(res, transfer, 'Transfer received');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.cancelTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.findByPk(req.params.id, {
      include: [{ model: StockTransferItem, as: 'items' }]
    });

    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status === 'COMPLETED') {
      throw new BusinessError('Cannot cancel completed transfer');
    }

    // If in transit, restore stock to source branch
    if (transfer.status === 'IN_TRANSIT') {
      for (const item of transfer.items) {
        const sourceStock = await BranchStock.findOne({
          where: { branch_id: transfer.from_branch_id, product_id: item.product_id }
        });

        if (sourceStock) {
          const newQuantity = parseFloat(sourceStock.quantity) + parseFloat(item.quantity_sent);
          await sourceStock.update({ quantity: newQuantity }, { transaction: t });

          await StockMovement.create({
            id: uuidv4(),
            branch_id: transfer.from_branch_id,
            product_id: item.product_id,
            movement_type: 'TRANSFER_OUT',
            quantity: item.quantity_sent,
            quantity_before: sourceStock.quantity,
            quantity_after: newQuantity,
            reference_type: 'TRANSFER',
            reference_id: transfer.id,
            notes: 'Transfer cancelled - stock restored',
            performed_by: req.user.id
          }, { transaction: t });
        }
      }
    }

    await transfer.update({
      status: 'CANCELLED',
      notes: `${transfer.notes || ''}\nCancelled by ${req.user.first_name} ${req.user.last_name}: ${req.body.reason || ''}`
    }, { transaction: t });

    await t.commit();
    return success(res, null, 'Transfer cancelled');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Shrinkage
exports.getShrinkage = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, product_id, reason, start_date, end_date } = req.query;

    const where = { movement_type: 'SHRINKAGE' };
    if (branch_id) where.branch_id = branch_id;
    if (product_id) where.product_id = product_id;
    if (reason) where.adjustment_reason = reason;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'performer', attributes: ['first_name', 'last_name'] }
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

exports.recordShrinkage = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id, product_id, quantity, reason, notes } = req.body;

    // Get current stock
    const stock = await BranchStock.findOne({
      where: { branch_id, product_id }
    });

    if (!stock) throw new NotFoundError('Stock record not found');

    const previousQuantity = parseFloat(stock.quantity);
    const newQuantity = previousQuantity - quantity;

    if (newQuantity < 0) {
      throw new BusinessError('Shrinkage quantity exceeds available stock');
    }

    // Update stock
    await stock.update({ quantity: newQuantity }, { transaction: t });

    // Create movement record with movement_type='SHRINKAGE'
    const movement = await StockMovement.create({
      id: uuidv4(),
      branch_id,
      product_id,
      movement_type: 'SHRINKAGE',
      quantity,
      quantity_before: previousQuantity,
      quantity_after: newQuantity,
      reference_type: 'ADJUSTMENT',
      adjustment_reason: reason,
      notes,
      performed_by: req.user.id
    }, { transaction: t });

    await t.commit();
    return created(res, movement);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getShrinkageReport = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;

    const where = { movement_type: 'SHRINKAGE' };
    if (branch_id) where.branch_id = branch_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    // Group by reason
    const byReason = await StockMovement.findAll({
      where,
      attributes: [
        'adjustment_reason',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['adjustment_reason']
    });

    // Group by product
    const byProduct = await StockMovement.findAll({
      where,
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
      ],
      include: [{ model: Product, as: 'product', attributes: ['name', 'sku', 'cost_price'] }],
      group: ['product_id', 'product.id', 'product.name', 'product.sku', 'product.cost_price'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 20
    });

    // Total loss
    const totals = await StockMovement.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records']
      ]
    });

    return success(res, {
      by_reason: byReason,
      by_product: byProduct,
      totals: totals?.toJSON() || { total_quantity: 0, total_records: 0 }
    });
  } catch (error) {
    next(error);
  }
};
