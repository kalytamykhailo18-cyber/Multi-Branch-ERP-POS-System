const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InvoiceType = sequelize.define('InvoiceType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    requires_customer_cuit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'invoice_types',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  InvoiceType.associate = (models) => {
    InvoiceType.hasMany(models.Invoice, { foreignKey: 'invoice_type_id', as: 'invoices' });
  };

  return InvoiceType;
};
