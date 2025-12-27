'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE alert_type AS ENUM (
        'VOIDED_SALE',
        'CASH_DISCREPANCY',
        'LOW_STOCK',
        'LATE_CLOSING',
        'REOPEN_REGISTER',
        'FAILED_INVOICE',
        'LARGE_DISCOUNT',
        'HIGH_VALUE_SALE',
        'SYNC_ERROR',
        'LOGIN_FAILED',
        'PRICE_CHANGE'
      );
    `);

    await queryInterface.createTable('alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      alert_type: {
        type: 'alert_type',
        allowNull: false
      },
      severity: {
        type: Sequelize.STRING(20),
        defaultValue: 'MEDIUM'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      resolved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolution_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('alerts', ['branch_id']);
    await queryInterface.addIndex('alerts', ['alert_type']);
    await queryInterface.addIndex('alerts', ['is_read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('alerts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS alert_type;');
  }
};
