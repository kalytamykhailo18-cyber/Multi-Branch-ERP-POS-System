const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_code: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    // Personal info
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    company_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    // Tax info (for invoicing)
    document_type: {
      type: DataTypes.STRING(10),
      defaultValue: 'DNI',
      validate: {
        isIn: [['DNI', 'CUIT', 'CUIL', 'PASSPORT', 'OTHER']]
      }
    },
    document_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    tax_condition: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['CONSUMIDOR_FINAL', 'MONOTRIBUTO', 'RESP_INSCRIPTO', 'EXENTO', null]]
      }
    },
    // Contact
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Address (for delivery/shipping)
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    neighborhood: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // Loyalty
    loyalty_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    loyalty_tier: {
      type: DataTypes.STRING(20),
      defaultValue: 'STANDARD',
      validate: {
        isIn: [['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']]
      }
    },
    qr_code: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true
    },
    // Credit (change as credit)
    credit_balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Wholesale
    is_wholesale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wholesale_discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    assigned_vendor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['document_number'] },
      { fields: ['qr_code'] },
      { fields: ['phone'] }
    ]
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.User, { foreignKey: 'assigned_vendor_id', as: 'assigned_vendor' });
    Customer.hasMany(models.Sale, { foreignKey: 'customer_id', as: 'sales' });
    Customer.hasMany(models.LoyaltyTransaction, { foreignKey: 'customer_id', as: 'loyalty_transactions' });
    Customer.hasMany(models.CreditTransaction, { foreignKey: 'customer_id', as: 'credit_transactions' });
  };

  return Customer;
};
