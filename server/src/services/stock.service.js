const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  BranchStock, Product, Branch, StockMovement, StockTransfer, StockTransferItem,
  Shrinkage, sequelize
} = require('../database/models');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const alertService = require('./alert.service');
const logger = require('../utils/logger');

class StockService {
  async getStock(branchId, productId) {
    return BranchStock.findOne({
      where: { branch_id: branchId, product_id: productId },
      include: [{ model: Product, as: 'product' }]
    });
  }

  async updateStock(branchId, productId, quantity, movementType, userId, options = {}) {
    const t = options.transaction || await sequelize.transaction();
    const useExternalTransaction = !!options.transaction;

    try {
      let stock = await BranchStock.findOne({
        where: { branch_id: branchId, product_id: productId }
      });

      const previousQuantity = stock ? parseFloat(stock.quantity) : 0;
      let newQuantity;

      switch (movementType) {
        case 'SET':
          newQuantity = quantity;
          break;
        case 'ADD':
          newQuantity = previousQuantity + quantity;
          break;
        case 'SUBTRACT':
          newQuantity = previousQuantity - quantity;
          break;
        default:
          newQuantity = previousQuantity + quantity;
      }

      if (newQuantity < 0 && !options.allowNegative) {
        throw new BusinessError('Stock cannot be negative');
      }

      if (!stock) {
        stock = await BranchStock.create({
          id: uuidv4(),
          branch_id: branchId,
          product_id: productId,
          quantity: newQuantity,
          min_stock: 0,
          max_stock: 0
        }, { transaction: t });
      } else {
        await stock.update({ quantity: newQuantity }, { transaction: t });
      }

      // Create movement record
      if (options.createMovement !== false) {
        await StockMovement.create({
          id: uuidv4(),
          branch_id: branchId,
          product_id: productId,
          movement_type: options.movementType || 'ADJUSTMENT',
          quantity: Math.abs(quantity),
          quantity_before: previousQuantity,
          quantity_after: newQuantity,
          reference_type: options.referenceType,
          reference_id: options.referenceId,
          reason: options.reason,
          notes: options.notes,
          created_by: userId
        }, { transaction: t });
      }

      if (!useExternalTransaction) {
        await t.commit();
      }

      // Check for low stock alert
      if (newQuantity <= stock.min_stock && stock.min_stock > 0) {
        const product = await Product.findByPk(productId);
        alertService.createLowStockAlert(branchId, product.name, newQuantity, stock.min_stock);
      }

      return stock;
    } catch (error) {
      if (!useExternalTransaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  async bulkUpdateStock(branchId, items, userId, options = {}) {
    const t = await sequelize.transaction();

    try {
      const results = [];

      for (const item of items) {
        const result = await this.updateStock(
          branchId,
          item.product_id,
          item.quantity,
          item.movement_type || 'SET',
          userId,
          { ...options, transaction: t }
        );
        results.push(result);
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async createTransfer(fromBranchId, toBranchId, items, userId) {
    const t = await sequelize.transaction();

    try {
      // Validate source stock
      for (const item of items) {
        const sourceStock = await BranchStock.findOne({
          where: { branch_id: fromBranchId, product_id: item.product_id }
        });

        if (!sourceStock || sourceStock.quantity < item.quantity) {
          const product = await Product.findByPk(item.product_id);
          throw new BusinessError(`Insufficient stock for ${product?.name || item.product_id}`);
        }
      }

      const transfer = await StockTransfer.create({
        id: uuidv4(),
        transfer_number: `TR-${Date.now()}`,
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        status: 'PENDING',
        requested_by: userId,
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

      logger.info(`Stock transfer ${transfer.transfer_number} created from branch ${fromBranchId} to ${toBranchId}`);

      return transfer;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async processTransferShipment(transferId, items, userId) {
    const t = await sequelize.transaction();

    try {
      const transfer = await StockTransfer.findByPk(transferId, {
        include: [{ model: StockTransferItem, as: 'items' }]
      });

      if (!transfer) {
        throw new NotFoundError('Transfer not found');
      }

      if (transfer.status !== 'PENDING') {
        throw new BusinessError('Transfer is not pending');
      }

      // Deduct from source branch
      for (const item of items) {
        const transferItem = transfer.items.find((i) => i.id === item.id || i.product_id === item.product_id);
        if (!transferItem) continue;

        await transferItem.update({ quantity_sent: item.quantity }, { transaction: t });

        await this.updateStock(
          transfer.from_branch_id,
          transferItem.product_id,
          item.quantity,
          'SUBTRACT',
          userId,
          {
            transaction: t,
            movementType: 'TRANSFER_OUT',
            referenceType: 'TRANSFER',
            referenceId: transfer.id
          }
        );
      }

      await transfer.update({
        status: 'IN_TRANSIT',
        approved_by: userId,
        approved_at: new Date()
      }, { transaction: t });

      await t.commit();

      logger.info(`Stock transfer ${transfer.transfer_number} shipped`);

      return transfer;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async processTransferReceipt(transferId, items, userId) {
    const t = await sequelize.transaction();

    try {
      const transfer = await StockTransfer.findByPk(transferId, {
        include: [{ model: StockTransferItem, as: 'items' }]
      });

      if (!transfer) {
        throw new NotFoundError('Transfer not found');
      }

      if (transfer.status !== 'IN_TRANSIT') {
        throw new BusinessError('Transfer is not in transit');
      }

      // Add to destination branch
      for (const item of items) {
        const transferItem = transfer.items.find((i) => i.id === item.id || i.product_id === item.product_id);
        if (!transferItem) continue;

        await transferItem.update({ quantity_received: item.quantity }, { transaction: t });

        await this.updateStock(
          transfer.to_branch_id,
          transferItem.product_id,
          item.quantity,
          'ADD',
          userId,
          {
            transaction: t,
            movementType: 'TRANSFER_IN',
            referenceType: 'TRANSFER',
            referenceId: transfer.id
          }
        );
      }

      await transfer.update({
        status: 'COMPLETED',
        received_by: userId,
        received_at: new Date()
      }, { transaction: t });

      await t.commit();

      logger.info(`Stock transfer ${transfer.transfer_number} completed`);

      return transfer;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async recordShrinkage(branchId, productId, quantity, reason, userId, notes = null) {
    const t = await sequelize.transaction();

    try {
      const stock = await BranchStock.findOne({
        where: { branch_id: branchId, product_id: productId }
      });

      if (!stock) {
        throw new NotFoundError('Stock record not found');
      }

      if (stock.quantity < quantity) {
        throw new BusinessError('Shrinkage quantity exceeds available stock');
      }

      const product = await Product.findByPk(productId);
      const costLoss = product ? parseFloat(product.cost_price) * quantity : 0;

      const shrinkage = await Shrinkage.create({
        id: uuidv4(),
        branch_id: branchId,
        product_id: productId,
        quantity,
        cost_loss: costLoss,
        reason,
        notes,
        reported_by: userId
      }, { transaction: t });

      await this.updateStock(
        branchId,
        productId,
        quantity,
        'SUBTRACT',
        userId,
        {
          transaction: t,
          movementType: 'SHRINKAGE',
          referenceType: 'SHRINKAGE',
          referenceId: shrinkage.id,
          reason,
          notes
        }
      );

      await t.commit();

      // Create shrinkage alert
      alertService.createShrinkageAlert(branchId, product.name, quantity, costLoss);

      logger.info(`Shrinkage recorded: ${quantity} units of ${product.name} - Loss: $${costLoss}`);

      return shrinkage;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getLowStockProducts(branchId = null, limit = 50) {
    const where = {};
    if (branchId) where.branch_id = branchId;

    return BranchStock.findAll({
      where: {
        ...where,
        [Op.and]: [
          sequelize.where(
            sequelize.col('quantity'),
            Op.lte,
            sequelize.col('min_stock')
          )
        ]
      },
      include: [
        { model: Product, as: 'product', where: { is_active: true } },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] }
      ],
      order: [[sequelize.literal('quantity - min_stock'), 'ASC']],
      limit
    });
  }

  async getStockValuation(branchId) {
    const stocks = await BranchStock.findAll({
      where: { branch_id: branchId },
      include: [{
        model: Product,
        as: 'product',
        where: { is_active: true },
        attributes: ['name', 'sku', 'cost_price', 'selling_price']
      }]
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;

    const items = stocks.map((stock) => {
      const quantity = parseFloat(stock.quantity);
      const costPrice = parseFloat(stock.product?.cost_price) || 0;
      const sellingPrice = parseFloat(stock.product?.selling_price) || 0;

      const costValue = quantity * costPrice;
      const retailValue = quantity * sellingPrice;

      totalCostValue += costValue;
      totalRetailValue += retailValue;

      return {
        product_id: stock.product_id,
        product_name: stock.product?.name,
        sku: stock.product?.sku,
        quantity,
        cost_price: costPrice,
        selling_price: sellingPrice,
        cost_value: costValue,
        retail_value: retailValue
      };
    });

    return {
      items,
      totals: {
        total_items: items.length,
        total_units: items.reduce((sum, i) => sum + i.quantity, 0),
        total_cost_value: totalCostValue,
        total_retail_value: totalRetailValue,
        potential_profit: totalRetailValue - totalCostValue
      }
    };
  }

  async performStockCount(branchId, counts, userId) {
    const t = await sequelize.transaction();

    try {
      const results = [];

      for (const count of counts) {
        const stock = await BranchStock.findOne({
          where: { branch_id: branchId, product_id: count.product_id }
        });

        const systemQuantity = stock ? parseFloat(stock.quantity) : 0;
        const countedQuantity = parseFloat(count.quantity);
        const difference = countedQuantity - systemQuantity;

        if (difference !== 0) {
          await this.updateStock(
            branchId,
            count.product_id,
            countedQuantity,
            'SET',
            userId,
            {
              transaction: t,
              movementType: 'COUNT_ADJUSTMENT',
              reason: 'Inventory count adjustment',
              notes: `System: ${systemQuantity}, Counted: ${countedQuantity}, Diff: ${difference}`
            }
          );
        }

        results.push({
          product_id: count.product_id,
          system_quantity: systemQuantity,
          counted_quantity: countedQuantity,
          difference,
          adjusted: difference !== 0
        });
      }

      await t.commit();

      const adjustedCount = results.filter((r) => r.adjusted).length;
      logger.info(`Stock count completed: ${adjustedCount} items adjusted`);

      return {
        results,
        summary: {
          total_counted: results.length,
          adjusted: adjustedCount,
          unchanged: results.length - adjustedCount
        }
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new StockService();
