// ============================================
// routes/orderRoutes.js
// Order Management Routes
// ============================================

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../auth/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ==================== ORDER ROUTES ====================
// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)

// Get all orders (admin - you can add admin middleware later)
router.get('/all', orderController.getAllOrders);

// Get order statistics
router.get('/stats', orderController.getOrderStats);

// Get user's orders (with pagination and filters)
router.get('/', orderController.getUserOrders);

// Get specific order by ID - This must come LAST among GET routes
router.get('/:id', orderController.getOrderById);

// Create new order
router.post('/', orderController.createOrder);

// Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// Cancel order
router.post('/:id/cancel', orderController.cancelOrder);

// Delete order
router.delete('/:id', orderController.deleteOrder);

module.exports = router;