'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoice_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.CHAR(1),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      requires_customer_cuit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('invoices', {
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
        onDelete: 'RESTRICT'
      },
      invoice_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'invoice_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      point_of_sale: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      invoice_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      cae: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      cae_expiration_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      customer_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      customer_document_type: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      customer_document_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      customer_tax_condition: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      customer_address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      net_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      factuhoy_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      factuhoy_response: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      pdf_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'PENDING'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_retry_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      issued_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('invoices', ['sale_id']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['issued_at']);
    await queryInterface.addIndex('invoices', ['point_of_sale', 'invoice_number', 'invoice_type_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('invoice_types');
  }
};
