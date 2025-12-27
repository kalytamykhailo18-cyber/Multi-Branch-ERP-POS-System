const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreditNote = sequelize.define('CreditNote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    original_invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    credit_note_type: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      validate: {
        isIn: [['A', 'B', 'C']]
      }
    },
    point_of_sale: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    credit_note_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cae: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    cae_expiration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
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
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'ISSUED', 'FAILED']]
      }
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'credit_notes',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  CreditNote.associate = (models) => {
    CreditNote.belongsTo(models.Invoice, { foreignKey: 'original_invoice_id', as: 'original_invoice' });
  };

  return CreditNote;
};
