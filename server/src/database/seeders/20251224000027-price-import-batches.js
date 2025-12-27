'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get suppliers
    const [suppliers] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM suppliers;`
    );

    // Get users
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('juan@petfood.com', 'maria@petfood.com');`
    );

    if (suppliers.length === 0 || users.length === 0) {
      console.log('No suppliers or users found, skipping price_import_batches seeder');
      return;
    }

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');

    const batches = [];
    const now = new Date();

    // Create some completed import batches
    suppliers.slice(0, 3).forEach((supplier, idx) => {
      const createdDate = new Date(now);
      createdDate.setDate(createdDate.getDate() - (7 + idx * 5));

      const appliedDate = new Date(createdDate);
      appliedDate.setHours(appliedDate.getHours() + 2);

      // Completed batch
      batches.push({
        id: uuidv4(),
        supplier_id: supplier.id,
        file_name: `lista_precios_${supplier.code}_${createdDate.toISOString().split('T')[0]}.pdf`,
        file_type: 'PDF',
        file_url: `https://storage.example.com/imports/${supplier.code}/${uuidv4()}.pdf`,
        file_size_bytes: 150000 + Math.floor(Math.random() * 100000),
        ocr_required: true,
        ocr_engine: 'GOOGLE_VISION',
        extraction_confidence: 85 + Math.random() * 10,
        status: 'APPLIED',
        error_message: null,
        total_rows_extracted: 25 + idx * 5,
        rows_matched: 20 + idx * 3,
        rows_unmatched: 5 + idx,
        rows_applied: 18 + idx * 2,
        margin_type: 'PERCENTAGE',
        margin_value: 30 + idx * 5,
        rounding_rule: 'ROUND_UP_10',
        uploaded_by: owner?.id || null,
        applied_by: owner?.id || null,
        applied_at: appliedDate,
        created_at: createdDate,
        updated_at: appliedDate
      });
    });

    // Create a pending batch (recently uploaded)
    const pendingSupplier = suppliers[3] || suppliers[0];
    const pendingDate = new Date(now);
    pendingDate.setHours(pendingDate.getHours() - 1);

    batches.push({
      id: uuidv4(),
      supplier_id: pendingSupplier.id,
      file_name: `lista_precios_${pendingSupplier.code}_${pendingDate.toISOString().split('T')[0]}.xlsx`,
      file_type: 'EXCEL',
      file_url: `https://storage.example.com/imports/${pendingSupplier.code}/${uuidv4()}.xlsx`,
      file_size_bytes: 85000,
      ocr_required: false,
      ocr_engine: null,
      extraction_confidence: null,
      status: 'PENDING_REVIEW',
      error_message: null,
      total_rows_extracted: 30,
      rows_matched: 25,
      rows_unmatched: 5,
      rows_applied: 0,
      margin_type: 'PERCENTAGE',
      margin_value: 35,
      rounding_rule: 'ROUND_UP_10',
      uploaded_by: manager?.id || null,
      applied_by: null,
      applied_at: null,
      created_at: pendingDate,
      updated_at: pendingDate
    });

    // Create a failed batch
    const failedSupplier = suppliers[4] || suppliers[1];
    const failedDate = new Date(now);
    failedDate.setDate(failedDate.getDate() - 3);

    batches.push({
      id: uuidv4(),
      supplier_id: failedSupplier.id,
      file_name: `lista_precios_${failedSupplier.code}_corrupted.pdf`,
      file_type: 'PDF',
      file_url: `https://storage.example.com/imports/${failedSupplier.code}/${uuidv4()}.pdf`,
      file_size_bytes: 50000,
      ocr_required: true,
      ocr_engine: 'GOOGLE_VISION',
      extraction_confidence: 25.5,
      status: 'FAILED',
      error_message: 'OCR extraction failed: Unable to parse price table structure. Low image quality detected.',
      total_rows_extracted: 0,
      rows_matched: 0,
      rows_unmatched: 0,
      rows_applied: 0,
      margin_type: null,
      margin_value: null,
      rounding_rule: null,
      uploaded_by: manager?.id || null,
      applied_by: null,
      applied_at: null,
      created_at: failedDate,
      updated_at: failedDate
    });

    await queryInterface.bulkInsert('price_import_batches', batches);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('price_import_batches', null, {});
  }
};
