const express = require('express');
const router = express.Router();

// Helper: generate receipt number
function generateReceiptNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TRX${date}${time}${rand}`;
}

// POST /api/transactions — create a new transaction
router.post('/', async (req, res) => {
  const trx = await req.db.transaction();
  try {
    const { shift_id, items, payment_type, customer_name, discount, paid, notes } = req.body;

    if (!shift_id || !items || !items.length) {
      await trx.rollback();
      return res.status(400).json({ error: 'Shift dan item transaksi wajib diisi' });
    }

    // Verify shift is open
    const shift = await trx('shifts').where({ id: shift_id, status: 'open' }).first();
    if (!shift) {
      await trx.rollback();
      return res.status(400).json({ error: 'Shift tidak ditemukan atau sudah ditutup' });
    }

    // Calculate totals and validate stock
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await trx('products').where({ id: item.product_id }).first();
      if (!product) {
        await trx.rollback();
        return res.status(400).json({ error: `Produk ID ${item.product_id} tidak ditemukan` });
      }

      // Check stock
      if (product.stock_qty < item.qty) {
        await trx.rollback();
        return res.status(400).json({
          error: `Stok ${product.name} tidak cukup. Tersedia: ${product.stock_qty} ${product.unit}`,
        });
      }

      const itemSubtotal = (item.unit_price || product.price) * item.qty - (item.discount || 0);
      subtotal += itemSubtotal;

      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        qty: item.qty,
        unit: product.unit,
        unit_price: item.unit_price || product.price,
        discount: item.discount || 0,
        subtotal: itemSubtotal,
      });

      // Reduce stock
      await trx('products')
        .where({ id: product.id })
        .update({ stock_qty: product.stock_qty - item.qty });
    }

    const totalDiscount = discount || 0;
    const total = subtotal - totalDiscount;
    const paidAmount = paid || total;
    const changeAmount = payment_type === 'cash' ? Math.max(0, paidAmount - total) : 0;

    // Create transaction
    const [txId] = await trx('transactions').insert({
      shift_id,
      user_id: req.user.id,
      receipt_no: generateReceiptNo(),
      payment_type: payment_type || 'cash',
      customer_name: customer_name || null,
      subtotal,
      discount: totalDiscount,
      total,
      paid: paidAmount,
      change_amount: changeAmount,
      status: 'completed',
      notes: notes || null,
    });

    // Create transaction items
    for (const item of processedItems) {
      await trx('transaction_items').insert({ transaction_id: txId, ...item });
    }

    await trx.commit();

    // Fetch full transaction
    const transaction = await req.db('transactions').where({ id: txId }).first();
    const txItems = await req.db('transaction_items').where({ transaction_id: txId });

    res.status(201).json({ transaction, items: txItems });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions/:id/void — void a transaction
router.post('/:id/void', async (req, res) => {
  const trx = await req.db.transaction();
  try {
    const transaction = await trx('transactions')
      .where({ id: req.params.id, status: 'completed' })
      .first();
    if (!transaction) {
      await trx.rollback();
      return res.status(404).json({ error: 'Transaksi tidak ditemukan atau sudah dibatalkan' });
    }

    // Restore stock
    const items = await trx('transaction_items').where({ transaction_id: transaction.id });
    for (const item of items) {
      await trx('products')
        .where({ id: item.product_id })
        .increment('stock_qty', item.qty);
    }

    // Mark as voided
    await trx('transactions')
      .where({ id: transaction.id })
      .update({ status: 'voided' });

    await trx.commit();
    res.json({ message: 'Transaksi berhasil dibatalkan' });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions — list transactions
router.get('/', async (req, res) => {
  try {
    const { shift_id, payment_type, status, date } = req.query;
    let query = req.db('transactions')
      .join('users', 'transactions.user_id', 'users.id')
      .select('transactions.*', 'users.name as user_name');

    if (shift_id) query = query.where('transactions.shift_id', shift_id);
    if (payment_type) query = query.where('transactions.payment_type', payment_type);
    if (status) query = query.where('transactions.status', status);
    if (date) query = query.whereRaw('DATE(transactions.created_at) = ?', [date]);

    const transactions = await query.orderBy('transactions.created_at', 'desc');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/:id — get transaction detail
router.get('/:id', async (req, res) => {
  try {
    const transaction = await req.db('transactions')
      .join('users', 'transactions.user_id', 'users.id')
      .select('transactions.*', 'users.name as user_name')
      .where('transactions.id', req.params.id)
      .first();
    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const items = await req.db('transaction_items')
      .where({ transaction_id: transaction.id });

    res.json({ transaction, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
