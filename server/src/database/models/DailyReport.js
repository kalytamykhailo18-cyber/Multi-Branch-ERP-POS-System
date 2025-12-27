const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DailyReport = sequelize.define('DailyReport', {
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
    business_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Totals by payment method
    total_cash: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_card: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_qr: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_credit_used: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_points_redeemed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Sales summary
    total_gross_sales: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_discounts: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_net_sales: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Transaction counts
    transaction_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    voided_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    voided_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    return_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    return_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Discrepancies
    total_discrepancy: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Status
    is_finalized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    finalized_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    finalized_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'daily_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['branch_id', 'business_date'] }
    ]
  });

  DailyReport.associate = (models) => {
    DailyReport.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    DailyReport.belongsTo(models.User, { foreignKey: 'finalized_by', as: 'finalizer' });
  };

  return DailyReport;
};
