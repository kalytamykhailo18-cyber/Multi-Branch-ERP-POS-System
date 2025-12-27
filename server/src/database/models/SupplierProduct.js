const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupplierProduct = sequelize.define('SupplierProduct', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
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
    supplier_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    supplier_description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    is_preferred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'supplier_products',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['supplier_id', 'product_id'] }
    ]
  });

  SupplierProduct.associate = (models) => {
    SupplierProduct.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    SupplierProduct.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return SupplierProduct;
};
