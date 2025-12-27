const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    // AFIP/FactuHoy data
    invoice_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoice_types',
        key: 'id'
      }
    },
    point_of_sale: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    invoice_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // CAE (Codigo de Autorizacion Electronico)
    cae: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    cae_expiration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // Customer data (snapshot at time of invoice)
    customer_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    customer_document_type: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    customer_document_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    customer_tax_condition: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    customer_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Amounts
    net_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    // FactuHoy response
    factuhoy_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    factuhoy_response: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    pdf_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'ISSUED', 'FAILED', 'CANCELLED']]
      }
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_retry_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['sale_id'] },
      { fields: ['status'] },
      { fields: ['issued_at'] },
      { unique: true, fields: ['point_of_sale', 'invoice_number', 'invoice_type_id'] }
    ]
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    Invoice.belongsTo(models.InvoiceType, { foreignKey: 'invoice_type_id', as: 'invoice_type' });
    Invoice.hasMany(models.CreditNote, { foreignKey: 'original_invoice_id', as: 'credit_notes' });
  };

  return Invoice;
};
