import express from 'express';
import { authRateLimiter } from '../config/rateLimitConfig.js';
import systemAuthController from '../controllers/systemAuth.controllers.js';
import { authenticateToken, systemAuthorizeRoles } from '../middleware/systemAuth.middleware.js';
import { SystemRegisterValidator, SystemLoginValidator } from '../validators/systemAuth.validators.js';
import validateRequest from '../middleware/validation.middleware.js';

const router = express.Router();

// Public routes with strict rate limiting
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


router.post('/forgot-password', systemAuthController.forgotPassword);




export default router;