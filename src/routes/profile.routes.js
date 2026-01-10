import express from 'express';
import { apiLimits } from '../config/rateLimitConfig.js';
import { authenticateToken } from '../middleware/systemAuth.middleware.js';
import profileController from '../controllers/profile.controller.js';
import { validateProfileRequest } from '../validators/profile.validators.js';

const router = express.Router();

// Protected routes
router.get('/profile-details',
  authenticateToken,
  validateProfileRequest('getProfile'),
  apiLimits,
  profileController.getProfile
);

export default router;