const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoyaltyPointsTransaction = sequelize.define('LoyaltyPointsTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    loyalty_account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'loyalty_accounts',
        key: 'id'
      }
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['EARN', 'REDEEM', 'ADJUSTMENT', 'EXPIRY']]
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Positive for earn/adjustment increase, negative for redeem/adjustment decrease'
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Points balance after this transaction'
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    sale_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Sale amount when earning points'
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
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Reason for adjustments or manual changes'
    },
    multiplier_applied: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      comment: 'Tier multiplier applied when earning points'
    }
  }, {
    tableName: 'loyalty_points_transactions',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['loyalty_account_id'] },
      { fields: ['transaction_type'] },
      { fields: ['sale_id'] },
      { fields: ['branch_id'] },
      { fields: ['created_at'] }
    ]
  });

  LoyaltyPointsTransaction.associate = (models) => {
    LoyaltyPointsTransaction.belongsTo(models.LoyaltyAccount, { foreignKey: 'loyalty_account_id', as: 'loyalty_account' });
    LoyaltyPointsTransaction.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    LoyaltyPointsTransaction.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    LoyaltyPointsTransaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LoyaltyPointsTransaction;
};
