const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    requires_reference: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'payment_methods',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  PaymentMethod.associate = (models) => {
    PaymentMethod.hasMany(models.SalePayment, { foreignKey: 'payment_method_id', as: 'sale_payments' });
  };

  return PaymentMethod;
};
