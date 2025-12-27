'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM branches;`
    );

    // Get cash registers
    const [registers] = await queryInterface.sequelize.query(
      `SELECT id, branch_id, register_number FROM cash_registers;`
    );

    // Get users
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users;`
    );

    // Get some sales for audit entries
    const [sales] = await queryInterface.sequelize.query(
      `SELECT id, sale_number, branch_id FROM sales LIMIT 10;`
    );

    if (branches.length === 0 || users.length === 0) {
      console.log('No branches or users found, skipping sync_audit seeder');
      return;
    }

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');
    const carlos = users.find(u => u.email === 'carlos@petfood.com');

    const syncQueueItems = [];
    const auditLogItems = [];
    const now = new Date();

    // Create sync queue items (simulating offline sales that were synced)
    const branch1 = branches.find(b => b.code === 'BR001');
    const branch1Registers = registers.filter(r => r.branch_id === branch1?.id);

    if (branch1 && branch1Registers.length > 0) {
      // Synced items
      for (let i = 0; i < 5; i++) {
        const createdDate = new Date(now);
        createdDate.setHours(createdDate.getHours() - (2 + i));
        const syncedDate = new Date(createdDate);
        syncedDate.setMinutes(syncedDate.getMinutes() + 5);

        syncQueueItems.push({
          id: uuidv4(),
          branch_id: branch1.id,
          register_id: branch1Registers[0].id,
          entity_type: 'SALE',
          entity_local_id: `LOCAL-${Date.now()}-${i}`,
          operation: 'CREATE',
          payload: JSON.stringify({
            sale_number: `OFFLINE-${1000 + i}`,
            total_amount: 1500 + i * 500,
            items_count: 2 + i
          }),
          status: 'SYNCED',
          error_message: null,
          retry_count: 0,
          conflict_type: null,
          conflict_resolution: null,
          conflict_resolved_by: null,
          local_created_at: createdDate,
          synced_at: syncedDate,
          created_at: createdDate,
          updated_at: syncedDate
        });
      }

      // Pending item
      const pendingDate = new Date(now);
      pendingDate.setMinutes(pendingDate.getMinutes() - 10);

      syncQueueItems.push({
        id: uuidv4(),
        branch_id: branch1.id,
        register_id: branch1Registers[0].id,
        entity_type: 'SALE',
        entity_local_id: `LOCAL-${Date.now()}-PENDING`,
        operation: 'CREATE',
        payload: JSON.stringify({
          sale_number: 'OFFLINE-PENDING',
          total_amount: 2500,
          items_count: 3
        }),
        status: 'PENDING',
        error_message: null,
        retry_count: 0,
        conflict_type: null,
        conflict_resolution: null,
        conflict_resolved_by: null,
        local_created_at: pendingDate,
        synced_at: null,
        created_at: pendingDate,
        updated_at: pendingDate
      });

      // Failed item with conflict
      const failedDate = new Date(now);
      failedDate.setHours(failedDate.getHours() - 1);

      syncQueueItems.push({
        id: uuidv4(),
        branch_id: branch1.id,
        register_id: branch1Registers[0].id,
        entity_type: 'STOCK_ADJUSTMENT',
        entity_local_id: `LOCAL-STOCK-${Date.now()}`,
        operation: 'UPDATE',
        payload: JSON.stringify({
          product_id: 'some-product-id',
          quantity_change: -10,
          reason: 'Sale adjustment'
        }),
        status: 'CONFLICT',
        error_message: 'Stock quantity conflict: Server has 5 units, local expected 15 units',
        retry_count: 3,
        conflict_type: 'QUANTITY_MISMATCH',
        conflict_resolution: null,
        conflict_resolved_by: null,
        local_created_at: failedDate,
        synced_at: null,
        created_at: failedDate,
        updated_at: now
      });
    }

    // Create audit log entries
    // Login events
    users.slice(0, 4).forEach((user, idx) => {
      const loginDate = new Date(now);
      loginDate.setHours(loginDate.getHours() - idx);

      auditLogItems.push({
        id: uuidv4(),
        user_id: user.id,
        user_email: user.email,
        branch_id: branches[idx % branches.length].id,
        ip_address: `192.168.1.${100 + idx}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        action: 'LOGIN',
        entity_type: 'USER_SESSION',
        entity_id: null,
        old_values: null,
        new_values: JSON.stringify({ login_time: loginDate.toISOString() }),
        description: `User ${user.email} logged in`,
        created_at: loginDate
      });
    });

    // Sale events
    sales.slice(0, 5).forEach((sale, idx) => {
      const saleDate = new Date(now);
      saleDate.setHours(saleDate.getHours() - (1 + idx));

      auditLogItems.push({
        id: uuidv4(),
        user_id: carlos?.id || users[0].id,
        user_email: carlos?.email || users[0].email,
        branch_id: sale.branch_id,
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        action: 'CREATE',
        entity_type: 'SALE',
        entity_id: sale.id,
        old_values: null,
        new_values: JSON.stringify({ sale_number: sale.sale_number }),
        description: `Sale ${sale.sale_number} created`,
        created_at: saleDate
      });
    });

    // Price change event
    const priceChangeDate = new Date(now);
    priceChangeDate.setDate(priceChangeDate.getDate() - 1);

    auditLogItems.push({
      id: uuidv4(),
      user_id: owner?.id || users[0].id,
      user_email: owner?.email || users[0].email,
      branch_id: null,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      action: 'BULK_UPDATE',
      entity_type: 'PRODUCT_PRICE',
      entity_id: null,
      old_values: null,
      new_values: JSON.stringify({ batch_id: 'import-batch-123', products_updated: 15 }),
      description: 'Bulk price update from supplier import',
      created_at: priceChangeDate
    });

    // Stock adjustment event
    auditLogItems.push({
      id: uuidv4(),
      user_id: manager?.id || users[0].id,
      user_email: manager?.email || users[0].email,
      branch_id: branches[0].id,
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      action: 'ADJUST',
      entity_type: 'STOCK',
      entity_id: null,
      old_values: JSON.stringify({ quantity: 100 }),
      new_values: JSON.stringify({ quantity: 95, reason: 'Physical count adjustment' }),
      description: 'Stock adjustment after physical count',
      created_at: priceChangeDate
    });

    if (syncQueueItems.length > 0) {
      await queryInterface.bulkInsert('sync_queue', syncQueueItems);
    }

    if (auditLogItems.length > 0) {
      await queryInterface.bulkInsert('audit_log', auditLogItems);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('audit_log', null, {});
    await queryInterface.bulkDelete('sync_queue', null, {});
  }
};
