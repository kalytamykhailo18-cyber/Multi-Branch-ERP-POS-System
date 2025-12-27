const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const {
  PriceImportBatch, PriceImportItem, Product, Supplier, ProductPriceHistory,
  sequelize
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError, ValidationError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');

// OCR Service placeholder - to be integrated with external OCR provider
const extractTextFromFile = async (filePath, fileType) => {
  // TODO: Integrate with OCR service (Tesseract, Google Vision, etc.)
  // For now, return placeholder for PDF files
  if (fileType === 'PDF') {
    return {
      success: true,
      text: '',
      items: []
    };
  }
  return { success: true, text: '', items: [] };
};

// Excel parsing
const parseExcelFile = async (filePath) => {
  const xlsx = require('xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  return data.map((row, index) => ({
    line_number: index + 1,
    supplier_code: row.codigo || row.code || row.sku || '',
    description: row.descripcion || row.description || row.nombre || row.name || '',
    cost_price: parseFloat(row.precio || row.price || row.costo || row.cost || 0)
  }));
};

exports.uploadFile = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { supplier_id, margin_percentage, rounding_rule, rounding_value } = req.body;
    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();

    let fileType;
    if (ext === '.pdf') fileType = 'PDF';
    else if (['.xls', '.xlsx'].includes(ext)) fileType = 'EXCEL';
    else if (ext === '.csv') fileType = 'CSV';
    else throw new ValidationError('Unsupported file type. Use PDF, Excel, or CSV');

    // Create batch record
    const batch = await PriceImportBatch.create({
      id: uuidv4(),
      supplier_id: supplier_id || null,
      file_name: file.originalname,
      file_path: file.path,
      file_type: fileType,
      status: 'PROCESSING',
      margin_percentage: parseFloat(margin_percentage) || 30,
      rounding_rule: rounding_rule || 'NEAREST',
      rounding_value: parseInt(rounding_value) || 10,
      uploaded_by: req.user.id
    }, { transaction: t });

    // Extract items from file
    let extractedItems = [];

    if (fileType === 'EXCEL' || fileType === 'CSV') {
      extractedItems = await parseExcelFile(file.path);
    } else if (fileType === 'PDF') {
      const ocrResult = await extractTextFromFile(file.path, 'PDF');
      extractedItems = ocrResult.items || [];
    }

    // Match products and create import items
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const item of extractedItems) {
      // Try to match by supplier code or SKU
      let matchedProduct = null;
      let matchStatus = 'NOT_FOUND';
      let confidence = 0;

      if (item.supplier_code) {
        // Try exact match on SKU or barcode
        matchedProduct = await Product.findOne({
          where: {
            [Op.or]: [
              { sku: item.supplier_code },
              { barcode: item.supplier_code }
            ]
          }
        });

        if (matchedProduct) {
          matchStatus = 'MATCHED';
          confidence = 100;
        } else {
          // Try fuzzy match on name
          matchedProduct = await Product.findOne({
            where: {
              name: { [Op.iLike]: `%${item.description}%` }
            }
          });

          if (matchedProduct) {
            matchStatus = 'SUGGESTED';
            confidence = 60;
          }
        }
      }

      // Calculate suggested sell price with margin
      const marginMultiplier = 1 + (batch.margin_percentage / 100);
      let suggestedPrice = item.cost_price * marginMultiplier;

      // Apply rounding
      if (batch.rounding_rule !== 'NONE' && batch.rounding_value > 0) {
        const rv = batch.rounding_value;
        if (batch.rounding_rule === 'UP') {
          suggestedPrice = Math.ceil(suggestedPrice / rv) * rv;
        } else if (batch.rounding_rule === 'DOWN') {
          suggestedPrice = Math.floor(suggestedPrice / rv) * rv;
        } else { // NEAREST
          suggestedPrice = Math.round(suggestedPrice / rv) * rv;
        }
      }

      // Calculate price change percentage
      let priceChangePercentage = 0;
      if (matchedProduct && matchedProduct.sell_price > 0) {
        priceChangePercentage = ((suggestedPrice - matchedProduct.sell_price) / matchedProduct.sell_price) * 100;
      }

      // Validation errors
      const validationErrors = [];
      if (!item.supplier_code) validationErrors.push('Missing supplier code');
      if (!item.cost_price || item.cost_price <= 0) validationErrors.push('Invalid price');
      if (Math.abs(priceChangePercentage) > 50) validationErrors.push('Large price change (>50%)');

      await PriceImportItem.create({
        id: uuidv4(),
        batch_id: batch.id,
        line_number: item.line_number,
        supplier_code: item.supplier_code || '',
        description: item.description || '',
        cost_price: item.cost_price || 0,
        matched_product_id: matchedProduct?.id || null,
        current_cost_price: matchedProduct?.cost_price || null,
        current_sell_price: matchedProduct?.sell_price || null,
        suggested_sell_price: suggestedPrice,
        price_change_percentage: priceChangePercentage,
        confidence_score: confidence,
        match_status: matchStatus,
        validation_errors: validationErrors,
        is_selected: matchStatus === 'MATCHED' && validationErrors.length === 0
      }, { transaction: t });

      if (matchStatus === 'MATCHED') matchedCount++;
      else unmatchedCount++;
    }

    await batch.update({
      status: 'READY',
      total_items: extractedItems.length,
      matched_items: matchedCount,
      unmatched_items: unmatchedCount
    }, { transaction: t });

    await t.commit();

    const result = await PriceImportBatch.findByPk(batch.id, {
      include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'code'] }]
    });

    return created(res, result);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getBatch = async (req, res, next) => {
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name', 'code'] },
        {
          model: require('../database/models').User,
          as: 'uploaded_by_user',
          attributes: ['first_name', 'last_name']
        }
      ]
    });

    if (!batch) throw new NotFoundError('Batch not found');
    return success(res, batch);
  } catch (error) {
    next(error);
  }
};

exports.getBatchItems = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { match_status, search } = req.query;

    const where = { batch_id: req.params.id };
    if (match_status) where.match_status = match_status;
    if (search) {
      where[Op.or] = [
        { supplier_code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await PriceImportItem.findAndCountAll({
      where,
      include: [{
        model: Product,
        as: 'matched_product',
        attributes: ['id', 'name', 'sku', 'sell_price', 'cost_price']
      }],
      order: [['line_number', 'ASC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.getBatches = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, supplier_id, start_date, end_date } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplier_id) where.supplier_id = supplier_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await PriceImportBatch.findAndCountAll({
      where,
      include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'code'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

exports.updateBatchConfig = async (req, res, next) => {
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status === 'APPLIED') throw new BusinessError('Cannot modify applied batch');

    const { margin_percentage, rounding_rule, rounding_value } = req.body;

    await batch.update({
      margin_percentage: margin_percentage !== undefined ? margin_percentage : batch.margin_percentage,
      rounding_rule: rounding_rule || batch.rounding_rule,
      rounding_value: rounding_value !== undefined ? rounding_value : batch.rounding_value
    });

    return success(res, batch);
  } catch (error) {
    next(error);
  }
};

exports.recalculate = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status === 'APPLIED') throw new BusinessError('Cannot recalculate applied batch');

    const items = await PriceImportItem.findAll({
      where: { batch_id: batch.id },
      include: [{ model: Product, as: 'matched_product' }]
    });

    const marginMultiplier = 1 + (batch.margin_percentage / 100);

    for (const item of items) {
      let suggestedPrice = item.cost_price * marginMultiplier;

      // Apply rounding
      if (batch.rounding_rule !== 'NONE' && batch.rounding_value > 0) {
        const rv = batch.rounding_value;
        if (batch.rounding_rule === 'UP') {
          suggestedPrice = Math.ceil(suggestedPrice / rv) * rv;
        } else if (batch.rounding_rule === 'DOWN') {
          suggestedPrice = Math.floor(suggestedPrice / rv) * rv;
        } else {
          suggestedPrice = Math.round(suggestedPrice / rv) * rv;
        }
      }

      let priceChangePercentage = 0;
      if (item.matched_product && item.matched_product.sell_price > 0) {
        priceChangePercentage = ((suggestedPrice - item.matched_product.sell_price) / item.matched_product.sell_price) * 100;
      }

      // Update validation errors
      const validationErrors = [...(item.validation_errors || [])].filter(e => e !== 'Large price change (>50%)');
      if (Math.abs(priceChangePercentage) > 50) validationErrors.push('Large price change (>50%)');

      await item.update({
        suggested_sell_price: suggestedPrice,
        price_change_percentage: priceChangePercentage,
        validation_errors: validationErrors
      }, { transaction: t });
    }

    await t.commit();
    return success(res, batch);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.matchItem = async (req, res, next) => {
  try {
    const item = await PriceImportItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Item not found');

    const product = await Product.findByPk(req.body.product_id);
    if (!product) throw new NotFoundError('Product not found');

    // Recalculate price change percentage
    const batch = await PriceImportBatch.findByPk(item.batch_id);
    const marginMultiplier = 1 + (batch.margin_percentage / 100);
    let suggestedPrice = item.cost_price * marginMultiplier;

    if (batch.rounding_rule !== 'NONE' && batch.rounding_value > 0) {
      const rv = batch.rounding_value;
      if (batch.rounding_rule === 'UP') suggestedPrice = Math.ceil(suggestedPrice / rv) * rv;
      else if (batch.rounding_rule === 'DOWN') suggestedPrice = Math.floor(suggestedPrice / rv) * rv;
      else suggestedPrice = Math.round(suggestedPrice / rv) * rv;
    }

    let priceChangePercentage = 0;
    if (product.sell_price > 0) {
      priceChangePercentage = ((suggestedPrice - product.sell_price) / product.sell_price) * 100;
    }

    await item.update({
      matched_product_id: product.id,
      current_cost_price: product.cost_price,
      current_sell_price: product.sell_price,
      suggested_sell_price: suggestedPrice,
      price_change_percentage: priceChangePercentage,
      match_status: 'MANUAL',
      confidence_score: 100
    });

    // Update batch counts
    await updateBatchCounts(item.batch_id);

    const updatedItem = await PriceImportItem.findByPk(item.id, {
      include: [{ model: Product, as: 'matched_product' }]
    });

    return success(res, updatedItem);
  } catch (error) {
    next(error);
  }
};

exports.toggleItemSelection = async (req, res, next) => {
  try {
    const item = await PriceImportItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Item not found');

    await item.update({ is_selected: req.body.is_selected });
    return success(res, item);
  } catch (error) {
    next(error);
  }
};

exports.selectAllItems = async (req, res, next) => {
  try {
    const { is_selected, match_status } = req.body;

    const where = { batch_id: req.params.id };
    if (match_status) where.match_status = match_status;

    const [count] = await PriceImportItem.update(
      { is_selected },
      { where }
    );

    return success(res, { updated_count: count });
  } catch (error) {
    next(error);
  }
};

exports.applyPrices = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status !== 'READY') throw new BusinessError('Batch is not ready to apply');

    const selectedItems = await PriceImportItem.findAll({
      where: {
        batch_id: batch.id,
        is_selected: true,
        matched_product_id: { [Op.ne]: null }
      },
      include: [{ model: Product, as: 'matched_product' }]
    });

    let appliedCount = 0;
    let skippedCount = 0;

    for (const item of selectedItems) {
      if (!item.matched_product_id) {
        skippedCount++;
        continue;
      }

      const product = item.matched_product;

      // Record price history
      await ProductPriceHistory.create({
        id: uuidv4(),
        product_id: product.id,
        old_cost_price: product.cost_price,
        new_cost_price: item.cost_price,
        old_selling_price: product.sell_price,
        new_selling_price: item.suggested_sell_price,
        change_reason: 'OCR_IMPORT',
        import_batch_id: batch.id,
        changed_by: req.user.id
      }, { transaction: t });

      // Update product prices
      await product.update({
        cost_price: item.cost_price,
        sell_price: item.suggested_sell_price
      }, { transaction: t });

      appliedCount++;
    }

    await batch.update({
      status: 'APPLIED',
      applied_items: appliedCount,
      applied_by: req.user.id,
      applied_at: new Date()
    }, { transaction: t });

    await t.commit();

    return success(res, {
      batch: await PriceImportBatch.findByPk(batch.id),
      applied_count: appliedCount,
      skipped_count: skippedCount
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.cancelBatch = async (req, res, next) => {
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status === 'APPLIED') throw new BusinessError('Cannot cancel applied batch');

    await batch.update({ status: 'CANCELLED' });

    // Delete file if exists
    if (batch.file_path) {
      try {
        await fs.unlink(batch.file_path);
      } catch (e) { /* ignore */ }
    }

    return success(res, null, 'Batch cancelled');
  } catch (error) {
    next(error);
  }
};

exports.revertPrices = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const batch = await PriceImportBatch.findByPk(req.params.id);
    if (!batch) throw new NotFoundError('Batch not found');
    if (batch.status !== 'APPLIED') throw new BusinessError('Can only revert applied batches');

    const priceHistories = await ProductPriceHistory.findAll({
      where: { import_batch_id: batch.id }
    });

    for (const history of priceHistories) {
      await Product.update({
        cost_price: history.old_cost_price,
        sell_price: history.old_selling_price
      }, {
        where: { id: history.product_id },
        transaction: t
      });
    }

    await batch.update({ status: 'REVERTED' }, { transaction: t });

    await t.commit();
    return success(res, { reverted_count: priceHistories.length });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { product_id, import_batch_id, start_date, end_date } = req.query;

    const where = {};
    if (product_id) where.product_id = product_id;
    if (import_batch_id) where.import_batch_id = import_batch_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const User = require('../database/models').User;

    const { count, rows } = await ProductPriceHistory.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        { model: User, as: 'changed_by_user', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

// Helper function
async function updateBatchCounts(batchId) {
  const items = await PriceImportItem.findAll({ where: { batch_id: batchId } });
  const matched = items.filter(i => i.match_status === 'MATCHED' || i.match_status === 'MANUAL').length;
  const unmatched = items.length - matched;

  await PriceImportBatch.update(
    { matched_items: matched, unmatched_items: unmatched },
    { where: { id: batchId } }
  );
}
