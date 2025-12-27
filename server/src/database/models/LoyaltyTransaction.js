const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoyaltyTransaction = sequelize.define('LoyaltyTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['EARN', 'REDEEM', 'EXPIRE', 'ADJUST']]
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    points_balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Reference
    sale_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Expiration
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'loyalty_transactions',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  LoyaltyTransaction.associate = (models) => {
    LoyaltyTransaction.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    LoyaltyTransaction.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    LoyaltyTransaction.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return LoyaltyTransaction;
};
