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
      `SELECT id, email, first_name, last_name FROM users;`
    );

    // Get some voided sales
    const [voidedSales] = await queryInterface.sequelize.query(
      `SELECT id, sale_number, voided_by, void_reason, branch_id, total_amount
       FROM sales WHERE status = 'VOIDED' LIMIT 5;`
    );

    // Get sessions with discrepancies
    const [sessionsWithDiscrepancy] = await queryInterface.sequelize.query(
      `SELECT id, session_number, branch_id, opened_by, total_discrepancy
       FROM register_sessions
       WHERE total_discrepancy IS NOT NULL AND total_discrepancy != 0
       LIMIT 5;`
    );

    // Get products with low stock
    const [lowStockProducts] = await queryInterface.sequelize.query(
      `SELECT bs.id, bs.product_id, bs.branch_id, bs.quantity, p.name, p.minimum_stock
       FROM branch_stock bs
       JOIN products p ON bs.product_id = p.id
       WHERE bs.quantity < p.minimum_stock
       LIMIT 5;`
    );

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');
    const branch1 = branches.find(b => b.code === 'BR001');
    const branch2 = branches.find(b => b.code === 'BR002');

    const alerts = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // VOIDED_SALE alerts
    voidedSales.forEach((sale, idx) => {
      const alertDate = new Date(yesterday);
      alertDate.setHours(10 + idx, Math.floor(Math.random() * 60));

      alerts.push({
        id: uuidv4(),
        alert_type: 'VOIDED_SALE',
        severity: parseFloat(sale.total_amount) > 50000 ? 'HIGH' : 'MEDIUM',
        branch_id: sale.branch_id,
        user_id: sale.voided_by,
        title: `Venta Anulada: ${sale.sale_number}`,
        message: `Se anulo la venta ${sale.sale_number} por $${sale.total_amount}. Motivo: ${sale.void_reason || 'No especificado'}`,
        reference_type: 'Sale',
        reference_id: sale.id,
        is_read: idx < 2, // First 2 are read
        read_by: idx < 2 ? manager?.id : null,
        read_at: idx < 2 ? new Date() : null,
        is_resolved: idx === 0,
        resolved_by: idx === 0 ? manager?.id : null,
        resolved_at: idx === 0 ? new Date() : null,
        resolution_notes: idx === 0 ? 'Anulacion justificada - error de precio' : null,
        created_at: alertDate
      });
    });

    // CASH_DISCREPANCY alerts
    sessionsWithDiscrepancy.forEach((session, idx) => {
      const discrepancy = parseFloat(session.total_discrepancy);
      const alertDate = new Date(yesterday);
      alertDate.setHours(21 + idx % 3, Math.floor(Math.random() * 60));

      alerts.push({
        id: uuidv4(),
        alert_type: 'CASH_DISCREPANCY',
        severity: Math.abs(discrepancy) > 5000 ? 'CRITICAL' : Math.abs(discrepancy) > 1000 ? 'HIGH' : 'MEDIUM',
        branch_id: session.branch_id,
        user_id: session.opened_by,
        title: `Discrepancia de Caja: ${session.session_number}`,
        message: `Se detecto una discrepancia de $${discrepancy} en el cierre de caja ${session.session_number}. ${discrepancy < 0 ? 'Faltante' : 'Sobrante'} de efectivo.`,
        reference_type: 'RegisterSession',
        reference_id: session.id,
        is_read: idx === 0,
        read_by: idx === 0 ? owner?.id : null,
        read_at: idx === 0 ? new Date() : null,
        is_resolved: false,
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null,
        created_at: alertDate
      });
    });

    // LOW_STOCK alerts
    lowStockProducts.forEach((stock, idx) => {
      const alertDate = new Date(today);
      alertDate.setHours(8, idx * 10);

      alerts.push({
        id: uuidv4(),
        alert_type: 'LOW_STOCK',
        severity: parseFloat(stock.quantity) <= 0 ? 'CRITICAL' : 'MEDIUM',
        branch_id: stock.branch_id,
        user_id: null,
        title: `Stock Bajo: ${stock.name}`,
        message: `El producto "${stock.name}" tiene stock bajo (${stock.quantity} unidades). Minimo requerido: ${stock.minimum_stock}`,
        reference_type: 'BranchStock',
        reference_id: stock.id,
        is_read: false,
        read_by: null,
        read_at: null,
        is_resolved: false,
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null,
        created_at: alertDate
      });
    });

    // LARGE_DISCOUNT alert
    alerts.push({
      id: uuidv4(),
      alert_type: 'LARGE_DISCOUNT',
      severity: 'HIGH',
      branch_id: branch1?.id || branches[0].id,
      user_id: users.find(u => u.email === 'carlos@petfood.com')?.id,
      title: 'Descuento Alto Aplicado',
      message: 'Se aplico un descuento del 15% ($12,500) en una venta de $83,333. Requiere revision.',
      reference_type: 'Sale',
      reference_id: null,
      is_read: true,
      read_by: manager?.id,
      read_at: yesterday,
      is_resolved: true,
      resolved_by: manager?.id,
      resolved_at: today,
      resolution_notes: 'Descuento aprobado por promocion de temporada',
      created_at: twoDaysAgo
    });

    // HIGH_VALUE_SALE alert
    alerts.push({
      id: uuidv4(),
      alert_type: 'HIGH_VALUE_SALE',
      severity: 'LOW',
      branch_id: branch1?.id || branches[0].id,
      user_id: users.find(u => u.email === 'carlos@petfood.com')?.id,
      title: 'Venta de Alto Valor',
      message: 'Se realizo una venta por $250,000. Cliente mayorista: Jorge Morales.',
      reference_type: 'Sale',
      reference_id: null,
      is_read: true,
      read_by: owner?.id,
      read_at: yesterday,
      is_resolved: false,
      resolved_by: null,
      resolved_at: null,
      resolution_notes: null,
      created_at: yesterday
    });

    // LATE_CLOSING alert
    alerts.push({
      id: uuidv4(),
      alert_type: 'LATE_CLOSING',
      severity: 'MEDIUM',
      branch_id: branch2?.id || branches[1]?.id || branches[0].id,
      user_id: users.find(u => u.email === 'ana@petfood.com')?.id,
      title: 'Cierre Tardio de Caja',
      message: 'La caja de la sucursal fue cerrada a las 22:45, 45 minutos despues del horario establecido.',
      reference_type: 'RegisterSession',
      reference_id: null,
      is_read: false,
      read_by: null,
      read_at: null,
      is_resolved: false,
      resolved_by: null,
      resolved_at: null,
      resolution_notes: null,
      created_at: twoDaysAgo
    });

    // LOGIN_FAILED alert
    alerts.push({
      id: uuidv4(),
      alert_type: 'LOGIN_FAILED',
      severity: 'MEDIUM',
      branch_id: branch1?.id || branches[0].id,
      user_id: null,
      title: 'Intentos de Login Fallidos',
      message: 'Se detectaron 5 intentos de login fallidos para el usuario "admin@petfood.com" desde la IP 192.168.1.100',
      reference_type: null,
      reference_id: null,
      is_read: true,
      read_by: owner?.id,
      read_at: today,
      is_resolved: true,
      resolved_by: owner?.id,
      resolved_at: today,
      resolution_notes: 'Usuario olvido contrasena. Se restablecio.',
      created_at: yesterday
    });

    // PRICE_CHANGE alert
    alerts.push({
      id: uuidv4(),
      alert_type: 'PRICE_CHANGE',
      severity: 'LOW',
      branch_id: null,
      user_id: owner?.id,
      title: 'Cambio Masivo de Precios',
      message: 'Se actualizaron los precios de 45 productos del proveedor Royal Canin. Aumento promedio: 12%',
      reference_type: 'PriceImportBatch',
      reference_id: null,
      is_read: true,
      read_by: owner?.id,
      read_at: yesterday,
      is_resolved: false,
      resolved_by: null,
      resolved_at: null,
      resolution_notes: null,
      created_at: twoDaysAgo
    });

    // REOPEN_REGISTER alert
    alerts.push({
      id: uuidv4(),
      alert_type: 'REOPEN_REGISTER',
      severity: 'HIGH',
      branch_id: branch1?.id || branches[0].id,
      user_id: manager?.id,
      title: 'Caja Reabierta',
      message: 'La caja del turno manana fue reabierta por Maria Gonzalez. Motivo: Venta no registrada.',
      reference_type: 'RegisterSession',
      reference_id: null,
      is_read: true,
      read_by: owner?.id,
      read_at: yesterday,
      is_resolved: true,
      resolved_by: owner?.id,
      resolved_at: today,
      resolution_notes: 'Reapertura justificada. Se agrego venta faltante.',
      created_at: twoDaysAgo
    });

    // Sort by created_at descending (newest first)
    alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    await queryInterface.bulkInsert('alerts', alerts);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('alerts', null, {});
  }
};
