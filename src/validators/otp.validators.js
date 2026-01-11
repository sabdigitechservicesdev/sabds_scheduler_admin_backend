import { body } from 'express-validator';

export const SendOTPValidator = [
  body('identifier')
    .notEmpty().withMessage('Email, username or phone number is required')
    .custom((value, { req }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      const phoneRegex = /^\d{10}$/;

      // If isUnregistered is true, only accept email
      if (req.body.isUnregistered === true) {
        if (!emailRegex.test(value)) {
          throw new Error('For unregistered users, only email is accepted');
        }
        return true;
      }

      // For registered users, accept email, username, or phone
      if (!emailRegex.test(value) && !usernameRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Invalid email, username or phone number format');
      }
      return true;
    }),

  body('isUnregistered')
    .optional()
    .isBoolean().withMessage('isUnregistered must be a boolean')
];

export const VerifyOTPValidator = [
  body('identifier')
    .notEmpty().withMessage('Email, username or phone number is required')
    .custom((value, { req }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      const phoneRegex = /^\d{10}$/;

      // If isUnregistered is true, only accept email
      if (req.body.isUnregistered === true) {
        if (!emailRegex.test(value)) {
          throw new Error('For unregistered users, only email is accepted');
        }
        return true;
      }

      // For registered users, accept email, username, or phone
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
    .notEmpty().withMessage('Process ID is required')
    .isLength({ min: 6, max: 6 }).withMessage('Process ID must be 6 digits')
    .isNumeric().withMessage('Process ID must contain only numbers'),

  body('isUnregistered')
    .optional()
    .isBoolean().withMessage('isUnregistered must be a boolean')
];

export default {
  SendOTPValidator,
  VerifyOTPValidator
};