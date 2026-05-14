import Razorpay from "razorpay";

const hasRazorpayKeys =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.startsWith("your_") &&
  !process.env.RAZORPAY_KEY_SECRET.startsWith("your_");

const razorpayInstance = hasRazorpayKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export const isRazorpayConfigured = () => Boolean(razorpayInstance);

export default razorpayInstance;
