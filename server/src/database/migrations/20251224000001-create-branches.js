'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {
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
        type: Sequelize.STRING(100),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      neighborhood: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        defaultValue: 'Buenos Aires'
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      midday_closing_time: {
        type: Sequelize.TIME,
        defaultValue: '14:00:00'
      },
      evening_closing_time: {
        type: Sequelize.TIME,
        defaultValue: '20:00:00'
      },
      has_shift_change: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      factuhoy_point_of_sale: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      default_invoice_type: {
        type: Sequelize.CHAR(1),
        defaultValue: 'B'
      },
      device_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'PC'
      },
      printer_model: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      printer_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'THERMAL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'America/Argentina/Buenos_Aires'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('branches');
  }
};
