'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branch_stock', {
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
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
      },
      reserved_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      expected_shrinkage: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      actual_shrinkage: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      last_counted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_counted_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('branch_stock', ['branch_id', 'product_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('branch_stock');
  }
};
