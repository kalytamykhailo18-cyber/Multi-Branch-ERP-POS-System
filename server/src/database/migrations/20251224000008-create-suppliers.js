'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      legal_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      cuit: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      contact_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contact_phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      payment_terms_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      credit_limit: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      price_list_format: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      default_margin_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 30
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notes: {
        type: Sequelize.TEXT,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('suppliers');
  }
};
