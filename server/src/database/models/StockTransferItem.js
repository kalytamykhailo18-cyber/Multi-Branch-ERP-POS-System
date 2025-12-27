const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StockTransferItem = sequelize.define('StockTransferItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transfer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stock_transfers',
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
    requested_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    shipped_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    },
    received_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'stock_transfer_items',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  StockTransferItem.associate = (models) => {
    StockTransferItem.belongsTo(models.StockTransfer, { foreignKey: 'transfer_id', as: 'transfer' });
    StockTransferItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return StockTransferItem;
};
