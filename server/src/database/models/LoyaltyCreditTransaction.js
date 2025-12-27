const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoyaltyCreditTransaction = sequelize.define('LoyaltyCreditTransaction', {
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
        isIn: [['CREDIT_GIVEN', 'CREDIT_USED', 'ADJUSTMENT', 'EXPIRY']]
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Positive for given/adjustment increase, negative for used/adjustment decrease'
    },
    balance_after: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Credit balance after this transaction'
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales',
        key: 'id'
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
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Reason for giving credit or adjustments'
    }
  }, {
    tableName: 'loyalty_credit_transactions',
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

  LoyaltyCreditTransaction.associate = (models) => {
    LoyaltyCreditTransaction.belongsTo(models.LoyaltyAccount, { foreignKey: 'loyalty_account_id', as: 'loyalty_account' });
    LoyaltyCreditTransaction.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    LoyaltyCreditTransaction.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    LoyaltyCreditTransaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LoyaltyCreditTransaction;
};
