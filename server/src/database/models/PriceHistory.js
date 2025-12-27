const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PriceHistory = sequelize.define('PriceHistory', {
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
    old_sell_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    new_sell_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    change_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['IMPORT', 'MANUAL', 'BULK', 'MARGIN_UPDATE']]
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
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'price_history',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['import_batch_id'] },
      { fields: ['created_at'] },
      { fields: ['change_type'] }
    ]
  });

  PriceHistory.associate = (models) => {
    PriceHistory.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    PriceHistory.belongsTo(models.User, { foreignKey: 'changed_by', as: 'changed_by_user' });
    PriceHistory.belongsTo(models.PriceImportBatch, { foreignKey: 'import_batch_id', as: 'import_batch' });
  };

  return PriceHistory;
};
