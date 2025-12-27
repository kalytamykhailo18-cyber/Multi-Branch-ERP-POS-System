const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique sale number
 * Format: BRANCH-YYYYMMDD-NNNNNN
 * @param {string} branchCode - Branch code
 * @returns {string} Sale number
 */
const generateSaleNumber = (branchCode) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${branchCode}-${dateStr}-${random}`;
};

/**
 * Generate a unique session number
 * Format: REG-YYYYMMDD-SHIFT-NNN
 * @param {number} registerNumber - Register number
 * @param {string} shiftType - Shift type (MORNING, AFTERNOON, FULL_DAY)
 * @returns {string} Session number
 */
const generateSessionNumber = (registerNumber, shiftType) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shiftCode = shiftType === 'MORNING' ? 'M' : shiftType === 'AFTERNOON' ? 'T' : 'F';
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `R${registerNumber}-${dateStr}-${shiftCode}-${random}`;
};

/**
 * Generate a unique transfer number
 * Format: TRF-YYYYMMDD-NNNN
 * @returns {string} Transfer number
 */
const generateTransferNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRF-${dateStr}-${random}`;
};

/**
 * Generate a customer QR code
 * Format: CUST-UUID
 * @returns {string} QR code
 */
const generateCustomerQRCode = () => {
  return `CUST-${uuidv4().slice(0, 8).toUpperCase()}`;
};

/**
 * Calculate margin percent from cost and selling price
 * @param {number} costPrice - Cost price
 * @param {number} sellingPrice - Selling price
 * @returns {number} Margin percent
 */
const calculateMarginPercent = (costPrice, sellingPrice) => {
  if (!costPrice || costPrice === 0) return 100;
  return ((sellingPrice - costPrice) / costPrice) * 100;
};

/**
 * Calculate selling price from cost and margin percent
 * @param {number} costPrice - Cost price
 * @param {number} marginPercent - Desired margin percent
 * @returns {number} Selling price
 */
const calculateSellingPrice = (costPrice, marginPercent) => {
  return costPrice * (1 + marginPercent / 100);
};

/**
 * Format decimal to 2 decimal places
 * @param {number} value - Number to format
 * @returns {string} Formatted decimal string
 */
const formatDecimal = (value) => {
  return parseFloat(value).toFixed(2);
};

/**
 * Parse pagination parameters from query
 * @param {Object} query - Express query object
 * @returns {Object} Pagination params
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  const sortBy = query.sort_by || 'created_at';
  const sortOrder = query.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return { page, limit, offset, sortBy, sortOrder };
};

/**
 * Get today's date in YYYY-MM-DD format (Argentina timezone)
 * @returns {string} Today's date
 */
const getBusinessDate = () => {
  const now = new Date();
  // Adjust for Argentina timezone (UTC-3)
  const argentinaOffset = -3 * 60; // minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const argentinaTime = new Date(utc + (argentinaOffset * 60000));
  return argentinaTime.toISOString().slice(0, 10);
};

/**
 * Check if time is past a given closing time
 * @param {string} closingTime - Closing time in HH:mm:ss format
 * @returns {boolean} True if past closing time
 */
const isPastClosingTime = (closingTime) => {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const argentinaTime = new Date(utc + (argentinaOffset * 60000));

  const [hours, minutes] = closingTime.split(':').map(Number);
  const closingDate = new Date(argentinaTime);
  closingDate.setHours(hours, minutes, 0, 0);

  return argentinaTime > closingDate;
};

/**
 * Calculate loyalty points from sale amount
 * @param {number} amount - Sale total amount
 * @param {number} pointsPerCurrency - Points per currency unit (default: 1 point per $100)
 * @returns {number} Points earned
 */
const calculateLoyaltyPoints = (amount, pointsPerCurrency = 0.01) => {
  return Math.floor(amount * pointsPerCurrency);
};

/**
 * Calculate points redemption value
 * @param {number} points - Points to redeem
 * @param {number} valuePerPoint - Currency value per point (default: $1 per point)
 * @returns {number} Redemption value
 */
const calculatePointsValue = (points, valuePerPoint = 1) => {
  return points * valuePerPoint;
};

/**
 * Clean string for search (remove accents, lowercase)
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
const cleanSearchString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

module.exports = {
  generateSaleNumber,
  generateSessionNumber,
  generateTransferNumber,
  generateCustomerQRCode,
  calculateMarginPercent,
  calculateSellingPrice,
  formatDecimal,
  parsePagination,
  getBusinessDate,
  isPastClosingTime,
  calculateLoyaltyPoints,
  calculatePointsValue,
  cleanSearchString
};
