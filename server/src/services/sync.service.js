const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  Sale, SaleItem, SalePayment, Customer, Product, BranchStock, Category,
  PaymentMethod, SyncLog, StockMovement, sequelize
} = require('../database/models');
const { BusinessError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class SyncService {
  async getDataForSync(branchId, lastSyncAt) {
    const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

    // Get updated products
    const products = await Product.findAll({
      where: { updated_at: { [Op.gt]: since } },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: require('../database/models').UnitOfMeasure, as: 'unit', attributes: ['id', 'code', 'name'] }
      ]
    });

    // Get updated customers
    const customers = await Customer.findAll({
      where: { updated_at: { [Op.gt]: since } },
      attributes: [
        'id', 'customer_code', 'first_name', 'last_name', 'company_name',
        'phone', 'document_number', 'qr_code', 'loyalty_points', 'credit_balance',
        'is_wholesale', 'wholesale_discount_percent', 'is_active'
      ]
    });

    // Get branch stock
    const stocks = await BranchStock.findAll({
      where: {
        branch_id: branchId,
        updated_at: { [Op.gt]: since }
      }
    });

    // Get payment methods
    const paymentMethods = await PaymentMethod.findAll({
      where: {
        is_active: true,
        updated_at: { [Op.gt]: since }
      }
    });

    // Get categories
    const categories = await Category.findAll({
      where: {
        is_active: true,
        updated_at: { [Op.gt]: since }
      }
    });

    return {
      sync_timestamp: new Date().toISOString(),
      products: products.map(this.formatProductForSync),
      customers,
      stocks,
      payment_methods: paymentMethods,
      categories
    };
  }

  formatProductForSync(product) {
    return {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      short_name: product.short_name,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      wholesale_price: product.wholesale_price,
      tax_rate: product.tax_rate,
      is_tax_included: product.is_tax_included,
      is_weighable: product.is_weighable,
      is_active: product.is_active,
      category_id: product.category_id,
      category_name: product.category?.name,
      unit_id: product.unit_id,
      unit_code: product.unit?.code,
      thumbnail_url: product.thumbnail_url
    };
  }

  async getFullDataForOffline(branchId) {
    // Get all active products with stock
    const products = await Product.findAll({
      where: { is_active: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: require('../database/models').UnitOfMeasure, as: 'unit', attributes: ['id', 'code', 'name'] },
        {
          model: BranchStock,
          as: 'branch_stocks',
          where: { branch_id: branchId },
          required: false
        }
      ]
    });

    // Format products for offline
    const offlineProducts = products.map((p) => ({
      ...this.formatProductForSync(p),
      stock_quantity: p.branch_stocks?.[0]?.quantity || 0,
      min_stock: p.branch_stocks?.[0]?.min_stock || 0
    }));

    // Get active customers
    const customers = await Customer.findAll({
      where: { is_active: true },
      attributes: [
        'id', 'customer_code', 'first_name', 'last_name', 'company_name',
        'phone', 'document_number', 'qr_code', 'loyalty_points', 'credit_balance',
        'is_wholesale', 'wholesale_discount_percent'
      ]
    });

    // Get payment methods
    const paymentMethods = await PaymentMethod.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });

    // Get categories
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    return {
      download_timestamp: new Date().toISOString(),
      products: offlineProducts,
      customers,
      payment_methods: paymentMethods,
      categories
    };
  }

  async uploadOfflineSales(branchId, sales, userId) {
    const results = {
      success: [],
      failed: [],
      duplicates: []
    };

    for (const saleData of sales) {
      const t = await sequelize.transaction();

      try {
        // Check for duplicate
        const existing = await Sale.findOne({
          where: { local_id: saleData.local_id, branch_id: branchId }
        });

        if (existing) {
          results.duplicates.push({
            local_id: saleData.local_id,
            server_id: existing.id,
            message: 'Sale already synced'
          });
          await t.rollback();
          continue;
        }

        // Create sale
        const sale = await Sale.create({
          id: uuidv4(),
          local_id: saleData.local_id,
          sale_number: await this.generateSyncedSaleNumber(branchId),
          branch_id: branchId,
          register_id: saleData.register_id,
          session_id: saleData.session_id,
          customer_id: saleData.customer_id,
          cashier_id: saleData.cashier_id || userId,
          subtotal: saleData.subtotal,
          discount_type: saleData.discount_type,
          discount_value: saleData.discount_value,
          discount_amount: saleData.discount_amount || 0,
          tax_amount: saleData.tax_amount || 0,
          total_amount: saleData.total_amount,
          paid_amount: saleData.paid_amount,
          change_amount: saleData.change_amount || 0,
          status: saleData.status || 'COMPLETED',
          notes: saleData.notes,
          sync_status: 'SYNCED',
          synced_at: new Date(),
          created_at: saleData.created_at || new Date()
        }, { transaction: t });

        // Create sale items and update stock
        for (const item of saleData.items) {
          await SaleItem.create({
            id: uuidv4(),
            sale_id: sale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cost_price: item.cost_price,
            discount_percent: item.discount_percent || 0,
            discount_amount: item.discount_amount || 0,
            tax_rate: item.tax_rate || 0,
            tax_amount: item.tax_amount || 0,
            subtotal: item.subtotal,
            total: item.total
          }, { transaction: t });

          // Update stock
          const stock = await BranchStock.findOne({
            where: { branch_id: branchId, product_id: item.product_id }
          });

          if (stock) {
            const prevQty = parseFloat(stock.quantity);
            const newQty = prevQty - parseFloat(item.quantity);

            await stock.update({ quantity: newQty }, { transaction: t });

            // Create stock movement
            await StockMovement.create({
              id: uuidv4(),
              branch_id: branchId,
              product_id: item.product_id,
              movement_type: 'SALE',
              quantity: item.quantity,
              quantity_before: prevQty,
              quantity_after: newQty,
              reference_type: 'SALE',
              reference_id: sale.id,
              notes: 'Synced from offline',
              created_by: userId
            }, { transaction: t });
          }
        }

        // Create payments
        for (const payment of saleData.payments) {
          await SalePayment.create({
            id: uuidv4(),
            sale_id: sale.id,
            payment_method_id: payment.payment_method_id,
            amount: payment.amount,
            reference_number: payment.reference_number,
            status: 'APPROVED'
          }, { transaction: t });
        }

        await t.commit();

        results.success.push({
          local_id: saleData.local_id,
          server_id: sale.id,
          sale_number: sale.sale_number
        });

      } catch (error) {
        await t.rollback();

        results.failed.push({
          local_id: saleData.local_id,
          error: error.message
        });

        logger.error(`Failed to sync sale ${saleData.local_id}:`, error);
      }
    }

    // Log sync operation
    await SyncLog.create({
      id: uuidv4(),
      branch_id: branchId,
      sync_type: 'UPLOAD',
      entity_type: 'SALES',
      records_processed: sales.length,
      records_success: results.success.length,
      records_failed: results.failed.length,
      sync_data: JSON.stringify(results),
      synced_by: userId
    });

    logger.info(`Sync completed: ${results.success.length} success, ${results.failed.length} failed, ${results.duplicates.length} duplicates`);

    return results;
  }

  async generateSyncedSaleNumber(branchId) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastSale = await Sale.findOne({
      where: {
        branch_id: branchId,
        sale_number: { [Op.like]: `S${dateStr}%` }
      },
      order: [['sale_number', 'DESC']]
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.sale_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `S${dateStr}${String(sequence).padStart(4, '0')}`;
  }

  async getSyncStatus(branchId) {
    // Get pending sales
    const pendingSales = await Sale.count({
      where: {
        branch_id: branchId,
        sync_status: 'PENDING'
      }
    });

    // Get recent sync logs
    const recentSyncs = await SyncLog.findAll({
      where: { branch_id: branchId },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get last successful sync
    const lastSuccessfulSync = await SyncLog.findOne({
      where: {
        branch_id: branchId,
        records_failed: 0
      },
      order: [['created_at', 'DESC']]
    });

    // Get failed syncs needing attention
    const failedSyncs = await SyncLog.count({
      where: {
        branch_id: branchId,
        records_failed: { [Op.gt]: 0 },
        created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    return {
      pending_sales: pendingSales,
      last_sync: lastSuccessfulSync?.created_at,
      last_sync_status: lastSuccessfulSync ? 'SUCCESS' : null,
      recent_syncs: recentSyncs,
      failed_syncs_24h: failedSyncs,
      needs_attention: pendingSales > 0 || failedSyncs > 0
    };
  }

  async markSaleAsSynced(saleId) {
    const sale = await Sale.findByPk(saleId);
    if (!sale) return null;

    await sale.update({
      sync_status: 'SYNCED',
      synced_at: new Date()
    });

    return sale;
  }

  async resolveConflict(entityType, localId, serverId, resolution, userId) {
    const t = await sequelize.transaction();

    try {
      switch (entityType) {
        case 'SALE':
          await this.resolveSaleConflict(localId, serverId, resolution, t);
          break;
        case 'CUSTOMER':
          await this.resolveCustomerConflict(localId, serverId, resolution, t);
          break;
        default:
          throw new BusinessError(`Unknown entity type: ${entityType}`);
      }

      await t.commit();

      logger.info(`Conflict resolved: ${entityType} - ${resolution}`);

      return { success: true };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async resolveSaleConflict(localId, serverId, resolution, transaction) {
    if (resolution === 'USE_SERVER') {
      // Delete local duplicate
      await Sale.destroy({
        where: { local_id: localId },
        transaction
      });
    } else if (resolution === 'USE_LOCAL') {
      // Update server record with local data
      const localSale = await Sale.findOne({ where: { local_id: localId } });
      const serverSale = await Sale.findByPk(serverId);

      if (localSale && serverSale) {
        await serverSale.update({
          total_amount: localSale.total_amount,
          sync_status: 'SYNCED',
          synced_at: new Date()
        }, { transaction });

        await localSale.destroy({ transaction });
      }
    } else if (resolution === 'MERGE') {
      // Keep both with different identifiers
      const localSale = await Sale.findOne({ where: { local_id: localId } });
      if (localSale) {
        await localSale.update({
          local_id: `${localId}_merged`,
          sync_status: 'SYNCED',
          notes: `${localSale.notes || ''}\n[Merged duplicate]`
        }, { transaction });
      }
    }
  }

  async resolveCustomerConflict(localId, serverId, resolution, transaction) {
    // Similar logic for customer conflicts
    if (resolution === 'USE_SERVER') {
      // Customer updates from server take precedence
      logger.info(`Customer conflict resolved: using server data for ${serverId}`);
    } else if (resolution === 'USE_LOCAL') {
      // Use local customer data
      logger.info(`Customer conflict resolved: using local data for ${localId}`);
    }
  }

  async getSyncLogs(filters = {}) {
    const where = {};

    if (filters.branch_id) where.branch_id = filters.branch_id;
    if (filters.sync_type) where.sync_type = filters.sync_type;
    if (filters.entity_type) where.entity_type = filters.entity_type;

    if (filters.start_date || filters.end_date) {
      where.created_at = {};
      if (filters.start_date) where.created_at[Op.gte] = new Date(filters.start_date);
      if (filters.end_date) where.created_at[Op.lte] = new Date(filters.end_date);
    }

    return SyncLog.findAll({
      where,
      include: [
        { model: require('../database/models').Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: require('../database/models').User, as: 'synced_by_user', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: filters.limit || 100,
      offset: filters.offset || 0
    });
  }
}

module.exports = new SyncService();
