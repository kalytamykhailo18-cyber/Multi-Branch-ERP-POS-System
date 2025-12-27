const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    legal_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    cuit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    // Contact person
    contact_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // Payment terms
    payment_terms_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    credit_limit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // For OCR import
    price_list_format: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['PDF', 'EXCEL', 'CSV', null]]
      }
    },
    default_margin_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 30
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'suppliers',
    timestamps: true,
    underscored: true
  });

  Supplier.associate = (models) => {
    Supplier.hasMany(models.SupplierProduct, { foreignKey: 'supplier_id', as: 'products' });
    Supplier.hasMany(models.PriceImportBatch, { foreignKey: 'supplier_id', as: 'import_batches' });
  };

  return Supplier;
};
