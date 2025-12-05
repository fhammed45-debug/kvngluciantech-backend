// ============================================
// utils/emailService.js
// Email Service using SendGrid
// ============================================

const sgMail = require('@sendgrid/mail');

// Validate SendGrid API key on startup
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not set in environment variables');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API key configured');
}

// Validate sender email
if (!process.env.EMAIL_USER) {
  console.error('❌ EMAIL_USER not set in environment variables');
}

// ============================================
// SEND VERIFICATION EMAIL
// ============================================
const sendVerificationEmail = async (email, code) => {
  try {
    console.log(`📧 Attempting to send verification email to: ${email}`);
    
    const msg = {
      to: email,
      from: process.env.EMAIL_USER, // Must be verified in SendGrid
      subject: 'Email Verification Code',
      text: `Your verification code is: ${code}. This code will expire in 24 hours.`,
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

    await sgMail.send(msg);
    console.log('✅ Verification email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('SendGrid Error Response:', error.response.body);
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
    
    const msg = {
      to: email,
      from: process.env.EMAIL_USER, // Must be verified in SendGrid
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click this link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
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
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 5px; background-color: #f44336;">
                          <a href="${resetUrl}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 15px 40px; border: 1px solid #f44336; display: inline-block; font-weight: bold;">Reset Password</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
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

    await sgMail.send(msg);
    console.log('✅ Password reset email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    
    if (error.response) {
      console.error('SendGrid Error Response:', error.response.body);
    }
    
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// ============================================
// TEST EMAIL CONNECTION (SendGrid)
// ============================================
const testEmailConnection = async () => {
  try {
    console.log('🔍 Testing SendGrid connection...');
    
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }
    
    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER is not set');
    }
    
    console.log('✅ SendGrid configuration looks good');
    console.log('📧 Sender email:', process.env.EMAIL_USER);
    console.log('⚠️  Make sure this email is verified in SendGrid!');
    
    return true;
  } catch (error) {
    console.error('❌ SendGrid configuration check failed:', error.message);
    console.error('📝 Please ensure:');
    console.error('   1. SENDGRID_API_KEY is set in environment variables');
    console.error('   2. EMAIL_USER is set and verified in SendGrid');
    console.error('   3. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
    
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailConnection
};