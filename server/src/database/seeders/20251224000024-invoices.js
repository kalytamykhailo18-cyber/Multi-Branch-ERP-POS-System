'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get completed sales with customers (invoices are typically for identified customers)
    const [salesWithCustomers] = await queryInterface.sequelize.query(
      `SELECT s.id, s.sale_number, s.total_amount, s.tax_amount, s.created_at, s.branch_id,
              c.first_name, c.last_name, c.document_type, c.document_number, c.tax_condition, c.address
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.status = 'COMPLETED'
       AND c.document_number IS NOT NULL
       ORDER BY s.created_at
       LIMIT 50;`
    );

    // Get invoice types
    const [invoiceTypes] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM invoice_types;`
    );

    const invoiceTypeB = invoiceTypes.find(t => t.code === 'B');
    const invoiceTypeA = invoiceTypes.find(t => t.code === 'A');

    if (!invoiceTypeB || salesWithCustomers.length === 0) {
      console.log('No invoice types or sales found, skipping');
      return;
    }

    const invoices = [];
    let invoiceCounter = 1;

    salesWithCustomers.forEach((sale) => {
      // Determine invoice type based on customer tax condition
      let invoiceType = invoiceTypeB;
      if (sale.tax_condition === 'RESPONSABLE_INSCRIPTO' && invoiceTypeA) {
        invoiceType = invoiceTypeA;
      }

      const totalAmount = parseFloat(sale.total_amount);
      const taxAmount = parseFloat(sale.tax_amount) || totalAmount * 0.21 / 1.21;
      const netAmount = totalAmount - taxAmount;

      // CAE expiration is typically 10 days from issue
      const caeExpiration = new Date(sale.created_at);
      caeExpiration.setDate(caeExpiration.getDate() + 10);

      // 90% are ISSUED, 10% PENDING (still processing)
      const isIssued = Math.random() > 0.1;

      invoices.push({
        id: uuidv4(),
        sale_id: sale.id,
        invoice_type_id: invoiceType.id,
        point_of_sale: 1,
        invoice_number: invoiceCounter++,
        cae: isIssued ? String(70000000000000 + Math.floor(Math.random() * 9999999999999)) : null,
        cae_expiration_date: isIssued ? caeExpiration.toISOString().split('T')[0] : null,
        customer_name: `${sale.first_name} ${sale.last_name}`,
        customer_document_type: sale.document_type || 'CUIT',
        customer_document_number: sale.document_number,
        customer_tax_condition: sale.tax_condition,
        customer_address: sale.address,
        net_amount: netAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        factuhoy_id: isIssued ? `FH-${Date.now()}-${invoiceCounter}` : null,
        factuhoy_response: isIssued ? JSON.stringify({
          success: true,
          cae: String(70000000000000 + Math.floor(Math.random() * 9999999999999)),
          invoice_number: invoiceCounter
        }) : null,
        pdf_url: isIssued ? `https://factuhoy.com/invoices/${uuidv4()}.pdf` : null,
        status: isIssued ? 'ISSUED' : 'PENDING',
        error_message: null,
        retry_count: 0,
        last_retry_at: null,
        issued_at: isIssued ? new Date(sale.created_at) : null,
        created_at: new Date(sale.created_at),
        updated_at: new Date(sale.created_at)
      });
    });

    if (invoices.length > 0) {
      await queryInterface.bulkInsert('invoices', invoices);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('invoices', null, {});
  }
};
