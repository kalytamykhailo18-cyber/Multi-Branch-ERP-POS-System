const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoyaltyAccount = sequelize.define('LoyaltyAccount', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    qr_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'QR code for scanning at kiosk'
    },
    points_balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Current points balance'
    },
    credit_balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Current credit balance (change as credit)'
    },
    lifetime_points_earned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total points earned throughout lifetime'
    },
    lifetime_points_redeemed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total points redeemed throughout lifetime'
    },
    lifetime_credit_given: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total credit given throughout lifetime'
    },
    lifetime_credit_used: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total credit used throughout lifetime'
    },
    tier: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'BRONZE',
      validate: {
        isIn: [['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']]
      },
      comment: 'Loyalty tier based on lifetime points'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'loyalty_accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['customer_id'], unique: true },
      { fields: ['qr_code'], unique: true },
      { fields: ['tier'] },
      { fields: ['is_active'] }
    ]
  });

  LoyaltyAccount.associate = (models) => {
    LoyaltyAccount.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    LoyaltyAccount.hasMany(models.LoyaltyPointsTransaction, { foreignKey: 'loyalty_account_id', as: 'points_transactions' });
    LoyaltyAccount.hasMany(models.LoyaltyCreditTransaction, { foreignKey: 'loyalty_account_id', as: 'credit_transactions' });
  };

  return LoyaltyAccount;
};
