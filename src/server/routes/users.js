const express = require('express');
const bcrypt = require('bcryptjs');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/users — list all users (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const users = await req.db('users')
      .select('id', 'username', 'name', 'role', 'active', 'created_at')
      .orderBy('name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — create user (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, dan nama wajib diisi' });
    }
    const salt = bcrypt.genSaltSync(10);
    const [id] = await req.db('users').insert({
      username,
      password_hash: bcrypt.hashSync(password, salt),
      name,
      role: role || 'kasir',
    });
    const user = await req.db('users')
      .select('id', 'username', 'name', 'role', 'active', 'created_at')
      .where({ id }).first();
    res.status(201).json(user);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update user (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id;
    delete updates.password_hash;
    if (updates.password) {
      const salt = bcrypt.genSaltSync(10);
      updates.password_hash = bcrypt.hashSync(updates.password, salt);
      delete updates.password;
    }
    await req.db('users').where({ id: req.params.id }).update(updates);
    const user = await req.db('users')
      .select('id', 'username', 'name', 'role', 'active', 'created_at')
      .where({ id: req.params.id }).first();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
