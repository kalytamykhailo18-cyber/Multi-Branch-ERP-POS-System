'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get sales with credit usage
    const [salesWithCredit] = await queryInterface.sequelize.query(
      `SELECT s.id as sale_id, s.customer_id, s.credit_used, s.change_as_credit,
              s.created_at, s.created_by, s.status
       FROM sales s
       WHERE s.customer_id IS NOT NULL
       AND s.status = 'COMPLETED'
       AND (s.credit_used > 0 OR s.change_as_credit > 0)
       ORDER BY s.created_at;`
    );

    // Get customers with credit balance
    const [customers] = await queryInterface.sequelize.query(
      `SELECT id, first_name, last_name, credit_balance FROM customers
       WHERE credit_balance > 0;`
    );

    // Get users for manager adjustments
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users;`
    );
    const manager = users.find(u => u.email === 'maria@petfood.com');
    const owner = users.find(u => u.email === 'juan@petfood.com');

    const creditTransactions = [];

    // Track customer balances starting from 0
    const customerBalances = {};
    customers.forEach(c => {
      customerBalances[c.id] = 0;
    });

    // First, add initial credits for customers that have credit_balance
    customers.forEach((customer) => {
      const initialCredit = parseFloat(customer.credit_balance);
      if (initialCredit > 0) {
        customerBalances[customer.id] = initialCredit;

        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() - 15); // 15 days ago

        creditTransactions.push({
          id: uuidv4(),
          customer_id: customer.id,
          transaction_type: 'CREDIT',
          amount: initialCredit,
          balance_after: initialCredit,
          sale_id: null,
          description: 'Credito inicial - Vuelto acumulado',
          created_by: manager?.id || owner?.id || null,
          created_at: initialDate
        });
      }
    });

    // Process sales with credit operations
    salesWithCredit.forEach((sale) => {
      const customerId = sale.customer_id;
      const currentBalance = customerBalances[customerId] || 0;

      // Credit used (DEBIT - reduces balance)
      if (parseFloat(sale.credit_used) > 0) {
        const creditUsed = parseFloat(sale.credit_used);
        const balanceAfter = currentBalance - creditUsed;
        customerBalances[customerId] = Math.max(0, balanceAfter);

        creditTransactions.push({
          id: uuidv4(),
          customer_id: customerId,
          transaction_type: 'DEBIT',
          amount: -creditUsed,
          balance_after: Math.max(0, balanceAfter),
          sale_id: sale.sale_id,
          description: 'Credito utilizado en compra',
          created_by: sale.created_by,
          created_at: new Date(sale.created_at)
        });
      }

      // Change as credit (CREDIT - increases balance)
      if (parseFloat(sale.change_as_credit) > 0) {
        const changeCredit = parseFloat(sale.change_as_credit);
        const balanceAfter = (customerBalances[customerId] || 0) + changeCredit;
        customerBalances[customerId] = balanceAfter;

        creditTransactions.push({
          id: uuidv4(),
          customer_id: customerId,
          transaction_type: 'CREDIT',
          amount: changeCredit,
          balance_after: balanceAfter,
          sale_id: sale.sale_id,
          description: 'Vuelto convertido a credito',
          created_by: sale.created_by,
          created_at: new Date(sale.created_at)
        });
      }
    });

    // Add some manual credit adjustments for variety
    const customersWithCredit = customers.filter(c => parseFloat(c.credit_balance) > 0).slice(0, 2);
    customersWithCredit.forEach((customer, idx) => {
      const currentBalance = customerBalances[customer.id] || 0;
      const adjustment = (idx + 1) * 100; // 100, 200 adjustment

      // Add bonus credit
      const adjustDate = new Date();
      adjustDate.setDate(adjustDate.getDate() - 3);

      customerBalances[customer.id] = currentBalance + adjustment;

      creditTransactions.push({
        id: uuidv4(),
        customer_id: customer.id,
        transaction_type: 'ADJUST',
        amount: adjustment,
        balance_after: currentBalance + adjustment,
        sale_id: null,
        description: 'Ajuste de credito - Promocion especial',
        created_by: manager?.id || owner?.id || null,
        created_at: adjustDate
      });
    });

    // Sort by created_at
    creditTransactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (creditTransactions.length > 0) {
      await queryInterface.bulkInsert('credit_transactions', creditTransactions);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('credit_transactions', null, {});
  }
};
