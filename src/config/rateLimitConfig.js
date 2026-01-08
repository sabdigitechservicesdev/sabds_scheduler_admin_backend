import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/responseFormatter.js';
import { applyRateLimits } from '../middleware/rateLimit.middleware.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to create unique keys for individual endpoints
const getRateLimitKey = (req, prefix) => {
  // Extract the route path from the request
  const routePath = req.baseUrl + req.path;
  return `${prefix}_${req.ip}_${routePath}`;
};

// Helper function to create category keys (combined for all endpoints in category)
const getCategoryKey = (req, prefix) => {
  return `${prefix}_category_${req.ip}`;
};

// OTP Individual endpoint limiter
export const otpRateLimiter = rateLimit({
  windowMs: process.env.OTP_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS)
    : 5 * 60 * 1000, // 5 minutes default
  max: process.env.OTP_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS)
    : 5, // 5 requests per window per endpoint
  keyGenerator: (req) => {
    return getRateLimitKey(req, 'otp');
  },
  handler: (req, res) => {
    const response = errorResponse(
      'Too many OTP attempts from this IP, please try again later',
      null,
      null
    );
    res.status(429).json(response);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// OTP Category limiter (combined for all OTP endpoints)
export const otpCategoryRateLimiter = rateLimit({
  windowMs: process.env.OTP_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS)
    : 5 * 60 * 1000,
  max: process.env.OTP_CATEGORY_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.OTP_CATEGORY_RATE_LIMIT_MAX_REQUESTS)
    : 20, // Combined limit for all OTP APIs
  keyGenerator: (req) => {
    return getCategoryKey(req, 'otp');
  },
  handler: (req, res) => {
    const response = errorResponse(
      'Too many OTP requests from this IP, please try again later',
      null,
      null
    );
    res.status(429).json(response);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth Individual endpoint limiter
export const authRateLimiter = rateLimit({
  windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS)
    : 5 * 60 * 1000, // 5 minutes default
  max: process.env.AUTH_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS)
    : 5, // 5 requests per window per endpoint
  keyGenerator: (req) => {
    return getRateLimitKey(req, 'auth');
  },
  handler: (req, res) => {
    const response = errorResponse(
      'Too many authentication attempts from this IP for this endpoint, please try again later',
      null,
      null
    );
    res.status(429).json(response);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth Category limiter (combined for all auth endpoints)
export const authCategoryRateLimiter = rateLimit({
  windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS)
    : 5 * 60 * 1000,
  max: process.env.AUTH_CATEGORY_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.AUTH_CATEGORY_RATE_LIMIT_MAX_REQUESTS)
    : 20, // Combined limit for all auth APIs
  keyGenerator: (req) => {
    return getCategoryKey(req, 'auth');
  },
  handler: (req, res) => {
    const response = errorResponse(
      'Too many authentication requests from this IP, please try again later',
      null,
      null
    );
    res.status(429).json(response);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API Individual endpoint limiter
export const apiRateLimiter = rateLimit({
  windowMs: process.env.API_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.API_RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000, // 15 minutes default
  max: process.env.API_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS)
    : 100, // 100 requests per window per endpoint
  keyGenerator: (req) => {
    return getRateLimitKey(req, 'api');
  },
  handler: (req, res) => {
    const response = errorResponse(
      'Too many requests from this IP for this endpoint, please try again later',
      null,
      null
    );
    res.status(429).json(response);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API Category limiter (combined for all general APIs)
export const apiCategoryRateLimiter = rateLimit({
  windowMs: process.env.API_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.API_RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000,
  max: process.env.API_CATEGORY_RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.API_CATEGORY_RATE_LIMIT_MAX_REQUESTS)
    : 300, // Combined limit for all general APIs
  keyGenerator: (req) => {
    return getCategoryKey(req, 'api');
  },
  handler: (req, res) => {
    const response = errorResponse(
      'Too many API requests from this IP, please try again later',
      null,
      null
    );
    res.status(429).json(response);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Preset combinations for easy use
const otpLimits = applyRateLimits(otpRateLimiter, otpCategoryRateLimiter);
const authLimits = applyRateLimits(authRateLimiter, authCategoryRateLimiter);
const apiLimits = applyRateLimits(apiRateLimiter, apiCategoryRateLimiter);

// Named exports for individual limiters if needed separately
export {
  otpLimits,
  authLimits,
  apiLimits,
};