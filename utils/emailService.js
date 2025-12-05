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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
            <tr>
              <td align="center" style="padding: 20px;">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #f44336; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset Request</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; font-size: 16px;">Hello,</p>
                      <p style="margin: 0 0 30px 0; font-size: 16px;">You requested a password reset for your account. Click the button below to reset your password:</p>
                      
                      <!-- Button -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" target="_blank" style="background-color: #f44336; color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 10px 0; font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                      <p style="margin: 0 0 30px 0; word-break: break-all;">
                        <a href="${resetUrl}" style="color: #0066cc; text-decoration: underline;">${resetUrl}</a>
                      </p>
                      
                      <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>This link will expire in 1 hour.</strong></p>
                      <p style="margin: 0; font-size: 14px; color: #666;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #999;">This is an automated email, please do not reply.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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