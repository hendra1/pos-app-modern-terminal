const bcrypt = require('bcryptjs');

/**
 * Seed demo users and sample products
 */
exports.seed = async function (knex) {
  // ── Clear all tables in correct order ──
  await knex('credit_payments').del();
  await knex('price_history').del();
  await knex('receiving_items').del();
  await knex('receivings').del();
  await knex('transaction_items').del();
  await knex('transactions').del();
  await knex('shifts').del();
  await knex('products').del();
  await knex('categories').del();
  await knex('users').del();

  // ── Demo Users ──
  const salt = bcrypt.genSaltSync(10);
  await knex('users').insert([
    {
      username: 'admin',
      password_hash: bcrypt.hashSync('admin123', salt),
      name: 'Administrator',
      role: 'admin',
      active: true,
    },
    {
      username: 'kasir1',
      password_hash: bcrypt.hashSync('kasir123', salt),
      name: 'Kasir Satu',
      role: 'kasir',
      active: true,
    },
    {
      username: 'kasir2',
      password_hash: bcrypt.hashSync('kasir123', salt),
      name: 'Kasir Dua',
      role: 'kasir',
      active: true,
    },
    {
      username: 'super1',
      password_hash: bcrypt.hashSync('super123', salt),
      name: 'Supervisor',
      role: 'supervisor',
      active: true,
    },
  ]);

  // ── Categories ──
  await knex('categories').insert([
    { id: 1, name: 'Sembako' },
    { id: 2, name: 'Minuman' },
    { id: 3, name: 'Snack' },
    { id: 4, name: 'Rokok' },
    { id: 5, name: 'Sayur & Buah' },
    { id: 6, name: 'Bumbu Dapur' },
    { id: 7, name: 'Kebersihan' },
    { id: 8, name: 'Lain-lain' },
  ]);

  // ── Sample Products ──
  await knex('products').insert([
    // Sembako
    { sku: 'SMB001', name: 'Beras Premium 5kg', category_id: 1, price: 75000, cost: 68000, unit: 'sak', stock_qty: 50, min_stock: 10, allow_decimal_qty: false },
    { sku: 'SMB002', name: 'Gula Pasir 1kg', category_id: 1, price: 16000, cost: 14000, unit: 'kg', stock_qty: 100, min_stock: 20, allow_decimal_qty: true },
    { sku: 'SMB003', name: 'Minyak Goreng 1L', category_id: 1, price: 18000, cost: 15500, unit: 'btl', stock_qty: 80, min_stock: 15, allow_decimal_qty: false },
    { sku: 'SMB004', name: 'Tepung Terigu 1kg', category_id: 1, price: 12000, cost: 10000, unit: 'kg', stock_qty: 60, min_stock: 10, allow_decimal_qty: true },
    { sku: 'SMB005', name: 'Telur Ayam', category_id: 1, price: 28000, cost: 25000, unit: 'kg', stock_qty: 30, min_stock: 5, allow_decimal_qty: true },
    { sku: 'SMB006', name: 'Mie Instan Goreng', category_id: 1, price: 3500, cost: 2800, unit: 'pcs', stock_qty: 200, min_stock: 48, allow_decimal_qty: false },
    { sku: 'SMB007', name: 'Mie Instan Kuah', category_id: 1, price: 3000, cost: 2500, unit: 'pcs', stock_qty: 200, min_stock: 48, allow_decimal_qty: false },

    // Minuman
    { sku: 'MNM001', name: 'Aqua 600ml', category_id: 2, price: 4000, cost: 3000, unit: 'btl', stock_qty: 120, min_stock: 24, allow_decimal_qty: false },
    { sku: 'MNM002', name: 'Teh Botol Sosro 450ml', category_id: 2, price: 5000, cost: 3800, unit: 'btl', stock_qty: 100, min_stock: 24, allow_decimal_qty: false },
    { sku: 'MNM003', name: 'Kopi Sachet', category_id: 2, price: 2500, cost: 1800, unit: 'pcs', stock_qty: 150, min_stock: 30, allow_decimal_qty: false },
    { sku: 'MNM004', name: 'Susu UHT 1L', category_id: 2, price: 18000, cost: 15000, unit: 'kotak', stock_qty: 40, min_stock: 10, allow_decimal_qty: false },

    // Snack
    { sku: 'SNK001', name: 'Chitato 68g', category_id: 3, price: 11000, cost: 9000, unit: 'pcs', stock_qty: 60, min_stock: 12, allow_decimal_qty: false },
    { sku: 'SNK002', name: 'Taro 36g', category_id: 3, price: 5000, cost: 3800, unit: 'pcs', stock_qty: 80, min_stock: 12, allow_decimal_qty: false },
    { sku: 'SNK003', name: 'Roti Tawar', category_id: 3, price: 15000, cost: 12000, unit: 'pcs', stock_qty: 20, min_stock: 5, allow_decimal_qty: false },

    // Rokok
    { sku: 'RKK001', name: 'Gudang Garam Filter 12', category_id: 4, price: 28000, cost: 25000, unit: 'bks', stock_qty: 100, min_stock: 20, allow_decimal_qty: false },
    { sku: 'RKK002', name: 'Djarum Super 12', category_id: 4, price: 24000, cost: 21000, unit: 'bks', stock_qty: 100, min_stock: 20, allow_decimal_qty: false },
    { sku: 'RKK003', name: 'Sampoerna Mild 16', category_id: 4, price: 32000, cost: 28000, unit: 'bks', stock_qty: 80, min_stock: 20, allow_decimal_qty: false },

    // Sayur & Buah
    { sku: 'SYR001', name: 'Bawang Merah', category_id: 5, price: 40000, cost: 35000, unit: 'kg', stock_qty: 15, min_stock: 3, allow_decimal_qty: true },
    { sku: 'SYR002', name: 'Bawang Putih', category_id: 5, price: 35000, cost: 30000, unit: 'kg', stock_qty: 15, min_stock: 3, allow_decimal_qty: true },
    { sku: 'SYR003', name: 'Cabai Merah', category_id: 5, price: 50000, cost: 42000, unit: 'kg', stock_qty: 10, min_stock: 2, allow_decimal_qty: true },

    // Bumbu Dapur
    { sku: 'BMP001', name: 'Kecap Manis 135ml', category_id: 6, price: 8000, cost: 6500, unit: 'btl', stock_qty: 50, min_stock: 10, allow_decimal_qty: false },
    { sku: 'BMP002', name: 'Garam Dapur 250g', category_id: 6, price: 5000, cost: 3500, unit: 'pcs', stock_qty: 60, min_stock: 10, allow_decimal_qty: false },
    { sku: 'BMP003', name: 'Saos Sambal 135ml', category_id: 6, price: 8500, cost: 7000, unit: 'btl', stock_qty: 50, min_stock: 10, allow_decimal_qty: false },

    // Kebersihan
    { sku: 'KBR001', name: 'Sabun Mandi', category_id: 7, price: 4000, cost: 3000, unit: 'pcs', stock_qty: 80, min_stock: 15, allow_decimal_qty: false },
    { sku: 'KBR002', name: 'Shampo Sachet', category_id: 7, price: 1500, cost: 1000, unit: 'pcs', stock_qty: 200, min_stock: 50, allow_decimal_qty: false },
    { sku: 'KBR003', name: 'Deterjen 800g', category_id: 7, price: 15000, cost: 12000, unit: 'pcs', stock_qty: 40, min_stock: 10, allow_decimal_qty: false },
  ]);
};
