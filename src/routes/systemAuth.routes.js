import express from 'express';
import { authRateLimiter } from '../config/rateLimitConfig.js';
import systemAuthController from '../controllers/systemAuth.controllers.js';
import { SystemRegisterValidator, SystemLoginValidator, ForgotPasswordValidator } from '../validators/systemAuth.validators.js';
import validateRequest from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/register',
  authRateLimiter,
  SystemRegisterValidator,
  validateRequest,
  systemAuthController.register
);

router.post('/login',
  authRateLimiter,
  SystemLoginValidator,
  validateRequest,
  systemAuthController.login
);

router.post('/forgot-password',
  authRateLimiter,
  ForgotPasswordValidator,
  validateRequest,
  systemAuthController.forgotPassword
);

export default router;