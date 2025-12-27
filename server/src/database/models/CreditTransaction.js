const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreditTransaction = sequelize.define('CreditTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['CREDIT', 'DEBIT', 'ADJUST']]
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    balance_after: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'credit_transactions',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  CreditTransaction.associate = (models) => {
    CreditTransaction.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    CreditTransaction.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });
    CreditTransaction.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return CreditTransaction;
};
