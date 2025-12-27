const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SyncQueue = sequelize.define('SyncQueue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    register_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cash_registers',
        key: 'id'
      }
    },
    // Operation details
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_local_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    operation: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['INSERT', 'UPDATE', 'DELETE']]
      }
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'PROCESSING', 'SYNCED', 'FAILED', 'CONFLICT']]
      }
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Conflict resolution
    conflict_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    conflict_resolution: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['LOCAL_WINS', 'SERVER_WINS', 'MERGED', null]]
      }
    },
    conflict_resolved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Timestamps
    local_created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'sync_queue',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['branch_id'] }
    ]
  });

  SyncQueue.associate = (models) => {
    SyncQueue.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    SyncQueue.belongsTo(models.CashRegister, { foreignKey: 'register_id', as: 'register' });
    SyncQueue.belongsTo(models.User, { foreignKey: 'conflict_resolved_by', as: 'resolver' });
  };

  return SyncQueue;
};
