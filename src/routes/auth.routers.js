// routes/systemAuth.routes.js
import express from 'express';
import { otpRateLimiter } from '../config/rateLimitConfig.js';
import { SendOTPValidator, VerifyOTPValidator } from '../validators/otp.validators.js';
import validateRequest from '../middleware/validation.middleware.js';
import deviceInfoMiddleware from '../middleware/deviceInfo.middleware.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/send-otp',
  otpRateLimiter,
  deviceInfoMiddleware,
  SendOTPValidator,
  validateRequest,
  authController.sendOTP
);

router.post('/verify-otp',
  otpRateLimiter,
  deviceInfoMiddleware,
  VerifyOTPValidator,
  validateRequest,
  authController.verifyOTP
);

export default router;