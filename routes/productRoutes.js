// ============================================
// routes/productRoutes.js
// Product Management Routes
// ============================================

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../auth/authMiddleware');

// ==================== PUBLIC ROUTES ====================
// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)

// Get low stock products (public)
router.get('/alerts/low-stock', productController.getLowStockProducts);

// Get product statistics (public)
router.get('/stats/overview', productController.getProductStats);

// Get all products (public - anyone can view)
router.get('/', productController.getAllProducts);

// Get product by ID (public) - This must come LAST among GET routes
router.get('/:id', productController.getProductById);

// ==================== PROTECTED ROUTES ====================
// Create product (requires authentication)
router.post('/', authMiddleware, productController.createProduct);

// Update product (requires authentication)
router.put('/:id', authMiddleware, productController.updateProduct);

// Delete product (requires authentication)
router.delete('/:id', authMiddleware, productController.deleteProduct);

// Update product stock (requires authentication)
router.patch('/:id/stock', authMiddleware, productController.updateStock);

module.exports = router;