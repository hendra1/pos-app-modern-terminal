const express = require('express');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/receivings — create a goods receiving entry
router.post('/', requireRole('admin', 'supervisor'), async (req, res) => {
  const trx = await req.db.transaction();
  try {
    const { supplier, reference_no, notes, items } = req.body;
    if (!items || !items.length) {
      await trx.rollback();
      return res.status(400).json({ error: 'Item penerimaan wajib diisi' });
    }

    let total = 0;
    const processedItems = [];
    for (const item of items) {
      const subtotal = item.qty * item.cost;
      total += subtotal;
      processedItems.push({ ...item, subtotal });
    }

    const [id] = await trx('receivings').insert({
      user_id: req.user.id,
      supplier: supplier || null,
      reference_no: reference_no || null,
      notes: notes || null,
      total,
    });

    for (const item of processedItems) {
      await trx('receiving_items').insert({
        receiving_id: id,
        product_id: item.product_id,
        qty: item.qty,
        cost: item.cost,
        subtotal: item.subtotal,
      });

      // Update stock
      await trx('products')
        .where({ id: item.product_id })
        .increment('stock_qty', item.qty);
    }

    await trx.commit();
    const receiving = await req.db('receivings').where({ id }).first();
    const recItems = await req.db('receiving_items').where({ receiving_id: id });
    res.status(201).json({ receiving, items: recItems });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({ error: err.message });
  }
});

// GET /api/receivings — list receivings
router.get('/', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const receivings = await req.db('receivings')
      .join('users', 'receivings.user_id', 'users.id')
      .select('receivings.*', 'users.name as user_name')
      .orderBy('receivings.created_at', 'desc');
    res.json(receivings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
