'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      business_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      total_cash: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_card: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_qr: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_transfer: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_credit_used: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_points_redeemed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_gross_sales: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_discounts: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_net_sales: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_tax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      transaction_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      voided_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      voided_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      return_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      return_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_discrepancy: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      is_finalized: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      finalized_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      finalized_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('daily_reports', ['branch_id', 'business_date'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('daily_reports');
  }
};
