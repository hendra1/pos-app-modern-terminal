const express = require('express');
const router = express.Router();

// GET /api/shifts/current — get current open shift for user
router.get('/current', async (req, res) => {
  try {
    const shift = await req.db('shifts')
      .where({ user_id: req.user.id, status: 'open' })
      .first();
    res.json(shift || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/open — open a new shift
router.post('/open', async (req, res) => {
  try {
    // Check if user already has an open shift
    const existing = await req.db('shifts')
      .where({ user_id: req.user.id, status: 'open' })
      .first();
    if (existing) {
      return res.status(400).json({ error: 'Anda masih memiliki shift yang terbuka' });
    }

    const { shift_number, opening_cash } = req.body;
    if (!shift_number || opening_cash === undefined) {
      return res.status(400).json({ error: 'Nomor shift dan modal awal wajib diisi' });
    }

    const [id] = await req.db('shifts').insert({
      user_id: req.user.id,
      shift_number,
      opening_cash,
      status: 'open',
    });

    const shift = await req.db('shifts').where({ id }).first();
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/:id/close — close a shift
router.post('/:id/close', async (req, res) => {
  try {
    const shift = await req.db('shifts')
      .where({ id: req.params.id, user_id: req.user.id, status: 'open' })
      .first();
    if (!shift) {
      return res.status(404).json({ error: 'Shift tidak ditemukan atau sudah ditutup' });
    }

    const { closing_cash } = req.body;

    // Calculate totals from transactions
    const totals = await req.db('transactions')
      .where({ shift_id: shift.id, status: 'completed' })
      .select(
        req.db.raw('COALESCE(SUM(CASE WHEN payment_type = \'cash\' THEN total ELSE 0 END), 0) as total_cash'),
        req.db.raw('COALESCE(SUM(CASE WHEN payment_type = \'credit\' THEN total ELSE 0 END), 0) as total_credit'),
        req.db.raw('COUNT(*) as total_trx')
      )
      .first();

    await req.db('shifts').where({ id: shift.id }).update({
      closing_cash: closing_cash || 0,
      total_sales_cash: totals.total_cash,
      total_sales_credit: totals.total_credit,
      total_transactions: totals.total_trx,
      status: 'closed',
      closed_at: new Date().toISOString(),
    });

    const closed = await req.db('shifts').where({ id: shift.id }).first();
    res.json(closed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shifts/:id/summary — shift summary with details
router.get('/:id/summary', async (req, res) => {
  try {
    const shift = await req.db('shifts')
      .join('users', 'shifts.user_id', 'users.id')
      .select('shifts.*', 'users.name as user_name')
      .where('shifts.id', req.params.id)
      .first();
    if (!shift) return res.status(404).json({ error: 'Shift tidak ditemukan' });

    const transactions = await req.db('transactions')
      .where({ shift_id: shift.id })
      .orderBy('created_at');

    res.json({ shift, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
