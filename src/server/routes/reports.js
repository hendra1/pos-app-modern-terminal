const express = require('express');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/reports/shift/:id — detailed shift report
router.get('/shift/:id', async (req, res) => {
  try {
    const shift = await req.db('shifts')
      .join('users', 'shifts.user_id', 'users.id')
      .select('shifts.*', 'users.name as user_name')
      .where('shifts.id', req.params.id)
      .first();
    if (!shift) return res.status(404).json({ error: 'Shift tidak ditemukan' });

    const transactions = await req.db('transactions')
      .where({ shift_id: shift.id, status: 'completed' })
      .orderBy('created_at');

    const voidedCount = await req.db('transactions')
      .where({ shift_id: shift.id, status: 'voided' })
      .count('* as count')
      .first();

    res.json({
      shift,
      transactions,
      summary: {
        total_cash: shift.total_sales_cash,
        total_credit: shift.total_sales_credit,
        total_transactions: shift.total_transactions,
        voided_transactions: voidedCount.count,
        expected_cash: parseFloat(shift.opening_cash) + parseFloat(shift.total_sales_cash),
        actual_cash: shift.closing_cash,
        difference: shift.closing_cash
          ? parseFloat(shift.closing_cash) - (parseFloat(shift.opening_cash) + parseFloat(shift.total_sales_cash))
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/daily — daily sales summary
router.get('/daily', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const shifts = await req.db('shifts')
      .join('users', 'shifts.user_id', 'users.id')
      .select('shifts.*', 'users.name as user_name')
      .whereRaw('DATE(shifts.opened_at) = ?', [targetDate])
      .orderBy('shifts.opened_at');

    const totals = await req.db('transactions')
      .join('shifts', 'transactions.shift_id', 'shifts.id')
      .whereRaw('DATE(shifts.opened_at) = ?', [targetDate])
      .where('transactions.status', 'completed')
      .select(
        req.db.raw('COALESCE(SUM(CASE WHEN payment_type = \'cash\' THEN total ELSE 0 END), 0) as total_cash'),
        req.db.raw('COALESCE(SUM(CASE WHEN payment_type = \'credit\' THEN total ELSE 0 END), 0) as total_credit'),
        req.db.raw('COALESCE(SUM(total), 0) as grand_total'),
        req.db.raw('COUNT(*) as total_transactions')
      )
      .first();

    res.json({ date: targetDate, shifts, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/credits — outstanding credits
router.get('/credits', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const credits = await req.db('transactions')
      .where({ payment_type: 'credit', status: 'completed' })
      .orderBy('created_at', 'desc');

    // Calculate paid amounts for each credit transaction
    const result = [];
    for (const tx of credits) {
      const payments = await req.db('credit_payments')
        .where({ transaction_id: tx.id })
        .sum('amount as total_paid')
        .first();
      const totalPaid = payments.total_paid || 0;
      const remaining = tx.total - totalPaid;
      if (remaining > 0) {
        result.push({ ...tx, total_paid: totalPaid, remaining });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
