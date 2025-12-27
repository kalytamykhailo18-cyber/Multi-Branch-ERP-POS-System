const { Sequelize } = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

// Import all models
const Branch = require('./Branch')(sequelize);
const Role = require('./Role')(sequelize);
const User = require('./User')(sequelize);
const UserSession = require('./UserSession')(sequelize);
const Category = require('./Category')(sequelize);
const UnitOfMeasure = require('./UnitOfMeasure')(sequelize);
const Product = require('./Product')(sequelize);
const ProductPriceHistory = require('./ProductPriceHistory')(sequelize);
const Supplier = require('./Supplier')(sequelize);
const SupplierProduct = require('./SupplierProduct')(sequelize);
const PriceImportBatch = require('./PriceImportBatch')(sequelize);
const PriceImportItem = require('./PriceImportItem')(sequelize);
const BranchStock = require('./BranchStock')(sequelize);
const StockMovement = require('./StockMovement')(sequelize);
const StockTransfer = require('./StockTransfer')(sequelize);
const StockTransferItem = require('./StockTransferItem')(sequelize);
const Customer = require('./Customer')(sequelize);
const LoyaltyTransaction = require('./LoyaltyTransaction')(sequelize);
const CreditTransaction = require('./CreditTransaction')(sequelize);
const CashRegister = require('./CashRegister')(sequelize);
const RegisterSession = require('./RegisterSession')(sequelize);
const DailyReport = require('./DailyReport')(sequelize);
const PaymentMethod = require('./PaymentMethod')(sequelize);
const Sale = require('./Sale')(sequelize);
const SaleItem = require('./SaleItem')(sequelize);
const SalePayment = require('./SalePayment')(sequelize);
const InvoiceType = require('./InvoiceType')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const CreditNote = require('./CreditNote')(sequelize);
const Alert = require('./Alert')(sequelize);
const SyncQueue = require('./SyncQueue')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);

// Create models object
const models = {
  Branch,
  Role,
  User,
  UserSession,
  Category,
  UnitOfMeasure,
  Product,
  ProductPriceHistory,
  Supplier,
  SupplierProduct,
  PriceImportBatch,
  PriceImportItem,
  BranchStock,
  StockMovement,
  StockTransfer,
  StockTransferItem,
  Customer,
  LoyaltyTransaction,
  CreditTransaction,
  CashRegister,
  RegisterSession,
  DailyReport,
  PaymentMethod,
  Sale,
  SaleItem,
  SalePayment,
  InvoiceType,
  Invoice,
  CreditNote,
  Alert,
  SyncQueue,
  AuditLog
};

// Set up associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export sequelize instance and models
module.exports = {
  sequelize,
  Sequelize,
  ...models
};
