'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE stock_movement_type AS ENUM (
        'SALE',
        'RETURN',
        'PURCHASE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'ADJUSTMENT_PLUS',
        'ADJUSTMENT_MINUS',
        'SHRINKAGE',
        'INITIAL',
        'INVENTORY_COUNT'
      );
    `);

    await queryInterface.createTable('stock_movements', {
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
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      movement_type: {
        type: 'stock_movement_type',
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      quantity_before: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      quantity_after: {
        type: Sequelize.DECIMAL(12, 3),
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
      adjustment_reason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      related_branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      performed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: {
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
      }
    });

    await queryInterface.addIndex('stock_movements', ['branch_id']);
    await queryInterface.addIndex('stock_movements', ['product_id']);
    await queryInterface.addIndex('stock_movements', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_movements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS stock_movement_type;');
  }
};
