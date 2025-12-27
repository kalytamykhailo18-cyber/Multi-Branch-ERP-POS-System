'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sync_queue', {
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
      register_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cash_registers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entity_local_id: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      operation: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false
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
      conflict_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      conflict_resolution: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      conflict_resolved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      local_created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      synced_at: {
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

    await queryInterface.addIndex('sync_queue', ['status']);
    await queryInterface.addIndex('sync_queue', ['branch_id']);

    await queryInterface.createTable('audit_log', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('audit_log', ['user_id']);
    await queryInterface.addIndex('audit_log', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_log', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_log');
    await queryInterface.dropTable('sync_queue');
  }
};
