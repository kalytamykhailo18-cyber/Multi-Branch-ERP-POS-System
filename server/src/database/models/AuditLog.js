const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Who
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    user_email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // Where
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // What
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Changes
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // Context
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'audit_log',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    AuditLog.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  };

  return AuditLog;
};
