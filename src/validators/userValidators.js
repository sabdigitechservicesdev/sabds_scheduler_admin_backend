import { body, param, query } from 'express-validator';

export const createUserValidator = [
  body('user_name')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),

  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('middle_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name too long'),

  body('role_code')
    .optional()
    .isIn(['SE', 'MN', 'HR', 'AC', 'AD']).withMessage('Invalid role code'),

  body('status_code')
    .optional()
    .isIn(['ACT', 'DEA', 'BAN']).withMessage('Invalid status code'),

  body('area').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode')
    .optional()
    .matches(/^\d{6}$/).withMessage('Invalid pincode format')
];

export const updateUserValidator = [
  param('userId')
    .isInt().withMessage('User ID must be an integer'),

  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('middle_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Middle name too long'),

  body('role_code')
    .optional()
    .isIn(['SE', 'MN', 'HR', 'AC', 'AD']).withMessage('Invalid role code'),

  body('status_code')
    .optional()
    .isIn(['ACT', 'DEA', 'BAN']).withMessage('Invalid status code')
];

export const userIdValidator = [
  param('userId')
    .isInt().withMessage('User ID must be an integer')
];

export const resetPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

export const changePasswordValidator = [
  param('userId')
    .isInt().withMessage('User ID must be an integer'),

  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

export const userFilterValidator = [
  query('role')
    .optional()
    .isIn(['ALL', 'SE', 'MN', 'HR', 'AC', 'AD']).withMessage('Invalid role filter'),

  query('status')
    .optional()
    .isIn(['ALL', 'ACT', 'DEA', 'BAN']).withMessage('Invalid status filter'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long')
];