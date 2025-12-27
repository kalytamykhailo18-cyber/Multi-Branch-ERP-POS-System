'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      {
        id: uuidv4(),
        name: 'OWNER',
        description: 'Store owner with full access',
        can_void_sale: true,
        can_give_discount: true,
        can_view_all_branches: true,
        can_close_register: true,
        can_reopen_closing: true,
        can_adjust_stock: true,
        can_import_prices: true,
        can_manage_users: true,
        can_view_reports: true,
        can_view_financials: true,
        can_manage_suppliers: true,
        can_manage_products: true,
        can_issue_invoice_a: true,
        max_discount_percent: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'MANAGER',
        description: 'Branch manager',
        can_void_sale: true,
        can_give_discount: true,
        can_view_all_branches: false,
        can_close_register: true,
        can_reopen_closing: true,
        can_adjust_stock: true,
        can_import_prices: false,
        can_manage_users: false,
        can_view_reports: true,
        can_view_financials: false,
        can_manage_suppliers: false,
        can_manage_products: true,
        can_issue_invoice_a: true,
        max_discount_percent: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'CASHIER',
        description: 'Regular cashier',
        can_void_sale: false,
        can_give_discount: true,
        can_view_all_branches: false,
        can_close_register: true,
        can_reopen_closing: false,
        can_adjust_stock: false,
        can_import_prices: false,
        can_manage_users: false,
        can_view_reports: false,
        can_view_financials: false,
        can_manage_suppliers: false,
        can_manage_products: false,
        can_issue_invoice_a: false,
        max_discount_percent: 5,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
