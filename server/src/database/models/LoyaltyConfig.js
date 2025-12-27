const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoyaltyConfig = sequelize.define('LoyaltyConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    points_per_peso: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 1,
      comment: 'How many points earned per peso spent'
    },
    peso_per_point_redemption: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.1,
      comment: 'Value in pesos of each point when redeemed'
    },
    minimum_points_to_redeem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: 'Minimum points required to redeem'
    },
    points_expiry_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 365,
      comment: 'Days until earned points expire (0 = never)'
    },
    credit_expiry_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 180,
      comment: 'Days until given credit expires (0 = never)'
    },
    min_change_for_credit: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 10,
      comment: 'Minimum change amount to offer as credit'
    },
    tier_thresholds: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        SILVER: 1000,
        GOLD: 3000,
        PLATINUM: 20000
      },
      comment: 'Lifetime points required for each tier'
    },
    tier_multipliers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        BRONZE: 1,
        SILVER: 1.25,
        GOLD: 1.5,
        PLATINUM: 2
      },
      comment: 'Points multiplier for each tier when earning'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Only one config should be active at a time'
    }
  }, {
    tableName: 'loyalty_config',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] }
    ]
  });

  LoyaltyConfig.associate = (models) => {
    // No associations
  };

  return LoyaltyConfig;
};
