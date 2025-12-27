const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_sessions',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserSession.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  };

  return UserSession;
};
