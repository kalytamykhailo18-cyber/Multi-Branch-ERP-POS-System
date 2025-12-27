'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('branches', [
      {
        id: uuidv4(),
        code: 'BR001',
        name: 'Sucursal La Tablada',
        address: 'Av. Crovara 1234',
        neighborhood: 'La Tablada',
        city: 'Buenos Aires',
        phone: '+54 11 1234-5678',
        midday_closing_time: '14:00:00',
        evening_closing_time: '20:00:00',
        has_shift_change: true,
        factuhoy_point_of_sale: 1,
        default_invoice_type: 'B',
        device_type: 'PC',
        printer_type: 'THERMAL',
        is_active: true,
        timezone: 'America/Argentina/Buenos_Aires',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'BR002',
        name: 'Sucursal San Justo',
        address: 'Av. San Justo 5678',
        neighborhood: 'San Justo',
        city: 'Buenos Aires',
        phone: '+54 11 2345-6789',
        midday_closing_time: '14:30:00',
        evening_closing_time: '20:30:00',
        has_shift_change: true,
        factuhoy_point_of_sale: 1,
        default_invoice_type: 'B',
        device_type: 'PC',
        printer_type: 'THERMAL',
        is_active: true,
        timezone: 'America/Argentina/Buenos_Aires',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'BR003',
        name: 'Sucursal Villa del Parque',
        address: 'Av. Nazca 3456',
        neighborhood: 'Villa del Parque',
        city: 'Buenos Aires',
        phone: '+54 11 3456-7890',
        midday_closing_time: '14:30:00',
        evening_closing_time: '20:30:00',
        has_shift_change: true,
        factuhoy_point_of_sale: 2,
        default_invoice_type: 'B',
        device_type: 'PC',
        printer_type: 'THERMAL',
        is_active: true,
        timezone: 'America/Argentina/Buenos_Aires',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'BR004',
        name: 'Sucursal Central',
        address: 'Av. Rivadavia 9012',
        neighborhood: 'Caballito',
        city: 'Buenos Aires',
        phone: '+54 11 4567-8901',
        midday_closing_time: '14:30:00',
        evening_closing_time: '20:30:00',
        has_shift_change: true,
        factuhoy_point_of_sale: 2,
        default_invoice_type: 'B',
        device_type: 'TABLET',
        printer_type: 'THERMAL',
        is_active: true,
        timezone: 'America/Argentina/Buenos_Aires',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('branches', null, {});
  }
};
