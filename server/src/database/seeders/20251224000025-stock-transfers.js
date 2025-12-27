'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM branches;`
    );

    // Get users
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email, first_name FROM users;`
    );

    // Get products
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku, name FROM products;`
    );

    if (branches.length < 2 || products.length === 0) {
      console.log('Not enough branches or products for transfers, skipping');
      return;
    }

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');
    const ana = users.find(u => u.email === 'ana@petfood.com');
    const luis = users.find(u => u.email === 'luis@petfood.com');

    const branch1 = branches.find(b => b.code === 'BR001');
    const branch2 = branches.find(b => b.code === 'BR002');
    const branch3 = branches.find(b => b.code === 'BR003');
    const branch4 = branches.find(b => b.code === 'BR004');

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const transfers = [];
    const transferItems = [];
    let transferCounter = 1;

    // Transfer 1: Completed - Branch 1 to Branch 2 (5 days ago)
    const transfer1Id = uuidv4();
    transfers.push({
      id: transfer1Id,
      transfer_number: `TR${String(transferCounter++).padStart(6, '0')}`,
      source_branch_id: branch1.id,
      destination_branch_id: branch2.id,
      status: 'RECEIVED',
      requested_by: manager?.id || owner?.id,
      approved_by: owner?.id,
      shipped_by: manager?.id,
      received_by: ana?.id,
      requested_at: fiveDaysAgo,
      approved_at: new Date(fiveDaysAgo.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      shipped_at: new Date(fiveDaysAgo.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
      received_at: new Date(fiveDaysAgo.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
      notes: 'Transferencia de reposicion de stock',
      created_at: fiveDaysAgo,
      updated_at: new Date(fiveDaysAgo.getTime() + 8 * 60 * 60 * 1000)
    });

    // Items for transfer 1
    products.slice(0, 3).forEach((product) => {
      const qty = 20 + Math.floor(Math.random() * 30);
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer1Id,
        product_id: product.id,
        requested_quantity: qty,
        shipped_quantity: qty,
        received_quantity: qty,
        notes: null,
        created_at: fiveDaysAgo
      });
    });

    // Transfer 2: In Transit - Branch 1 to Branch 3 (yesterday)
    const transfer2Id = uuidv4();
    transfers.push({
      id: transfer2Id,
      transfer_number: `TR${String(transferCounter++).padStart(6, '0')}`,
      source_branch_id: branch1.id,
      destination_branch_id: branch3.id,
      status: 'IN_TRANSIT',
      requested_by: luis?.id || manager?.id,
      approved_by: owner?.id,
      shipped_by: manager?.id,
      received_by: null,
      requested_at: twoDaysAgo,
      approved_at: new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000),
      shipped_at: yesterday,
      received_at: null,
      notes: 'Envio urgente por falta de stock',
      created_at: twoDaysAgo,
      updated_at: yesterday
    });

    // Items for transfer 2
    products.slice(2, 5).forEach((product) => {
      const qty = 15 + Math.floor(Math.random() * 25);
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer2Id,
        product_id: product.id,
        requested_quantity: qty,
        shipped_quantity: qty,
        received_quantity: null,
        notes: null,
        created_at: twoDaysAgo
      });
    });

    // Transfer 3: Approved (waiting shipment) - Branch 2 to Branch 4 (today)
    const transfer3Id = uuidv4();
    transfers.push({
      id: transfer3Id,
      transfer_number: `TR${String(transferCounter++).padStart(6, '0')}`,
      source_branch_id: branch2.id,
      destination_branch_id: branch4.id,
      status: 'APPROVED',
      requested_by: users.find(u => u.email === 'sofia@petfood.com')?.id || manager?.id,
      approved_by: owner?.id,
      shipped_by: null,
      received_by: null,
      requested_at: yesterday,
      approved_at: now,
      shipped_at: null,
      received_at: null,
      notes: 'Solicitud de productos de alta rotacion',
      created_at: yesterday,
      updated_at: now
    });

    // Items for transfer 3
    products.slice(0, 4).forEach((product) => {
      const qty = 10 + Math.floor(Math.random() * 20);
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer3Id,
        product_id: product.id,
        requested_quantity: qty,
        shipped_quantity: null,
        received_quantity: null,
        notes: null,
        created_at: yesterday
      });
    });

    // Transfer 4: Pending approval - Branch 3 to Branch 1 (today)
    const transfer4Id = uuidv4();
    transfers.push({
      id: transfer4Id,
      transfer_number: `TR${String(transferCounter++).padStart(6, '0')}`,
      source_branch_id: branch3.id,
      destination_branch_id: branch1.id,
      status: 'PENDING',
      requested_by: luis?.id || manager?.id,
      approved_by: null,
      shipped_by: null,
      received_by: null,
      requested_at: now,
      approved_at: null,
      shipped_at: null,
      received_at: null,
      notes: 'Devolucion de exceso de stock',
      created_at: now,
      updated_at: now
    });

    // Items for transfer 4
    products.slice(4, 7).forEach((product) => {
      const qty = 5 + Math.floor(Math.random() * 15);
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer4Id,
        product_id: product.id,
        requested_quantity: qty,
        shipped_quantity: null,
        received_quantity: null,
        notes: null,
        created_at: now
      });
    });

    // Transfer 5: Cancelled - Branch 4 to Branch 2 (3 days ago)
    const transfer5Id = uuidv4();
    transfers.push({
      id: transfer5Id,
      transfer_number: `TR${String(transferCounter++).padStart(6, '0')}`,
      source_branch_id: branch4.id,
      destination_branch_id: branch2.id,
      status: 'CANCELLED',
      requested_by: ana?.id || manager?.id,
      approved_by: null,
      shipped_by: null,
      received_by: null,
      requested_at: threeDaysAgo,
      approved_at: null,
      shipped_at: null,
      received_at: null,
      notes: 'Cancelado - ya no se requiere el stock',
      created_at: threeDaysAgo,
      updated_at: twoDaysAgo
    });

    // Items for cancelled transfer
    products.slice(1, 3).forEach((product) => {
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer5Id,
        product_id: product.id,
        requested_quantity: 25,
        shipped_quantity: null,
        received_quantity: null,
        notes: 'Transferencia cancelada',
        created_at: threeDaysAgo
      });
    });

    // Transfer 6: Received with discrepancy (partial receipt)
    const transfer6Id = uuidv4();
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    transfers.push({
      id: transfer6Id,
      transfer_number: `TR${String(transferCounter++).padStart(6, '0')}`,
      source_branch_id: branch1.id,
      destination_branch_id: branch4.id,
      status: 'RECEIVED',
      requested_by: users.find(u => u.email === 'sofia@petfood.com')?.id || manager?.id,
      approved_by: owner?.id,
      shipped_by: manager?.id,
      received_by: users.find(u => u.email === 'sofia@petfood.com')?.id,
      requested_at: sixDaysAgo,
      approved_at: new Date(sixDaysAgo.getTime() + 1 * 60 * 60 * 1000),
      shipped_at: new Date(sixDaysAgo.getTime() + 3 * 60 * 60 * 1000),
      received_at: fiveDaysAgo,
      notes: 'Recibido con diferencia - 2 unidades faltantes de producto DF001',
      created_at: sixDaysAgo,
      updated_at: fiveDaysAgo
    });

    // Items for transfer 6 with discrepancy
    const product1 = products.find(p => p.sku === 'DF001');
    if (product1) {
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer6Id,
        product_id: product1.id,
        requested_quantity: 30,
        shipped_quantity: 30,
        received_quantity: 28, // Discrepancy!
        notes: 'Recibido con faltante de 2 unidades',
        created_at: sixDaysAgo
      });
    }
    const product2 = products.find(p => p.sku === 'CF001');
    if (product2) {
      transferItems.push({
        id: uuidv4(),
        transfer_id: transfer6Id,
        product_id: product2.id,
        requested_quantity: 20,
        shipped_quantity: 20,
        received_quantity: 20,
        notes: null,
        created_at: sixDaysAgo
      });
    }

    await queryInterface.bulkInsert('stock_transfers', transfers);
    await queryInterface.bulkInsert('stock_transfer_items', transferItems);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_transfer_items', null, {});
    await queryInterface.bulkDelete('stock_transfers', null, {});
  }
};
