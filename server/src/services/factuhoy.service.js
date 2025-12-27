/**
 * FactuHoy API Integration Service
 * Handles AFIP electronic invoicing through FactuHoy third-party service
 *
 * Invoice Types for Argentina:
 * - A: For Responsable Inscripto customers (requires CUIT)
 * - B: For Consumidor Final (most common)
 * - C: For Monotributista to Monotributista
 * - NC_A, NC_B, NC_C: Credit Notes
 */

const axios = require('axios');
const logger = require('../utils/logger');

const FACTUHOY_BASE_URL = process.env.FACTUHOY_API_URL || 'https://api.factuhoy.com/v1';

class FactuHoyService {
  constructor() {
    this.apiKey = process.env.FACTUHOY_API_KEY;
    this.client = axios.create({
      baseURL: FACTUHOY_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      if (this.apiKey) {
        config.headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('FactuHoy API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Determine invoice type based on customer and seller tax conditions
   */
  determineInvoiceType(sellerTaxCondition, customerTaxCondition, customerCuit) {
    // Monotributista seller
    if (sellerTaxCondition === 'MONOTRIBUTO') {
      // To Responsable Inscripto with CUIT -> C
      if (customerTaxCondition === 'RESPONSABLE_INSCRIPTO' && customerCuit) {
        return 'C';
      }
      // To anyone else -> C
      return 'C';
    }

    // Responsable Inscripto seller
    if (sellerTaxCondition === 'RESPONSABLE_INSCRIPTO') {
      // To Responsable Inscripto with CUIT -> A
      if (customerTaxCondition === 'RESPONSABLE_INSCRIPTO' && customerCuit) {
        return 'A';
      }
      // To Consumidor Final or others -> B
      return 'B';
    }

    // Default to B
    return 'B';
  }

  /**
   * Create an invoice through FactuHoy API
   */
  async createInvoice(invoiceData) {
    try {
      const payload = this.formatInvoicePayload(invoiceData);

      logger.info('Creating FactuHoy invoice:', { invoiceNumber: invoiceData.invoice_number });

      const response = await this.client.post('/invoices', payload);

      if (response.data.success) {
        return {
          success: true,
          cae: response.data.cae,
          cae_expiration: response.data.cae_vencimiento,
          invoice_number: response.data.numero_comprobante,
          afip_response: response.data,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Unknown error from FactuHoy',
          afip_response: response.data,
        };
      }
    } catch (error) {
      // Check if it's a retryable error
      const isRetryable = this.isRetryableError(error);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        retryable: isRetryable,
        afip_response: error.response?.data,
      };
    }
  }

  /**
   * Format invoice data for FactuHoy API
   */
  formatInvoicePayload(invoiceData) {
    const {
      invoice_type,
      point_of_sale,
      customer,
      items,
      totals,
      branch,
    } = invoiceData;

    // Map invoice type to FactuHoy format
    const tipoComprobante = {
      'A': 1,    // Factura A
      'B': 6,    // Factura B
      'C': 11,   // Factura C
      'NC_A': 3, // Nota de Crédito A
      'NC_B': 8, // Nota de Crédito B
      'NC_C': 13, // Nota de Crédito C
    };

    // Map document type
    const tipoDocumento = {
      'DNI': 96,
      'CUIT': 80,
      'CUIL': 86,
      'PASSPORT': 94,
      'OTHER': 99,
    };

    const payload = {
      tipo_comprobante: tipoComprobante[invoice_type] || 6,
      punto_venta: parseInt(point_of_sale) || 1,
      concepto: 1, // Products
      tipo_documento: tipoDocumento[customer?.document_type] || 99,
      documento: customer?.document_number || '0',
      nombre: customer?.name || 'Consumidor Final',
      // Address only required for Invoice A
      ...(invoice_type === 'A' && {
        domicilio: customer?.address || '',
      }),
      items: items.map((item) => ({
        descripcion: item.description,
        cantidad: item.quantity,
        unidad: 7, // Units
        precio_unitario: item.unit_price,
        iva: this.mapIvaRate(item.tax_rate || 21),
        importe: item.total,
      })),
      subtotal: totals.subtotal,
      iva_21: totals.tax_21 || 0,
      iva_10_5: totals.tax_10_5 || 0,
      iva_27: totals.tax_27 || 0,
      total: totals.total,
      moneda: 'PES', // Argentine Peso
      cotizacion: 1,
    };

    return payload;
  }

  /**
   * Map IVA rate to AFIP code
   */
  mapIvaRate(rate) {
    const rates = {
      0: 3,     // 0%
      10.5: 4,  // 10.5%
      21: 5,    // 21%
      27: 6,    // 27%
    };
    return rates[rate] || 5; // Default to 21%
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (!error.response) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.response.status >= 500) {
      return true;
    }

    // Rate limiting is retryable
    if (error.response.status === 429) {
      return true;
    }

    // Client errors (4xx) are not retryable
    return false;
  }

  /**
   * Get last invoice number for a point of sale
   */
  async getLastInvoiceNumber(pointOfSale, invoiceType) {
    try {
      const tipoComprobante = {
        'A': 1, 'B': 6, 'C': 11, 'NC_A': 3, 'NC_B': 8, 'NC_C': 13,
      };

      const response = await this.client.get('/ultimo-comprobante', {
        params: {
          punto_venta: pointOfSale,
          tipo_comprobante: tipoComprobante[invoiceType] || 6,
        },
      });

      return {
        success: true,
        lastNumber: response.data.ultimo_numero || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        lastNumber: 0,
      };
    }
  }

  /**
   * Check API status and credentials
   */
  async checkStatus() {
    try {
      const response = await this.client.get('/status');
      return {
        connected: true,
        status: response.data,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate QR code data for invoice (AFIP requirement)
   */
  generateQRData(invoice) {
    const qrData = {
      ver: 1,
      fecha: invoice.invoice_date,
      cuit: invoice.branch_cuit,
      ptoVta: parseInt(invoice.point_of_sale),
      tipoCmp: this.getInvoiceTypeCode(invoice.invoice_type),
      nroCmp: parseInt(invoice.invoice_number.split('-')[1]),
      importe: invoice.total_amount,
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: this.getDocumentTypeCode(invoice.customer_document_type),
      nroDocRec: invoice.customer_document_number || 0,
      tipoCodAut: 'E', // CAE
      codAut: invoice.cae,
    };

    // Base64 encode for QR
    const jsonString = JSON.stringify(qrData);
    const base64Data = Buffer.from(jsonString).toString('base64');

    return `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`;
  }

  getInvoiceTypeCode(type) {
    const codes = { 'A': 1, 'B': 6, 'C': 11, 'NC_A': 3, 'NC_B': 8, 'NC_C': 13 };
    return codes[type] || 6;
  }

  getDocumentTypeCode(type) {
    const codes = { 'DNI': 96, 'CUIT': 80, 'CUIL': 86, 'PASSPORT': 94 };
    return codes[type] || 99;
  }

  /**
   * Retry failed invoices
   */
  async retryPendingInvoices(invoices) {
    const results = [];

    for (const invoice of invoices) {
      try {
        const result = await this.createInvoice(invoice);
        results.push({
          invoice_id: invoice.id,
          ...result,
        });

        // Add delay between retries to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          invoice_id: invoice.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new FactuHoyService();
