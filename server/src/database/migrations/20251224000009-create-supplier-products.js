'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('supplier_products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'suppliers',
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
        onDelete: 'CASCADE'
      },
      supplier_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      supplier_description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      last_cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      is_preferred: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('supplier_products', ['supplier_id', 'product_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('supplier_products');
  }
};
