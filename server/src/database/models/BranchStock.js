const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BranchStock = sequelize.define('BranchStock', {
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
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0
    },
    reserved_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0
    },
    // Shrinkage tracking
    expected_shrinkage: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0
    },
    actual_shrinkage: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0
    },
    last_counted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_counted_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    }
  }, {
    tableName: 'branch_stock',
    timestamps: true,
    underscored: true,
    createdAt: false,
    indexes: [
      { unique: true, fields: ['branch_id', 'product_id'] }
    ]
  });

  BranchStock.associate = (models) => {
    BranchStock.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    BranchStock.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return BranchStock;
};
