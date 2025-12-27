'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all suppliers
    const [suppliers] = await queryInterface.sequelize.query(
      `SELECT id, code, name FROM suppliers;`
    );

    // Get all products
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku, name, cost_price FROM products;`
    );

    if (suppliers.length === 0 || products.length === 0) {
      console.log('No suppliers or products found, skipping');
      return;
    }

    const supplierProducts = [];

    // Royal Canin - Dog and Cat food
    const royalCanin = suppliers.find(s => s.code === 'SUP001');
    if (royalCanin) {
      const dogCatProducts = products.filter(p =>
        p.sku.startsWith('DF') || p.sku.startsWith('CF')
      );
      dogCatProducts.forEach((product, idx) => {
        supplierProducts.push({
          id: uuidv4(),
          supplier_id: royalCanin.id,
          product_id: product.id,
          supplier_code: `RC-${product.sku}`,
          supplier_description: `Royal Canin - ${product.name}`,
          last_cost_price: parseFloat(product.cost_price),
          is_preferred: idx < 3, // First 3 are preferred from this supplier
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    // Purina - Also has dog and cat food (alternative supplier)
    const purina = suppliers.find(s => s.code === 'SUP002');
    if (purina) {
      const dogCatProducts = products.filter(p =>
        p.sku.startsWith('DF') || p.sku.startsWith('CF')
      );
      dogCatProducts.slice(0, 3).forEach((product) => {
        supplierProducts.push({
          id: uuidv4(),
          supplier_id: purina.id,
          product_id: product.id,
          supplier_code: `PUR-${product.sku}`,
          supplier_description: `Purina - ${product.name}`,
          last_cost_price: parseFloat(product.cost_price) * 0.95, // 5% cheaper
          is_preferred: false,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    // Vital Can - Dog food only
    const vitalCan = suppliers.find(s => s.code === 'SUP003');
    if (vitalCan) {
      const dogProducts = products.filter(p => p.sku.startsWith('DF'));
      dogProducts.forEach((product) => {
        supplierProducts.push({
          id: uuidv4(),
          supplier_id: vitalCan.id,
          product_id: product.id,
          supplier_code: `VC-${product.sku}`,
          supplier_description: `Vital Can - ${product.name}`,
          last_cost_price: parseFloat(product.cost_price) * 0.90, // 10% cheaper
          is_preferred: false,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    // Accesorios Pet Shop - Accessories only
    const accesorios = suppliers.find(s => s.code === 'SUP005');
    if (accesorios) {
      const accessoryProducts = products.filter(p => p.sku.startsWith('ACC'));
      accessoryProducts.forEach((product, idx) => {
        supplierProducts.push({
          id: uuidv4(),
          supplier_id: accesorios.id,
          product_id: product.id,
          supplier_code: `APS-${product.sku}`,
          supplier_description: `Accesorios PS - ${product.name}`,
          last_cost_price: parseFloat(product.cost_price),
          is_preferred: true, // All accessories from this supplier are preferred
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    // Ken-L Ration - Treats
    const kenL = suppliers.find(s => s.code === 'SUP004');
    if (kenL) {
      const treatProducts = products.filter(p => p.sku.startsWith('TRT'));
      treatProducts.forEach((product) => {
        supplierProducts.push({
          id: uuidv4(),
          supplier_id: kenL.id,
          product_id: product.id,
          supplier_code: `KL-${product.sku}`,
          supplier_description: `Ken-L - ${product.name}`,
          last_cost_price: parseFloat(product.cost_price),
          is_preferred: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }

    if (supplierProducts.length > 0) {
      await queryInterface.bulkInsert('supplier_products', supplierProducts);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('supplier_products', null, {});
  }
};
