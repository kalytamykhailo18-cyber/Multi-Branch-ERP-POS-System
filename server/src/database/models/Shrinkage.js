const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Shrinkage = sequelize.define('Shrinkage', {
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
      comment: 'Quantity lost to shrinkage'
    },
    cost_loss: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Monetary value of shrinkage (quantity * cost_price)'
    },
    reason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isIn: [['POWDER_LOSS', 'PORTIONING', 'SCALE_ERROR', 'SPILLAGE', 'OTHER']]
      },
      comment: 'Reason for shrinkage'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about shrinkage'
    },
    reported_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'shrinkage',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['product_id'] },
      { fields: ['reason'] },
      { fields: ['created_at'] }
    ]
  });

  Shrinkage.associate = (models) => {
    Shrinkage.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Shrinkage.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    Shrinkage.belongsTo(models.User, { foreignKey: 'reported_by', as: 'reported_by_user' });
  };

  return Shrinkage;
};
