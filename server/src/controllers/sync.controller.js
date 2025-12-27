const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Sale, SaleItem, SalePayment, Customer, Product, BranchStock, SyncLog, sequelize
} = require('../database/models');
const { success, created } = require('../utils/apiResponse');
const { BusinessError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get pending sync items for a branch
exports.getPendingSync = async (req, res, next) => {
  try {
    const { branch_id } = req.params;
    const { last_sync_at } = req.query;

    const since = last_sync_at ? new Date(last_sync_at) : new Date(0);

    // Get products updated since last sync
    const products = await Product.findAll({
      where: {
        updated_at: { [Op.gt]: since }
      },
      include: [
        { model: require('../database/models').Category, as: 'category', attributes: ['name'] },
        { model: require('../database/models').UnitOfMeasure, as: 'unit', attributes: ['code'] }
      ]
    });

    // Get customers updated since last sync
    const customers = await Customer.findAll({
      where: {
        updated_at: { [Op.gt]: since }
      }
    });

    // Get branch stock
    const stocks = await BranchStock.findAll({
      where: {
        branch_id,
        updated_at: { [Op.gt]: since }
      }
    });

    // Get payment methods
    const paymentMethods = await require('../database/models').PaymentMethod.findAll({
      where: {
        is_active: true,
        updated_at: { [Op.gt]: since }
      }
    });

    // Get categories
    const categories = await require('../database/models').Category.findAll({
      where: {
        is_active: true,
        updated_at: { [Op.gt]: since }
      }
    });

    return success(res, {
      sync_timestamp: new Date().toISOString(),
      products,
      customers,
      stocks,
      payment_methods: paymentMethods,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// Upload offline sales from POS
exports.uploadOfflineSales = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_id } = req.params;
    const { sales } = req.body;

    const results = {
      success: [],
      failed: [],
      duplicates: []
    };

    for (const saleData of sales) {
      try {
        // Check for duplicate by local_id
        const existing = await Sale.findOne({
          where: { local_id: saleData.local_id, branch_id }
        });

        if (existing) {
          results.duplicates.push({
            local_id: saleData.local_id,
            server_id: existing.id,
            message: 'Sale already synced'
          });
          continue;
        }

        // Create sale
        const sale = await Sale.create({
          id: uuidv4(),
          local_id: saleData.local_id,
          sale_number: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          branch_id,
          register_id: saleData.register_id,
          session_id: saleData.session_id,
          customer_id: saleData.customer_id,
          cashier_id: saleData.cashier_id,
          subtotal: saleData.subtotal,
          discount_amount: saleData.discount_amount || 0,
          tax_amount: saleData.tax_amount || 0,
          total_amount: saleData.total_amount,
          status: saleData.status || 'COMPLETED',
          sync_status: 'SYNCED',
          synced_at: new Date(),
          created_at: saleData.created_at || new Date()
        }, { transaction: t });

        // Create sale items
        for (const item of saleData.items) {
          await SaleItem.create({
            id: uuidv4(),
            sale_id: sale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            discount_amount: item.discount_amount || 0,
            tax_rate: item.tax_rate || 0,
            tax_amount: item.tax_amount || 0,
            subtotal: item.subtotal,
            total: item.total
          }, { transaction: t });

          // Update stock
          const stock = await BranchStock.findOne({
            where: { branch_id, product_id: item.product_id }
          });

          if (stock) {
            await stock.update({
              quantity: parseFloat(stock.quantity) - item.quantity
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

        results.success.push({
          local_id: saleData.local_id,
          server_id: sale.id,
          sale_number: sale.sale_number
        });

      } catch (error) {
        results.failed.push({
          local_id: saleData.local_id,
          error: error.message
        });
        logger.error(`Failed to sync sale ${saleData.local_id}:`, error);
      }
    }

    // Log sync
    await SyncLog.create({
      id: uuidv4(),
      branch_id,
      sync_type: 'UPLOAD',
      entity_type: 'SALES',
      records_processed: sales.length,
      records_success: results.success.length,
      records_failed: results.failed.length,
      sync_data: JSON.stringify(results),
      synced_by: req.user.id
    }, { transaction: t });

    await t.commit();

    return success(res, results, `Synced ${results.success.length} sales`);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Download data for offline use
exports.downloadForOffline = async (req, res, next) => {
  try {
    const { branch_id } = req.params;

    // Get all active products with stock
    const products = await Product.findAll({
      where: { is_active: true },
      include: [
        { model: require('../database/models').Category, as: 'category', attributes: ['id', 'name'] },
        { model: require('../database/models').UnitOfMeasure, as: 'unit', attributes: ['id', 'code', 'name'] },
        {
          model: BranchStock,
          as: 'branch_stocks',
          where: { branch_id },
          required: false
        }
      ]
    });

    // Format products for offline use
    const offlineProducts = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      short_name: p.short_name,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      tax_rate: p.tax_rate,
      is_tax_included: p.is_tax_included,
      is_weighable: p.is_weighable,
      category_id: p.category_id,
      category_name: p.category?.name,
      unit_id: p.unit_id,
      unit_code: p.unit?.code,
      thumbnail_url: p.thumbnail_url,
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
    const paymentMethods = await require('../database/models').PaymentMethod.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });

    // Get categories
    const categories = await require('../database/models').Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Log download
    await SyncLog.create({
      id: uuidv4(),
      branch_id,
      sync_type: 'DOWNLOAD',
      entity_type: 'FULL',
      records_processed: products.length + customers.length,
      records_success: products.length + customers.length,
      records_failed: 0,
      synced_by: req.user.id
    });

    return success(res, {
      download_timestamp: new Date().toISOString(),
      products: offlineProducts,
      customers,
      payment_methods: paymentMethods,
      categories,
      counts: {
        products: products.length,
        customers: customers.length,
        payment_methods: paymentMethods.length,
        categories: categories.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get sync status
exports.getSyncStatus = async (req, res, next) => {
  try {
    const { branch_id } = req.params;

    // Get latest sync logs
    const recentSyncs = await SyncLog.findAll({
      where: { branch_id },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get pending sales count
    const pendingSales = await Sale.count({
      where: {
        branch_id,
        sync_status: 'PENDING'
      }
    });

    // Last successful sync
    const lastSuccessfulSync = await SyncLog.findOne({
      where: {
        branch_id,
        records_failed: 0
      },
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      pending_sales: pendingSales,
      last_sync: lastSuccessfulSync?.created_at,
      recent_syncs: recentSyncs
    });
  } catch (error) {
    next(error);
  }
};

// Force sync specific sale
exports.forceSyncSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { sale_id } = req.params;

    const sale = await Sale.findByPk(sale_id);
    if (!sale) {
      throw new BusinessError('Sale not found');
    }

    if (sale.sync_status === 'SYNCED') {
      return success(res, sale, 'Sale already synced');
    }

    await sale.update({
      sync_status: 'SYNCED',
      synced_at: new Date()
    }, { transaction: t });

    await t.commit();

    logger.info(`Sale ${sale_id} force synced`);

    return success(res, sale, 'Sale synced');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Resolve sync conflicts
exports.resolveConflict = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { entity_type, local_id, server_id, resolution } = req.body;

    // resolution: 'USE_LOCAL', 'USE_SERVER', 'MERGE'

    switch (entity_type) {
      case 'SALE':
        if (resolution === 'USE_SERVER') {
          // Delete local duplicate
          await Sale.destroy({
            where: { local_id },
            transaction: t
          });
        } else if (resolution === 'USE_LOCAL') {
          // Update server record with local data
          const localSale = await Sale.findOne({ where: { local_id } });
          const serverSale = await Sale.findByPk(server_id);

          if (localSale && serverSale) {
            await serverSale.update({
              total_amount: localSale.total_amount,
              sync_status: 'SYNCED'
            }, { transaction: t });

            await localSale.destroy({ transaction: t });
          }
        }
        break;

      case 'CUSTOMER':
        // Handle customer conflicts
        break;

      default:
        throw new BusinessError(`Unknown entity type: ${entity_type}`);
    }

    await t.commit();

    return success(res, null, 'Conflict resolved');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get sync logs
exports.getSyncLogs = async (req, res, next) => {
  try {
    const { branch_id, sync_type, start_date, end_date, page = 1, limit = 20 } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (sync_type) where.sync_type = sync_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await SyncLog.findAndCountAll({
      where,
      include: [
        { model: require('../database/models').Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: require('../database/models').User, as: 'synced_by_user', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return success(res, {
      logs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_items: count,
        total_pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
