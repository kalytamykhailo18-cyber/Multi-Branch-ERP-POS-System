'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      customer_code: {
        type: Sequelize.STRING(20),
        unique: true,
        allowNull: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      document_type: {
        type: Sequelize.STRING(10),
        defaultValue: 'DNI'
      },
      document_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      tax_condition: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      neighborhood: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      loyalty_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      loyalty_tier: {
        type: Sequelize.STRING(20),
        defaultValue: 'STANDARD'
      },
      qr_code: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: true
      },
      credit_balance: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      is_wholesale: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      wholesale_discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      assigned_vendor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('customers', ['document_number']);
    await queryInterface.addIndex('customers', ['qr_code']);
    await queryInterface.addIndex('customers', ['phone']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('customers');
  }
};
