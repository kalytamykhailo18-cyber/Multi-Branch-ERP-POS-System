'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('invoice_types', [
      {
        id: uuidv4(),
        code: 'A',
        name: 'Factura A',
        description: 'Para Responsables Inscriptos',
        requires_customer_cuit: true,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'B',
        name: 'Factura B',
        description: 'Para Consumidores Finales y Exentos',
        requires_customer_cuit: false,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'C',
        name: 'Factura C',
        description: 'Para Monotributistas',
        requires_customer_cuit: false,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('invoice_types', null, {});
  }
};
