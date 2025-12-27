const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  Invoice, Sale, Customer, Branch, AFIPConfig, sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');
const logger = require('../utils/logger');

// Invoice CRUD
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { branch_id, invoice_type, status, start_date, end_date, search } = req.query;

    const where = {};
    if (branch_id) where.branch_id = branch_id;
    if (invoice_type) where.invoice_type = invoice_type;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.invoice_date = {};
      if (start_date) where.invoice_date[Op.gte] = new Date(start_date);
      if (end_date) where.invoice_date[Op.lte] = new Date(end_date);
    }
    if (search) {
      where[Op.or] = [
        { invoice_number: { [Op.iLike]: `%${search}%` } },
        { cae: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Sale, as: 'sale', attributes: ['sale_number', 'total_amount'] },
        { model: Customer, as: 'customer', attributes: ['first_name', 'last_name', 'company_name', 'document_number'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] }
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

exports.getById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            { model: require('../database/models').SaleItem, as: 'items' }
          ]
        },
        { model: Customer, as: 'customer' },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!invoice) throw new NotFoundError('Invoice not found');
    return success(res, invoice);
  } catch (error) {
    next(error);
  }
};

exports.getBySale = async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: { sale_id: req.params.saleId },
      include: [
        { model: Customer, as: 'customer' },
        { model: Branch, as: 'branch' }
      ],
      order: [['created_at', 'DESC']]
    });

    return success(res, invoices);
  } catch (error) {
    next(error);
  }
};

// Generate invoice for sale
exports.generate = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { sale_id, invoice_type, customer_id, customer_data } = req.body;

    // Get sale
    const sale = await Sale.findByPk(sale_id, {
      include: [{ model: Branch, as: 'branch' }]
    });
    if (!sale) throw new NotFoundError('Sale not found');

    // Check if sale already has this type of invoice
    const existingInvoice = await Invoice.findOne({
      where: { sale_id, invoice_type }
    });
    if (existingInvoice) {
      throw new BusinessError(`Sale already has a ${invoice_type} invoice`);
    }

    // Get AFIP config for branch
    const afipConfig = await AFIPConfig.findOne({
      where: { branch_id: sale.branch_id, is_active: true }
    });

    // Determine invoice type based on customer
    let finalInvoiceType = invoice_type;
    let customer = null;

    if (customer_id) {
      customer = await Customer.findByPk(customer_id);
    }

    // Validate invoice type based on customer document type
    if (finalInvoiceType === 'A' && (!customer || !customer.document_number)) {
      throw new BusinessError('Invoice type A requires customer with CUIT');
    }

    // Generate invoice number
    const lastInvoice = await Invoice.findOne({
      where: {
        branch_id: sale.branch_id,
        invoice_type: finalInvoiceType
      },
      order: [['invoice_number', 'DESC']]
    });

    const pointOfSale = afipConfig?.point_of_sale || '0001';
    const nextNumber = lastInvoice
      ? String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(8, '0')
      : '00000001';
    const invoiceNumber = `${pointOfSale}-${nextNumber}`;

    // Calculate tax amounts
    const subtotal = parseFloat(sale.subtotal);
    const taxAmount = parseFloat(sale.tax_amount);
    const totalAmount = parseFloat(sale.total_amount);

    // Create invoice (without AFIP integration for now - will be added in Phase 7)
    const invoice = await Invoice.create({
      id: uuidv4(),
      sale_id,
      branch_id: sale.branch_id,
      customer_id: customer?.id || null,
      invoice_type: finalInvoiceType,
      invoice_number: invoiceNumber,
      point_of_sale: pointOfSale,
      invoice_date: new Date(),
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'PENDING',
      // Customer data snapshot
      customer_name: customer?.company_name || customer_data?.name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Consumidor Final',
      customer_document_type: customer?.document_type || customer_data?.document_type || 'DNI',
      customer_document_number: customer?.document_number || customer_data?.document_number || null,
      customer_tax_condition: customer?.tax_condition || customer_data?.tax_condition || 'CONSUMIDOR_FINAL',
      customer_address: customer?.address || customer_data?.address || null,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();

    logger.info(`Invoice ${invoiceNumber} generated for sale ${sale.sale_number}`);

    return created(res, invoice);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Submit invoice to AFIP (placeholder - full implementation in Phase 7)
exports.submitToAFIP = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) throw new NotFoundError('Invoice not found');

    if (invoice.status !== 'PENDING') {
      throw new BusinessError('Invoice is not pending');
    }

    // Get AFIP config
    const afipConfig = await AFIPConfig.findOne({
      where: { branch_id: invoice.branch_id, is_active: true }
    });

    if (!afipConfig) {
      throw new BusinessError('AFIP not configured for this branch');
    }

    // TODO: Implement actual AFIP/FactuHoy integration in Phase 7
    // For now, simulate successful submission

    const cae = `${Date.now()}`.slice(0, 14); // Simulated CAE
    const caeExpiration = new Date();
    caeExpiration.setDate(caeExpiration.getDate() + 10);

    await invoice.update({
      status: 'APPROVED',
      cae,
      cae_expiration: caeExpiration,
      afip_response: JSON.stringify({ success: true, cae }),
      submitted_at: new Date()
    }, { transaction: t });

    await t.commit();

    logger.info(`Invoice ${invoice.invoice_number} submitted to AFIP - CAE: ${cae}`);

    return success(res, invoice, 'Invoice submitted to AFIP');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Void invoice
exports.void = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) throw new NotFoundError('Invoice not found');

    if (invoice.status === 'VOIDED') {
      throw new BusinessError('Invoice is already voided');
    }

    // If approved, need credit note instead
    if (invoice.status === 'APPROVED' && invoice.cae) {
      throw new BusinessError('Approved invoices must be cancelled with a credit note');
    }

    await invoice.update({
      status: 'VOIDED',
      void_reason: req.body.reason,
      voided_by: req.user.id,
      voided_at: new Date()
    }, { transaction: t });

    await t.commit();

    return success(res, null, 'Invoice voided');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Create credit note
exports.createCreditNote = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const originalInvoice = await Invoice.findByPk(req.params.id);
    if (!originalInvoice) throw new NotFoundError('Original invoice not found');

    if (originalInvoice.status !== 'APPROVED') {
      throw new BusinessError('Can only create credit note for approved invoices');
    }

    const { reason, items } = req.body;

    // Calculate credit note amount
    let creditAmount = 0;
    if (items && items.length > 0) {
      // Partial credit note
      for (const item of items) {
        creditAmount += item.amount;
      }
    } else {
      // Full credit note
      creditAmount = parseFloat(originalInvoice.total_amount);
    }

    // Determine credit note type based on original invoice
    const creditNoteType = originalInvoice.invoice_type === 'A' ? 'NC_A' :
      originalInvoice.invoice_type === 'B' ? 'NC_B' : 'NC_C';

    // Generate credit note number
    const afipConfig = await AFIPConfig.findOne({
      where: { branch_id: originalInvoice.branch_id, is_active: true }
    });

    const pointOfSale = afipConfig?.point_of_sale || '0001';
    const lastCreditNote = await Invoice.findOne({
      where: {
        branch_id: originalInvoice.branch_id,
        invoice_type: creditNoteType
      },
      order: [['invoice_number', 'DESC']]
    });

    const nextNumber = lastCreditNote
      ? String(parseInt(lastCreditNote.invoice_number.split('-')[1]) + 1).padStart(8, '0')
      : '00000001';
    const creditNoteNumber = `${pointOfSale}-${nextNumber}`;

    const creditNote = await Invoice.create({
      id: uuidv4(),
      sale_id: originalInvoice.sale_id,
      branch_id: originalInvoice.branch_id,
      customer_id: originalInvoice.customer_id,
      invoice_type: creditNoteType,
      invoice_number: creditNoteNumber,
      point_of_sale: pointOfSale,
      invoice_date: new Date(),
      subtotal: -creditAmount,
      tax_amount: 0,
      total_amount: -creditAmount,
      status: 'PENDING',
      customer_name: originalInvoice.customer_name,
      customer_document_type: originalInvoice.customer_document_type,
      customer_document_number: originalInvoice.customer_document_number,
      customer_tax_condition: originalInvoice.customer_tax_condition,
      customer_address: originalInvoice.customer_address,
      original_invoice_id: originalInvoice.id,
      void_reason: reason,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();

    logger.info(`Credit note ${creditNoteNumber} created for invoice ${originalInvoice.invoice_number}`);

    return created(res, creditNote);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get invoice statistics
exports.getStats = async (req, res, next) => {
  try {
    const { branch_id, start_date, end_date } = req.query;

    const where = { status: 'APPROVED' };
    if (branch_id) where.branch_id = branch_id;
    if (start_date || end_date) {
      where.invoice_date = {};
      if (start_date) where.invoice_date[Op.gte] = new Date(start_date);
      if (end_date) where.invoice_date[Op.lte] = new Date(end_date);
    }

    // By invoice type
    const byType = await Invoice.findAll({
      where,
      attributes: [
        'invoice_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ],
      group: ['invoice_type']
    });

    // Totals
    const totals = await Invoice.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax']
      ]
    });

    // Pending invoices
    const pendingCount = await Invoice.count({
      where: { ...where, status: 'PENDING' }
    });

    return success(res, {
      by_type: byType,
      totals: totals?.toJSON() || { total_count: 0, total_amount: 0, total_tax: 0 },
      pending_count: pendingCount
    });
  } catch (error) {
    next(error);
  }
};

// Print invoice
exports.getPrintData = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sale',
          include: [
            {
              model: require('../database/models').SaleItem,
              as: 'items',
              include: [{ model: require('../database/models').Product, as: 'product' }]
            }
          ]
        },
        { model: Customer, as: 'customer' },
        { model: Branch, as: 'branch' }
      ]
    });

    if (!invoice) throw new NotFoundError('Invoice not found');

    // Format for printing
    const printData = {
      invoice: {
        type: invoice.invoice_type,
        number: invoice.invoice_number,
        date: invoice.invoice_date,
        cae: invoice.cae,
        cae_expiration: invoice.cae_expiration
      },
      branch: {
        name: invoice.branch.name,
        address: invoice.branch.address,
        cuit: invoice.branch.tax_id,
        tax_condition: invoice.branch.tax_condition
      },
      customer: {
        name: invoice.customer_name,
        document_type: invoice.customer_document_type,
        document_number: invoice.customer_document_number,
        tax_condition: invoice.customer_tax_condition,
        address: invoice.customer_address
      },
      items: invoice.sale?.items?.map((item) => ({
        code: item.product?.sku,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total
      })) || [],
      totals: {
        subtotal: invoice.subtotal,
        tax: invoice.tax_amount,
        total: invoice.total_amount
      }
    };

    return success(res, printData);
  } catch (error) {
    next(error);
  }
};
