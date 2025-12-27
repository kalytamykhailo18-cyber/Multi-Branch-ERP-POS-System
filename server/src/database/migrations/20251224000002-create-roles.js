'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      can_void_sale: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_give_discount: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_view_all_branches: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_close_register: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      can_reopen_closing: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_adjust_stock: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_import_prices: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_manage_users: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_view_reports: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_view_financials: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_manage_suppliers: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_manage_products: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      can_issue_invoice_a: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      max_discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  }
};
