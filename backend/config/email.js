import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Stylewave <onboarding@resend.dev>";

// 1. Send seller credentials email
export const sendSellerCredentials = async (sellerEmail, sellerName, password) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: "Welcome to Style wave - Your Seller Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave Team</strong></p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Email sent to ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// 2. Seller forgot password
export const sendForgotPasswordEmail = async (sellerEmail, sellerName, tempPassword) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: "Your Temporary Password - Style wave Seller",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave Team</strong></p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Temporary password sent to ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// 3. User forgot password
export const sendUserForgotPasswordEmail = async (userEmail, userName, tempPassword) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "Your Temporary Password - Style wave",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1>Password Recovery</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2>Hello ${userName},</h2>
            <p>Here is your temporary password:</p>
            <div style="background-color: #edf2f7; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0;">
              <p style="font-size: 18px; font-weight: bold; color: #2d3748; letter-spacing: 2px;">${tempPassword}</p>
            </div>
            <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin-top: 20px;">
              <p><strong>🔒 Please change this password after logging in.</strong></p>
            </div>
            <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 12px 30px; background-color: #2d3748; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Login Now
            </a>
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave Team</strong></p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Temporary password sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

// 4. Admin notification when seller adds product
export const sendNewProductNotificationToAdmin = async (adminEmail, sellerName, productName) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Product Pending Approval - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave System</strong></p>
          </div>
        </div>
      `,
    });
    console.log(`✅ New product notification sent to admin`);
  } catch (error) {
    console.error("❌ Failed to send admin notification:", error);
  }
};

// 5. Seller product approved
export const sendProductApprovedEmail = async (sellerEmail, sellerName, productName) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: `✅ Your Product "${productName}" Has Been Approved!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave Team</strong></p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Approval email sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
  }
};

// 6. Seller product rejected
export const sendProductRejectedEmail = async (sellerEmail, sellerName, productName, reason) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: `❌ Your Product "${productName}" Was Not Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
            <p style="margin-top: 30px;">Best regards,<br><strong>Style wave Team</strong></p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Rejection email sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error);
  }
};

// 7. Low stock alert
export const sendLowStockEmail = async (sellerEmail, sellerName, productName, stock) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: `⚠️ Low Stock Alert - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
    });
    console.log(`✅ Low stock alert sent to ${sellerEmail}`);
  } catch (error) {
    console.error("❌ Failed to send low stock email:", error);
  }
};