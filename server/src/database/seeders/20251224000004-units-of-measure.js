'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('units_of_measure', [
      {
        id: uuidv4(),
        code: 'UN',
        name: 'Unidad',
        is_fractional: false,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'KG',
        name: 'Kilogramo',
        is_fractional: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'GR',
        name: 'Gramo',
        is_fractional: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'LT',
        name: 'Litro',
        is_fractional: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'ML',
        name: 'Mililitro',
        is_fractional: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'MT',
        name: 'Metro',
        is_fractional: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'BL',
        name: 'Bolsa',
        is_fractional: false,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'CJ',
        name: 'Caja',
        is_fractional: false,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('units_of_measure', null, {});
  }
};
