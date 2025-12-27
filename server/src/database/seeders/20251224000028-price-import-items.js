'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get import batches that have been applied or are pending review
    const [batches] = await queryInterface.sequelize.query(
      `SELECT id, status, supplier_id, total_rows_extracted FROM price_import_batches
       WHERE status IN ('APPLIED', 'PENDING_REVIEW')
       ORDER BY created_at;`
    );

    // Get products
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku, name, cost_price, selling_price FROM products;`
    );

    if (batches.length === 0 || products.length === 0) {
      console.log('No batches or products found, skipping price_import_items seeder');
      return;
    }

    const items = [];
    const now = new Date();

    batches.forEach((batch) => {
      const totalRows = parseInt(batch.total_rows_extracted) || 10;

      // Create items for each batch
      for (let i = 0; i < totalRows; i++) {
        const product = products[i % products.length];
        const isMatched = i < (totalRows - 3); // Last 3 are unmatched
        const isApplied = batch.status === 'APPLIED' && isMatched && i < (totalRows - 5);

        const currentCost = parseFloat(product.cost_price);
        const currentSelling = parseFloat(product.selling_price);
        const priceChangePercent = 5 + Math.random() * 10; // 5-15% increase
        const newCost = currentCost * (1 + priceChangePercent / 100);
        const newSelling = currentSelling * (1 + priceChangePercent / 100);

        let status = 'PENDING';
        let rejectionReason = null;

        if (batch.status === 'APPLIED') {
          if (isApplied) {
            status = 'APPLIED';
          } else if (isMatched) {
            status = 'REJECTED';
            rejectionReason = 'Price change exceeds maximum allowed threshold';
          } else {
            status = 'UNMATCHED';
            rejectionReason = 'Product not found in catalog';
          }
        } else {
          // Pending review
          status = isMatched ? 'PENDING' : 'UNMATCHED';
          if (!isMatched) {
            rejectionReason = 'Product not found in catalog';
          }
        }

        items.push({
          id: uuidv4(),
          batch_id: batch.id,
          row_number: i + 1,
          extracted_code: isMatched ? product.sku : `UNK${1000 + i}`,
          extracted_description: isMatched ? product.name : `Unknown Product ${i + 1}`,
          extracted_price: newCost,
          product_id: isMatched ? product.id : null,
          match_type: isMatched ? (i % 3 === 0 ? 'SKU_EXACT' : 'DESCRIPTION_FUZZY') : null,
          match_confidence: isMatched ? (85 + Math.random() * 10) : null,
          current_cost_price: isMatched ? currentCost : null,
          new_cost_price: isMatched ? newCost : null,
          current_selling_price: isMatched ? currentSelling : null,
          new_selling_price: isMatched ? newSelling : null,
          price_change_percent: isMatched ? priceChangePercent : null,
          status: status,
          rejection_reason: rejectionReason,
          created_at: now
        });
      }
    });

    if (items.length > 0) {
      await queryInterface.bulkInsert('price_import_items', items);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('price_import_items', null, {});
  }
};
