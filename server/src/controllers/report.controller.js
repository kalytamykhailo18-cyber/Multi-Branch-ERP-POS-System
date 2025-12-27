const { Op } = require('sequelize');
const {
  Sale, SaleItem, SalePayment, RegisterSession, DailyReport, Branch, User, Product,
  Category, Customer, PaymentMethod, BranchStock, sequelize
} = require('../database/models');
const { success } = require('../utils/apiResponse');
const { NotFoundError } = require('../middleware/errorHandler');

// Daily Report
exports.getDailyReport = async (req, res, next) => {
  try {
    const { branch_id, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    // Try to get existing report
    let report = await DailyReport.findOne({
      where: { branch_id, report_date: dateString },
      include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }]
    });

    if (!report) {
      // Generate report on the fly
      report = await exports.generateDailyReportData(branch_id, targetDate);
    }

    return success(res, report);
  } catch (error) {
    next(error);
  }
};

exports.generateDailyReportData = async (branchId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const saleWhere = {
    branch_id: branchId,
    status: 'COMPLETED',
    created_at: { [Op.between]: [startOfDay, endOfDay] }
  };

  // Sales totals
  const salesData = await Sale.findOne({
    where: saleWhere,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
      [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax'],
      [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discounts'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_ticket']
    ]
  });

  // Voided sales
  const voidedData = await Sale.findOne({
    where: {
      branch_id: branchId,
      status: 'VOIDED',
      created_at: { [Op.between]: [startOfDay, endOfDay] }
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'voided_count'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'voided_amount']
    ]
  });

  // Payment methods breakdown
  const paymentBreakdown = await SalePayment.findAll({
    attributes: [
      'payment_method_id',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    include: [
      {
        model: Sale,
        as: 'sale',
        where: saleWhere,
        attributes: []
      },
      {
        model: PaymentMethod,
        as: 'payment_method',
        attributes: ['name', 'code']
      }
    ],
    where: { status: 'APPROVED' },
    group: ['payment_method_id', 'payment_method.id', 'payment_method.name', 'payment_method.code']
  });

  // Sessions
  const sessions = await RegisterSession.findAll({
    where: {
      branch_id: branchId,
      opened_at: { [Op.between]: [startOfDay, endOfDay] }
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sessions'],
      [sequelize.fn('SUM', sequelize.col('opening_amount')), 'total_opening'],
      [sequelize.fn('SUM', sequelize.col('closing_amount')), 'total_closing'],
      [sequelize.fn('SUM', sequelize.col('discrepancy_cash')), 'total_discrepancy']
    ]
  });

  // Top products
  const topProducts = await SaleItem.findAll({
    attributes: [
      'product_id',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      [sequelize.fn('SUM', sequelize.col('SaleItem.line_total')), 'total_revenue']
    ],
    include: [
      {
        model: Sale,
        as: 'sale',
        where: saleWhere,
        attributes: []
      },
      {
        model: Product,
        as: 'product',
        attributes: ['name', 'sku']
      }
    ],
    group: ['product_id', 'product.id', 'product.name', 'product.sku'],
    order: [[sequelize.fn('SUM', sequelize.col('SaleItem.line_total')), 'DESC']],
    limit: 10
  });

  // Hourly breakdown
  const hourlyData = await sequelize.query(`
    SELECT
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue
    FROM sales
    WHERE branch_id = :branchId
      AND status = 'COMPLETED'
      AND created_at BETWEEN :startOfDay AND :endOfDay
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour
  `, {
    replacements: { branchId, startOfDay, endOfDay },
    type: sequelize.QueryTypes.SELECT
  });

  return {
    report_date: date.toISOString().split('T')[0],
    branch_id: branchId,
    sales: {
      total_count: parseInt(salesData?.toJSON().total_sales) || 0,
      total_revenue: parseFloat(salesData?.toJSON().total_revenue) || 0,
      total_tax: parseFloat(salesData?.toJSON().total_tax) || 0,
      total_discounts: parseFloat(salesData?.toJSON().total_discounts) || 0,
      average_ticket: parseFloat(salesData?.toJSON().average_ticket) || 0,
      voided_count: parseInt(voidedData?.toJSON().voided_count) || 0,
      voided_amount: parseFloat(voidedData?.toJSON().voided_amount) || 0
    },
    payments: paymentBreakdown.map((p) => ({
      method: p.payment_method?.name,
      code: p.payment_method?.code,
      total: parseFloat(p.toJSON().total)
    })),
    sessions: sessions[0]?.toJSON() || {},
    top_products: topProducts.map((p) => ({
      product: p.product?.name,
      sku: p.product?.sku,
      quantity: parseFloat(p.toJSON().total_quantity),
      revenue: parseFloat(p.toJSON().total_revenue)
    })),
    hourly: hourlyData
  };
};

// Owner Dashboard
exports.getOwnerDashboard = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all branches for the owner
    const branches = await Branch.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code']
    });

    // Overall metrics
    const overallSales = await Sale.findOne({
      where: {
        status: 'COMPLETED',
        created_at: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_ticket']
      ]
    });

    // Sales by branch
    const salesByBranch = await Sale.findAll({
      where: {
        status: 'COMPLETED',
        created_at: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        'branch_id',
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('Sale.total_amount')), 'total_revenue']
      ],
      include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }],
      group: ['branch_id', 'branch.id', 'branch.name', 'branch.code']
    });

    // Daily trend
    const dailyTrend = await sequelize.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE status = 'COMPLETED'
        AND created_at BETWEEN :startDate AND :endDate
      GROUP BY DATE(created_at)
      ORDER BY date
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Cash discrepancies
    const discrepancies = await RegisterSession.findAll({
      where: {
        closed_at: { [Op.between]: [startDate, endDate] },
        discrepancy_cash: { [Op.ne]: 0 }
      },
      attributes: [
        'branch_id',
        [sequelize.fn('COUNT', sequelize.col('RegisterSession.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('RegisterSession.discrepancy_cash')), 'total_discrepancy']
      ],
      include: [{ model: Branch, as: 'branch', attributes: ['name', 'code'] }],
      group: ['branch_id', 'branch.id', 'branch.name', 'branch.code']
    });

    // Shrinkage summary from stock_movements
    const shrinkageMovements = await sequelize.query(`
      SELECT
        COUNT(*) as total_records,
        SUM(ABS(sm.quantity) * p.cost_price) as total_cost_loss
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE sm.movement_type = 'SHRINKAGE'
        AND sm.created_at BETWEEN :startDate AND :endDate
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    const shrinkage = {
      total_records: parseInt(shrinkageMovements[0]?.total_records) || 0,
      total_cost_loss: parseFloat(shrinkageMovements[0]?.total_cost_loss) || 0
    };

    // Top selling products overall
    const topProducts = await SaleItem.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.line_total')), 'total_revenue']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          where: {
            status: 'COMPLETED',
            created_at: { [Op.between]: [startDate, endDate] }
          },
          attributes: []
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'sku']
        }
      ],
      group: ['product_id', 'product.id', 'product.name', 'product.sku'],
      order: [[sequelize.fn('SUM', sequelize.col('SaleItem.line_total')), 'DESC']],
      limit: 10
    });

    return success(res, {
      period: { start_date: startDate, end_date: endDate },
      branches: branches.length,
      overall: {
        total_sales: parseInt(overallSales?.toJSON().total_sales) || 0,
        total_revenue: parseFloat(overallSales?.toJSON().total_revenue) || 0,
        average_ticket: parseFloat(overallSales?.toJSON().average_ticket) || 0
      },
      by_branch: salesByBranch,
      daily_trend: dailyTrend,
      discrepancies,
      shrinkage,
      top_products: topProducts
    });
  } catch (error) {
    next(error);
  }
};

// Sales Report
exports.getSalesReport = async (req, res, next) => {
  try {
    const { branch_id, from_date, to_date, group_by = 'day' } = req.query;

    const where = { status: 'COMPLETED' };
    if (branch_id) where.branch_id = branch_id;

    const endDate = to_date ? new Date(to_date) : new Date();
    const startDate = from_date ? new Date(from_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    where.created_at = { [Op.between]: [startDate, endDate] };

    let groupByClause;
    let selectDate;
    switch (group_by) {
      case 'hour':
        groupByClause = "DATE_TRUNC('hour', created_at)";
        selectDate = "DATE_TRUNC('hour', created_at)";
        break;
      case 'week':
        groupByClause = "DATE_TRUNC('week', created_at)";
        selectDate = "DATE_TRUNC('week', created_at)";
        break;
      case 'month':
        groupByClause = "DATE_TRUNC('month', created_at)";
        selectDate = "DATE_TRUNC('month', created_at)";
        break;
      default:
        groupByClause = 'DATE(created_at)';
        selectDate = 'DATE(created_at)';
    }

    const salesData = await sequelize.query(`
      SELECT
        ${selectDate} as period,
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue,
        SUM(tax_amount) as tax,
        SUM(discount_amount) as discounts,
        AVG(total_amount) as avg_ticket
      FROM sales
      WHERE status = 'COMPLETED'
        AND ${branch_id ? 'branch_id = :branchId AND' : ''}
        created_at BETWEEN :startDate AND :endDate
      GROUP BY ${groupByClause}
      ORDER BY period
    `, {
      replacements: { branchId: branch_id, startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Totals
    const totals = await Sale.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discounts'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_ticket']
      ]
    });

    return success(res, {
      period: { start_date: startDate, end_date: endDate },
      group_by,
      data: salesData,
      totals: totals?.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Product Performance Report
exports.getProductReport = async (req, res, next) => {
  try {
    const { branch_id, category_id, from_date, to_date, limit = 50 } = req.query;

    const endDate = to_date ? new Date(to_date) : new Date();
    const startDate = from_date ? new Date(from_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const saleWhere = {
      status: 'COMPLETED',
      created_at: { [Op.between]: [startDate, endDate] }
    };
    if (branch_id) saleWhere.branch_id = branch_id;

    const productWhere = {};
    if (category_id) productWhere.category_id = category_id;

    const products = await SaleItem.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.line_total')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT sale_id')), 'transaction_count'],
        [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_price']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          where: saleWhere,
          attributes: []
        },
        {
          model: Product,
          as: 'product',
          where: Object.keys(productWhere).length ? productWhere : undefined,
          attributes: ['name', 'sku', 'cost_price', 'selling_price'],
          include: [{ model: Category, as: 'category', attributes: ['name'] }]
        }
      ],
      group: ['product_id', 'product.id', 'product.name', 'product.sku', 'product.cost_price', 'product.selling_price', 'product.category.id', 'product.category.name'],
      order: [[sequelize.fn('SUM', sequelize.col('SaleItem.line_total')), 'DESC']],
      limit: parseInt(limit)
    });

    // Calculate margins
    const productsWithMargin = products.map((p) => {
      const data = p.toJSON();
      const costPrice = parseFloat(p.product?.cost_price) || 0;
      const avgPrice = parseFloat(data.avg_price) || 0;
      const margin = avgPrice > 0 ? ((avgPrice - costPrice) / avgPrice) * 100 : 0;

      return {
        product_id: data.product_id,
        name: p.product?.name,
        sku: p.product?.sku,
        category: p.product?.category?.name,
        total_quantity: parseFloat(data.total_quantity),
        total_revenue: parseFloat(data.total_revenue),
        transaction_count: parseInt(data.transaction_count),
        avg_price: avgPrice,
        margin_percent: margin.toFixed(2)
      };
    });

    return success(res, {
      period: { start_date: startDate, end_date: endDate },
      products: productsWithMargin
    });
  } catch (error) {
    next(error);
  }
};

// Cashier Performance Report
exports.getCashierReport = async (req, res, next) => {
  try {
    const { branch_id, from_date, to_date } = req.query;

    const endDate = to_date ? new Date(to_date) : new Date();
    const startDate = from_date ? new Date(from_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const saleWhere = {
      status: 'COMPLETED',
      created_at: { [Op.between]: [startDate, endDate] }
    };
    if (branch_id) saleWhere.branch_id = branch_id;

    // Sale model uses created_by with alias 'creator' (not cashier_id)
    const cashierPerformance = await Sale.findAll({
      where: saleWhere,
      attributes: [
        'created_by',
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_ticket']
      ],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['first_name', 'last_name']
      }],
      group: ['created_by', 'creator.id', 'creator.first_name', 'creator.last_name'],
      order: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']]
    });

    // Get session data for each cashier
    const sessionWhere = {
      closed_at: { [Op.between]: [startDate, endDate] }
    };
    if (branch_id) sessionWhere.branch_id = branch_id;

    // RegisterSession uses opened_by (not cashier_id)
    const sessionData = await RegisterSession.findAll({
      where: sessionWhere,
      attributes: [
        'opened_by',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sessions'],
        [sequelize.fn('SUM', sequelize.col('discrepancy_cash')), 'total_discrepancy'],
        [sequelize.fn('AVG', sequelize.literal("EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600")), 'avg_session_hours']
      ],
      group: ['opened_by']
    });

    // Combine data
    const combined = cashierPerformance.map((c) => {
      // Match session data by created_by (sale creator) to opened_by (session owner)
      const session = sessionData.find((s) => s.opened_by === c.created_by);
      return {
        cashier_id: c.created_by,
        name: `${c.creator?.first_name || ''} ${c.creator?.last_name || ''}`.trim(),
        total_sales: parseInt(c.toJSON().total_sales),
        total_revenue: parseFloat(c.toJSON().total_revenue),
        average_ticket: parseFloat(c.toJSON().average_ticket),
        total_sessions: parseInt(session?.toJSON().total_sessions) || 0,
        total_discrepancy: parseFloat(session?.toJSON().total_discrepancy) || 0,
        avg_session_hours: parseFloat(session?.toJSON().avg_session_hours)?.toFixed(2) || 0
      };
    });

    return success(res, {
      period: { start_date: startDate, end_date: endDate },
      cashiers: combined
    });
  } catch (error) {
    next(error);
  }
};

// Inventory Report
exports.getInventoryReport = async (req, res, next) => {
  try {
    const { branch_id, category_id, low_stock_only } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;

    const productWhere = { is_active: true };
    if (category_id) productWhere.category_id = category_id;

    if (low_stock_only === 'true') {
      where[Op.and] = [
        sequelize.where(
          sequelize.col('quantity'),
          Op.lte,
          sequelize.col('product.minimum_stock')
        )
      ];
    }

    const stocks = await BranchStock.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhere,
          attributes: ['name', 'sku', 'cost_price', 'selling_price', 'minimum_stock'],
          include: [{ model: Category, as: 'category', attributes: ['name'] }]
        },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] }
      ],
      order: [['quantity', 'ASC']]
    });

    // Calculate inventory value
    const inventory = stocks.map((s) => {
      const costPrice = parseFloat(s.product?.cost_price) || 0;
      const sellingPrice = parseFloat(s.product?.selling_price) || 0;
      const quantity = parseFloat(s.quantity);
      const minStock = parseFloat(s.product?.minimum_stock) || 0;

      return {
        branch: s.branch?.name,
        branch_code: s.branch?.code,
        product: s.product?.name,
        sku: s.product?.sku,
        category: s.product?.category?.name,
        quantity,
        min_stock: minStock,
        max_stock: 0,
        cost_value: quantity * costPrice,
        retail_value: quantity * sellingPrice,
        is_low: quantity <= minStock
      };
    });

    // Totals
    const totalCostValue = inventory.reduce((sum, i) => sum + i.cost_value, 0);
    const totalRetailValue = inventory.reduce((sum, i) => sum + i.retail_value, 0);
    const lowStockCount = inventory.filter((i) => i.is_low).length;

    return success(res, {
      inventory,
      summary: {
        total_items: inventory.length,
        total_cost_value: totalCostValue,
        total_retail_value: totalRetailValue,
        low_stock_count: lowStockCount
      }
    });
  } catch (error) {
    next(error);
  }
};
