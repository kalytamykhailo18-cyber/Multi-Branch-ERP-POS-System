const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaleItem = sequelize.define('SaleItem', {
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
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    // Quantity and pricing at time of sale
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 21.00
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    line_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'sale_items',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['sale_id'] },
      { fields: ['product_id'] }
    ]
  });

  SaleItem.associate = (models) => {
    SaleItem.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    SaleItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return SaleItem;
};
