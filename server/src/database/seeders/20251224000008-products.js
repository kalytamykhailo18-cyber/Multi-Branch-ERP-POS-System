'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get category IDs
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories;`
    );

    // Get unit IDs
    const [units] = await queryInterface.sequelize.query(
      `SELECT id, code FROM units_of_measure;`
    );

    const dogCategory = categories.find(c => c.name.includes('Perro') || c.name.includes('Dog'));
    const catCategory = categories.find(c => c.name.includes('Gato') || c.name.includes('Cat'));
    const kgUnit = units.find(u => u.code === 'KG');
    const unitUnit = units.find(u => u.code === 'UN');

    const products = [
      // Dog Food
      {
        id: uuidv4(),
        sku: 'DF001',
        barcode: '7790001234567',
        name: 'Alimento Perro Adulto Premium 15kg',
        short_name: 'Alim Perro Adult 15kg',
        description: 'Alimento balanceado para perros adultos, alta calidad',
        category_id: dogCategory?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 25000.00,
        selling_price: 35000.00,
        margin_percent: 40.00,
        is_weighable: true,
        shrinkage_percent: 2.00,
        minimum_stock: 100,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'DF002',
        barcode: '7790001234574',
        name: 'Alimento Perro Cachorro 10kg',
        description: 'Alimento especial para cachorros',
        category_id: dogCategory?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 22000.00,
        selling_price: 30000.00,
        margin_percent: 36.36,
        is_weighable: true,
        shrinkage_percent: 2.50,
        minimum_stock: 80,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'DF003',
        barcode: '7790001234581',
        name: 'Alimento Perro Senior 12kg',
        description: 'Alimento para perros mayores',
        category_id: dogCategory?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 24000.00,
        selling_price: 33000.00,
        margin_percent: 37.50,
        is_weighable: true,
        shrinkage_percent: 1.80,
        minimum_stock: 60,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Cat Food
      {
        id: uuidv4(),
        sku: 'CF001',
        barcode: '7790002234567',
        name: 'Alimento Gato Adulto 10kg',
        description: 'Alimento balanceado para gatos adultos',
        category_id: catCategory?.id || categories[1]?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 28000.00,
        selling_price: 38000.00,
        margin_percent: 35.71,
        is_weighable: true,
        shrinkage_percent: 1.50,
        minimum_stock: 70,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'CF002',
        barcode: '7790002234574',
        name: 'Alimento Gato Gatitos 7kg',
        description: 'Alimento para gatitos',
        category_id: catCategory?.id || categories[1]?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 26000.00,
        selling_price: 36000.00,
        margin_percent: 38.46,
        is_weighable: true,
        shrinkage_percent: 1.80,
        minimum_stock: 50,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Accessories
      {
        id: uuidv4(),
        sku: 'ACC001',
        barcode: '7790003234567',
        name: 'Collar para Perro Mediano',
        description: 'Collar ajustable nylon',
        category_id: categories[2]?.id || categories[0].id,
        unit_id: unitUnit?.id || units[1]?.id || units[0].id,
        cost_price: 2500.00,
        selling_price: 4000.00,
        margin_percent: 60.00,
        is_weighable: false,
        shrinkage_percent: 0.00,
        minimum_stock: 20,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'ACC002',
        barcode: '7790003234574',
        name: 'Comedero Acero Inoxidable',
        description: 'Comedero antideslizante',
        category_id: categories[2]?.id || categories[0].id,
        unit_id: unitUnit?.id || units[1]?.id || units[0].id,
        cost_price: 3000.00,
        selling_price: 5000.00,
        margin_percent: 66.67,
        is_weighable: false,
        shrinkage_percent: 0.00,
        minimum_stock: 15,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'ACC003',
        barcode: '7790003234581',
        name: 'Juguete Pelota con Sonido',
        description: 'Pelota de goma para perros',
        category_id: categories[2]?.id || categories[0].id,
        unit_id: unitUnit?.id || units[1]?.id || units[0].id,
        cost_price: 1500.00,
        selling_price: 2800.00,
        margin_percent: 86.67,
        is_weighable: false,
        shrinkage_percent: 0.00,
        minimum_stock: 30,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Treats
      {
        id: uuidv4(),
        sku: 'TRT001',
        barcode: '7790004234567',
        name: 'Snacks para Perro Pollo 500g',
        description: 'Premios naturales sabor pollo',
        category_id: categories[3]?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 3500.00,
        selling_price: 5500.00,
        margin_percent: 57.14,
        is_weighable: true,
        shrinkage_percent: 1.00,
        minimum_stock: 40,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'TRT002',
        barcode: '7790004234574',
        name: 'Golosinas para Gato Salmon 300g',
        description: 'Premios para gatos sabor salmon',
        category_id: categories[3]?.id || categories[0].id,
        unit_id: kgUnit?.id || units[0].id,
        cost_price: 4000.00,
        selling_price: 6500.00,
        margin_percent: 62.50,
        is_weighable: true,
        shrinkage_percent: 0.80,
        minimum_stock: 35,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
  }
};
