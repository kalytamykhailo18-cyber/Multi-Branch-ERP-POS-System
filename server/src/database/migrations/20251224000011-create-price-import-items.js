'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('price_import_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'price_import_batches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      row_number: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      extracted_code: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      extracted_description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      extracted_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      match_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      match_confidence: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      current_cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      new_cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      current_selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      new_selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      price_change_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'PENDING'
      },
      rejection_reason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('price_import_items');
  }
};
