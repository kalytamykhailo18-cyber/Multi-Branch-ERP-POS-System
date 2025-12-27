'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sales', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sale_number: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      ticket_number: {
        type: Sequelize.STRING(20),
        allowNull: true
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
      register_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cash_registers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'register_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      points_earned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      points_redeemed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      points_redemption_value: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      credit_used: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      change_as_credit: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'COMPLETED'
      },
      voided_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      voided_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      void_reason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      void_approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      local_id: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      local_created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      synced_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sync_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'SYNCED'
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

    await queryInterface.addIndex('sales', ['branch_id']);
    await queryInterface.addIndex('sales', ['session_id']);
    await queryInterface.addIndex('sales', ['customer_id']);
    await queryInterface.addIndex('sales', ['created_at']);
    await queryInterface.addIndex('sales', ['status']);
    await queryInterface.addIndex('sales', ['local_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sales');
  }
};
