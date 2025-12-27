'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_payments', {
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
      payment_method_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payment_methods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      reference_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      card_last_four: {
        type: Sequelize.STRING(4),
        allowNull: true
      },
      card_brand: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      authorization_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      qr_provider: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      qr_transaction_id: {
        type: Sequelize.STRING(100),
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
    await queryInterface.dropTable('sale_payments');
  }
};
