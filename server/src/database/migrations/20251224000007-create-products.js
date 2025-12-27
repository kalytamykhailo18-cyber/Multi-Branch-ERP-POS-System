'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sku: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      barcode: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      short_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'units_of_measure',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      margin_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 21.00
      },
      is_tax_included: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      track_stock: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      minimum_stock: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      is_weighable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      shrinkage_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      scale_plu: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      export_to_scale: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('products', ['sku']);
    await queryInterface.addIndex('products', ['barcode']);
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
