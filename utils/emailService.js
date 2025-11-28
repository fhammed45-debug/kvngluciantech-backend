// ============================================
// utils/emailService.js
// Email Service using Nodemailer (FIXED)
// ============================================

const nodemailer = require('nodemailer');

// Validate email configuration on startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ EMAIL_USER or EMAIL_PASSWORD not set in environment variables');
}

// Create email transporter with better configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // This should be your Gmail App Password
  },
  // Add these options for better reliability
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Enable debug output
  logger: true // Log information to console
});

// ============================================
// SEND VERIFICATION EMAIL
// ============================================
const sendVerificationEmail = async (email, code) => {
  try {
    console.log(`📧 Attempting to send verification email to: ${email}`);
    
    const mailOptions = {
      from: {
        name: 'Your App Name',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              background-color: #f4f4f4;
              padding: 20px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #4CAF50;
              text-align: center;
              padding: 20px;
              background-color: white;
              border-radius: 5px;
              letter-spacing: 5px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for registering! Please use the verification code below to verify your email address:</p>
              <div class="code">${code}</div>
              <p><strong>This code will expire in 24 hours.</strong></p>
              <p>If you didn't request this verification code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', info.messageId);
    console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    
    // Detailed error logging
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Please check:');
      console.error('   1. EMAIL_USER is correct');
      console.error('   2. EMAIL_PASSWORD is a Gmail App Password (not regular password)');
      console.error('   3. 2FA is enabled on your Google account');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed. Check your internet connection.');
    }
    
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
const sendPasswordResetEmail = async (email, token) => {
  try {
    console.log(`📧 Attempting to send password reset email to: ${email}`);
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'Your App Name',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #f44336;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              background-color: #f4f4f4;
              padding: 20px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #f44336;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested a password reset for your account. Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Check your Gmail App Password.');
    }
    
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// ============================================
// TEST EMAIL CONNECTION
// ============================================
const testEmailConnection = async () => {
  try {
    console.log('🔍 Testing email service connection...');
    await transporter.verify();
    console.log('✅ Email service is ready and authenticated');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 Gmail authentication failed. Please ensure:');
      console.error('   1. You are using a Gmail App Password (not your regular password)');
      console.error('   2. 2-Factor Authentication is enabled on your Google account');
      console.error('   3. Go to: https://myaccount.google.com/apppasswords');
    }
    
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailConnection
};