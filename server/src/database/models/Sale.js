const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Identifiers
    sale_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    ticket_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // Location
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    register_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cash_registers',
        key: 'id'
      }
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'register_sessions',
        key: 'id'
      }
    },
    // Customer (optional for quick sales)
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    // Seller (for wholesale commission)
    seller_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Amounts
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    // Loyalty
    points_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    points_redeemed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    points_redemption_value: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Customer credit
    credit_used: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    change_as_credit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'COMPLETED',
      validate: {
        isIn: [['PENDING', 'COMPLETED', 'VOIDED', 'RETURNED']]
      }
    },
    // Voiding
    voided_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    voided_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    void_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    void_approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Created by
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Sync tracking (for offline POS)
    local_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    local_created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sync_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'SYNCED',
      validate: {
        isIn: [['PENDING', 'SYNCED', 'CONFLICT']]
      }
    }
  }, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['session_id'] },
      { fields: ['customer_id'] },
      { fields: ['created_at'] },
      { fields: ['status'] },
      { fields: ['local_id'] }
    ]
  });

  Sale.associate = (models) => {
    Sale.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Sale.belongsTo(models.CashRegister, { foreignKey: 'register_id', as: 'register' });
    Sale.belongsTo(models.RegisterSession, { foreignKey: 'session_id', as: 'session' });
    Sale.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    Sale.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
    Sale.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Sale.belongsTo(models.User, { foreignKey: 'voided_by', as: 'voider' });
    Sale.belongsTo(models.User, { foreignKey: 'void_approved_by', as: 'void_approver' });
    Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id', as: 'items' });
    Sale.hasMany(models.SalePayment, { foreignKey: 'sale_id', as: 'payments' });
    Sale.hasOne(models.Invoice, { foreignKey: 'sale_id', as: 'invoice' });
    Sale.hasMany(models.LoyaltyTransaction, { foreignKey: 'sale_id', as: 'loyalty_transactions' });
    Sale.hasMany(models.CreditTransaction, { foreignKey: 'sale_id', as: 'credit_transactions' });
  };

  return Sale;
};
