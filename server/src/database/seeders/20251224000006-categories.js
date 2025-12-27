'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const dogFoodId = uuidv4();
    const catFoodId = uuidv4();
    const accessoriesId = uuidv4();
    const hygieneId = uuidv4();

    await queryInterface.bulkInsert('categories', [
      // Main categories
      {
        id: dogFoodId,
        parent_id: null,
        name: 'Alimento para Perros',
        description: 'Alimentos y snacks para perros',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: catFoodId,
        parent_id: null,
        name: 'Alimento para Gatos',
        description: 'Alimentos y snacks para gatos',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: accessoriesId,
        parent_id: null,
        name: 'Accesorios',
        description: 'Accesorios y juguetes para mascotas',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: hygieneId,
        parent_id: null,
        name: 'Higiene y Cuidado',
        description: 'Productos de higiene y cuidado',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Dog food subcategories
      {
        id: uuidv4(),
        parent_id: dogFoodId,
        name: 'Alimento Balanceado Perros',
        description: 'Alimento balanceado seco para perros',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        parent_id: dogFoodId,
        name: 'Alimento Húmedo Perros',
        description: 'Latas y sobres para perros',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        parent_id: dogFoodId,
        name: 'Snacks Perros',
        description: 'Premios y snacks para perros',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Cat food subcategories
      {
        id: uuidv4(),
        parent_id: catFoodId,
        name: 'Alimento Balanceado Gatos',
        description: 'Alimento balanceado seco para gatos',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        parent_id: catFoodId,
        name: 'Alimento Húmedo Gatos',
        description: 'Latas y sobres para gatos',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Accessories subcategories
      {
        id: uuidv4(),
        parent_id: accessoriesId,
        name: 'Juguetes',
        description: 'Juguetes para mascotas',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        parent_id: accessoriesId,
        name: 'Camas y Cuchas',
        description: 'Camas y cuchas para mascotas',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        parent_id: accessoriesId,
        name: 'Correas y Collares',
        description: 'Correas y collares para mascotas',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Hygiene subcategories
      {
        id: uuidv4(),
        parent_id: hygieneId,
        name: 'Shampoo y Acondicionador',
        description: 'Productos de baño para mascotas',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        parent_id: hygieneId,
        name: 'Antiparasitarios',
        description: 'Productos antiparasitarios',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
