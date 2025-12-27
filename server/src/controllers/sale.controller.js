const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Sale, SaleItem, SalePayment, Branch, CashRegister, RegisterSession,
  Customer, User, Product, PaymentMethod, Invoice, InvoiceType,
  BranchStock, StockMovement, LoyaltyTransaction, CreditTransaction,
  sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination, generateSaleNumber, calculateLoyaltyPoints, formatDecimal } = require('../utils/helpers');
const { EVENTS } = require('../socket');
const logger = require('../utils/logger');

/**
 * Get all sales with filters
 * GET /api/v1/sales
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset, sortBy, sortOrder } = parsePagination(req.query);
    const { branch_id, session_id, customer_id, status, from_date, to_date, search } = req.query;

    const where = {};

    if (branch_id) where.branch_id = branch_id;
    if (session_id) where.session_id = session_id;
    if (customer_id) where.customer_id = customer_id;
    if (status) where.status = status;

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date) where.created_at[Op.lte] = new Date(to_date);
    }

    if (search) {
      where.sale_number = { [Op.iLike]: `%${search}%` };
    }

    // Filter by user's accessible branches if needed
    if (!req.user.permissions.canViewAllBranches) {
      where.branch_id = req.user.branch_id;
    }

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'company_name'] },
        { model: SalePayment, as: 'payments', include: [{ model: PaymentMethod, as: 'payment_method' }] }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    const salesWithSummary = rows.map((sale) => ({
      id: sale.id,
      sale_number: sale.sale_number,
      created_at: sale.created_at,
      total_amount: sale.total_amount,
      status: sale.status,
      customer_name: sale.customer
        ? sale.customer.company_name || `${sale.customer.first_name} ${sale.customer.last_name}`
        : null,
      payment_methods: sale.payments.map((p) => p.payment_method.name),
      items_count: 0 // Would need separate query for count
    }));

    return paginated(res, salesWithSummary, {
      page,
      limit,
      total_items: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sale by ID with full details
 * GET /api/v1/sales/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: CashRegister, as: 'register', attributes: ['id', 'register_number', 'name'] },
        { model: Customer, as: 'customer' },
        { model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'voider', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name'] }]
        },
        {
          model: SalePayment,
          as: 'payments',
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    const saleData = sale.toJSON();
    saleData.branch_name = sale.branch?.name;
    saleData.register_name = sale.register?.name || `Caja ${sale.register?.register_number}`;
    saleData.customer_name = sale.customer
      ? sale.customer.company_name || `${sale.customer.first_name} ${sale.customer.last_name}`
      : null;
    saleData.seller_name = sale.seller ? `${sale.seller.first_name} ${sale.seller.last_name}` : null;
    saleData.created_by_name = `${sale.creator.first_name} ${sale.creator.last_name}`;

    return success(res, saleData);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new sale
 * POST /api/v1/sales
 */
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      branch_id, register_id, session_id, customer_id, seller_id,
      discount_percent, discount_amount, points_redeemed, credit_used,
      change_as_credit, items, payments, local_id, local_created_at
    } = req.body;

    // Verify session is open
    const session = await RegisterSession.findByPk(session_id);
    if (!session || session.status !== 'OPEN') {
      throw new BusinessError('Register session is not open', 'E401');
    }

    // Get branch for sale number
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // Calculate sale totals
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        throw new NotFoundError(`Product ${item.product_id} not found`);
      }

      const lineDiscount = item.discount_percent
        ? (item.unit_price * item.quantity * item.discount_percent / 100)
        : 0;
      const lineTotal = (item.unit_price * item.quantity) - lineDiscount;
      const taxAmount = product.is_tax_included
        ? (lineTotal * product.tax_rate / (100 + parseFloat(product.tax_rate)))
        : (lineTotal * product.tax_rate / 100);

      saleItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: product.cost_price,
        discount_percent: item.discount_percent || 0,
        discount_amount: lineDiscount,
        tax_rate: product.tax_rate,
        tax_amount: taxAmount,
        line_total: lineTotal,
        notes: item.notes
      });

      subtotal += lineTotal;
    }

    // Apply sale-level discount
    const saleDiscount = discount_amount || (discount_percent ? subtotal * discount_percent / 100 : 0);

    // Calculate points redemption value
    const pointsValue = points_redeemed ? points_redeemed * 1 : 0; // 1 peso per point

    // Calculate total
    const totalAmount = subtotal - saleDiscount - pointsValue - (credit_used || 0);

    // Verify payments cover total
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    if (totalPaid < totalAmount) {
      throw new BusinessError('Payment amount is less than total', 'E407');
    }

    // Create sale
    const sale = await Sale.create({
      id: uuidv4(),
      sale_number: generateSaleNumber(branch.code),
      branch_id,
      register_id,
      session_id,
      customer_id,
      seller_id,
      subtotal,
      discount_amount: saleDiscount,
      discount_percent: discount_percent || 0,
      tax_amount: saleItems.reduce((sum, i) => sum + parseFloat(i.tax_amount), 0),
      total_amount: totalAmount,
      points_redeemed: points_redeemed || 0,
      points_redemption_value: pointsValue,
      credit_used: credit_used || 0,
      change_as_credit: change_as_credit || 0,
      status: 'COMPLETED',
      created_by: req.user.id,
      local_id,
      local_created_at,
      synced_at: new Date(),
      sync_status: 'SYNCED'
    }, { transaction: t });

    // Create sale items
    for (const item of saleItems) {
      await SaleItem.create({
        id: uuidv4(),
        sale_id: sale.id,
        ...item
      }, { transaction: t });

      // Update stock
      if (item.product_id) {
        const stock = await BranchStock.findOne({
          where: { branch_id, product_id: item.product_id }
        });

        if (stock) {
          const newQty = parseFloat(stock.quantity) - parseFloat(item.quantity);
          await stock.update({ quantity: newQty }, { transaction: t });

          // Create stock movement
          await StockMovement.create({
            id: uuidv4(),
            branch_id,
            product_id: item.product_id,
            movement_type: 'SALE',
            quantity: -parseFloat(item.quantity),
            quantity_before: stock.quantity,
            quantity_after: newQty,
            reference_type: 'SALE',
            reference_id: sale.id,
            performed_by: req.user.id
          }, { transaction: t });
        }
      }
    }

    // Create sale payments
    for (const payment of payments) {
      await SalePayment.create({
        id: uuidv4(),
        sale_id: sale.id,
        payment_method_id: payment.payment_method_id,
        amount: payment.amount,
        reference_number: payment.reference_number,
        card_last_four: payment.card_last_four,
        card_brand: payment.card_brand,
        authorization_code: payment.authorization_code,
        qr_provider: payment.qr_provider,
        qr_transaction_id: payment.qr_transaction_id
      }, { transaction: t });
    }

    // Handle loyalty points
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id);

      // Deduct redeemed points
      if (points_redeemed > 0) {
        const newBalance = customer.loyalty_points - points_redeemed;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'REDEEM',
          points: -points_redeemed,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Canje en venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }

      // Calculate and add earned points
      const pointsEarned = calculateLoyaltyPoints(totalAmount);
      if (pointsEarned > 0) {
        const newBalance = customer.loyalty_points + pointsEarned;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'EARN',
          points: pointsEarned,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Puntos por venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });

        sale.points_earned = pointsEarned;
        await sale.save({ transaction: t });
      }

      // Handle credit
      if (credit_used > 0) {
        const newCreditBalance = parseFloat(customer.credit_balance) - credit_used;
        await customer.update({ credit_balance: newCreditBalance }, { transaction: t });

        await CreditTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'DEBIT',
          amount: -credit_used,
          balance_after: newCreditBalance,
          sale_id: sale.id,
          description: `Uso de crédito en venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }

      if (change_as_credit > 0) {
        const newCreditBalance = parseFloat(customer.credit_balance) + change_as_credit;
        await customer.update({ credit_balance: newCreditBalance }, { transaction: t });

        await CreditTransaction.create({
          id: uuidv4(),
          customer_id,
          transaction_type: 'CREDIT',
          amount: change_as_credit,
          balance_after: newCreditBalance,
          sale_id: sale.id,
          description: `Vuelto como crédito de venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }
    }

    await t.commit();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emitToBranch(branch_id, EVENTS.SALE_CREATED, {
        sale_id: sale.id,
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        created_by: req.user.first_name + ' ' + req.user.last_name
      });
    }

    // Return created sale with details
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items' },
        { model: SalePayment, as: 'payments' }
      ]
    });

    return created(res, createdSale);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Void a sale
 * POST /api/v1/sales/:id/void
 */
exports.voidSale = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { reason, manager_pin } = req.body;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: SaleItem, as: 'items' },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    if (sale.status === 'VOIDED') {
      throw new BusinessError('Sale is already voided', 'E404');
    }

    // Check permission - either user has permission or manager authorized
    let approvedBy = null;
    if (!req.user.permissions.canVoidSale) {
      if (!manager_pin) {
        throw new BusinessError('Manager authorization required to void this sale', 'E106');
      }
      // Find manager by PIN
      const manager = await User.findOne({
        where: { pin_code: manager_pin, is_active: true },
        include: [{ model: require('../database/models').Role, as: 'role' }]
      });

      if (!manager || !manager.role.can_void_sale) {
        throw new BusinessError('Invalid manager PIN or insufficient permissions', 'E107');
      }
      approvedBy = manager.id;
    }

    // Void the sale
    await sale.update({
      status: 'VOIDED',
      voided_at: new Date(),
      voided_by: req.user.id,
      void_reason: reason,
      void_approved_by: approvedBy
    }, { transaction: t });

    // Restore stock for each item
    for (const item of sale.items) {
      const stock = await BranchStock.findOne({
        where: { branch_id: sale.branch_id, product_id: item.product_id }
      });

      if (stock) {
        const newQty = parseFloat(stock.quantity) + parseFloat(item.quantity);
        await stock.update({ quantity: newQty }, { transaction: t });

        await StockMovement.create({
          id: uuidv4(),
          branch_id: sale.branch_id,
          product_id: item.product_id,
          movement_type: 'RETURN',
          quantity: parseFloat(item.quantity),
          quantity_before: stock.quantity,
          quantity_after: newQty,
          reference_type: 'VOIDED_SALE',
          reference_id: sale.id,
          performed_by: req.user.id,
          notes: `Anulación de venta ${sale.sale_number}: ${reason}`
        }, { transaction: t });
      }
    }

    // Reverse loyalty/credit transactions if customer exists
    if (sale.customer_id) {
      const customer = await Customer.findByPk(sale.customer_id);

      // Reverse points earned
      if (sale.points_earned > 0) {
        const newBalance = customer.loyalty_points - sale.points_earned;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id: sale.customer_id,
          transaction_type: 'ADJUST',
          points: -sale.points_earned,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Anulación de puntos por venta ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }

      // Restore redeemed points
      if (sale.points_redeemed > 0) {
        const newBalance = customer.loyalty_points + sale.points_redeemed;
        await customer.update({ loyalty_points: newBalance }, { transaction: t });

        await LoyaltyTransaction.create({
          id: uuidv4(),
          customer_id: sale.customer_id,
          transaction_type: 'ADJUST',
          points: sale.points_redeemed,
          points_balance_after: newBalance,
          sale_id: sale.id,
          description: `Devolución de puntos canjeados por anulación ${sale.sale_number}`,
          created_by: req.user.id
        }, { transaction: t });
      }
    }

    await t.commit();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emitToBranch(sale.branch_id, EVENTS.SALE_VOIDED, {
        sale_id: sale.id,
        sale_number: sale.sale_number,
        voided_by: req.user.first_name + ' ' + req.user.last_name,
        reason
      });

      // Alert owners
      io.emitToOwners(EVENTS.ALERT_CREATED, {
        type: 'VOIDED_SALE',
        severity: 'HIGH',
        title: `Venta anulada en ${sale.branch.name}`,
        message: `Venta ${sale.sale_number} por $${sale.total_amount} fue anulada. Motivo: ${reason}`
      }, sale.branch_id);
    }

    return success(res, sale, 'Sale voided successfully');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Get receipt data for printing
 * GET /api/v1/sales/:id/receipt
 */
exports.getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Customer, as: 'customer' },
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: SalePayment,
          as: 'payments',
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    const receipt = {
      // Header
      business_name: 'PetFood Store',
      branch_name: sale.branch.name,
      branch_address: sale.branch.address,
      branch_phone: sale.branch.phone,

      // Sale info
      sale_number: sale.sale_number,
      date: sale.created_at,
      cashier: `${sale.creator.first_name} ${sale.creator.last_name}`,

      // Customer (if any)
      customer: sale.customer ? {
        name: sale.customer.company_name || `${sale.customer.first_name} ${sale.customer.last_name}`,
        document: sale.customer.document_number
      } : null,

      // Items
      items: sale.items.map((item) => ({
        name: item.product.short_name || item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount_amount,
        total: item.line_total
      })),

      // Totals
      subtotal: sale.subtotal,
      discount: sale.discount_amount,
      points_redemption: sale.points_redemption_value,
      credit_used: sale.credit_used,
      total: sale.total_amount,

      // Payments
      payments: sale.payments.map((p) => ({
        method: p.payment_method.name,
        amount: p.amount
      })),

      // Loyalty
      points_earned: sale.points_earned,
      change_as_credit: sale.change_as_credit,

      // Footer
      message: '¡Gracias por su compra!'
    };

    return success(res, receipt);
  } catch (error) {
    next(error);
  }
};

/**
 * Issue invoice for sale
 * POST /api/v1/sales/:id/invoice
 */
exports.issueInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      invoice_type_code, customer_name, customer_document_type,
      customer_document_number, customer_tax_condition, customer_address
    } = req.body;

    const sale = await Sale.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    if (sale.invoice && sale.invoice.status === 'ISSUED') {
      throw new BusinessError('Invoice already issued for this sale', 'E405');
    }

    // Get invoice type
    const invoiceType = await InvoiceType.findOne({ where: { code: invoice_type_code } });
    if (!invoiceType) {
      throw new NotFoundError('Invoice type not found');
    }

    // Check if Factura A requires CUIT
    if (invoice_type_code === 'A' && !customer_document_number) {
      throw new BusinessError('Factura A requires customer CUIT', 'E202');
    }

    // TODO: Integrate with FactuHoy API here
    // For now, create pending invoice
    const invoice = await Invoice.create({
      id: uuidv4(),
      sale_id: sale.id,
      invoice_type_id: invoiceType.id,
      point_of_sale: sale.branch.factuhoy_point_of_sale || 1,
      invoice_number: 0, // Will be assigned by AFIP
      customer_name,
      customer_document_type,
      customer_document_number,
      customer_tax_condition,
      customer_address,
      net_amount: sale.subtotal,
      tax_amount: sale.tax_amount,
      total_amount: sale.total_amount,
      status: 'PENDING'
    });

    return created(res, invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by session
 * GET /api/v1/sales/session/:sessionId
 */
exports.getBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    const { count, rows } = await Sale.findAndCountAll({
      where: { session_id: sessionId },
      include: [
        { model: Customer, as: 'customer', attributes: ['first_name', 'last_name', 'company_name'] },
        { model: SalePayment, as: 'payments', include: [{ model: PaymentMethod, as: 'payment_method' }] }
      ],
      order: [['created_at', 'DESC']],
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
 * Get sales summary report
 * GET /api/v1/sales/report/summary
 */
exports.getSummaryReport = async (req, res, next) => {
  try {
    const { branch_id, from_date, to_date } = req.query;

    const where = {
      created_at: {
        [Op.between]: [new Date(from_date), new Date(to_date)]
      },
      status: 'COMPLETED'
    };

    if (branch_id) where.branch_id = branch_id;

    // Get totals
    const totals = await Sale.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discount'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax']
      ],
      raw: true
    });

    // Get voided sales
    const voided = await Sale.findOne({
      where: { ...where, status: 'VOIDED' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
      ],
      raw: true
    });

    // Get by payment method
    const byPaymentMethod = await SalePayment.findAll({
      include: [{
        model: Sale,
        as: 'sale',
        where: { ...where },
        attributes: []
      }, {
        model: PaymentMethod,
        as: 'payment_method',
        attributes: ['name']
      }],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('SalePayment.amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('SalePayment.id')), 'count']
      ],
      group: ['payment_method.id', 'payment_method.name'],
      raw: true
    });

    return success(res, {
      total_sales: parseInt(totals.total_sales) || 0,
      total_amount: formatDecimal(totals.total_amount || 0),
      total_discount: formatDecimal(totals.total_discount || 0),
      total_tax: formatDecimal(totals.total_tax || 0),
      voided_count: parseInt(voided.count) || 0,
      voided_amount: formatDecimal(voided.amount || 0),
      average_sale: totals.total_sales > 0
        ? formatDecimal(totals.total_amount / totals.total_sales)
        : '0.00',
      by_payment_method: byPaymentMethod.map((p) => ({
        method_name: p['payment_method.name'],
        total: formatDecimal(p.total || 0),
        count: parseInt(p.count) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
};
