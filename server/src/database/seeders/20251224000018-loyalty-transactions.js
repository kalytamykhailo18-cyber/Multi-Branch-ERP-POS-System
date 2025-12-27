'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get sales with customers that have loyalty points
    const [salesWithCustomers] = await queryInterface.sequelize.query(
      `SELECT s.id as sale_id, s.customer_id, s.points_earned, s.points_redeemed,
              s.created_at, s.created_by, s.status
       FROM sales s
       WHERE s.customer_id IS NOT NULL
       AND s.status = 'COMPLETED'
       AND (s.points_earned > 0 OR s.points_redeemed > 0)
       ORDER BY s.created_at;`
    );

    // Get customers to track balances
    const [customers] = await queryInterface.sequelize.query(
      `SELECT id, first_name, loyalty_points, is_wholesale FROM customers;`
    );

    // Build customer balance tracker starting from 0 (initial state)
    const customerBalances = {};
    customers.forEach(c => {
      customerBalances[c.id] = 0;
    });

    const loyaltyTransactions = [];

    // Process sales chronologically
    salesWithCustomers.forEach((sale) => {
      const customerId = sale.customer_id;
      const customer = customers.find(c => c.id === customerId);

      if (!customer || customer.is_wholesale) return; // Wholesale customers don't earn points

      // Handle points earned
      if (sale.points_earned > 0) {
        const pointsBefore = customerBalances[customerId] || 0;
        const pointsAfter = pointsBefore + sale.points_earned;
        customerBalances[customerId] = pointsAfter;

        // Calculate expiration date (1 year from now)
        const expiresAt = new Date(sale.created_at);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        loyaltyTransactions.push({
          id: uuidv4(),
          customer_id: customerId,
          transaction_type: 'EARN',
          points: sale.points_earned,
          points_balance_after: pointsAfter,
          sale_id: sale.sale_id,
          description: `Puntos ganados por compra`,
          expires_at: expiresAt,
          expired: false,
          created_by: sale.created_by,
          created_at: new Date(sale.created_at)
        });
      }

      // Handle points redeemed
      if (sale.points_redeemed > 0) {
        const pointsBefore = customerBalances[customerId] || 0;
        const pointsAfter = pointsBefore - sale.points_redeemed;
        customerBalances[customerId] = Math.max(0, pointsAfter);

        loyaltyTransactions.push({
          id: uuidv4(),
          customer_id: customerId,
          transaction_type: 'REDEEM',
          points: -sale.points_redeemed,
          points_balance_after: Math.max(0, pointsAfter),
          sale_id: sale.sale_id,
          description: `Puntos canjeados en compra`,
          expires_at: null,
          expired: false,
          created_by: sale.created_by,
          created_at: new Date(sale.created_at)
        });
      }
    });

    // Add some manual adjustments for variety
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email = 'maria@petfood.com';`
    );
    const manager = users[0];

    // Add promotional points for a couple of customers
    const retailCustomers = customers.filter(c => !c.is_wholesale).slice(0, 3);
    retailCustomers.forEach((customer, idx) => {
      const pointsBefore = customerBalances[customer.id] || 0;
      const bonusPoints = (idx + 1) * 50; // 50, 100, 150 bonus points
      const pointsAfter = pointsBefore + bonusPoints;
      customerBalances[customer.id] = pointsAfter;

      const adjustDate = new Date();
      adjustDate.setDate(adjustDate.getDate() - 5);

      loyaltyTransactions.push({
        id: uuidv4(),
        customer_id: customer.id,
        transaction_type: 'ADJUST',
        points: bonusPoints,
        points_balance_after: pointsAfter,
        sale_id: null,
        description: `Puntos promocionales - Campana de fidelizacion`,
        expires_at: null,
        expired: false,
        created_by: manager?.id || null,
        created_at: adjustDate
      });
    });

    // Sort by created_at
    loyaltyTransactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < loyaltyTransactions.length; i += batchSize) {
      const batch = loyaltyTransactions.slice(i, i + batchSize);
      await queryInterface.bulkInsert('loyalty_transactions', batch);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('loyalty_transactions', null, {});
  }
};
