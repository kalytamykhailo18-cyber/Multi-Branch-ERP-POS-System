const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PriceImportItem = sequelize.define('PriceImportItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'price_import_batches',
        key: 'id'
      }
    },
    // Extracted data
    row_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    extracted_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    extracted_description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    extracted_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Matching
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    match_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['EXACT_CODE', 'FUZZY_NAME', 'MANUAL', 'UNMATCHED', null]]
      }
    },
    match_confidence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    // Price calculation
    current_cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    new_cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    current_selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    new_selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    price_change_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'SKIPPED']]
      }
    },
    rejection_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'price_import_items',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  PriceImportItem.associate = (models) => {
    PriceImportItem.belongsTo(models.PriceImportBatch, { foreignKey: 'batch_id', as: 'batch' });
    PriceImportItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return PriceImportItem;
};
