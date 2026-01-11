import express from 'express';
import { apiLimits } from '../config/rateLimitConfig.js';
import { authenticateToken } from '../middleware/systemAuth.middleware.js';
import systemProfileController from '../controllers/systemProfile.controller.js';
import { validateProfileRequest, DecryptTokenValidator } from '../validators/systemProfile.validators.js';
import validateRequest from '../middleware/validation.middleware.js';

const router = express.Router();

// Protected routes
router.get('/profile-details',
  authenticateToken,
  validateProfileRequest('getProfile'),
  apiLimits,
  systemProfileController.getProfile
);

// New endpoint to decrypt tokens with validation
router.post('/decrypt-token',
  apiLimits,
  DecryptTokenValidator,
  validateRequest,
  systemProfileController.decryptToken
);

export default router;