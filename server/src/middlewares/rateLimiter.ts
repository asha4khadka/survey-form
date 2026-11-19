import rateLimit from 'express-rate-limit';

// Rate limiter for survey submission endpoint (prevents automated bot flooding)
export const surveySubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 50 submissions per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this IP address, please try again after 15 minutes.',
  },
});

// Rate limiter for auth endpoints (brute-force defense)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // max 30 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});
