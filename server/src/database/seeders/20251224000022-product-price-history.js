'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all products
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku, name, cost_price, selling_price FROM products;`
    );

    // Get users (owner for manual changes)
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email = 'juan@petfood.com';`
    );

    const owner = users[0];

    if (products.length === 0) {
      console.log('No products found, skipping');
      return;
    }

    const priceHistory = [];
    const now = new Date();

    // Create price history for each product (simulating past price changes)
    products.forEach((product) => {
      const currentCost = parseFloat(product.cost_price);
      const currentSelling = parseFloat(product.selling_price);

      // Price change 30 days ago (initial setup)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      priceHistory.push({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: null,
        new_cost_price: currentCost * 0.85, // Started 15% lower
        old_selling_price: null,
        new_selling_price: currentSelling * 0.85,
        change_reason: 'MANUAL',
        import_batch_id: null,
        changed_by: owner?.id || null,
        created_at: thirtyDaysAgo
      });

      // Price increase 15 days ago (market adjustment)
      const fifteenDaysAgo = new Date(now);
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      priceHistory.push({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: currentCost * 0.85,
        new_cost_price: currentCost * 0.92,
        old_selling_price: currentSelling * 0.85,
        new_selling_price: currentSelling * 0.92,
        change_reason: 'OCR_IMPORT',
        import_batch_id: null,
        changed_by: owner?.id || null,
        created_at: fifteenDaysAgo
      });

      // Current price (5 days ago)
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      priceHistory.push({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: currentCost * 0.92,
        new_cost_price: currentCost,
        old_selling_price: currentSelling * 0.92,
        new_selling_price: currentSelling,
        change_reason: 'MARGIN_UPDATE',
        import_batch_id: null,
        changed_by: owner?.id || null,
        created_at: fiveDaysAgo
      });
    });

    // Sort by created_at
    priceHistory.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    await queryInterface.bulkInsert('product_price_history', priceHistory);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_price_history', null, {});
  }
};
