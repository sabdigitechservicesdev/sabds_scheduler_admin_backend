import { body } from 'express-validator';

export const SystemRegisterValidator = [
  body('admin_name')
    .trim()
    .notEmpty().withMessage('Admin name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Admin name must be 3-50 characters')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('Admin name can only contain letters, numbers'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('phone_number')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits')
    .isNumeric().withMessage('Phone number must contain only numbers'),

  body('password')
    .notEmpty().withMessage('Password is required')
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

  body('area').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode')
    .optional()
    .matches(/^\d{6}$/).withMessage('Invalid pincode format')
];

export const SystemLoginValidator = [
  body('identifier')
    .notEmpty().withMessage('Email, username or phone number is required')
    .custom(value => {
      // allow email OR username OR phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9]{3,50}$/;
      const phoneRegex = /^\d{10}$/;

      if (!emailRegex.test(value) && !usernameRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Invalid email, username or phone number format');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('Password is required')
];

export const ForgotPasswordValidator = [
  body('identifier')
    .notEmpty().withMessage('Email, username or phone number is required')
    .custom(value => {
      // allow email OR username OR phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9]{3,50}$/;
      const phoneRegex = /^\d{10}$/;

      if (!emailRegex.test(value) && !usernameRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Invalid email, username or phone number format');
      }
      return true;
    }),

  body('new_password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain uppercase, lowercase, number and special character')
];

export default {
  SystemRegisterValidator,
  SystemLoginValidator,
  ForgotPasswordValidator
};