'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('credit_notes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      original_invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      credit_note_type: {
        type: Sequelize.CHAR(1),
        allowNull: false
      },
      point_of_sale: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      credit_note_number: {
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
      reason: {
        type: Sequelize.STRING(255),
        allowNull: false
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
      issued_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('credit_notes');
  }
};
