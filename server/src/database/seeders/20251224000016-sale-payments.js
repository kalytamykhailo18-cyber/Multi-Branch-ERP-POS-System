'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all completed sales
    const [sales] = await queryInterface.sequelize.query(
      `SELECT id, total_amount, credit_used, points_redemption_value, created_at
       FROM sales
       WHERE status = 'COMPLETED'
       ORDER BY created_at;`
    );

    // Get payment methods
    const [paymentMethods] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM payment_methods WHERE is_active = true;`
    );

    const cashMethod = paymentMethods.find(pm => pm.code === 'CASH');
    const cardMethod = paymentMethods.find(pm => pm.code === 'CARD');
    const qrMethod = paymentMethods.find(pm => pm.code === 'QR');
    const transferMethod = paymentMethods.find(pm => pm.code === 'TRANSFER');

    if (!cashMethod) {
      console.log('No payment methods found, skipping sale payments seeder');
      return;
    }

    const salePayments = [];
    const cardBrands = ['VISA', 'MASTERCARD', 'AMEX', 'CABAL', 'NARANJA'];
    const qrProviders = ['MERCADOPAGO', 'MODO', 'CUENTA_DNI', 'UALABIS'];

    sales.forEach((sale) => {
      const totalToPay = parseFloat(sale.total_amount) - parseFloat(sale.credit_used || 0) - parseFloat(sale.points_redemption_value || 0);

      if (totalToPay <= 0) return;

      // Determine payment split
      // 45% cash only, 25% card only, 15% QR only, 5% transfer, 10% mixed
      const paymentType = Math.random();
      const saleDate = new Date(sale.created_at);

      if (paymentType < 0.45) {
        // Cash only
        salePayments.push({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method_id: cashMethod.id,
          amount: totalToPay,
          reference_number: null,
          card_last_four: null,
          card_brand: null,
          authorization_code: null,
          qr_provider: null,
          qr_transaction_id: null,
          created_at: saleDate
        });
      } else if (paymentType < 0.70) {
        // Card only
        const cardBrand = cardBrands[Math.floor(Math.random() * cardBrands.length)];
        salePayments.push({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method_id: cardMethod.id,
          amount: totalToPay,
          reference_number: null,
          card_last_four: String(1000 + Math.floor(Math.random() * 9000)),
          card_brand: cardBrand,
          authorization_code: String(100000 + Math.floor(Math.random() * 900000)),
          qr_provider: null,
          qr_transaction_id: null,
          created_at: saleDate
        });
      } else if (paymentType < 0.85) {
        // QR only
        const qrProvider = qrProviders[Math.floor(Math.random() * qrProviders.length)];
        salePayments.push({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method_id: qrMethod.id,
          amount: totalToPay,
          reference_number: null,
          card_last_four: null,
          card_brand: null,
          authorization_code: null,
          qr_provider: qrProvider,
          qr_transaction_id: `QR${Date.now()}${Math.floor(Math.random() * 10000)}`,
          created_at: saleDate
        });
      } else if (paymentType < 0.90) {
        // Transfer only
        salePayments.push({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method_id: transferMethod.id,
          amount: totalToPay,
          reference_number: `TRF${Date.now()}${Math.floor(Math.random() * 10000)}`,
          card_last_four: null,
          card_brand: null,
          authorization_code: null,
          qr_provider: null,
          qr_transaction_id: null,
          created_at: saleDate
        });
      } else {
        // Mixed payment (cash + card or cash + QR)
        const cashPortion = Math.floor(totalToPay * (0.3 + Math.random() * 0.4)); // 30-70% cash
        const remainingAmount = totalToPay - cashPortion;

        // Cash portion
        salePayments.push({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method_id: cashMethod.id,
          amount: cashPortion,
          reference_number: null,
          card_last_four: null,
          card_brand: null,
          authorization_code: null,
          qr_provider: null,
          qr_transaction_id: null,
          created_at: saleDate
        });

        // Remaining as card or QR
        if (Math.random() > 0.5) {
          const cardBrand = cardBrands[Math.floor(Math.random() * cardBrands.length)];
          salePayments.push({
            id: uuidv4(),
            sale_id: sale.id,
            payment_method_id: cardMethod.id,
            amount: remainingAmount,
            reference_number: null,
            card_last_four: String(1000 + Math.floor(Math.random() * 9000)),
            card_brand: cardBrand,
            authorization_code: String(100000 + Math.floor(Math.random() * 900000)),
            qr_provider: null,
            qr_transaction_id: null,
            created_at: saleDate
          });
        } else {
          const qrProvider = qrProviders[Math.floor(Math.random() * qrProviders.length)];
          salePayments.push({
            id: uuidv4(),
            sale_id: sale.id,
            payment_method_id: qrMethod.id,
            amount: remainingAmount,
            reference_number: null,
            card_last_four: null,
            card_brand: null,
            authorization_code: null,
            qr_provider: qrProvider,
            qr_transaction_id: `QR${Date.now()}${Math.floor(Math.random() * 10000)}`,
            created_at: saleDate
          });
        }
      }
    });

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < salePayments.length; i += batchSize) {
      const batch = salePayments.slice(i, i + batchSize);
      await queryInterface.bulkInsert('sale_payments', batch);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sale_payments', null, {});
  }
};
