const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PriceImportBatch = sequelize.define('PriceImportBatch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['PDF', 'XLSX', 'XLS', 'CSV']]
      }
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    file_size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // OCR processing
    ocr_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ocr_engine: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    extraction_confidence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'PROCESSING', 'PREVIEW', 'APPLIED', 'FAILED', 'CANCELLED']]
      }
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Stats
    total_rows_extracted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rows_matched: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rows_unmatched: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rows_applied: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Pricing rules applied
    margin_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['FIXED', 'PERCENT', 'ROUNDING', null]]
      }
    },
    margin_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    rounding_rule: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['NONE', 'ROUND_5', 'ROUND_10', 'ROUND_100', null]]
      }
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    applied_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'price_import_batches',
    timestamps: true,
    underscored: true
  });

  PriceImportBatch.associate = (models) => {
    PriceImportBatch.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    PriceImportBatch.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    PriceImportBatch.belongsTo(models.User, { foreignKey: 'applied_by', as: 'applier' });
    PriceImportBatch.hasMany(models.PriceImportItem, { foreignKey: 'batch_id', as: 'items' });
  };

  return PriceImportBatch;
};
