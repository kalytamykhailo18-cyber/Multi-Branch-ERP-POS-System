const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  Invoice, Sale, Customer, Branch, AFIPConfig, SaleItem, Product, sequelize
} = require('../database/models');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Invoice types for Argentina
const INVOICE_TYPES = {
  A: 'A',           // For registered taxpayers (Responsable Inscripto)
  B: 'B',           // For final consumers and exempt
  C: 'C',           // For Monotributo
  NC_A: 'NC_A',     // Credit Note Type A
  NC_B: 'NC_B',     // Credit Note Type B
  NC_C: 'NC_C',     // Credit Note Type C
  ND_A: 'ND_A',     // Debit Note Type A
  ND_B: 'ND_B',     // Debit Note Type B
  ND_C: 'ND_C'      // Debit Note Type C
};

const TAX_CONDITIONS = {
  RESPONSABLE_INSCRIPTO: 'RESPONSABLE_INSCRIPTO',
  MONOTRIBUTISTA: 'MONOTRIBUTISTA',
  EXENTO: 'EXENTO',
  CONSUMIDOR_FINAL: 'CONSUMIDOR_FINAL'
};

class InvoiceService {
  constructor() {
    this.INVOICE_TYPES = INVOICE_TYPES;
    this.TAX_CONDITIONS = TAX_CONDITIONS;
  }

  async createInvoice(saleId, invoiceType, customerData, userId) {
    const t = await sequelize.transaction();

    try {
      const sale = await Sale.findByPk(saleId, {
        include: [
          { model: Branch, as: 'branch' },
          { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Customer, as: 'customer' }
        ]
      });

      if (!sale) {
        throw new NotFoundError('Sale not found');
      }

      // Check for existing invoice
      const existingInvoice = await Invoice.findOne({
        where: { sale_id: saleId, invoice_type: invoiceType }
      });

      if (existingInvoice) {
        throw new BusinessError(`Sale already has a ${invoiceType} invoice`);
      }

      // Determine customer info
      const customer = sale.customer || {};
      const finalCustomerData = {
        name: customerData?.name || customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Consumidor Final',
        document_type: customerData?.document_type || customer.document_type || 'DNI',
        document_number: customerData?.document_number || customer.document_number || null,
        tax_condition: customerData?.tax_condition || customer.tax_condition || TAX_CONDITIONS.CONSUMIDOR_FINAL,
        address: customerData?.address || customer.address || null
      };

      // Validate invoice type based on customer tax condition
      this.validateInvoiceType(invoiceType, finalCustomerData);

      // Get AFIP config
      const afipConfig = await AFIPConfig.findOne({
        where: { branch_id: sale.branch_id, is_active: true }
      });

      const pointOfSale = afipConfig?.point_of_sale || '0001';

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(sale.branch_id, invoiceType, pointOfSale);

      // Create invoice
      const invoice = await Invoice.create({
        id: uuidv4(),
        sale_id: saleId,
        branch_id: sale.branch_id,
        customer_id: sale.customer_id,
        invoice_type: invoiceType,
        invoice_number: invoiceNumber,
        point_of_sale: pointOfSale,
        invoice_date: new Date(),
        subtotal: sale.subtotal,
        tax_amount: sale.tax_amount,
        total_amount: sale.total_amount,
        status: 'PENDING',
        customer_name: finalCustomerData.name,
        customer_document_type: finalCustomerData.document_type,
        customer_document_number: finalCustomerData.document_number,
        customer_tax_condition: finalCustomerData.tax_condition,
        customer_address: finalCustomerData.address,
        created_by: userId
      }, { transaction: t });

      await t.commit();

      logger.info(`Invoice ${invoiceNumber} created for sale ${sale.sale_number}`);

      return invoice;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  validateInvoiceType(invoiceType, customerData) {
    // Type A requires CUIT
    if (invoiceType === INVOICE_TYPES.A) {
      if (!customerData.document_number) {
        throw new BusinessError('Invoice type A requires customer CUIT');
      }
      if (customerData.tax_condition === TAX_CONDITIONS.CONSUMIDOR_FINAL) {
        throw new BusinessError('Invoice type A is not valid for final consumers');
      }
    }

    // Type B is for final consumers and exempt
    if (invoiceType === INVOICE_TYPES.B) {
      if (customerData.tax_condition === TAX_CONDITIONS.RESPONSABLE_INSCRIPTO) {
        throw new BusinessError('Invoice type B is not valid for registered taxpayers');
      }
    }
  }

  async generateInvoiceNumber(branchId, invoiceType, pointOfSale) {
    const lastInvoice = await Invoice.findOne({
      where: {
        branch_id: branchId,
        invoice_type: invoiceType,
        point_of_sale: pointOfSale
      },
      order: [['invoice_number', 'DESC']]
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoice_number.split('-');
      if (parts.length === 2) {
        nextNumber = parseInt(parts[1]) + 1;
      }
    }

    return `${pointOfSale}-${String(nextNumber).padStart(8, '0')}`;
  }

  async submitToAFIP(invoiceId) {
    const t = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [
          { model: Branch, as: 'branch' },
          { model: Sale, as: 'sale', include: [{ model: SaleItem, as: 'items' }] }
        ]
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      if (invoice.status !== 'PENDING') {
        throw new BusinessError('Invoice is not pending');
      }

      const afipConfig = await AFIPConfig.findOne({
        where: { branch_id: invoice.branch_id, is_active: true }
      });

      if (!afipConfig) {
        throw new BusinessError('AFIP not configured for this branch');
      }

      // TODO: Actual AFIP/FactuHoy API integration
      // This is a placeholder for Phase 7
      const afipResponse = await this.callAFIPService(invoice, afipConfig);

      if (afipResponse.success) {
        await invoice.update({
          status: 'APPROVED',
          cae: afipResponse.cae,
          cae_expiration: afipResponse.cae_expiration,
          afip_response: JSON.stringify(afipResponse),
          submitted_at: new Date()
        }, { transaction: t });

        logger.info(`Invoice ${invoice.invoice_number} approved by AFIP - CAE: ${afipResponse.cae}`);
      } else {
        await invoice.update({
          status: 'REJECTED',
          afip_response: JSON.stringify(afipResponse)
        }, { transaction: t });

        logger.error(`Invoice ${invoice.invoice_number} rejected by AFIP: ${afipResponse.error}`);
        throw new BusinessError(`AFIP rejected invoice: ${afipResponse.error}`);
      }

      await t.commit();
      return invoice;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async callAFIPService(invoice, afipConfig) {
    // Placeholder for actual AFIP integration
    // In Phase 7, this will connect to FactuHoy or AFIP directly

    // Simulate successful response
    const cae = String(Date.now()).slice(0, 14);
    const caeExpiration = new Date();
    caeExpiration.setDate(caeExpiration.getDate() + 10);

    return {
      success: true,
      cae,
      cae_expiration: caeExpiration,
      result: 'A' // Approved
    };
  }

  async createCreditNote(originalInvoiceId, reason, items, userId) {
    const t = await sequelize.transaction();

    try {
      const originalInvoice = await Invoice.findByPk(originalInvoiceId, {
        include: [{ model: Sale, as: 'sale' }]
      });

      if (!originalInvoice) {
        throw new NotFoundError('Original invoice not found');
      }

      if (originalInvoice.status !== 'APPROVED') {
        throw new BusinessError('Can only create credit note for approved invoices');
      }

      // Determine credit note type
      const creditNoteType = this.getCreditNoteType(originalInvoice.invoice_type);

      // Calculate credit amount
      let creditAmount = 0;
      if (items && items.length > 0) {
        creditAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      } else {
        creditAmount = parseFloat(originalInvoice.total_amount);
      }

      // Get AFIP config
      const afipConfig = await AFIPConfig.findOne({
        where: { branch_id: originalInvoice.branch_id, is_active: true }
      });

      const pointOfSale = afipConfig?.point_of_sale || '0001';
      const creditNoteNumber = await this.generateInvoiceNumber(
        originalInvoice.branch_id,
        creditNoteType,
        pointOfSale
      );

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
        created_by: userId
      }, { transaction: t });

      await t.commit();

      logger.info(`Credit note ${creditNoteNumber} created for invoice ${originalInvoice.invoice_number}`);

      return creditNote;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  getCreditNoteType(invoiceType) {
    const mapping = {
      [INVOICE_TYPES.A]: INVOICE_TYPES.NC_A,
      [INVOICE_TYPES.B]: INVOICE_TYPES.NC_B,
      [INVOICE_TYPES.C]: INVOICE_TYPES.NC_C
    };
    return mapping[invoiceType] || INVOICE_TYPES.NC_B;
  }

  async voidInvoice(invoiceId, reason, userId) {
    const invoice = await Invoice.findByPk(invoiceId);

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status === 'VOIDED') {
      throw new BusinessError('Invoice is already voided');
    }

    if (invoice.status === 'APPROVED' && invoice.cae) {
      throw new BusinessError('Approved invoices with CAE must be cancelled with a credit note');
    }

    await invoice.update({
      status: 'VOIDED',
      void_reason: reason,
      voided_by: userId,
      voided_at: new Date()
    });

    logger.info(`Invoice ${invoice.invoice_number} voided: ${reason}`);

    return invoice;
  }

  async getInvoicePrintData(invoiceId) {
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Sale, as: 'sale', include: [{ model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] }] },
        { model: Customer, as: 'customer' }
      ]
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return {
      invoice: {
        type: invoice.invoice_type,
        number: invoice.invoice_number,
        date: invoice.invoice_date,
        cae: invoice.cae,
        cae_expiration: invoice.cae_expiration
      },
      emitter: {
        name: invoice.branch?.name || 'Store Name',
        address: invoice.branch?.address,
        cuit: invoice.branch?.tax_id,
        tax_condition: invoice.branch?.tax_condition,
        gross_income: invoice.branch?.gross_income_number,
        start_date: invoice.branch?.activity_start_date
      },
      receiver: {
        name: invoice.customer_name,
        document_type: invoice.customer_document_type,
        document_number: invoice.customer_document_number,
        tax_condition: invoice.customer_tax_condition,
        address: invoice.customer_address
      },
      items: (invoice.sale?.items || []).map((item) => ({
        code: item.product?.sku,
        description: item.product_name,
        quantity: item.quantity,
        unit: item.product?.unit?.code || 'UN',
        unit_price: item.unit_price,
        discount: item.discount_amount,
        subtotal: item.subtotal,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total: item.total
      })),
      totals: {
        subtotal: invoice.subtotal,
        tax: invoice.tax_amount,
        total: invoice.total_amount
      },
      qr_data: this.generateQRData(invoice)
    };
  }

  generateQRData(invoice) {
    // Generate QR code data for AFIP validation
    // Format according to AFIP specifications
    const data = {
      ver: 1,
      fecha: invoice.invoice_date?.toISOString().split('T')[0],
      cuit: invoice.branch?.tax_id,
      ptoVta: parseInt(invoice.point_of_sale),
      tipoCmp: this.getAFIPInvoiceTypeCode(invoice.invoice_type),
      nroCmp: parseInt(invoice.invoice_number.split('-')[1]),
      importe: parseFloat(invoice.total_amount),
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: this.getDocumentTypeCode(invoice.customer_document_type),
      nroDocRec: invoice.customer_document_number || 0,
      tipoCodAut: 'E',
      codAut: invoice.cae
    };

    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  getAFIPInvoiceTypeCode(invoiceType) {
    const codes = {
      [INVOICE_TYPES.A]: 1,
      [INVOICE_TYPES.B]: 6,
      [INVOICE_TYPES.C]: 11,
      [INVOICE_TYPES.NC_A]: 3,
      [INVOICE_TYPES.NC_B]: 8,
      [INVOICE_TYPES.NC_C]: 13
    };
    return codes[invoiceType] || 6;
  }

  getDocumentTypeCode(documentType) {
    const codes = {
      'CUIT': 80,
      'CUIL': 86,
      'DNI': 96,
      'PASAPORTE': 94,
      'OTRO': 99
    };
    return codes[documentType?.toUpperCase()] || 99;
  }
}

module.exports = new InvoiceService();
