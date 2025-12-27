const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alert_type: {
      type: DataTypes.ENUM(
        'VOIDED_SALE',
        'CASH_DISCREPANCY',
        'LOW_STOCK',
        'LATE_CLOSING',
        'REOPEN_REGISTER',
        'FAILED_INVOICE',
        'LARGE_DISCOUNT',
        'HIGH_VALUE_SALE',
        'SYNC_ERROR',
        'LOGIN_FAILED',
        'PRICE_CHANGE'
      ),
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING(20),
      defaultValue: 'MEDIUM',
      validate: {
        isIn: [['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']]
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Reference to related entity
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Status
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resolved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'alerts',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['alert_type'] },
      { fields: ['is_read'] }
    ]
  });

  Alert.associate = (models) => {
    Alert.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Alert.belongsTo(models.User, { foreignKey: 'user_id', as: 'triggered_by' });
    Alert.belongsTo(models.User, { foreignKey: 'read_by', as: 'reader' });
    Alert.belongsTo(models.User, { foreignKey: 'resolved_by', as: 'resolver' });
  };

  return Alert;
};
