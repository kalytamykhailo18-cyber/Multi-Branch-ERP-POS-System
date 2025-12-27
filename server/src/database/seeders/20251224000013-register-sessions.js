'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all cash registers
    const [registers] = await queryInterface.sequelize.query(
      `SELECT cr.id, cr.register_number, cr.branch_id, b.code as branch_code
       FROM cash_registers cr
       JOIN branches b ON cr.branch_id = b.id;`
    );

    // Get all users
    const [users] = await queryInterface.sequelize.query(
      `SELECT u.id, u.email, u.first_name, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id;`
    );

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');
    const carlos = users.find(u => u.email === 'carlos@petfood.com');
    const ana = users.find(u => u.email === 'ana@petfood.com');
    const luis = users.find(u => u.email === 'luis@petfood.com');
    const sofia = users.find(u => u.email === 'sofia@petfood.com');

    // Get registers by branch
    const br1Registers = registers.filter(r => r.branch_code === 'BR001');
    const br2Registers = registers.filter(r => r.branch_code === 'BR002');
    const br3Registers = registers.filter(r => r.branch_code === 'BR003');
    const br4Registers = registers.filter(r => r.branch_code === 'BR004');

    const sessions = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Session counter for unique session numbers
    let sessionCounter = 1;

    // ===== Branch 1 Sessions =====
    // 3 days ago - CLOSED session (morning shift - Carlos)
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'MORNING',
      business_date: formatDate(threeDaysAgo),
      opened_by: carlos.id,
      opened_at: new Date(threeDaysAgo.setHours(8, 0, 0)),
      opening_cash: 50000.00,
      opening_notes: 'Apertura turno manana',
      closed_by: carlos.id,
      closed_at: new Date(threeDaysAgo.setHours(14, 0, 0)),
      declared_cash: 185500.00,
      declared_card: 75000.00,
      declared_qr: 25000.00,
      declared_transfer: 15000.00,
      expected_cash: 185000.00,
      expected_card: 75000.00,
      expected_qr: 25000.00,
      expected_transfer: 15000.00,
      discrepancy_cash: 500.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 500.00,
      status: 'CLOSED',
      closing_notes: 'Cierre sin novedades. Sobrante de $500 en efectivo.',
      created_at: new Date(threeDaysAgo),
      updated_at: new Date(threeDaysAgo)
    });

    // 3 days ago - CLOSED session (afternoon shift - manager Maria)
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'AFTERNOON',
      business_date: formatDate(threeDaysAgo),
      opened_by: manager.id,
      opened_at: new Date(threeDaysAgo.setHours(14, 30, 0)),
      opening_cash: 50000.00,
      opening_notes: 'Apertura turno tarde',
      closed_by: manager.id,
      closed_at: new Date(threeDaysAgo.setHours(21, 0, 0)),
      declared_cash: 220000.00,
      declared_card: 95000.00,
      declared_qr: 45000.00,
      declared_transfer: 30000.00,
      expected_cash: 220000.00,
      expected_card: 95000.00,
      expected_qr: 45000.00,
      expected_transfer: 30000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      status: 'CLOSED',
      closing_notes: 'Cierre perfecto, sin discrepancias',
      created_at: new Date(threeDaysAgo),
      updated_at: new Date(threeDaysAgo)
    });

    // 2 days ago - CLOSED session (full day - Carlos)
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(twoDaysAgo),
      opened_by: carlos.id,
      opened_at: new Date(twoDaysAgo.setHours(8, 0, 0)),
      opening_cash: 60000.00,
      opening_notes: null,
      closed_by: carlos.id,
      closed_at: new Date(twoDaysAgo.setHours(20, 30, 0)),
      declared_cash: 350000.00,
      declared_card: 180000.00,
      declared_qr: 65000.00,
      declared_transfer: 45000.00,
      expected_cash: 352000.00,
      expected_card: 180000.00,
      expected_qr: 65000.00,
      expected_transfer: 45000.00,
      discrepancy_cash: -2000.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: -2000.00,
      status: 'CLOSED',
      closing_notes: 'Faltante de $2000 en efectivo. Se revisara camara.',
      created_at: new Date(twoDaysAgo),
      updated_at: new Date(twoDaysAgo)
    });

    // Yesterday - CLOSED session
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: carlos.id,
      opened_at: new Date(yesterday.setHours(8, 0, 0)),
      opening_cash: 55000.00,
      opening_notes: 'Dia de promociones especiales',
      closed_by: carlos.id,
      closed_at: new Date(yesterday.setHours(21, 0, 0)),
      declared_cash: 425000.00,
      declared_card: 210000.00,
      declared_qr: 85000.00,
      declared_transfer: 55000.00,
      expected_cash: 425000.00,
      expected_card: 210000.00,
      expected_qr: 85000.00,
      expected_transfer: 55000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      status: 'CLOSED',
      closing_notes: 'Excelente jornada, ventas por encima del promedio',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN session (current)
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(today),
      opened_by: carlos.id,
      opened_at: new Date(today.setHours(8, 0, 0)),
      opening_cash: 60000.00,
      opening_notes: 'Apertura normal',
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ===== Branch 2 Sessions (Ana) =====
    // Yesterday - CLOSED
    sessions.push({
      id: uuidv4(),
      register_id: br2Registers[0].id,
      branch_id: br2Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: ana.id,
      opened_at: new Date(yesterday.setHours(9, 0, 0)),
      opening_cash: 40000.00,
      opening_notes: null,
      closed_by: ana.id,
      closed_at: new Date(yesterday.setHours(20, 0, 0)),
      declared_cash: 280000.00,
      declared_card: 145000.00,
      declared_qr: 55000.00,
      declared_transfer: 35000.00,
      expected_cash: 280000.00,
      expected_card: 145000.00,
      expected_qr: 55000.00,
      expected_transfer: 35000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      status: 'CLOSED',
      closing_notes: null,
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN
    sessions.push({
      id: uuidv4(),
      register_id: br2Registers[0].id,
      branch_id: br2Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(today),
      opened_by: ana.id,
      opened_at: new Date(today.setHours(9, 0, 0)),
      opening_cash: 45000.00,
      opening_notes: null,
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ===== Branch 3 Sessions (Luis) =====
    // Yesterday - CLOSED
    sessions.push({
      id: uuidv4(),
      register_id: br3Registers[0].id,
      branch_id: br3Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: luis.id,
      opened_at: new Date(yesterday.setHours(9, 30, 0)),
      opening_cash: 35000.00,
      opening_notes: null,
      closed_by: luis.id,
      closed_at: new Date(yesterday.setHours(19, 30, 0)),
      declared_cash: 195000.00,
      declared_card: 98000.00,
      declared_qr: 42000.00,
      declared_transfer: 25000.00,
      expected_cash: 196500.00,
      expected_card: 98000.00,
      expected_qr: 42000.00,
      expected_transfer: 25000.00,
      discrepancy_cash: -1500.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: -1500.00,
      status: 'CLOSED',
      closing_notes: 'Faltante menor en efectivo',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN
    sessions.push({
      id: uuidv4(),
      register_id: br3Registers[0].id,
      branch_id: br3Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(today),
      opened_by: luis.id,
      opened_at: new Date(today.setHours(9, 30, 0)),
      opening_cash: 35000.00,
      opening_notes: null,
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ===== Branch 4 Sessions (Sofia) =====
    // Yesterday - CLOSED
    sessions.push({
      id: uuidv4(),
      register_id: br4Registers[0].id,
      branch_id: br4Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: sofia.id,
      opened_at: new Date(yesterday.setHours(10, 0, 0)),
      opening_cash: 30000.00,
      opening_notes: null,
      closed_by: sofia.id,
      closed_at: new Date(yesterday.setHours(19, 0, 0)),
      declared_cash: 165000.00,
      declared_card: 75000.00,
      declared_qr: 35000.00,
      declared_transfer: 20000.00,
      expected_cash: 165000.00,
      expected_card: 75000.00,
      expected_qr: 35000.00,
      expected_transfer: 20000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      status: 'CLOSED',
      closing_notes: null,
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN
    sessions.push({
      id: uuidv4(),
      register_id: br4Registers[0].id,
      branch_id: br4Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(today),
      opened_by: sofia.id,
      opened_at: new Date(today.setHours(10, 0, 0)),
      opening_cash: 30000.00,
      opening_notes: null,
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Second register in Branch 1 - Yesterday CLOSED (Manager)
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[1].id,
      branch_id: br1Registers[1].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'AFTERNOON',
      business_date: formatDate(yesterday),
      opened_by: manager.id,
      opened_at: new Date(yesterday.setHours(14, 0, 0)),
      opening_cash: 40000.00,
      opening_notes: 'Caja 2 abierta por alto trafico',
      closed_by: manager.id,
      closed_at: new Date(yesterday.setHours(21, 0, 0)),
      declared_cash: 175000.00,
      declared_card: 120000.00,
      declared_qr: 48000.00,
      declared_transfer: 28000.00,
      expected_cash: 175000.00,
      expected_card: 120000.00,
      expected_qr: 48000.00,
      expected_transfer: 28000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      status: 'CLOSED',
      closing_notes: 'Segunda caja cerrada correctamente',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    await queryInterface.bulkInsert('register_sessions', sessions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('register_sessions', null, {});
  }
};
