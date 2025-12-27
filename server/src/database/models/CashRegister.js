const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashRegister = sequelize.define('CashRegister', {
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
    register_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'cash_registers',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['branch_id', 'register_number'] }
    ]
  });

  CashRegister.associate = (models) => {
    CashRegister.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    CashRegister.hasMany(models.RegisterSession, { foreignKey: 'register_id', as: 'sessions' });
    CashRegister.hasMany(models.Sale, { foreignKey: 'register_id', as: 'sales' });
  };

  return CashRegister;
};
