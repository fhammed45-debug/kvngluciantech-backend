// ============================================
// controllers/productController.js
// Product Management Controller
// ============================================

const db = require('../db');

const productController = {

  // ==================== GET ALL PRODUCTS ====================
  getAllProducts: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        minPrice, 
        maxPrice,
        inStock 
      } = req.query;

      const offset = (page - 1) * limit;

      // Build query
      let query = 'SELECT * FROM products WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
      const params = [];
      const countParams = [];

      // Search filter
      if (search) {
        query += ' AND name LIKE ?';
        countQuery += ' AND name LIKE ?';
        const searchTerm = `%${search}%`;
        params.push(searchTerm);
        countParams.push(searchTerm);
      }

      // Price filters
      if (minPrice) {
        query += ' AND price >= ?';
        countQuery += ' AND price >= ?';
        params.push(parseFloat(minPrice));
        countParams.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        query += ' AND price <= ?';
        countQuery += ' AND price <= ?';
        params.push(parseFloat(maxPrice));
        countParams.push(parseFloat(maxPrice));
      }

      // Stock filter
      if (inStock === 'true') {
        query += ' AND stock > 0';
        countQuery += ' AND stock > 0';
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      // Execute queries
      const [products] = await db.query(query, params);
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Get all products error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch products' 
      });
    }
  },

  // ==================== GET PRODUCT BY ID ====================
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          error: 'Invalid product ID' 
        });
      }

      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ 
          error: 'Product not found' 
        });
      }

      res.json({
        success: true,
        data: products[0]
      });

    } catch (error) {
      console.error('❌ Get product by ID error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch product' 
      });
    }
  },

  // ==================== CREATE PRODUCT ====================
  createProduct: async (req, res) => {
    try {
      const { name, price, stock } = req.body;

      // Validation
      if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ 
          error: 'Name, price, and stock are required' 
        });
      }

      if (price < 0) {
        return res.status(400).json({ 
          error: 'Price cannot be negative' 
        });
      }

      if (stock < 0) {
        return res.status(400).json({ 
          error: 'Stock cannot be negative' 
        });
      }

      // Check if product with same name exists
      const [existing] = await db.query(
        'SELECT id FROM products WHERE name = ?',
        [name.trim()]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          error: 'Product with this name already exists' 
        });
      }

      // Create product
      const [result] = await db.query(
        'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
        [name.trim(), parseFloat(price), parseInt(stock)]
      );

      // Fetch created product
      const [product] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product[0]
      });

    } catch (error) {
      console.error('❌ Create product error:', error);
      res.status(500).json({ 
        error: 'Failed to create product' 
      });
    }
  },

  // ==================== UPDATE PRODUCT ====================
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, stock } = req.body;

      // Check if product exists
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ 
          error: 'Product not found' 
        });
      }

      // Validation
      if (price !== undefined && price < 0) {
        return res.status(400).json({ 
          error: 'Price cannot be negative' 
        });
      }

      if (stock !== undefined && stock < 0) {
        return res.status(400).json({ 
          error: 'Stock cannot be negative' 
        });
      }

      // Build update query
      const updates = [];
      const params = [];

      if (name !== undefined) {
        // Check if new name already exists
        const [existing] = await db.query(
          'SELECT id FROM products WHERE name = ? AND id != ?',
          [name.trim(), id]
        );

        if (existing.length > 0) {
          return res.status(400).json({ 
            error: 'Product with this name already exists' 
          });
        }

        updates.push('name = ?');
        params.push(name.trim());
      }

      if (price !== undefined) {
        updates.push('price = ?');
        params.push(parseFloat(price));
      }

      if (stock !== undefined) {
        updates.push('stock = ?');
        params.push(parseInt(stock));
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          error: 'No fields to update' 
        });
      }

      params.push(id);

      await db.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Fetch updated product
      const [updatedProduct] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct[0]
      });

    } catch (error) {
      console.error('❌ Update product error:', error);
      res.status(500).json({ 
        error: 'Failed to update product' 
      });
    }
  },

  // ==================== DELETE PRODUCT ====================
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ 
          error: 'Product not found' 
        });
      }

      await db.query('DELETE FROM products WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete product error:', error);
      res.status(500).json({ 
        error: 'Failed to delete product' 
      });
    }
  },

  // ==================== UPDATE STOCK ====================
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

      if (stock === undefined) {
        return res.status(400).json({ 
          error: 'Stock value is required' 
        });
      }

      // Get current product
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ 
          error: 'Product not found' 
        });
      }

      const product = products[0];
      let newStock;

      switch (operation) {
        case 'add':
          newStock = product.stock + parseInt(stock);
          break;
        case 'subtract':
          newStock = product.stock - parseInt(stock);
          if (newStock < 0) {
            return res.status(400).json({ 
              error: 'Insufficient stock' 
            });
          }
          break;
        case 'set':
        default:
          newStock = parseInt(stock);
          if (newStock < 0) {
            return res.status(400).json({ 
              error: 'Stock cannot be negative' 
            });
          }
          break;
      }

      await db.query(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, id]
      );

      const [updatedProduct] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: updatedProduct[0]
      });

    } catch (error) {
      console.error('❌ Update stock error:', error);
      res.status(500).json({ 
        error: 'Failed to update stock' 
      });
    }
  },

  // ==================== GET LOW STOCK PRODUCTS ====================
  getLowStockProducts: async (req, res) => {
    try {
      const { threshold = 10 } = req.query;

      const [products] = await db.query(
        'SELECT * FROM products WHERE stock <= ? ORDER BY stock ASC',
        [parseInt(threshold)]
      );

      res.json({
        success: true,
        data: products,
        count: products.length
      });

    } catch (error) {
      console.error('❌ Get low stock products error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch low stock products' 
      });
    }
  },

  // ==================== GET PRODUCT STATISTICS ====================
  getProductStats: async (req, res) => {
    try {
      // Total products
      const [totalProducts] = await db.query(
        'SELECT COUNT(*) as total FROM products'
      );

      // Total value
      const [totalValue] = await db.query(
        'SELECT SUM(price * stock) as total FROM products'
      );

      // Out of stock
      const [outOfStock] = await db.query(
        'SELECT COUNT(*) as total FROM products WHERE stock = 0'
      );

      // Low stock (< 10)
      const [lowStock] = await db.query(
        'SELECT COUNT(*) as total FROM products WHERE stock > 0 AND stock <= 10'
      );

      res.json({
        success: true,
        data: {
          totalProducts: totalProducts[0].total,
          totalInventoryValue: totalValue[0].total || 0,
          outOfStock: outOfStock[0].total,
          lowStock: lowStock[0].total
        }
      });

    } catch (error) {
      console.error('❌ Get product stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch product statistics' 
      });
    }
  }

};

module.exports = productController;