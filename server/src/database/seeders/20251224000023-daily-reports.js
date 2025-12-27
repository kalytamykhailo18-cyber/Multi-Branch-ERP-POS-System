'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM branches;`
    );

    // Get users (owner/manager for finalizing)
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('juan@petfood.com', 'maria@petfood.com');`
    );

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');

    // Get closed sessions to calculate totals
    const [closedSessions] = await queryInterface.sequelize.query(
      `SELECT branch_id, business_date,
              SUM(COALESCE(expected_cash, 0)) as total_cash,
              SUM(COALESCE(expected_card, 0)) as total_card,
              SUM(COALESCE(expected_qr, 0)) as total_qr,
              SUM(COALESCE(expected_transfer, 0)) as total_transfer,
              SUM(COALESCE(total_discrepancy, 0)) as total_discrepancy
       FROM register_sessions
       WHERE status = 'CLOSED'
       GROUP BY branch_id, business_date
       ORDER BY business_date;`
    );

    // Get sales summary per branch per day
    const [salesSummary] = await queryInterface.sequelize.query(
      `SELECT s.branch_id,
              DATE(s.created_at) as business_date,
              COUNT(*) as transaction_count,
              SUM(s.subtotal) as total_gross_sales,
              SUM(s.discount_amount) as total_discounts,
              SUM(s.total_amount) as total_net_sales,
              SUM(s.tax_amount) as total_tax,
              SUM(s.credit_used) as total_credit_used,
              SUM(s.points_redeemed) as total_points_redeemed,
              SUM(CASE WHEN s.status = 'VOIDED' THEN 1 ELSE 0 END) as voided_count,
              SUM(CASE WHEN s.status = 'VOIDED' THEN s.total_amount ELSE 0 END) as voided_amount
       FROM sales s
       GROUP BY s.branch_id, DATE(s.created_at)
       ORDER BY business_date;`
    );

    const dailyReports = [];
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Create daily reports for past days (finalized)
    branches.forEach((branch) => {
      [threeDaysAgo, twoDaysAgo, yesterday].forEach((date, idx) => {
        const dateStr = formatDate(date);

        // Find session data for this branch/date
        const sessionData = closedSessions.find(
          s => s.branch_id === branch.id && s.business_date === dateStr
        );

        // Find sales data for this branch/date
        const salesData = salesSummary.find(
          s => s.branch_id === branch.id && s.business_date === dateStr
        );

        // Skip if no data
        if (!sessionData && !salesData) return;

        const isFinalized = idx < 2; // All but yesterday are finalized

        dailyReports.push({
          id: uuidv4(),
          branch_id: branch.id,
          business_date: dateStr,
          total_cash: parseFloat(sessionData?.total_cash || 0),
          total_card: parseFloat(sessionData?.total_card || 0),
          total_qr: parseFloat(sessionData?.total_qr || 0),
          total_transfer: parseFloat(sessionData?.total_transfer || 0),
          total_credit_used: parseFloat(salesData?.total_credit_used || 0),
          total_points_redeemed: parseInt(salesData?.total_points_redeemed || 0),
          total_gross_sales: parseFloat(salesData?.total_gross_sales || 0),
          total_discounts: parseFloat(salesData?.total_discounts || 0),
          total_net_sales: parseFloat(salesData?.total_net_sales || 0),
          total_tax: parseFloat(salesData?.total_tax || 0),
          transaction_count: parseInt(salesData?.transaction_count || 0),
          voided_count: parseInt(salesData?.voided_count || 0),
          voided_amount: parseFloat(salesData?.voided_amount || 0),
          return_count: 0,
          return_amount: 0,
          total_discrepancy: parseFloat(sessionData?.total_discrepancy || 0),
          is_finalized: isFinalized,
          finalized_at: isFinalized ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : null,
          finalized_by: isFinalized ? (owner?.id || manager?.id) : null,
          created_at: date,
          updated_at: date
        });
      });
    });

    if (dailyReports.length > 0) {
      await queryInterface.bulkInsert('daily_reports', dailyReports);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('daily_reports', null, {});
  }
};
