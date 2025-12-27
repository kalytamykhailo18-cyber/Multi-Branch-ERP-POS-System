'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('price_import_batches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      file_size_bytes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ocr_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ocr_engine: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      extraction_confidence: {
        type: Sequelize.DECIMAL(5, 2),
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
      total_rows_extracted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rows_matched: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rows_unmatched: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rows_applied: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      margin_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      margin_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      rounding_rule: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      applied_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      applied_at: {
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('price_import_batches');
  }
};
