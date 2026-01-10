import express from 'express';
import { authLimits } from '../config/rateLimitConfig.js';
import systemAuthController from '../controllers/systemAuth.controllers.js';
import { SystemRegisterValidator, SystemLoginValidator, ForgotPasswordValidator } from '../validators/systemAuth.validators.js';
import validateRequest from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/register',
  authLimits,
  SystemRegisterValidator,
  validateRequest,
  systemAuthController.register
);

router.post('/login',
  authLimits,
  SystemLoginValidator,
  validateRequest,
  systemAuthController.login
);

router.post('/forgot-password',
  authLimits,
  ForgotPasswordValidator,
  validateRequest,
  systemAuthController.forgotPassword
);




export default router;