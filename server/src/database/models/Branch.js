const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Branch = sequelize.define('Branch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
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
      defaultValue: 'Buenos Aires'
    },
    postal_code: {
      type: DataTypes.STRING(20),
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
    // Operating hours
    midday_closing_time: {
      type: DataTypes.TIME,
      defaultValue: '14:00:00'
    },
    evening_closing_time: {
      type: DataTypes.TIME,
      defaultValue: '20:00:00'
    },
    has_shift_change: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // FactuHoy/AFIP configuration
    factuhoy_point_of_sale: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    default_invoice_type: {
      type: DataTypes.CHAR(1),
      defaultValue: 'B',
      validate: {
        isIn: [['A', 'B', 'C']]
      }
    },
    // Hardware info
    device_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'PC',
      validate: {
        isIn: [['PC', 'TABLET']]
      }
    },
    printer_model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    printer_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'THERMAL',
      validate: {
        isIn: [['THERMAL', 'LASER', 'PDF']]
      }
    },
    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'America/Argentina/Buenos_Aires'
    }
  }, {
    tableName: 'branches',
    timestamps: true,
    underscored: true
  });

  Branch.associate = (models) => {
    Branch.hasMany(models.User, { foreignKey: 'primary_branch_id', as: 'users' });
    Branch.hasMany(models.CashRegister, { foreignKey: 'branch_id', as: 'cash_registers' });
    Branch.hasMany(models.BranchStock, { foreignKey: 'branch_id', as: 'stock' });
    Branch.hasMany(models.Sale, { foreignKey: 'branch_id', as: 'sales' });
    Branch.hasMany(models.RegisterSession, { foreignKey: 'branch_id', as: 'sessions' });
    Branch.hasMany(models.DailyReport, { foreignKey: 'branch_id', as: 'daily_reports' });
    Branch.hasMany(models.StockMovement, { foreignKey: 'branch_id', as: 'stock_movements' });
    Branch.hasMany(models.Alert, { foreignKey: 'branch_id', as: 'alerts' });
  };

  return Branch;
};
