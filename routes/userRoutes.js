// ============================================
// routes/userRoutes.js
// User Management Routes
// ============================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../auth/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ==================== USER PROFILE ROUTES ====================
// Get own profile
router.get('/profile', userController.getProfile);

// Update own profile
router.put('/profile', userController.updateProfile);

// Change email
router.post('/change-email', userController.changeEmail);

// Get user statistics
router.get('/stats', userController.getUserStats);

// ==================== USER MANAGEMENT ROUTES ====================
// Get all users (with pagination and search)
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;