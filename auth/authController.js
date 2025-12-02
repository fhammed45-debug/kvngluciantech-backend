// ============================================
// auth/authController.js
// Complete Authentication Controller (FIXED WITH SEQUELIZE)
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, EmailVerification, PasswordReset } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// AUTHENTICATION CONTROLLER
// ============================================

const authController = {
  
  // ==================== REGISTER ====================
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;

      // ===== VALIDATION =====
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      // ===== CHECK IF USER EXISTS =====
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'An account with this email already exists' 
        });
      }

      // ===== HASH PASSWORD =====
      const hashedPassword = await bcrypt.hash(password, 10);

      // ===== CREATE USER =====
      const user = await User.create({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name || '',
        is_verified: false
      });

      // ===== GENERATE VERIFICATION CODE =====
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await EmailVerification.create({
        user_id: user.id,
        token: verificationCode,
        expires_at: expiresAt,
        is_used: false
      });

      // ===== SEND VERIFICATION EMAIL =====
      try {
        await sendVerificationEmail(email, verificationCode);
        console.log(`✅ Verification email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError.message);
      }

      // ===== RESPONSE =====
      res.status(201).json({ 
        success: true,
        message: 'Registration successful! Please check your email for a verification code.',
        data: {
          userId: user.id,
          email: user.email,
          name: user.name
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed. Please try again later.' 
      });
    }
  },

  // ==================== LOGIN ====================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // ===== VALIDATION =====
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      // ===== FIND USER =====
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // ===== CHECK EMAIL VERIFICATION =====
      if (!user.is_verified) {
        return res.status(403).json({ 
          error: 'Please verify your email before logging in',
          needsVerification: true,
          email: user.email
        });
      }

      // ===== VERIFY PASSWORD =====
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // ===== GENERATE TOKEN =====
      const token = generateToken(user);

      // ===== RESPONSE =====
      res.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.is_verified,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        error: 'Login failed. Please try again later.' 
      });
    }
  },

  // ==================== VERIFY EMAIL ====================
  verifyEmail: async (req, res) => {
    try {
      const { email, code } = req.body;

      // ===== VALIDATION =====
      if (!email || !code) {
        return res.status(400).json({ 
          error: 'Email and verification code are required' 
        });
      }

      if (code.length !== 6) {
        return res.status(400).json({ 
          error: 'Verification code must be 6 digits' 
        });
      }

      // ===== FIND USER =====
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // ===== CHECK IF ALREADY VERIFIED =====
      if (user.is_verified) {
        return res.status(400).json({ 
          error: 'Email is already verified' 
        });
      }

      // ===== VERIFY CODE =====
      const verification = await EmailVerification.findOne({
        where: {
          user_id: user.id,
          token: code,
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        },
        order: [['created_at', 'DESC']]
      });

      if (!verification) {
        return res.status(400).json({ 
          error: 'Invalid or expired verification code' 
        });
      }

      // ===== UPDATE USER =====
      await user.update({ is_verified: true });
      await verification.update({ is_used: true });

      // ===== GENERATE TOKEN =====
      const token = generateToken(user);

      // ===== RESPONSE =====
      res.json({
        success: true,
        message: 'Email verified successfully! You are now logged in.',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: true
        }
      });

    } catch (error) {
      console.error('❌ Email verification error:', error);
      res.status(500).json({ 
        error: 'Verification failed. Please try again later.' 
      });
    }
  },

  // ==================== RESEND VERIFICATION ====================
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;

      // ===== VALIDATION =====
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      // ===== FIND USER =====
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // ===== CHECK IF ALREADY VERIFIED =====
      if (user.is_verified) {
        return res.status(400).json({ 
          error: 'Email is already verified' 
        });
      }

      // ===== MARK OLD CODES AS USED =====
      await EmailVerification.update(
        { is_used: true },
        { where: { user_id: user.id } }
      );

      // ===== GENERATE NEW CODE =====
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await EmailVerification.create({
        user_id: user.id,
        token: verificationCode,
        expires_at: expiresAt,
        is_used: false
      });

      // ===== SEND EMAIL =====
      try {
        await sendVerificationEmail(email, verificationCode);
        console.log(`✅ Verification code resent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to resend verification email:', emailError.message);
        return res.status(500).json({ 
          error: 'Failed to send verification email. Please try again later.' 
        });
      }

      // ===== RESPONSE =====
      res.json({
        success: true,
        message: 'Verification code has been resent to your email.'
      });

    } catch (error) {
      console.error('❌ Resend verification error:', error);
      res.status(500).json({ 
        error: 'Failed to resend verification code. Please try again later.' 
      });
    }
  },

  // ==================== FORGOT PASSWORD ====================
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // ===== VALIDATION =====
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      // ===== FIND USER =====
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      // Security: Don't reveal if user exists
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // ===== MARK OLD TOKENS AS USED =====
      await PasswordReset.update(
        { is_used: true },
        { where: { user_id: user.id } }
      );

      // ===== GENERATE RESET TOKEN =====
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await PasswordReset.create({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        is_used: false
      });

      // ===== SEND EMAIL =====
      try {
        await sendPasswordResetEmail(email, resetToken);
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError.message);
      }

      // ===== RESPONSE =====
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      res.status(500).json({ 
        error: 'Failed to process password reset request. Please try again later.' 
      });
    }
  },

  // ==================== RESET PASSWORD ====================
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // ===== VALIDATION =====
      if (!token || !newPassword) {
        return res.status(400).json({ 
          error: 'Token and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      // ===== VERIFY TOKEN =====
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.purpose !== 'password_reset') {
          return res.status(400).json({ 
            error: 'Invalid reset token' 
          });
        }
      } catch (err) {
        return res.status(400).json({ 
          error: 'Invalid or expired reset token' 
        });
      }

      // ===== CHECK TOKEN IN DATABASE =====
      const reset = await PasswordReset.findOne({
        where: {
          token: token,
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        }
      });

      if (!reset) {
        return res.status(400).json({ 
          error: 'Invalid or expired reset token' 
        });
      }

      // ===== HASH NEW PASSWORD =====
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // ===== UPDATE PASSWORD =====
      await User.update(
        { password: hashedPassword },
        { where: { id: reset.user_id } }
      );

      await reset.update({ is_used: true });

      // ===== RESPONSE =====
      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });

    } catch (error) {
      console.error('❌ Reset password error:', error);
      res.status(500).json({ 
        error: 'Password reset failed. Please try again later.' 
      });
    }
  },

  // ==================== GET CURRENT USER ====================
  getCurrentUser: async (req, res) => {
    try {
      const userId = req.user.userId;

      // ===== FETCH USER =====
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'name', 'is_verified', 'created_at']
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // ===== RESPONSE =====
      res.json({
        success: true,
        user: user
      });

    } catch (error) {
      console.error('❌ Get current user error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user information.' 
      });
    }
  },

  // ==================== CHANGE PASSWORD ====================
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // ===== VALIDATION =====
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ 
          error: 'New password must be different from current password' 
        });
      }

      // ===== GET USER =====
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // ===== VERIFY CURRENT PASSWORD =====
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Current password is incorrect' 
        });
      }

      // ===== HASH NEW PASSWORD =====
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // ===== UPDATE PASSWORD =====
      await user.update({ password: hashedPassword });

      // ===== RESPONSE =====
      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({ 
        error: 'Failed to change password. Please try again later.' 
      });
    }
  },

  // ==================== LOGOUT ====================
  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({ 
        error: 'Logout failed' 
      });
    }
  }

};

module.exports = authController;