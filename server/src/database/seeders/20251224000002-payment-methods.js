'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('payment_methods', [
      {
        id: uuidv4(),
        code: 'CASH',
        name: 'Efectivo',
        requires_reference: false,
        is_active: true,
        sort_order: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'CARD',
        name: 'Tarjeta',
        requires_reference: false,
        is_active: true,
        sort_order: 2,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'QR',
        name: 'QR / MercadoPago',
        requires_reference: false,
        is_active: true,
        sort_order: 3,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'TRANSFER',
        name: 'Transferencia',
        requires_reference: true,
        is_active: true,
        sort_order: 4,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('payment_methods', null, {});
  }
};
