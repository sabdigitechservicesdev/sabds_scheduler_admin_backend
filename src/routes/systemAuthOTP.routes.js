import express from 'express';
import { otpLimits } from '../config/rateLimitConfig.js';
import { SendOTPValidator, VerifyOTPValidator } from '../validators/otp.validators.js';
import validateRequest from '../middleware/validation.middleware.js';
import deviceInfoMiddleware from '../middleware/deviceInfo.middleware.js';
import systemAuthOTPController from '../controllers/systemAuthOTP.controller.js';

const router = express.Router();

router.post('/send-otp',
  otpLimits,
  deviceInfoMiddleware,
  SendOTPValidator,
  validateRequest,
  systemAuthOTPController.sendOTP
);

router.post('/verify-otp',
  otpLimits,
  deviceInfoMiddleware,
  VerifyOTPValidator,
  validateRequest,
  systemAuthOTPController.verifyOTP
);

export default router;