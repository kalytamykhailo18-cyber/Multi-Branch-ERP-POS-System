'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all sales
    const [sales] = await queryInterface.sequelize.query(
      `SELECT s.id, s.subtotal, s.discount_percent, s.total_amount, s.created_at
       FROM sales s
       ORDER BY s.created_at;`
    );

    // Get all products with their prices
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku, name, cost_price, selling_price, tax_rate, is_weighable
       FROM products
       WHERE is_active = true;`
    );

    if (products.length === 0) {
      console.log('No products found, skipping sale items seeder');
      return;
    }

    const saleItems = [];

    sales.forEach((sale) => {
      // Each sale has 1-5 different products
      const numItems = 1 + Math.floor(Math.random() * 5);
      const usedProducts = new Set();
      let runningTotal = 0;

      for (let i = 0; i < numItems; i++) {
        // Pick a random product not already in this sale
        let product;
        let attempts = 0;
        do {
          product = products[Math.floor(Math.random() * products.length)];
          attempts++;
        } while (usedProducts.has(product.id) && attempts < 10);

        if (usedProducts.has(product.id)) continue;
        usedProducts.add(product.id);

        // Determine quantity based on product type
        let quantity;
        if (product.is_weighable) {
          // Weighable products: 0.5 - 15 kg
          quantity = (0.5 + Math.random() * 14.5).toFixed(3);
        } else {
          // Unit products: 1-5 units
          quantity = 1 + Math.floor(Math.random() * 5);
        }

        const unitPrice = parseFloat(product.selling_price);
        const costPrice = parseFloat(product.cost_price);
        const taxRate = parseFloat(product.tax_rate) || 21.00;

        // Apply item-level discount (most have no discount, some have small discount)
        const hasItemDiscount = Math.random() > 0.85; // 15% have item discount
        const discountPercent = hasItemDiscount ? Math.floor(Math.random() * 5) + 1 : 0;

        const subtotal = quantity * unitPrice;
        const discountAmount = subtotal * discountPercent / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * taxRate / 100;
        const lineTotal = subtotal - discountAmount; // Tax is included in price for Argentina

        runningTotal += lineTotal;

        saleItems.push({
          id: uuidv4(),
          sale_id: sale.id,
          product_id: product.id,
          quantity: parseFloat(quantity),
          unit_price: unitPrice,
          cost_price: costPrice,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          line_total: lineTotal,
          notes: null,
          created_at: new Date(sale.created_at)
        });
      }
    });

    // Insert in batches to avoid memory issues
    const batchSize = 500;
    for (let i = 0; i < saleItems.length; i += batchSize) {
      const batch = saleItems.slice(i, i + batchSize);
      await queryInterface.bulkInsert('sale_items', batch);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sale_items', null, {});
  }
};
