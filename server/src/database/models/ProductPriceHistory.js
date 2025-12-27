const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductPriceHistory = sequelize.define('ProductPriceHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    old_cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    new_cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    old_selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    new_selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    change_reason: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['MANUAL', 'OCR_IMPORT', 'MARGIN_UPDATE', 'BULK_UPDATE']]
      }
    },
    import_batch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'price_import_batches',
        key: 'id'
      }
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_price_history',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  ProductPriceHistory.associate = (models) => {
    ProductPriceHistory.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    ProductPriceHistory.belongsTo(models.User, { foreignKey: 'changed_by', as: 'changed_by_user' });
    ProductPriceHistory.belongsTo(models.PriceImportBatch, { foreignKey: 'import_batch_id', as: 'import_batch' });
  };

  return ProductPriceHistory;
};
