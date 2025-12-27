const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RegisterSession = sequelize.define('RegisterSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    register_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cash_registers',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    session_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    shift_type: {
      type: DataTypes.ENUM('MORNING', 'AFTERNOON', 'FULL_DAY'),
      allowNull: false
    },
    business_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Opening
    opened_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    opening_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    opening_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Closing (Blind Closing)
    closed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Cashier's declared amounts (blind - they don't see expected)
    declared_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    declared_card: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    declared_qr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    declared_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // System calculated amounts
    expected_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    expected_card: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    expected_qr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    expected_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Discrepancies
    discrepancy_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discrepancy_card: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discrepancy_qr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discrepancy_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    total_discrepancy: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'OPEN',
      validate: {
        isIn: [['OPEN', 'CLOSED', 'REOPENED']]
      }
    },
    closing_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Reopen tracking
    reopened_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reopened_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reopen_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Sync tracking
    local_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'register_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['register_id'] },
      { fields: ['branch_id'] },
      { fields: ['business_date'] },
      { fields: ['status'] }
    ]
  });

  RegisterSession.associate = (models) => {
    RegisterSession.belongsTo(models.CashRegister, { foreignKey: 'register_id', as: 'register' });
    RegisterSession.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    RegisterSession.belongsTo(models.User, { foreignKey: 'opened_by', as: 'opener' });
    RegisterSession.belongsTo(models.User, { foreignKey: 'closed_by', as: 'closer' });
    RegisterSession.belongsTo(models.User, { foreignKey: 'reopened_by', as: 'reopener' });
    RegisterSession.hasMany(models.Sale, { foreignKey: 'session_id', as: 'sales' });
  };

  return RegisterSession;
};
