'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_price_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      old_cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      new_cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      old_selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      new_selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      change_reason: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      import_batch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'price_import_batches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      changed_by: {
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
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_price_history');
  }
};
