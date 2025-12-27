'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all sale items with their sale info
    const [saleItems] = await queryInterface.sequelize.query(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.created_at,
              s.branch_id, s.status as sale_status, s.created_by
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       ORDER BY si.created_at;`
    );

    // Get branch stock for quantity tracking
    const [branchStocks] = await queryInterface.sequelize.query(
      `SELECT id, product_id, branch_id, quantity FROM branch_stock;`
    );

    // Get branches for transfers
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code FROM branches;`
    );

    // Get users
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users;`
    );

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');

    const stockMovements = [];

    // Track running quantities per product per branch
    const quantityTracker = {};
    branchStocks.forEach(bs => {
      const key = `${bs.product_id}_${bs.branch_id}`;
      // Start with a higher initial quantity (the current is after all movements)
      quantityTracker[key] = parseFloat(bs.quantity) + 500; // Add back what would have been sold
    });

    // Get initial stock quantity helper
    const getQuantity = (productId, branchId) => {
      const key = `${productId}_${branchId}`;
      return quantityTracker[key] || 500;
    };

    // Update quantity helper
    const updateQuantity = (productId, branchId, delta) => {
      const key = `${productId}_${branchId}`;
      if (!quantityTracker[key]) quantityTracker[key] = 500;
      quantityTracker[key] += delta;
      return quantityTracker[key];
    };

    // Create INITIAL stock movements for products
    const productBranchPairs = new Set();
    branchStocks.forEach(bs => {
      const key = `${bs.product_id}_${bs.branch_id}`;
      if (productBranchPairs.has(key)) return;
      productBranchPairs.add(key);

      const initialDate = new Date();
      initialDate.setDate(initialDate.getDate() - 30); // 30 days ago

      stockMovements.push({
        id: uuidv4(),
        branch_id: bs.branch_id,
        product_id: bs.product_id,
        movement_type: 'INITIAL',
        quantity: 500,
        quantity_before: 0,
        quantity_after: 500,
        reference_type: null,
        reference_id: null,
        adjustment_reason: 'Stock inicial de apertura',
        related_branch_id: null,
        performed_by: owner?.id || null,
        notes: 'Carga inicial de inventario',
        local_id: null,
        synced_at: initialDate,
        created_at: initialDate
      });
    });

    // Create SALE movements from sale items
    saleItems.forEach((item) => {
      const quantityBefore = getQuantity(item.product_id, item.branch_id);
      const quantity = parseFloat(item.quantity);
      const quantityAfter = updateQuantity(item.product_id, item.branch_id, -quantity);

      // Only create SALE movements for completed sales
      if (item.sale_status === 'COMPLETED') {
        stockMovements.push({
          id: uuidv4(),
          branch_id: item.branch_id,
          product_id: item.product_id,
          movement_type: 'SALE',
          quantity: -quantity,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reference_type: 'Sale',
          reference_id: item.sale_id,
          adjustment_reason: null,
          related_branch_id: null,
          performed_by: item.created_by,
          notes: null,
          local_id: null,
          synced_at: new Date(item.created_at),
          created_at: new Date(item.created_at)
        });
      } else if (item.sale_status === 'VOIDED') {
        // Create a RETURN movement to reverse the voided sale
        stockMovements.push({
          id: uuidv4(),
          branch_id: item.branch_id,
          product_id: item.product_id,
          movement_type: 'RETURN',
          quantity: quantity,
          quantity_before: quantityAfter,
          quantity_after: quantityBefore, // Restore original
          reference_type: 'Sale',
          reference_id: item.sale_id,
          adjustment_reason: 'Venta anulada',
          related_branch_id: null,
          performed_by: item.created_by,
          notes: 'Devolucion por anulacion de venta',
          local_id: null,
          synced_at: new Date(item.created_at),
          created_at: new Date(item.created_at)
        });
        // Restore the quantity
        updateQuantity(item.product_id, item.branch_id, quantity);
      }
    });

    // Add some stock adjustments
    const adjustmentReasons = [
      'Conteo de inventario',
      'Producto danado',
      'Correccion de error',
      'Merma detectada',
      'Producto vencido'
    ];

    const uniqueProducts = [...new Set(branchStocks.map(bs => bs.product_id))];
    const branch1 = branches.find(b => b.code === 'BR001');
    const branch2 = branches.find(b => b.code === 'BR002');

    // Add 5-10 adjustment movements
    for (let i = 0; i < 8; i++) {
      const product = uniqueProducts[Math.floor(Math.random() * uniqueProducts.length)];
      const branch = [branch1, branch2][Math.floor(Math.random() * 2)];

      if (!branch) continue;

      const quantityBefore = getQuantity(product, branch.id);
      const isPositive = Math.random() > 0.7; // 30% positive adjustments
      const adjustAmount = (1 + Math.floor(Math.random() * 10)) * (isPositive ? 1 : -1);
      const quantityAfter = updateQuantity(product, branch.id, adjustAmount);

      const adjustmentDate = new Date();
      adjustmentDate.setDate(adjustmentDate.getDate() - Math.floor(Math.random() * 7));

      stockMovements.push({
        id: uuidv4(),
        branch_id: branch.id,
        product_id: product,
        movement_type: adjustAmount > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
        quantity: adjustAmount,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reference_type: null,
        reference_id: null,
        adjustment_reason: adjustmentReasons[Math.floor(Math.random() * adjustmentReasons.length)],
        related_branch_id: null,
        performed_by: manager?.id || owner?.id || null,
        notes: 'Ajuste de inventario',
        local_id: null,
        synced_at: adjustmentDate,
        created_at: adjustmentDate
      });
    }

    // Add a stock transfer between branches
    if (branch1 && branch2 && uniqueProducts.length > 0) {
      const transferProduct = uniqueProducts[0];
      const transferDate = new Date();
      transferDate.setDate(transferDate.getDate() - 2);
      const transferQty = 20;

      const qtyBeforeFrom = getQuantity(transferProduct, branch1.id);
      const qtyAfterFrom = updateQuantity(transferProduct, branch1.id, -transferQty);

      const qtyBeforeTo = getQuantity(transferProduct, branch2.id);
      const qtyAfterTo = updateQuantity(transferProduct, branch2.id, transferQty);

      // Transfer out from branch 1
      stockMovements.push({
        id: uuidv4(),
        branch_id: branch1.id,
        product_id: transferProduct,
        movement_type: 'TRANSFER_OUT',
        quantity: -transferQty,
        quantity_before: qtyBeforeFrom,
        quantity_after: qtyAfterFrom,
        reference_type: 'StockTransfer',
        reference_id: null,
        adjustment_reason: null,
        related_branch_id: branch2.id,
        performed_by: manager?.id || owner?.id || null,
        notes: 'Transferencia a sucursal 2',
        local_id: null,
        synced_at: transferDate,
        created_at: transferDate
      });

      // Transfer in to branch 2
      stockMovements.push({
        id: uuidv4(),
        branch_id: branch2.id,
        product_id: transferProduct,
        movement_type: 'TRANSFER_IN',
        quantity: transferQty,
        quantity_before: qtyBeforeTo,
        quantity_after: qtyAfterTo,
        reference_type: 'StockTransfer',
        reference_id: null,
        adjustment_reason: null,
        related_branch_id: branch1.id,
        performed_by: manager?.id || owner?.id || null,
        notes: 'Recepcion de sucursal 1',
        local_id: null,
        synced_at: transferDate,
        created_at: transferDate
      });
    }

    // Sort by created_at to maintain order
    stockMovements.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < stockMovements.length; i += batchSize) {
      const batch = stockMovements.slice(i, i + batchSize);
      await queryInterface.bulkInsert('stock_movements', batch);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_movements', null, {});
  }
};
