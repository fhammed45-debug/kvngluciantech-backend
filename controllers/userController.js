// ============================================
// controllers/userController.js
// User Management Controller
// ============================================

const bcrypt = require('bcryptjs');
const db = require('../db');

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const userController = {

  // ==================== GET ALL USERS ====================
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      // Build query with search
      let query = 'SELECT id, email, name, is_verified, created_at FROM users';
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      const params = [];
      const countParams = [];

      if (search) {
        query += ' WHERE email LIKE ? OR name LIKE ?';
        countQuery += ' WHERE email LIKE ? OR name LIKE ?';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
        countParams.push(searchTerm, searchTerm);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      // Get users
      const [users] = await db.query(query, params);
      
      // Get total count
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Get all users error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users' 
      });
    }
  },

  // ==================== GET USER BY ID ====================
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          error: 'Invalid user ID' 
        });
      }

      const [users] = await db.query(
        'SELECT id, email, name, is_verified, created_at FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        data: users[0]
      });

    } catch (error) {
      console.error('❌ Get user by ID error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user' 
      });
    }
  },

  // ==================== UPDATE USER ====================
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
      const currentUserId = req.user.userId;

      // Check if user is updating their own profile or is admin
      // For now, users can only update their own profile
      if (parseInt(id) !== currentUserId) {
        return res.status(403).json({ 
          error: 'You can only update your own profile' 
        });
      }

      // Validate input
      if (!name && !email) {
        return res.status(400).json({ 
          error: 'At least one field (name or email) is required' 
        });
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Check if user exists
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // Check if new email is already taken
      if (email && email !== users[0].email) {
        const [existingEmail] = await db.query(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email.toLowerCase().trim(), id]
        );

        if (existingEmail.length > 0) {
          return res.status(400).json({ 
            error: 'Email already in use by another account' 
          });
        }
      }

      // Build update query
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }

      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email.toLowerCase().trim());
        // If email changes, mark as unverified
        updates.push('is_verified = ?');
        params.push(0);
      }

      params.push(id);

      await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Fetch updated user
      const [updatedUser] = await db.query(
        'SELECT id, email, name, is_verified, created_at FROM users WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: email ? 'Profile updated. Please verify your new email address.' : 'Profile updated successfully',
        data: updatedUser[0]
      });

    } catch (error) {
      console.error('❌ Update user error:', error);
      res.status(500).json({ 
        error: 'Failed to update user' 
      });
    }
  },

  // ==================== DELETE USER ====================
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.userId;

      // Users can only delete their own account
      if (parseInt(id) !== currentUserId) {
        return res.status(403).json({ 
          error: 'You can only delete your own account' 
        });
      }

      // Check if user exists
      const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
      
      if (users.length === 0) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // Delete user (cascade will delete related records)
      await db.query('DELETE FROM users WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete user error:', error);
      res.status(500).json({ 
        error: 'Failed to delete user' 
      });
    }
  },

  // ==================== GET USER PROFILE (Self) ====================
  getProfile: async (req, res) => {
    try {
      const userId = req.user.userId;

      const [users] = await db.query(
        'SELECT id, email, name, is_verified, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        data: users[0]
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch profile' 
      });
    }
  },

  // ==================== UPDATE PROFILE (Self) ====================
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ 
          error: 'Name is required' 
        });
      }

      await db.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [name, userId]
      );

      const [updatedUser] = await db.query(
        'SELECT id, email, name, is_verified, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser[0]
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile' 
      });
    }
  },

  // ==================== CHANGE EMAIL ====================
  changeEmail: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { newEmail, password } = req.body;

      // Validate input
      if (!newEmail || !password) {
        return res.status(400).json({ 
          error: 'New email and password are required' 
        });
      }

      if (!isValidEmail(newEmail)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Get user
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (users.length === 0) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      const user = users[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Incorrect password' 
        });
      }

      // Check if same email
      if (newEmail.toLowerCase().trim() === user.email) {
        return res.status(400).json({ 
          error: 'New email must be different from current email' 
        });
      }

      // Check if email is taken
      const [existingEmail] = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [newEmail.toLowerCase().trim()]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ 
          error: 'Email already in use' 
        });
      }

      // Update email and mark as unverified
      await db.query(
        'UPDATE users SET email = ?, is_verified = 0 WHERE id = ?',
        [newEmail.toLowerCase().trim(), userId]
      );

      res.json({
        success: true,
        message: 'Email updated successfully. Please verify your new email address.'
      });

    } catch (error) {
      console.error('❌ Change email error:', error);
      res.status(500).json({ 
        error: 'Failed to change email' 
      });
    }
  },

  // ==================== GET USER STATISTICS ====================
  getUserStats: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Get order count
      const [orderCount] = await db.query(
        'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
        [userId]
      );

      // Get subscription status
      const [subscriptions] = await db.query(
        'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
        [userId, 'active']
      );

      // Get total spent
      const [totalSpent] = await db.query(
        'SELECT SUM(total) as total FROM orders WHERE user_id = ?',
        [userId]
      );

      res.json({
        success: true,
        data: {
          totalOrders: orderCount[0].total,
          hasActiveSubscription: subscriptions.length > 0,
          activeSubscription: subscriptions[0] || null,
          totalSpent: totalSpent[0].total || 0
        }
      });

    } catch (error) {
      console.error('❌ Get user stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user statistics' 
      });
    }
  }

};

module.exports = userController;