import nodemailer from "nodemailer";

const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || "Stylewave";

const formatAddress = (name, email) => {
  if (!email) return undefined;
  const cleanName = String(name || "").replace(/["<>]/g, "").trim();
  return cleanName ? `"${cleanName}" <${email}>` : email;
};

const isEmailConfigured = () =>
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  !process.env.EMAIL_USER.startsWith("your_") &&
  !process.env.EMAIL_PASSWORD.startsWith("your_");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

const sendEmail = async (to, subject, htmlContent, options = {}) => {
  if (!isEmailConfigured()) {
    console.warn(`Email skipped for ${to}: EMAIL_USER and EMAIL_PASSWORD are not configured.`);
    return { skipped: true };
  }

  const fromName = options.fromName || DEFAULT_FROM_NAME;
  const replyTo = options.replyTo || process.env.EMAIL_REPLY_TO;

  await createTransporter().sendMail({
    from: formatAddress(fromName, process.env.EMAIL_USER),
    replyTo,
    to,
    subject,
    html: htmlContent,
  });
};
// 1. Send seller credentials email
export const sendSellerCredentials = async (sellerEmail, sellerName, password, adminContact = {}) => {
  try {
    await sendEmail(
      sellerEmail,
      "Welcome to Style wave - Your Seller Account Credentials",
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4a5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>Welcome to Style wave!</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${sellerName},</h2>
            <p>Your seller account has been created successfully.</p>
            <div style="background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0;">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${sellerEmail}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Dashboard URL:</strong> <a href="${process.env.SELLER_DASHBOARD_URL}">${process.env.SELLER_DASHBOARD_URL}</a></p>
            </div>
            <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin-top: 20px;">
              <p><strong>🔒 Security Notice:</strong> Please change your password immediately after your first login.</p>
            </div>
            <a href="${process.env.SELLER_DASHBOARD_URL}" style="display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Login to Dashboard
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>${adminContact.name || "Style wave Admin"}</strong></p>
          </div>
        </div>`,
      {
        fromName: adminContact.name
          ? `${adminContact.name} via Stylewave`
          : "Stylewave Admin",
        replyTo: adminContact.email,
      }
    );
    console.log(`✅ Email sent to ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// 2. Seller forgot password
export const sendForgotPasswordEmail = async (sellerEmail, sellerName, tempPassword, adminContact = {}) => {
  try {
    await sendEmail(
      sellerEmail,
      "Your Temporary Password - Style wave Seller",
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4a5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>Password Recovery</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${sellerName},</h2>
            <p>Here is your temporary password:</p>
            <div style="background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0;">
              <p style="font-size: 18px; font-weight: bold; color: #2d3748;">${tempPassword}</p>
            </div>
            <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin-top: 20px;">
              <p><strong>🔒 Please change this password immediately after logging in.</strong></p>
            </div>
            <a href="${process.env.SELLER_DASHBOARD_URL}" style="display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Login to Dashboard
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>${adminContact.name || "Style wave Team"}</strong></p>
          </div>
        </div>`,
      {
        fromName: adminContact.name
          ? `${adminContact.name} via Stylewave`
          : "Stylewave Team",
        replyTo: adminContact.email,
      }
    );
    console.log(`✅ Temporary password sent to ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// 3. User forgot password
export const sendUserForgotPasswordEmail = async (userEmail, userName, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail(
      userEmail,
      "Reset Your Password - Style wave",
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>Password Reset Request</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #2d3748; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">
              If you did not request this, please ignore this email. This token will expire in 1 hour.
            </p>
          </div>
        </div>`
    );
    console.log(`✅ Password reset email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// 4. Admin notification when seller adds product
export const sendNewProductNotificationToAdmin = async (adminEmail, sellerName, productName, sellerContact = {}) => {
  try {
    await sendEmail(
      adminEmail,
      `New Product Pending Approval - ${productName}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4a5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>New Product Pending Approval</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello Admin,</h2>
            <p>A new product has been submitted for approval.</p>
            <div style="background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0;">
              <p><strong>Seller:</strong> ${sellerName}</p>
              <p><strong>Product:</strong> ${productName}</p>
            </div>
            <a href="${process.env.ADMIN_DASHBOARD_URL || process.env.FRONTEND_URL}" style="display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Go to Admin Dashboard
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>${sellerName || "Style wave Seller"}</strong></p>
          </div>
        </div>`,
      {
        fromName: sellerName ? `${sellerName} via Stylewave` : "Stylewave Seller",
        replyTo: sellerContact.email,
      }
    );
    console.log(`✅ New product notification sent to admin`);
  } catch (error) {
    console.error("❌ Failed to send admin notification:", error);
  }
};

// 5. Seller product approved
export const sendProductApprovedEmail = async (sellerEmail, sellerName, productName, adminContact = {}) => {
  try {
    await sendEmail(
      sellerEmail,
      `✅ Your Product "${productName}" Has Been Approved!`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #38a169; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>🎉 Product Approved!</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${sellerName},</h2>
            <p>Your product has been approved and is now live on the store!</p>
            <div style="background-color: #f0fff4; padding: 20px; border-left: 4px solid #38a169; margin: 20px 0;">
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Status:</strong> ✅ Approved & Live</p>
            </div>
            <a href="${process.env.SELLER_DASHBOARD_URL}" style="display: inline-block; padding: 12px 30px; background-color: #38a169; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Go to Dashboard
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>${adminContact.name || "Style wave Team"}</strong></p>
          </div>
        </div>`,
      {
        fromName: adminContact.name
          ? `${adminContact.name} via Stylewave`
          : "Stylewave Team",
        replyTo: adminContact.email,
      }
    );
    console.log(`✅ Approval email sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
  }
};

// 6. Seller product rejected
export const sendProductRejectedEmail = async (sellerEmail, sellerName, productName, reason, adminContact = {}) => {
  try {
    await sendEmail(
      sellerEmail,
      `❌ Your Product "${productName}" Was Not Approved`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e53e3e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>Product Not Approved</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${sellerName},</h2>
            <p>Unfortunately, your product was not approved.</p>
            <div style="background-color: #fff5f5; padding: 20px; border-left: 4px solid #e53e3e; margin: 20px 0;">
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Status:</strong> ❌ Rejected</p>
              <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
            </div>
            <a href="${process.env.SELLER_DASHBOARD_URL}" style="display: inline-block; padding: 12px 30px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Edit Product
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>${adminContact.name || "Style wave Team"}</strong></p>
          </div>
        </div>`,
      {
        fromName: adminContact.name
          ? `${adminContact.name} via Stylewave`
          : "Stylewave Team",
        replyTo: adminContact.email,
      }
    );
    console.log(`✅ Rejection email sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error);
  }
};

// 7. Low stock alert
export const sendLowStockEmail = async (sellerEmail, sellerName, productName, stock) => {
  try {
    await sendEmail(
      sellerEmail,
      `⚠️ Low Stock Alert - ${productName}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dd6b20; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${sellerName},</h2>
            <p>One of your products is running low on stock.</p>
            <div style="background-color: #fffaf0; padding: 20px; border-left: 4px solid #dd6b20; margin: 20px 0;">
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Current Stock:</strong> <span style="color: #e53e3e; font-weight: bold;">${stock} units remaining</span></p>
            </div>
            <a href="${process.env.SELLER_DASHBOARD_URL}" style="display: inline-block; padding: 12px 30px; background-color: #dd6b20; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Update Stock
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave Team</strong></p>
          </div>
        </div>`
    );
    console.log(`✅ Low stock alert sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send low stock email:", error);
  }
};
