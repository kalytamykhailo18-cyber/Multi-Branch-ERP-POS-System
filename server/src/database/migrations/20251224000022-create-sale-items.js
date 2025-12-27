'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'sales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 21.00
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      line_total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      notes: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('sale_items', ['sale_id']);
    await queryInterface.addIndex('sale_items', ['product_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sale_items');
  }
};
