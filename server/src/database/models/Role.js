const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Permissions
    can_void_sale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_give_discount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_view_all_branches: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_close_register: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    can_reopen_closing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_adjust_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_import_prices: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_manage_users: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_view_reports: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_view_financials: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_manage_suppliers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_manage_products: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_issue_invoice_a: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    max_discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });
  };

  return Role;
};
