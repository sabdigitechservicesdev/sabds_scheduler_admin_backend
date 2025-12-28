import express from 'express';
import rateLimit from 'express-rate-limit';
import UserController from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validationMiddleware.js';
import {
  createUserValidator,
  updateUserValidator,
  userIdValidator,
  resetPasswordValidator,
  changePasswordValidator,
  userFilterValidator
} from '../validators/userValidators.js';

const router = express.Router();

// Rate limiting for user routes
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

// Public routes
router.get('/filters',
  authenticateToken,
  authorizeRoles('SA', 'AD'), // ✅ Added
  userLimiter,
  UserController.getFilterOptions
);


// Protected routes (Admin only)
router.post('/',
  authenticateToken,
  authorizeRoles('SA', 'AD'),
  userLimiter,
  createUserValidator,
  validateRequest,
  UserController.createUser
);

router.put('/:userId',
  authenticateToken,
  authorizeRoles('SA', 'AD'),
  userLimiter,
  updateUserValidator,
  validateRequest,
  UserController.updateUser
);

router.delete('/:userId',
  authenticateToken,
  authorizeRoles('SA', 'AD'),
  userLimiter,
  userIdValidator,
  validateRequest,
  UserController.deleteUser
);

router.post('/:userId/deactivate',
  authenticateToken,
  authorizeRoles('SA', 'AD'),
  userLimiter,
  userIdValidator,
  validateRequest,
  UserController.deactivateUser
);

router.post('/:userId/activate',
  authenticateToken,
  authorizeRoles('SA', 'AD'),
  userLimiter,
  userIdValidator,
  validateRequest,
  UserController.activateUser
);

router.post('/reset-password',
  authenticateToken,
  authorizeRoles('SA', 'AD'),
  userLimiter,
  resetPasswordValidator,
  validateRequest,
  UserController.resetPassword
);

router.post('/:userId/change-password',
  authenticateToken,
  userLimiter,
  changePasswordValidator,
  validateRequest,
  UserController.changePassword
);

// Get routes
router.get('/',
  authenticateToken,
  authorizeRoles('SA', 'AD'), // ✅ Added
  userLimiter,
  userFilterValidator,
  validateRequest,
  UserController.getAllUsers
);

router.get('/:userId',
  authenticateToken,
  userLimiter,
  userIdValidator,
  validateRequest,
  UserController.getUserById
);

export default router;