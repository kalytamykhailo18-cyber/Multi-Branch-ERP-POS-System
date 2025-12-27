'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE shift_type AS ENUM ('MORNING', 'AFTERNOON', 'FULL_DAY');
    `);

    await queryInterface.createTable('register_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      session_number: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      shift_type: {
        type: 'shift_type',
        allowNull: false
      },
      business_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      opened_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      opening_cash: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      opening_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      closed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      closed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      declared_cash: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      declared_card: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      declared_qr: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      declared_transfer: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      expected_cash: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      expected_card: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      expected_qr: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      expected_transfer: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      discrepancy_cash: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      discrepancy_card: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      discrepancy_qr: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      discrepancy_transfer: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      total_discrepancy: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'OPEN'
      },
      closing_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reopened_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reopened_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reopen_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      local_id: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      synced_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('register_sessions', ['register_id']);
    await queryInterface.addIndex('register_sessions', ['branch_id']);
    await queryInterface.addIndex('register_sessions', ['business_date']);
    await queryInterface.addIndex('register_sessions', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('register_sessions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS shift_type;');
  }
};
