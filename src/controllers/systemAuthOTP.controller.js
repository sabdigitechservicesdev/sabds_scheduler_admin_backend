import systemAuthOTPService from "../services/systemAuthOTP.service.js";
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

class systemAuthOTPController {
  static async sendOTP(req, res) {
    try {
      const { identifier, isUnregistered = false } = req.body;

      // Validate request for unregistered users
      if (isUnregistered === true) {
        // For unregistered users, identifier must be a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          return res.status(400).json(
            errorResponse(
              'For unregistered users, identifier must be a valid email address',
              null
            )
          );
        }
      }

      const result = await systemAuthOTPService.sendOTP(
        identifier,
        req.deviceInfo,
        isUnregistered
      );

      // For unregistered users
      if (isUnregistered) {
        return res.status(200).json(
          successResponse(
            result.message,
            {
              email: result.email,
              processId: result.processId,
              expiresAt: result.expiresAt,
              userTimezone: result.userTimezone,
              userType: 'unregistered'
            }
          )
        );
      }

      // For registered users (existing response structure)
      return res.status(200).json(
        successResponse(
          result.message,
          {
            adminId: result.adminId,
            email: result.email,
            processId: result.processId,
            expiresAt: result.expiresAt,
            userTimezone: result.userTimezone,
            userType: 'registered'
          }
        )
      );
    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(400).json(
        errorResponse(
          error.message || 'Failed to send OTP',
          process.env.NODE_ENV === 'development' ? error.stack : null
        )
      );
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { identifier, otp, processId, isUnregistered = false } = req.body;

      // Validate request for unregistered users
      if (isUnregistered === true) {
        // For unregistered users, identifier must be a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          return res.status(400).json(
            errorResponse(
              'For unregistered users, identifier must be a valid email address',
              null
            )
          );
        }
      }

      const result = await systemAuthOTPService.verifyOTP(
        identifier,
        otp,
        processId,
        req.deviceInfo,
        isUnregistered
      );

      // For unregistered users
      if (isUnregistered) {
        return res.status(200).json(
          successResponse(
            result.message,
            {
              email: result.email,
              processId: result.processId,
              verifiedAt: result.verifiedAt,
              verified: true,
              userTimezone: result.userTimezone,
              userType: 'unregistered'
            }
          )
        );
      }

      // For registered users (existing response structure)
      return res.status(200).json(
        successResponse(
          result.message,
          {
            adminId: result.adminId,
            email: result.email,
            processId: result.processId,
            verifiedAt: result.verifiedAt,
            verified: true,
            userTimezone: result.userTimezone,
            userType: 'registered'
          }
        )
      );
    } catch (error) {
      console.error('Verify OTP error:', error);
      return res.status(400).json(
        errorResponse(
          error.message || 'OTP verification failed',
          process.env.NODE_ENV === 'development' ? error.stack : null
        )
      );
    }
  }
}

export default systemAuthOTPController;