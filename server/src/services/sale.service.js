const { v4: uuidv4 } = require('uuid');
const {
  Sale, SaleItem, SalePayment, Product, Customer, BranchStock, StockMovement,
  LoyaltyTransaction, CreditTransaction, PaymentMethod, sequelize
} = require('../database/models');
const { NotFoundError, BusinessError } = require('../middleware/errorHandler');
const { getIO } = require('../socket');
const alertService = require('./alert.service');
const logger = require('../utils/logger');

class SaleService {
  async createSale(saleData, userId) {
    const t = await sequelize.transaction();

    try {
      const {
        branch_id, register_id, session_id, customer_id, items, payments,
        discount_type, discount_value, notes, local_id
      } = saleData;

      // Validate items and calculate totals
      let subtotal = 0;
      let totalTax = 0;
      const processedItems = [];

      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        if (!product) {
          throw new NotFoundError(`Product not found: ${item.product_id}`);
        }

        // Check stock
        const stock = await BranchStock.findOne({
          where: { branch_id, product_id: item.product_id }
        });

        if (stock && stock.quantity < item.quantity && !product.allow_negative_stock) {
          throw new BusinessError(`Insufficient stock for ${product.name}`);
        }

        const unitPrice = item.unit_price || parseFloat(product.selling_price);
        const quantity = parseFloat(item.quantity);
        const itemSubtotal = unitPrice * quantity;

        // Calculate item discount
        let itemDiscount = 0;
        if (item.discount_percent) {
          itemDiscount = itemSubtotal * (item.discount_percent / 100);
        } else if (item.discount_amount) {
          itemDiscount = item.discount_amount;
        }

        const itemAfterDiscount = itemSubtotal - itemDiscount;

        // Calculate tax
        let taxAmount = 0;
        if (product.tax_rate && !product.is_tax_included) {
          taxAmount = itemAfterDiscount * (product.tax_rate / 100);
        }

        const itemTotal = itemAfterDiscount + taxAmount;

        processedItems.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity,
          unit_price: unitPrice,
          cost_price: product.cost_price,
          discount_percent: item.discount_percent || 0,
          discount_amount: itemDiscount,
          tax_rate: product.tax_rate || 0,
          tax_amount: taxAmount,
          subtotal: itemSubtotal,
          total: itemTotal
        });

        subtotal += itemSubtotal;
        totalTax += taxAmount;
      }

      // Apply sale-level discount
      let totalDiscount = 0;
      if (discount_type === 'PERCENT' && discount_value) {
        totalDiscount = subtotal * (discount_value / 100);
      } else if (discount_type === 'FIXED' && discount_value) {
        totalDiscount = discount_value;
      }

      // Apply wholesale discount if customer is wholesale
      let customer = null;
      if (customer_id) {
        customer = await Customer.findByPk(customer_id);
        if (customer?.is_wholesale && customer.wholesale_discount_percent) {
          const wholesaleDiscount = subtotal * (customer.wholesale_discount_percent / 100);
          totalDiscount += wholesaleDiscount;
        }
      }

      const totalAmount = subtotal - totalDiscount + totalTax;

      // Validate payments
      let totalPaid = 0;
      for (const payment of payments) {
        totalPaid += parseFloat(payment.amount);
      }

      if (totalPaid < totalAmount) {
        throw new BusinessError('Payment amount is less than total');
      }

      const change = totalPaid - totalAmount;

      // Generate sale number
      const saleNumber = await this.generateSaleNumber(branch_id);

      // Create sale
      const sale = await Sale.create({
        id: uuidv4(),
        local_id,
        sale_number: saleNumber,
        branch_id,
        register_id,
        session_id,
        customer_id,
        cashier_id: userId,
        subtotal,
        discount_type,
        discount_value,
        discount_amount: totalDiscount,
        tax_amount: totalTax,
        total_amount: totalAmount,
        paid_amount: totalPaid,
        change_amount: change,
        status: 'COMPLETED',
        notes,
        sync_status: local_id ? 'SYNCED' : 'SYNCED',
        synced_at: new Date()
      }, { transaction: t });

      // Create sale items and update stock
      for (const item of processedItems) {
        await SaleItem.create({
          id: uuidv4(),
          sale_id: sale.id,
          ...item
        }, { transaction: t });

        // Update stock
        const stock = await BranchStock.findOne({
          where: { branch_id, product_id: item.product_id }
        });

        if (stock) {
          const previousQty = parseFloat(stock.quantity);
          const newQty = previousQty - item.quantity;

          await stock.update({ quantity: newQty }, { transaction: t });

          // Create stock movement
          await StockMovement.create({
            id: uuidv4(),
            branch_id,
            product_id: item.product_id,
            movement_type: 'SALE',
            quantity: item.quantity,
            quantity_before: previousQty,
            quantity_after: newQty,
            reference_type: 'SALE',
            reference_id: sale.id,
            created_by: userId
          }, { transaction: t });

          // Check for low stock alert
          if (newQty <= stock.min_stock) {
            const product = await Product.findByPk(item.product_id);
            alertService.createLowStockAlert(branch_id, product.name, newQty, stock.min_stock);
          }
        }
      }

      // Create payments
      for (const payment of payments) {
        await SalePayment.create({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method_id: payment.payment_method_id,
          amount: payment.amount,
          reference_number: payment.reference_number,
          status: 'APPROVED'
        }, { transaction: t });
      }

      // Handle loyalty points
      if (customer) {
        const pointsEarned = Math.floor(totalAmount / 100); // 1 point per $100

        if (pointsEarned > 0) {
          const newLoyaltyBalance = customer.loyalty_points + pointsEarned;

          await customer.update({ loyalty_points: newLoyaltyBalance }, { transaction: t });

          await LoyaltyTransaction.create({
            id: uuidv4(),
            customer_id: customer.id,
            sale_id: sale.id,
            transaction_type: 'EARN',
            points: pointsEarned,
            points_balance_after: newLoyaltyBalance,
            description: `Points earned from sale ${saleNumber}`,
            created_by: userId
          }, { transaction: t });
        }
      }

      await t.commit();

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`branch_${branch_id}`).emit('SALE_CREATED', {
          sale_id: sale.id,
          sale_number: saleNumber,
          total_amount: totalAmount
        });
      }

      // Check for large transaction alert
      const LARGE_TRANSACTION_THRESHOLD = 50000;
      if (totalAmount > LARGE_TRANSACTION_THRESHOLD) {
        alertService.createLargeTransactionAlert(branch_id, saleNumber, totalAmount, LARGE_TRANSACTION_THRESHOLD);
      }

      logger.info(`Sale ${saleNumber} created - Total: $${totalAmount}`);

      return sale;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async voidSale(saleId, reason, userId) {
    const t = await sequelize.transaction();

    try {
      const sale = await Sale.findByPk(saleId, {
        include: [
          { model: SaleItem, as: 'items' },
          { model: SalePayment, as: 'payments' },
          { model: Customer, as: 'customer' }
        ]
      });

      if (!sale) {
        throw new NotFoundError('Sale not found');
      }

      if (sale.status === 'VOIDED') {
        throw new BusinessError('Sale is already voided');
      }

      // Restore stock
      for (const item of sale.items) {
        const stock = await BranchStock.findOne({
          where: { branch_id: sale.branch_id, product_id: item.product_id }
        });

        if (stock) {
          const previousQty = parseFloat(stock.quantity);
          const newQty = previousQty + parseFloat(item.quantity);

          await stock.update({ quantity: newQty }, { transaction: t });

          await StockMovement.create({
            id: uuidv4(),
            branch_id: sale.branch_id,
            product_id: item.product_id,
            movement_type: 'SALE_VOID',
            quantity: item.quantity,
            quantity_before: previousQty,
            quantity_after: newQty,
            reference_type: 'SALE',
            reference_id: sale.id,
            notes: `Voided: ${reason}`,
            created_by: userId
          }, { transaction: t });
        }
      }

      // Reverse loyalty points if applicable
      if (sale.customer) {
        const loyaltyTx = await LoyaltyTransaction.findOne({
          where: { sale_id: sale.id, transaction_type: 'EARN' }
        });

        if (loyaltyTx) {
          const newBalance = sale.customer.loyalty_points - loyaltyTx.points;

          await sale.customer.update({ loyalty_points: newBalance }, { transaction: t });

          await LoyaltyTransaction.create({
            id: uuidv4(),
            customer_id: sale.customer.id,
            sale_id: sale.id,
            transaction_type: 'VOID',
            points: -loyaltyTx.points,
            points_balance_after: newBalance,
            description: `Points reversed - sale voided: ${reason}`,
            created_by: userId
          }, { transaction: t });
        }
      }

      // Update sale status
      await sale.update({
        status: 'VOIDED',
        void_reason: reason,
        voided_by: userId,
        voided_at: new Date()
      }, { transaction: t });

      // Update payment statuses
      await SalePayment.update(
        { status: 'VOIDED' },
        { where: { sale_id: sale.id }, transaction: t }
      );

      await t.commit();

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`branch_${sale.branch_id}`).emit('SALE_VOIDED', {
          sale_id: sale.id,
          sale_number: sale.sale_number
        });
      }

      logger.info(`Sale ${sale.sale_number} voided: ${reason}`);

      return sale;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async generateSaleNumber(branchId) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastSale = await Sale.findOne({
      where: {
        branch_id: branchId,
        sale_number: { [require('sequelize').Op.like]: `${dateStr}%` }
      },
      order: [['sale_number', 'DESC']]
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.sale_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${dateStr}${String(sequence).padStart(4, '0')}`;
  }

  async getSaleReceipt(saleId) {
    const sale = await Sale.findByPk(saleId, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }]
        },
        {
          model: SalePayment,
          as: 'payments',
          include: [{ model: PaymentMethod, as: 'payment_method' }]
        },
        { model: Customer, as: 'customer' },
        { model: require('../database/models').Branch, as: 'branch' },
        { model: require('../database/models').User, as: 'cashier', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    return {
      sale_number: sale.sale_number,
      date: sale.created_at,
      branch: {
        name: sale.branch?.name,
        address: sale.branch?.address,
        phone: sale.branch?.phone
      },
      cashier: `${sale.cashier?.first_name || ''} ${sale.cashier?.last_name || ''}`.trim(),
      customer: sale.customer ? {
        name: sale.customer.company_name || `${sale.customer.first_name || ''} ${sale.customer.last_name || ''}`.trim(),
        document: sale.customer.document_number
      } : null,
      items: sale.items.map((item) => ({
        name: item.product_name,
        sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount_amount,
        total: item.total
      })),
      subtotal: sale.subtotal,
      discount: sale.discount_amount,
      tax: sale.tax_amount,
      total: sale.total_amount,
      payments: sale.payments.map((p) => ({
        method: p.payment_method?.name,
        amount: p.amount
      })),
      paid: sale.paid_amount,
      change: sale.change_amount,
      status: sale.status
    };
  }

  async redeemLoyaltyPoints(customerId, points, saleId, userId) {
    const t = await sequelize.transaction();

    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      if (customer.loyalty_points < points) {
        throw new BusinessError('Insufficient loyalty points');
      }

      const newBalance = customer.loyalty_points - points;

      await customer.update({ loyalty_points: newBalance }, { transaction: t });

      await LoyaltyTransaction.create({
        id: uuidv4(),
        customer_id: customerId,
        sale_id: saleId,
        transaction_type: 'REDEEM',
        points: -points,
        points_balance_after: newBalance,
        description: 'Points redeemed',
        created_by: userId
      }, { transaction: t });

      await t.commit();

      return { points_redeemed: points, new_balance: newBalance };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async useCustomerCredit(customerId, amount, saleId, userId) {
    const t = await sequelize.transaction();

    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      if (parseFloat(customer.credit_balance) < amount) {
        throw new BusinessError('Insufficient credit balance');
      }

      const newBalance = parseFloat(customer.credit_balance) - amount;

      await customer.update({ credit_balance: newBalance }, { transaction: t });

      await CreditTransaction.create({
        id: uuidv4(),
        customer_id: customerId,
        sale_id: saleId,
        transaction_type: 'DEBIT',
        amount: -amount,
        balance_after: newBalance,
        description: 'Credit used for purchase',
        created_by: userId
      }, { transaction: t });

      await t.commit();

      return { credit_used: amount, new_balance: newBalance };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new SaleService();
