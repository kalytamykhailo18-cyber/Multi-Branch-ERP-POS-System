const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const branchRoutes = require('./branch.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const customerRoutes = require('./customer.routes');
const supplierRoutes = require('./supplier.routes');
const stockRoutes = require('./stock.routes');
const saleRoutes = require('./sale.routes');
const paymentRoutes = require('./payment.routes');
const registerRoutes = require('./register.routes');
const invoiceRoutes = require('./invoice.routes');
const alertRoutes = require('./alert.routes');
const reportRoutes = require('./report.routes');
const syncRoutes = require('./sync.routes');
const priceImportRoutes = require('./priceImport.routes');
const loyaltyRoutes = require('./loyalty.routes');

// API Version prefix
const API_VERSION = '/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/branches`, branchRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/roles`, roleRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/customers`, customerRoutes);
router.use(`${API_VERSION}/suppliers`, supplierRoutes);
router.use(`${API_VERSION}/stock`, stockRoutes);
router.use(`${API_VERSION}/sales`, saleRoutes);
router.use(`${API_VERSION}/payment-methods`, paymentRoutes);
router.use(`${API_VERSION}/registers`, registerRoutes);
router.use(`${API_VERSION}/invoices`, invoiceRoutes);
router.use(`${API_VERSION}/alerts`, alertRoutes);
router.use(`${API_VERSION}/reports`, reportRoutes);
router.use(`${API_VERSION}/sync`, syncRoutes);
router.use(`${API_VERSION}/prices`, priceImportRoutes);
router.use(`${API_VERSION}/loyalty`, loyaltyRoutes);

module.exports = router;
