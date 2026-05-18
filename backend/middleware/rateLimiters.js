import rateLimit from "express-rate-limit";

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
  });
};

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  handler: jsonHandler("Too many requests. Please try again later."),
});

export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: jsonHandler("Too many authentication attempts. Please try again later."),
});

export const passwordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  handler: jsonHandler("Too many password requests. Please try again later."),
});

export const mutationLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 120,
  handler: jsonHandler("Too many write requests. Please slow down and try again."),
});

export const checkoutLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  limit: 30,
  handler: jsonHandler("Too many checkout requests. Please try again shortly."),
});

export const paymentLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  limit: 20,
  handler: jsonHandler("Too many payment requests. Please try again shortly."),
});

export const aiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  limit: 20,
  handler: jsonHandler("Too many AI requests. Please try again shortly."),
});
