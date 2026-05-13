import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send seller credentials email
export const sendSellerCredentials = async (sellerEmail, sellerName, password) => {
  const mailOptions = {
    from: `"Style wave Admin" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: "Welcome to Style wave - Your Seller Account Credentials",
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
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4a5568;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .credentials {
              background-color: #edf2f7;
              padding: 20px;
              border-left: 4px solid #4299e1;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4299e1;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #718096;
            }
            .warning {
              background-color: #fff5f5;
              border-left: 4px solid #fc8181;
              padding: 15px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Style wave!</h1>
            </div>
            <div class="content">
              <h2>Hello ${sellerName},</h2>
              <p>Your seller account has been created successfully. You can now access the Style wave Seller Dashboard.</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0;">Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${sellerEmail}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Dashboard URL:</strong> <a href="${process.env.SELLER_DASHBOARD_URL || "http://localhost:5175"}">${process.env.SELLER_DASHBOARD_URL || "http://localhost:5175"}</a></p>
              </div>

              <div class="warning">
                <p><strong>🔒 Security Notice:</strong></p>
                <p>Please change your password immediately after your first login for security purposes.</p>
              </div>

              <a href="${process.env.SELLER_DASHBOARD_URL || "http://localhost:5175"}" class="button">
                Login to Dashboard
              </a>

              <h3>Getting Started:</h3>
              <ol>
                <li>Click the button above to access the seller dashboard</li>
                <li>Login with your credentials</li>
                <li>Update your profile and change your password</li>
                <li>Start adding products to your store</li>
              </ol>

              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Best regards,<br><strong>Style wave Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

export const sendForgotPasswordEmail = async (sellerEmail, sellerName, tempPassword) => {
  const mailOptions = {
    from: `"Style wave Admin" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: "Your Temporary Password - Style wave Seller",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .credentials { background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0; }
            .warning { background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Recovery</h1>
            </div>
            <div class="content">
              <h2>Hello ${sellerName},</h2>
              <p>We received a request to recover your password. Here is your temporary password:</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0;">Your Temporary Password:</h3>
                <p style="font-size: 18px; font-weight: bold; color: #2d3748;">${tempPassword}</p>
              </div>

              <div class="warning">
                <p><strong>🔒 Important Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Please change this password immediately after logging in</li>
                  <li>Go to your profile settings to update your password</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </div>

              <a href="${process.env.SELLER_DASHBOARD_URL || "http://localhost:5174"}" class="button">
                Login to Dashboard
              </a>

              <p style="margin-top: 30px;">If you didn't request this password reset, please contact our support team immediately.</p>
              
              <p>Best regards,<br><strong>Style wave Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Temporary password sent to ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// ✅ NEW: Send forgot password email for regular users
export const sendUserForgotPasswordEmail = async (userEmail, userName, tempPassword) => {
  const mailOptions = {
    from: `"Style wave Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Your Temporary Password - Style wave",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #2d3748; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .credentials { background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0; }
            .warning { background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2d3748; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Recovery</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>We received a request to recover your password. Here is your temporary password:</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0;">Your Temporary Password:</h3>
                <p style="font-size: 18px; font-weight: bold; color: #2d3748; letter-spacing: 2px;">${tempPassword}</p>
              </div>

              <div class="warning">
                <p><strong>🔒 Important Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Please change this password after logging in</li>
                  <li>You can change your password in your account settings</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </div>

              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" class="button">
                Login Now
              </a>

              <p style="margin-top: 30px;">If you didn't request this password reset, please contact our support team immediately.</p>
              
              <p>Best regards,<br><strong>Style wave Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Temporary password sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// ✅ ADD THESE NEW FUNCTIONS at the bottom of email.js

// 1. Email to ADMIN when seller adds new product
export const sendNewProductNotificationToAdmin = async (adminEmail, sellerName, productName) => {
  const mailOptions = {
    from: `"Style wave" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Product Pending Approval - ${productName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .info { background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Product Pending Approval</h1>
            </div>
            <div class="content">
              <h2>Hello Admin,</h2>
              <p>A new product has been submitted for approval.</p>
              <div class="info">
                <p><strong>Seller:</strong> ${sellerName}</p>
                <p><strong>Product:</strong> ${productName}</p>
              </div>
              <p>Please login to the admin dashboard to review and approve or reject this product.</p>
              <a href="${process.env.ADMIN_DASHBOARD_URL || "http://localhost:5174"}" class="button">
                Go to Admin Dashboard
              </a>
              <p>Best regards,<br><strong>Style wave System</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ New product notification sent to admin`);
  } catch (error) {
    console.error("❌ Failed to send admin notification:", error);
  }
};

// 2. Email to SELLER when product is approved
export const sendProductApprovedEmail = async (sellerEmail, sellerName, productName) => {
  const mailOptions = {
    from: `"Style wave" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: `✅ Your Product "${productName}" Has Been Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #38a169; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .info { background-color: #f0fff4; padding: 20px; border-left: 4px solid #38a169; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #38a169; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Product Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${sellerName},</h2>
              <p>Great news! Your product has been approved and is now live on the store.</p>
              <div class="info">
                <p><strong>Product Name:</strong> ${productName}</p>
                <p><strong>Status:</strong> ✅ Approved & Live</p>
              </div>
              <p>Customers can now see and purchase your product. Keep track of your orders in the seller dashboard.</p>
              <a href="${process.env.SELLER_DASHBOARD_URL || "http://localhost:5175"}" class="button">
                Go to Dashboard
              </a>
              <p>Best regards,<br><strong>Style wave Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
  }
};

// 3. Email to SELLER when product is rejected
export const sendProductRejectedEmail = async (sellerEmail, sellerName, productName, reason) => {
  const mailOptions = {
    from: `"Style wave" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: `❌ Your Product "${productName}" Was Not Approved`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #e53e3e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .info { background-color: #fff5f5; padding: 20px; border-left: 4px solid #e53e3e; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Not Approved</h1>
            </div>
            <div class="content">
              <h2>Hello ${sellerName},</h2>
              <p>Unfortunately, your product has not been approved at this time.</p>
              <div class="info">
                <p><strong>Product Name:</strong> ${productName}</p>
                <p><strong>Status:</strong> ❌ Rejected</p>
                <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
              </div>
              <p>You can edit your product based on the feedback and resubmit it for approval from your seller dashboard.</p>
              <a href="${process.env.SELLER_DASHBOARD_URL || "http://localhost:5175"}" class="button">
                Edit Product
              </a>
              <p>Best regards,<br><strong>Style wave Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error);
  }
};

// 4. Email to SELLER when stock is low
export const sendLowStockEmail = async (sellerEmail, sellerName, productName, stock) => {
  const mailOptions = {
    from: `"Style wave" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: `⚠️ Low Stock Alert - ${productName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #dd6b20; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .info { background-color: #fffaf0; padding: 20px; border-left: 4px solid #dd6b20; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #dd6b20; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Low Stock Alert</h1>
            </div>
            <div class="content">
              <h2>Hello ${sellerName},</h2>
              <p>One of your products is running low on stock. Please restock soon to avoid missing sales.</p>
              <div class="info">
                <p><strong>Product Name:</strong> ${productName}</p>
                <p><strong>Current Stock:</strong> <span style="color: #e53e3e; font-weight: bold;">${stock} units remaining</span></p>
              </div>
              <p>Please update your stock from the seller dashboard as soon as possible.</p>
              <a href="${process.env.SELLER_DASHBOARD_URL || "http://localhost:5175"}" class="button">
                Update Stock
              </a>
              <p>Best regards,<br><strong>Style wave Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Style wave. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Low stock alert sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send low stock email:", error);
  }
};

export default transporter;