// ============================================
// routes/index.js
// Main Router - Combines All Routes
// ============================================

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('../auth/authRoutes');  // ✅ Changed to lowercase
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');

// ============================================
// API DOCUMENTATION ROUTE
// ============================================
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      subscriptions: '/api/subscriptions'
    },
    documentation: 'Visit each endpoint for more details'
  });
});

// ============================================
// MOUNT ALL ROUTES
// ============================================
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/subscriptions', subscriptionRoutes);

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;