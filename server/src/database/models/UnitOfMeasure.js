const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UnitOfMeasure = sequelize.define('UnitOfMeasure', {
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
      type: DataTypes.STRING(50),
      allowNull: false
    },
    is_fractional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'units_of_measure',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  UnitOfMeasure.associate = (models) => {
    UnitOfMeasure.hasMany(models.Product, { foreignKey: 'unit_id', as: 'products' });
  };

  return UnitOfMeasure;
};
