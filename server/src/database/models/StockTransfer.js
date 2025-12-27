const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StockTransfer = sequelize.define('StockTransfer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transfer_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    source_branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    destination_branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']]
      }
    },
    requested_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    shipped_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    received_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    requested_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'stock_transfers',
    timestamps: true,
    underscored: true
  });

  StockTransfer.associate = (models) => {
    StockTransfer.belongsTo(models.Branch, { foreignKey: 'source_branch_id', as: 'source_branch' });
    StockTransfer.belongsTo(models.Branch, { foreignKey: 'destination_branch_id', as: 'destination_branch' });
    StockTransfer.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requester' });
    StockTransfer.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    StockTransfer.belongsTo(models.User, { foreignKey: 'shipped_by', as: 'shipper' });
    StockTransfer.belongsTo(models.User, { foreignKey: 'received_by', as: 'receiver' });
    StockTransfer.hasMany(models.StockTransferItem, { foreignKey: 'transfer_id', as: 'items' });
  };

  return StockTransfer;
};
