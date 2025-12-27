'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get sessions
    const [sessions] = await queryInterface.sequelize.query(
      `SELECT rs.id, rs.register_id, rs.branch_id, rs.opened_by, rs.business_date, rs.status
       FROM register_sessions rs
       ORDER BY rs.business_date, rs.opened_at;`
    );

    // Get users
    const [users] = await queryInterface.sequelize.query(
      `SELECT u.id, u.email, u.first_name FROM users u;`
    );

    // Get customers
    const [customers] = await queryInterface.sequelize.query(
      `SELECT id, first_name, last_name, is_wholesale FROM customers;`
    );

    // Get branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code FROM branches;`
    );

    // Get registers
    const [registers] = await queryInterface.sequelize.query(
      `SELECT id, branch_id FROM cash_registers;`
    );

    const sales = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    let saleCounter = 1;

    // Get closed sessions to create historical sales
    const closedSessions = sessions.filter(s => s.status === 'CLOSED');
    const openSessions = sessions.filter(s => s.status === 'OPEN');

    // Helper to generate sale number
    const genSaleNumber = () => `V${String(saleCounter++).padStart(8, '0')}`;
    const genTicketNumber = () => `T${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    // Create multiple sales per closed session
    closedSessions.forEach((session, sessionIdx) => {
      const salesPerSession = 8 + Math.floor(Math.random() * 12); // 8-20 sales per session
      const sessionDate = new Date(session.business_date);

      for (let i = 0; i < salesPerSession; i++) {
        // Random customer (70% have customer, 30% anonymous)
        const hasCustomer = Math.random() > 0.3;
        const customer = hasCustomer ? customers[Math.floor(Math.random() * customers.length)] : null;

        // Calculate amounts
        const subtotal = 5000 + Math.floor(Math.random() * 95000); // 5000 - 100000
        const hasDiscount = Math.random() > 0.7; // 30% have discount
        const discountPercent = hasDiscount ? Math.floor(Math.random() * 10) + 1 : 0;
        const discountAmount = Math.floor(subtotal * discountPercent / 100);
        const taxAmount = Math.floor((subtotal - discountAmount) * 0.21);
        const totalAmount = subtotal - discountAmount;

        // Points (only for customers)
        const pointsEarned = customer && !customer.is_wholesale ? Math.floor(totalAmount / 100) : 0;
        const pointsRedeemed = customer && Math.random() > 0.9 ? Math.floor(Math.random() * 50) : 0;
        const pointsRedemptionValue = pointsRedeemed * 10;

        // Credit used
        const creditUsed = customer && Math.random() > 0.95 ? Math.floor(Math.random() * 1000) : 0;
        const changeAsCredit = customer && Math.random() > 0.9 ? Math.floor(Math.random() * 500) : 0;

        // Sale time within session hours
        const saleHour = 8 + Math.floor(Math.random() * 12); // 8am - 8pm
        const saleMinute = Math.floor(Math.random() * 60);
        const saleTime = new Date(sessionDate);
        saleTime.setHours(saleHour, saleMinute, 0);

        // Determine status (mostly completed, few voided)
        let status = 'COMPLETED';
        let voidedAt = null;
        let voidedBy = null;
        let voidReason = null;
        let voidApprovedBy = null;

        if (Math.random() > 0.97) { // 3% voided
          status = 'VOIDED';
          voidedAt = new Date(saleTime);
          voidedAt.setMinutes(voidedAt.getMinutes() + 5);
          voidedBy = session.opened_by;
          voidReason = ['Error de precio', 'Cliente cancelo', 'Producto equivocado', 'Devolucion inmediata'][Math.floor(Math.random() * 4)];
          // Manager approval for voids
          const manager = users.find(u => u.email === 'maria@petfood.com');
          voidApprovedBy = manager ? manager.id : null;
        }

        sales.push({
          id: uuidv4(),
          sale_number: genSaleNumber(),
          ticket_number: genTicketNumber(),
          branch_id: session.branch_id,
          register_id: session.register_id,
          session_id: session.id,
          customer_id: customer?.id || null,
          seller_id: customer?.is_wholesale ? session.opened_by : null,
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_percent: discountPercent,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          points_earned: pointsEarned,
          points_redeemed: pointsRedeemed,
          points_redemption_value: pointsRedemptionValue,
          credit_used: creditUsed,
          change_as_credit: changeAsCredit,
          status: status,
          voided_at: voidedAt,
          voided_by: voidedBy,
          void_reason: voidReason,
          void_approved_by: voidApprovedBy,
          created_by: session.opened_by,
          local_id: null,
          local_created_at: null,
          synced_at: saleTime,
          sync_status: 'SYNCED',
          created_at: saleTime,
          updated_at: saleTime
        });
      }
    });

    // Create a few sales for today's open sessions
    openSessions.forEach((session) => {
      const salesPerSession = 3 + Math.floor(Math.random() * 7); // 3-10 sales so far today

      for (let i = 0; i < salesPerSession; i++) {
        const hasCustomer = Math.random() > 0.3;
        const customer = hasCustomer ? customers[Math.floor(Math.random() * customers.length)] : null;

        const subtotal = 5000 + Math.floor(Math.random() * 95000);
        const hasDiscount = Math.random() > 0.7;
        const discountPercent = hasDiscount ? Math.floor(Math.random() * 10) + 1 : 0;
        const discountAmount = Math.floor(subtotal * discountPercent / 100);
        const taxAmount = Math.floor((subtotal - discountAmount) * 0.21);
        const totalAmount = subtotal - discountAmount;

        const pointsEarned = customer && !customer.is_wholesale ? Math.floor(totalAmount / 100) : 0;

        // Today's sales within morning hours
        const saleHour = 8 + Math.floor(Math.random() * 4); // 8am - 12pm
        const saleMinute = Math.floor(Math.random() * 60);
        const saleTime = new Date();
        saleTime.setHours(saleHour, saleMinute, 0);

        sales.push({
          id: uuidv4(),
          sale_number: genSaleNumber(),
          ticket_number: genTicketNumber(),
          branch_id: session.branch_id,
          register_id: session.register_id,
          session_id: session.id,
          customer_id: customer?.id || null,
          seller_id: customer?.is_wholesale ? session.opened_by : null,
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_percent: discountPercent,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          points_earned: pointsEarned,
          points_redeemed: 0,
          points_redemption_value: 0,
          credit_used: 0,
          change_as_credit: 0,
          status: 'COMPLETED',
          voided_at: null,
          voided_by: null,
          void_reason: null,
          void_approved_by: null,
          created_by: session.opened_by,
          local_id: null,
          local_created_at: null,
          synced_at: saleTime,
          sync_status: 'SYNCED',
          created_at: saleTime,
          updated_at: saleTime
        });
      }
    });

    await queryInterface.bulkInsert('sales', sales);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sales', null, {});
  }
};
