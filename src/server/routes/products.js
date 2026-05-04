const express = require('express');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/products — list all products
router.get('/', async (req, res) => {
  try {
    const { search, category_id, active } = req.query;
    let query = req.db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select('products.*', 'categories.name as category_name');

    if (search) {
      query = query.where(function () {
        this.where('products.name', 'like', `%${search}%`)
          .orWhere('products.sku', 'like', `%${search}%`)
          .orWhere('products.barcode', 'like', `%${search}%`);
      });
    }
    if (category_id) query = query.where('products.category_id', category_id);
    if (active !== undefined) query = query.where('products.active', active === 'true' ? 1 : 0);

    const products = await query.orderBy('products.name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await req.db('categories').orderBy('name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await req.db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select('products.*', 'categories.name as category_name')
      .where('products.id', req.params.id)
      .first();
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — create product
router.post('/', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { sku, barcode, name, category_id, price, cost, unit, stock_qty, min_stock, allow_decimal_qty } = req.body;
    if (!sku || !name || price === undefined) {
      return res.status(400).json({ error: 'SKU, nama, dan harga wajib diisi' });
    }
    const [id] = await req.db('products').insert({
      sku, barcode, name, category_id, price, cost: cost || 0, unit: unit || 'pcs',
      stock_qty: stock_qty || 0, min_stock: min_stock || 0,
      allow_decimal_qty: allow_decimal_qty || false,
    });
    const product = await req.db('products').where({ id }).first();
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'SKU sudah digunakan' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — update product
router.put('/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const product = await req.db('products').where({ id: req.params.id }).first();
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.id;
    delete updates.created_at;

    // Track price changes
    if (updates.price !== undefined && updates.price !== product.price) {
      await req.db('price_history').insert({
        product_id: product.id,
        old_price: product.price,
        new_price: updates.price,
        changed_by: req.user.id,
      });
    }

    await req.db('products').where({ id: req.params.id }).update(updates);
    const updated = await req.db('products').where({ id: req.params.id }).first();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
