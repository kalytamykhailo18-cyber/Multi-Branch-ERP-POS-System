const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalePayment = sequelize.define('SalePayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    payment_method_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'payment_methods',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    // For transfers (receipt number required)
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // For cards
    card_last_four: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    card_brand: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    authorization_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // For QR payments
    qr_provider: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    qr_transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'sale_payments',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  SalePayment.associate = (models) => {
    SalePayment.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    SalePayment.belongsTo(models.PaymentMethod, { foreignKey: 'payment_method_id', as: 'payment_method' });
  };

  return SalePayment;
};
