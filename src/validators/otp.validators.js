import { body } from 'express-validator';

export const SendOTPValidator = [
  body('identifier')
    .notEmpty().withMessage('Email, username or phone number is required')
    .custom(value => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      const phoneRegex = /^\d{10}$/;

      if (!emailRegex.test(value) && !usernameRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Invalid email, username or phone number format');
      }
      return true;
    })
];

export const VerifyOTPValidator = [
  body('identifier')
    .notEmpty().withMessage('Email, username or phone number is required')
    .custom(value => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      const phoneRegex = /^\d{10}$/;

      if (!emailRegex.test(value) && !usernameRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Invalid email, username or phone number format');
      }
      return true;
    }),

  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),

  body('processId')
    .optional()
    .notEmpty().withMessage('Process ID must not be empty')
    .isLength({ min: 6, max: 6 }).withMessage('Process ID must be 6 digits')
    .isNumeric().withMessage('Process ID must contain only numbers')
];

export default {
  SendOTPValidator,
  VerifyOTPValidator
};