import express from 'express';
import { otpLimits } from '../config/rateLimitConfig.js';
import { SendOTPValidator, VerifyOTPValidator } from '../validators/otp.validators.js';
import validateRequest from '../middleware/validation.middleware.js';
import deviceInfoMiddleware from '../middleware/deviceInfo.middleware.js';
import authController from '../controllers/systemAuthOTP.controller.js';

const router = express.Router();

router.post('/send-otp',
  otpLimits,
  deviceInfoMiddleware,
  SendOTPValidator,
  validateRequest,
  authController.sendOTP
);

router.post('/verify-otp',
  otpLimits,
  deviceInfoMiddleware,
  VerifyOTPValidator,
  validateRequest,
  authController.verifyOTP
);

export default router;