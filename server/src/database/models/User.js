const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employee_code: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    primary_branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    // Authentication
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    pin_code: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Preferences
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'es'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.pin_code;
    return values;
  };

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    User.belongsTo(models.Branch, { foreignKey: 'primary_branch_id', as: 'primary_branch' });
    User.hasMany(models.UserSession, { foreignKey: 'user_id', as: 'sessions' });
    User.hasMany(models.Sale, { foreignKey: 'created_by', as: 'sales' });
    User.hasMany(models.RegisterSession, { foreignKey: 'opened_by', as: 'opened_sessions' });
    User.hasMany(models.RegisterSession, { foreignKey: 'closed_by', as: 'closed_sessions' });
    User.hasMany(models.StockMovement, { foreignKey: 'performed_by', as: 'stock_movements' });
    User.belongsToMany(models.Branch, { through: 'user_branches', foreignKey: 'user_id', as: 'branches' });
  };

  return User;
};
