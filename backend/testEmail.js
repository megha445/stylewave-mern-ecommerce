import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

try {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: "metermama775@gmail.com",
    subject: "Test Email from Stylewave",
    text: "Email is working correctly!"
  });
  console.log("✅ Email sent successfully!");
} catch (error) {
  console.log("❌ Email failed:", error.message);
}

process.exit();