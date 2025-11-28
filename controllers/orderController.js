// ============================================
// controllers/orderController.js
// Order Management Controller
// ============================================

const db = require('../db');

const orderController = {

  // ==================== GET USER ORDERS ====================
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM orders WHERE user_id = ?';
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
      const params = [userId];
      const countParams = [userId];

      // Filter by status if provided
      if (status) {
        query += ' AND status = ?';
        countQuery += ' AND status = ?';
        params.push(status);
        countParams.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [orders] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Get user orders error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch orders' 
      });
    }
  },

  // ==================== GET ALL ORDERS (Admin) ====================
  getAllOrders: async (req, res) => {
    try {
      const { page = 1, limit = 10, userId, status } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT o.*, u.email, u.name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
      const params = [];
      const countParams = [];

      if (userId) {
        query += ' AND o.user_id = ?';
        countQuery += ' AND user_id = ?';
        params.push(userId);
        countParams.push(userId);
      }

      if (status) {
        query += ' AND o.status = ?';
        countQuery += ' AND status = ?';
        params.push(status);
        countParams.push(status);
      }

      query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [orders] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Get all orders error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch orders' 
      });
    }
  },

  // ==================== GET ORDER BY ID ====================
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          error: 'Invalid order ID' 
        });
      }

      const [orders] = await db.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({ 
          error: 'Order not found' 
        });
      }

      res.json({
        success: true,
        data: orders[0]
      });

    } catch (error) {
      console.error('❌ Get order by ID error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch order' 
      });
    }
  },

  // ==================== CREATE ORDER ====================
  createOrder: async (req, res) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const userId = req.user.userId;
      const { items, shippingAddress, paymentMethod } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Order must contain at least one item' 
        });
      }

      let total = 0;
      const orderItems = [];

      // Process each item
      for (const item of items) {
        const { productId, quantity } = item;

        if (!productId || !quantity || quantity <= 0) {
          await connection.rollback();
          return res.status(400).json({ 
            error: 'Invalid product or quantity' 
          });
        }

        // Get product
        const [products] = await connection.query(
          'SELECT * FROM products WHERE id = ?',
          [productId]
        );

        if (products.length === 0) {
          await connection.rollback();
          return res.status(404).json({ 
            error: `Product with ID ${productId} not found` 
          });
        }

        const product = products[0];

        // Check stock
        if (product.stock < quantity) {
          await connection.rollback();
          return res.status(400).json({ 
            error: `Insufficient stock for product: ${product.name}. Available: ${product.stock}` 
          });
        }

        // Update stock
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [quantity, productId]
        );

        const itemTotal = product.price * quantity;
        total += itemTotal;

        orderItems.push({
          productId,
          productName: product.name,
          price: product.price,
          quantity,
          subtotal: itemTotal
        });
      }

      // Create order
      const [result] = await connection.query(
        'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
        [userId, total, 'pending']
      );

      const orderId = result.insertId;

      // If you have an order_items table, insert items here
      // For now, we're storing in JSON or separate table

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId,
          total,
          items: orderItems,
          status: 'pending'
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('❌ Create order error:', error);
      res.status(500).json({ 
        error: 'Failed to create order' 
      });
    } finally {
      connection.release();
    }
  },

  // ==================== UPDATE ORDER STATUS ====================
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.userId;

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Check if order exists and belongs to user
      const [orders] = await db.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({ 
          error: 'Order not found' 
        });
      }

      const order = orders[0];

      // Users can only cancel their own pending orders
      if (status === 'cancelled' && order.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Only pending orders can be cancelled' 
        });
      }

      await db.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id]
      );

      const [updatedOrder] = await db.query(
        'SELECT * FROM orders WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder[0]
      });

    } catch (error) {
      console.error('❌ Update order status error:', error);
      res.status(500).json({ 
        error: 'Failed to update order status' 
      });
    }
  },

  // ==================== CANCEL ORDER ====================
  cancelOrder: async (req, res) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const userId = req.user.userId;

      // Get order
      const [orders] = await connection.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          error: 'Order not found' 
        });
      }

      const order = orders[0];

      // Can only cancel pending orders
      if (order.status !== 'pending') {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Only pending orders can be cancelled' 
        });
      }

      // Update order status
      await connection.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['cancelled', id]
      );

      // TODO: Restore product stock if you stored order items

      await connection.commit();

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      await connection.rollback();
      console.error('❌ Cancel order error:', error);
      res.status(500).json({ 
        error: 'Failed to cancel order' 
      });
    } finally {
      connection.release();
    }
  },

  // ==================== DELETE ORDER ====================
  deleteOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const [orders] = await db.query(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({ 
          error: 'Order not found' 
        });
      }

      await db.query('DELETE FROM orders WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Order deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete order error:', error);
      res.status(500).json({ 
        error: 'Failed to delete order' 
      });
    }
  },

  // ==================== GET ORDER STATISTICS ====================
  getOrderStats: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Total orders
      const [totalOrders] = await db.query(
        'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
        [userId]
      );

      // Total spent
      const [totalSpent] = await db.query(
        'SELECT SUM(total) as total FROM orders WHERE user_id = ? AND status != ?',
        [userId, 'cancelled']
      );

      // Orders by status
      const [ordersByStatus] = await db.query(
        'SELECT status, COUNT(*) as count FROM orders WHERE user_id = ? GROUP BY status',
        [userId]
      );

      // Recent orders
      const [recentOrders] = await db.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      res.json({
        success: true,
        data: {
          totalOrders: totalOrders[0].total,
          totalSpent: totalSpent[0].total || 0,
          ordersByStatus: ordersByStatus,
          recentOrders: recentOrders
        }
      });

    } catch (error) {
      console.error('❌ Get order stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch order statistics' 
      });
    }
  }

};

module.exports = orderController;