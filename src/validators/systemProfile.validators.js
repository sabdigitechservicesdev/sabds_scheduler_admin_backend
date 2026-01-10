import { body, header, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware.js';

export const ProfileValidator = {
  // Validator for GET profile
  getProfile: [
    // JWT token validation
    header('authorization')
      .exists().withMessage('Authorization header is required')
      .bail()
      .custom((value) => {
        if (!value.startsWith('Bearer ')) {
          throw new Error('Authorization header must start with Bearer');
        }
        const token = value.substring(7);

        // Basic JWT format validation (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT token format');
        }

        // Check if token parts are valid base64
        try {
          parts.forEach(part => {
            Buffer.from(part, 'base64url').toString();
          });
        } catch (error) {
          throw new Error('Invalid JWT token encoding');
        }

        // Optional: Add token length validation
        if (token.length < 50 || token.length > 2000) {
          throw new Error('Invalid token length');
        }

        return true;
      }),

    // Optional query parameters validation if your route accepts any
    query('fields')
      .optional()
      .isString().withMessage('Fields must be a string')
      .custom(value => {
        const allowedFields = [
          'admin_name', 'first_name', 'last_name', 'middle_name',
          'email', 'phone_number', 'role', 'status', 'address',
          'created_at', 'updated_at'
        ];

        const requestedFields = value.split(',');
        for (const field of requestedFields) {
          if (!allowedFields.includes(field.trim())) {
            throw new Error(`Invalid field requested: ${field}`);
          }
        }
        return true;
      }),

    query('include')
      .optional()
      .isIn(['all', 'basic', 'detailed']).withMessage('Include must be one of: all, basic, detailed')
  ],

  // Validator for updating profile (if you add update route later)
  updateProfile: [
    header('authorization')
      .exists().withMessage('Authorization header is required')
      .bail()
      .custom((value) => {
        if (!value.startsWith('Bearer ')) {
          throw new Error('Authorization header must start with Bearer');
        }
        return true;
      }),

    body('first_name')
      .optional()
      .trim()
      .notEmpty().withMessage('First name cannot be empty if provided')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/).withMessage('First name can only contain letters, spaces, dots, apostrophes, and hyphens'),

    body('last_name')
      .optional()
      .trim()
      .notEmpty().withMessage('Last name cannot be empty if provided')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Last name can only contain letters, spaces, dots, apostrophes, and hyphens'),

    body('middle_name')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Middle name too long')
      .matches(/^[a-zA-Z\s.'-]*$/).withMessage('Middle name can only contain letters, spaces, dots, apostrophes, and hyphens'),

    body('phone_number')
      .optional()
      .trim()
      .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits')
      .isNumeric().withMessage('Phone number must contain only numbers'),

    body('area')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Area name too long'),

    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('City name too long')
      .matches(/^[a-zA-Z\s.-]+$/).withMessage('City can only contain letters, spaces, dots, and hyphens'),

    body('state')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('State name too long')
      .matches(/^[a-zA-Z\s.-]+$/).withMessage('State can only contain letters, spaces, dots, and hyphens'),

    body('pincode')
      .optional()
      .matches(/^\d{6}$/).withMessage('Invalid pincode format (must be 6 digits)')
      .isNumeric().withMessage('Pincode must contain only numbers'),

    // Validate that at least one field is being updated
    body()
      .custom((value, { req }) => {
        const updatableFields = [
          'first_name', 'last_name', 'middle_name',
          'phone_number', 'area', 'city', 'state', 'pincode'
        ];

        const hasUpdateField = updatableFields.some(field =>
          req.body[field] !== undefined
        );

        if (!hasUpdateField) {
          throw new Error('At least one field must be provided for update');
        }

        return true;
      })
  ],

  // Validator for profile picture upload (if needed)
  uploadProfilePicture: [
    header('authorization')
      .exists().withMessage('Authorization header is required')
      .bail()
      .custom((value) => {
        if (!value.startsWith('Bearer ')) {
          throw new Error('Authorization header must start with Bearer');
        }
        return true;
      }),

    // File validation would typically be done in multer middleware
    // This is just for body validation if needed
    body('image_type')
      .optional()
      .isIn(['profile', 'cover', 'document']).withMessage('Invalid image type')
  ]
};

// Validation middleware wrapper
export const validateProfileRequest = (validatorType) => {
  return [
    ...ProfileValidator[validatorType],
    validateRequest
  ];
};

// Add DecryptTokenValidator using express-validator
export const DecryptTokenValidator = [
  body('encryptedToken')
    .notEmpty().withMessage('Encrypted token is required')
    .isString().withMessage('Encrypted token must be a string')
    .custom(value => {
      // Check if it contains a dot (encryptedToken.iv format)
      if (!value.includes('.')) {
        throw new Error('Invalid encrypted token format');
      }
      return true;
    })
];

export default {
  ProfileValidator,
  DecryptTokenValidator,
};