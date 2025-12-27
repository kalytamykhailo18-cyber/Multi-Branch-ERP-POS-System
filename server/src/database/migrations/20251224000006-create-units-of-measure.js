'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('units_of_measure', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      is_fractional: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('units_of_measure');
  }
};
