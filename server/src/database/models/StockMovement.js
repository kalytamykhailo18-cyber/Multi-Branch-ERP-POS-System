const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
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
    movement_type: {
      type: DataTypes.ENUM(
        'SALE',
        'RETURN',
        'PURCHASE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'ADJUSTMENT_PLUS',
        'ADJUSTMENT_MINUS',
        'SHRINKAGE',
        'INITIAL',
        'INVENTORY_COUNT'
      ),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    quantity_before: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    quantity_after: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    // Reference to source document
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // For adjustments
    adjustment_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // For transfers
    related_branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    performed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Sync tracking
    local_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'stock_movements',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['product_id'] },
      { fields: ['created_at'] },
      { fields: ['movement_type'] }
    ]
  });

  StockMovement.associate = (models) => {
    StockMovement.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    StockMovement.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    StockMovement.belongsTo(models.Branch, { foreignKey: 'related_branch_id', as: 'related_branch' });
    StockMovement.belongsTo(models.User, { foreignKey: 'performed_by', as: 'performer' });
  };

  return StockMovement;
};
