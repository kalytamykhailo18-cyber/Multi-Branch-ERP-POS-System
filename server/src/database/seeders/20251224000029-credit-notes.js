'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get issued invoices
    const [invoices] = await queryInterface.sequelize.query(
      `SELECT i.id, i.invoice_type_id, i.point_of_sale, i.net_amount, i.tax_amount, i.total_amount,
              i.issued_at, it.code as invoice_type_code
       FROM invoices i
       JOIN invoice_types it ON i.invoice_type_id = it.id
       WHERE i.status = 'ISSUED'
       ORDER BY i.issued_at
       LIMIT 5;`
    );

    if (invoices.length === 0) {
      console.log('No invoices found, skipping credit_notes seeder');
      return;
    }

    const creditNotes = [];
    const now = new Date();
    let creditNoteCounter = 1;

    // Create credit notes for some invoices (partial and full refunds)
    invoices.slice(0, 3).forEach((invoice, idx) => {
      const issuedDate = new Date(invoice.issued_at);
      issuedDate.setDate(issuedDate.getDate() + 1); // Credit note issued 1 day after invoice

      const caeExpiration = new Date(issuedDate);
      caeExpiration.setDate(caeExpiration.getDate() + 10);

      const totalAmount = parseFloat(invoice.total_amount);
      const taxAmount = parseFloat(invoice.tax_amount);
      const netAmount = parseFloat(invoice.net_amount);

      // First one is partial refund (50%), others are full refunds
      const refundPercent = idx === 0 ? 0.5 : 1;

      const isIssued = idx < 2; // First 2 are issued, last one is pending

      creditNotes.push({
        id: uuidv4(),
        original_invoice_id: invoice.id,
        credit_note_type: invoice.invoice_type_code, // Same type as invoice (A, B, C)
        point_of_sale: invoice.point_of_sale,
        credit_note_number: creditNoteCounter++,
        cae: isIssued ? String(80000000000000 + Math.floor(Math.random() * 9999999999999)) : null,
        cae_expiration_date: isIssued ? caeExpiration.toISOString().split('T')[0] : null,
        reason: idx === 0 ? 'Devolucion parcial - Producto defectuoso' : 'Devolucion completa - Error en facturacion',
        net_amount: netAmount * refundPercent,
        tax_amount: taxAmount * refundPercent,
        total_amount: totalAmount * refundPercent,
        factuhoy_id: isIssued ? `FH-CN-${Date.now()}-${creditNoteCounter}` : null,
        factuhoy_response: isIssued ? JSON.stringify({
          success: true,
          cae: String(80000000000000 + Math.floor(Math.random() * 9999999999999)),
          credit_note_number: creditNoteCounter
        }) : null,
        pdf_url: isIssued ? `https://factuhoy.com/credit-notes/${uuidv4()}.pdf` : null,
        status: isIssued ? 'ISSUED' : 'PENDING',
        issued_at: isIssued ? issuedDate : null,
        created_at: issuedDate
      });
    });

    if (creditNotes.length > 0) {
      await queryInterface.bulkInsert('credit_notes', creditNotes);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('credit_notes', null, {});
  }
};
