const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    short_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'units_of_measure',
        key: 'id'
      }
    },
    // Pricing
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    margin_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 21.00
    },
    is_tax_included: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Stock settings
    track_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    minimum_stock: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0
    },
    is_weighable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shrinkage_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    // Kretz Aura scale integration
    scale_plu: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    export_to_scale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Images
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    thumbnail_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['sku'] },
      { fields: ['barcode'] },
      { fields: ['category_id'] },
      { fields: ['is_active'] }
    ]
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    Product.belongsTo(models.UnitOfMeasure, { foreignKey: 'unit_id', as: 'unit' });
    Product.hasMany(models.BranchStock, { foreignKey: 'product_id', as: 'branch_stocks' });
    Product.hasMany(models.SaleItem, { foreignKey: 'product_id', as: 'sale_items' });
    Product.hasMany(models.ProductPriceHistory, { foreignKey: 'product_id', as: 'price_history' });
    Product.hasMany(models.SupplierProduct, { foreignKey: 'product_id', as: 'supplier_products' });
    Product.hasMany(models.StockMovement, { foreignKey: 'product_id', as: 'stock_movements' });
  };

  return Product;
};
