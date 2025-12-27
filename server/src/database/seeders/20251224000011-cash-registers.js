'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM branches;`
    );

    const registers = [];

    // Create 2 cash registers per branch (as per requirements)
    branches.forEach((branch, index) => {
      registers.push({
        id: uuidv4(),
        branch_id: branch.id,
        register_number: 1,
        name: `Caja 1 - ${branch.name}`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      registers.push({
        id: uuidv4(),
        branch_id: branch.id,
        register_number: 2,
        name: `Caja 2 - ${branch.name}`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    await queryInterface.bulkInsert('cash_registers', registers);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cash_registers', null, {});
  }
};
