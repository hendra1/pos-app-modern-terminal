const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const shiftRoutes = require('./routes/shifts');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const receivingRoutes = require('./routes/receivings');
const userRoutes = require('./routes/users');
const { authMiddleware } = require('./middleware/auth');

function createServer(db) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Make db accessible to routes
  app.use((req, _res, next) => {
    req.db = db;
    next();
  });

  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes
  app.use('/api/products', authMiddleware, productRoutes);
  app.use('/api/shifts', authMiddleware, shiftRoutes);
  app.use('/api/transactions', authMiddleware, transactionRoutes);
  app.use('/api/reports', authMiddleware, reportRoutes);
  app.use('/api/receivings', authMiddleware, receivingRoutes);
  app.use('/api/users', authMiddleware, userRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files for renderer testing
  app.use(express.static(path.join(__dirname, '../renderer')));

  return app;
}

module.exports = { createServer };
