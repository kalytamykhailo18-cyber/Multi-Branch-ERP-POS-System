const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Supplier, PurchaseOrder, PurchaseOrderItem, Product, Branch, User, BranchStock,
  StockMovement, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

// Supplier CRUD
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { is_active, search } = req.query;

    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { tax_id: { [Op.iLike]: `%${search}%` } },
        { contact_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Supplier.findAndCountAll({
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

exports.getById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw new NotFoundError('Supplier not found');
    return success(res, supplier);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({ id: uuidv4(), ...req.body });
    return created(res, supplier);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw new NotFoundError('Supplier not found');
    await supplier.update(req.body);
    return success(res, supplier);
  } catch (error) {
    next(error);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw new NotFoundError('Supplier not found');
    await supplier.update({ is_active: false });
    return success(res, null, 'Supplier deactivated');
  } catch (error) {
    next(error);
  }
};

// Purchase Orders
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { supplier_id, branch_id, status } = req.query;

    const where = {};
    if (supplier_id) where.supplier_id = supplier_id;
    if (branch_id) where.branch_id = branch_id;
    if (status) where.status = status;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: User, as: 'created_by_user', attributes: ['first_name', 'last_name'] }
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

exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Branch, as: 'branch' },
        { model: User, as: 'created_by_user', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'approved_by_user', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'received_by_user', attributes: ['first_name', 'last_name'] },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name', 'sku', 'cost_price'] }]
        }
      ]
    });

    if (!order) throw new NotFoundError('Purchase order not found');
    return success(res, order);
  } catch (error) {
    next(error);
  }
};

exports.createPurchaseOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { supplier_id, branch_id, items, expected_date, notes } = req.body;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }

    const order = await PurchaseOrder.create({
      id: uuidv4(),
      order_number: `PO-${Date.now()}`,
      supplier_id,
      branch_id,
      status: 'DRAFT',
      subtotal,
      tax_amount: 0,
      total_amount: subtotal,
      expected_date,
      notes,
      created_by: req.user.id
    }, { transaction: t });

    for (const item of items) {
      await PurchaseOrderItem.create({
        id: uuidv4(),
        purchase_order_id: order.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity,
        quantity_received: 0,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }, { transaction: t });
    }

    await t.commit();

    const createdOrder = await PurchaseOrder.findByPk(order.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    return created(res, createdOrder);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updatePurchaseOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) throw new NotFoundError('Purchase order not found');

    if (order.status !== 'DRAFT') {
      throw new BusinessError('Can only update draft orders');
    }

    const { items, ...orderData } = req.body;

    if (items) {
      // Delete existing items
      await PurchaseOrderItem.destroy({
        where: { purchase_order_id: order.id },
        transaction: t
      });

      // Create new items
      let subtotal = 0;
      for (const item of items) {
        await PurchaseOrderItem.create({
          id: uuidv4(),
          purchase_order_id: order.id,
          product_id: item.product_id,
          quantity_ordered: item.quantity,
          quantity_received: 0,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        }, { transaction: t });
        subtotal += item.quantity * item.unit_price;
      }

      orderData.subtotal = subtotal;
      orderData.total_amount = subtotal;
    }

    await order.update(orderData, { transaction: t });
    await t.commit();

    return success(res, order);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.submitPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) throw new NotFoundError('Purchase order not found');

    if (order.status !== 'DRAFT') {
      throw new BusinessError('Order is not a draft');
    }

    await order.update({
      status: 'SUBMITTED',
      submitted_at: new Date()
    });

    return success(res, order, 'Order submitted');
  } catch (error) {
    next(error);
  }
};

exports.approvePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) throw new NotFoundError('Purchase order not found');

    if (order.status !== 'SUBMITTED') {
      throw new BusinessError('Order is not submitted');
    }

    await order.update({
      status: 'APPROVED',
      approved_by: req.user.id,
      approved_at: new Date()
    });

    return success(res, order, 'Order approved');
  } catch (error) {
    next(error);
  }
};

exports.receivePurchaseOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }]
    });

    if (!order) throw new NotFoundError('Purchase order not found');
    if (order.status !== 'APPROVED' && order.status !== 'PARTIALLY_RECEIVED') {
      throw new BusinessError('Order is not approved');
    }

    const { items } = req.body;
    let allReceived = true;

    for (const receivedItem of items) {
      const orderItem = order.items.find((i) => i.id === receivedItem.id);
      if (!orderItem) continue;

      const newQuantityReceived = parseFloat(orderItem.quantity_received) + receivedItem.quantity_received;
      await orderItem.update({ quantity_received: newQuantityReceived }, { transaction: t });

      if (newQuantityReceived < orderItem.quantity_ordered) {
        allReceived = false;
      }

      // Update stock
      let stock = await BranchStock.findOne({
        where: { branch_id: order.branch_id, product_id: orderItem.product_id }
      });

      const previousQuantity = stock ? parseFloat(stock.quantity) : 0;
      const newQuantity = previousQuantity + receivedItem.quantity_received;

      if (!stock) {
        stock = await BranchStock.create({
          id: uuidv4(),
          branch_id: order.branch_id,
          product_id: orderItem.product_id,
          quantity: newQuantity,
          min_stock: 0,
          max_stock: 0
        }, { transaction: t });
      } else {
        await stock.update({ quantity: newQuantity }, { transaction: t });
      }

      // Create stock movement
      await StockMovement.create({
        id: uuidv4(),
        branch_id: order.branch_id,
        product_id: orderItem.product_id,
        movement_type: 'PURCHASE',
        quantity: receivedItem.quantity_received,
        quantity_before: previousQuantity,
        quantity_after: newQuantity,
        reference_type: 'PURCHASE_ORDER',
        reference_id: order.id,
        created_by: req.user.id
      }, { transaction: t });
    }

    await order.update({
      status: allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
      received_by: req.user.id,
      received_at: new Date()
    }, { transaction: t });

    await t.commit();
    return success(res, order, allReceived ? 'Order fully received' : 'Order partially received');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.cancelPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) throw new NotFoundError('Purchase order not found');

    if (order.status === 'RECEIVED' || order.status === 'CANCELLED') {
      throw new BusinessError('Cannot cancel this order');
    }

    await order.update({
      status: 'CANCELLED',
      notes: `${order.notes || ''}\nCancelled: ${req.body.reason || ''}`
    });

    return success(res, null, 'Order cancelled');
  } catch (error) {
    next(error);
  }
};

exports.getSupplierProducts = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw new NotFoundError('Supplier not found');

    // Get products from purchase history
    const products = await PurchaseOrderItem.findAll({
      include: [
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          where: { supplier_id: req.params.id },
          attributes: []
        },
        { model: Product, as: 'product' }
      ],
      attributes: [
        'product_id',
        [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_price'],
        [sequelize.fn('SUM', sequelize.col('quantity_ordered')), 'total_ordered']
      ],
      group: ['product_id', 'product.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity_ordered')), 'DESC']]
    });

    return success(res, products);
  } catch (error) {
    next(error);
  }
};
