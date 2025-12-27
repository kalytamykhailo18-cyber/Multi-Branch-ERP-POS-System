'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Get role IDs
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles;`
    );

    const ownerRole = roles.find(r => r.name === 'OWNER');
    const managerRole = roles.find(r => r.name === 'MANAGER');
    const cashierRole = roles.find(r => r.name === 'CASHIER');

    // Get branch IDs
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code FROM branches;`
    );

    const branch1 = branches.find(b => b.code === 'BR001');
    const branch2 = branches.find(b => b.code === 'BR002');
    const branch3 = branches.find(b => b.code === 'BR003');
    const branch4 = branches.find(b => b.code === 'BR004');

    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      {
        id: uuidv4(),
        role_id: ownerRole.id,
        first_name: 'Juan',
        last_name: 'Owner',
        email: 'juan@petfood.com',
        password_hash: passwordHash,
        pin_code: '1234',
        phone: '+54 11 1111-1111',
        is_active: true,
        created_at: new Date(),
        
      },
      {
        id: uuidv4(),
        role_id: managerRole.id,
        first_name: 'Maria',
        last_name: 'Gonzalez',
        email: 'maria@petfood.com',
        password_hash: passwordHash,
        pin_code: '2345',
        phone: '+54 11 2222-2222',
        is_active: true,
        created_at: new Date(),
        
      },
      {
        id: uuidv4(),
        role_id: cashierRole.id,
        first_name: 'Carlos',
        last_name: 'Martinez',
        email: 'carlos@petfood.com',
        password_hash: passwordHash,
        pin_code: '3456',
        phone: '+54 11 3333-3333',
        is_active: true,
        created_at: new Date(),
        
      },
      {
        id: uuidv4(),
        role_id: cashierRole.id,
        first_name: 'Ana',
        last_name: 'Rodriguez',
        email: 'ana@petfood.com',
        password_hash: passwordHash,
        pin_code: '4567',
        phone: '+54 11 4444-4444',
        is_active: true,
        created_at: new Date(),
        
      },
      {
        id: uuidv4(),
        role_id: cashierRole.id,
        first_name: 'Luis',
        last_name: 'Fernandez',
        email: 'luis@petfood.com',
        password_hash: passwordHash,
        pin_code: '5678',
        phone: '+54 11 5555-5555',
        is_active: true,
        created_at: new Date(),
        
      },
      {
        id: uuidv4(),
        role_id: cashierRole.id,
        first_name: 'Sofia',
        last_name: 'Lopez',
        email: 'sofia@petfood.com',
        password_hash: passwordHash,
        pin_code: '6789',
        phone: '+54 11 6666-6666',
        is_active: true,
        created_at: new Date(),
        
      }
    ];

    await queryInterface.bulkInsert('users', users);

    // Create user-branch assignments
    const userBranches = [];
    const [insertedUsers] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users;`
    );

    const owner = insertedUsers.find(u => u.email === 'juan@petfood.com');
    const manager = insertedUsers.find(u => u.email === 'maria@petfood.com');
    const carlos = insertedUsers.find(u => u.email === 'carlos@petfood.com');
    const ana = insertedUsers.find(u => u.email === 'ana@petfood.com');
    const luis = insertedUsers.find(u => u.email === 'luis@petfood.com');
    const sofia = insertedUsers.find(u => u.email === 'sofia@petfood.com');

    // Owner has access to all branches
    branches.forEach(branch => {
      userBranches.push({
        id: uuidv4(),
        user_id: owner.id,
        branch_id: branch.id,
        is_primary: branch.code === 'BR001',
        created_at: new Date(),
        
      });
    });

    // Manager assigned to Branch 1
    userBranches.push({
      id: uuidv4(),
      user_id: manager.id,
      branch_id: branch1.id,
      is_primary: true,
      created_at: new Date(),
      
    });

    // Carlos assigned to Branch 1
    userBranches.push({
      id: uuidv4(),
      user_id: carlos.id,
      branch_id: branch1.id,
      is_primary: true,
      created_at: new Date(),
      
    });

    // Ana assigned to Branch 2
    userBranches.push({
      id: uuidv4(),
      user_id: ana.id,
      branch_id: branch2.id,
      is_primary: true,
      created_at: new Date(),
      
    });

    // Luis assigned to Branch 3
    userBranches.push({
      id: uuidv4(),
      user_id: luis.id,
      branch_id: branch3.id,
      is_primary: true,
      created_at: new Date(),
      
    });

    // Sofia assigned to Branch 4
    userBranches.push({
      id: uuidv4(),
      user_id: sofia.id,
      branch_id: branch4.id,
      is_primary: true,
      created_at: new Date(),
      
    });

    await queryInterface.bulkInsert('user_branches', userBranches);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_branches', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
