import systemAuthOTPService from "../services/systemAuthOTP.service.js";
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import TimezoneHelper from '../utils/timezoneHelper.js';

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

  static async cleanupOTPs(req, res) {
    try {
      const otpService = await import('./systemOTP.service.js');
      const result = await otpService.default.cleanExpiredOTPs();

      return res.status(200).json(
        successResponse(
          'OTP cleanup completed successfully',
          result
        )
      );
    } catch (error) {
      console.error('OTP cleanup error:', error);
      return res.status(500).json(
        errorResponse(
          error.message || 'Failed to cleanup OTPs',
          process.env.NODE_ENV === 'development' ? error.stack : null
        )
      );
    }
  }

  static async getOTPStats(req, res) {
    try {
      const otpService = await import('./systemOTP.service.js');
      const stats = await otpService.default.getOTPStats();

      return res.status(200).json(
        successResponse(
          'OTP statistics retrieved successfully',
          stats
        )
      );
    } catch (error) {
      console.error('Get OTP stats error:', error);
      return res.status(500).json(
        errorResponse(
          error.message || 'Failed to get OTP statistics',
          process.env.NODE_ENV === 'development' ? error.stack : null
        )
      );
    }
  }

  static async getDeviceInfo(req, res) {
    try {
      const otpService = await import('./systemOTP.service.js');
      const deviceInfo = otpService.default.extractDeviceInfo(req);
      const userTimezone = TimezoneHelper.detectUserTimezone(deviceInfo.ipAddress);
      const currentDeviceTime = TimezoneHelper.getCurrentDeviceTime(deviceInfo.ipAddress);

      return res.status(200).json(
        successResponse(
          'Device information retrieved successfully',
          {
            deviceInfo,
            userTimezone,
            currentTime: TimezoneHelper.toMySQLDateTime(currentDeviceTime),
            currentTimeISO: currentDeviceTime.toISOString()
          }
        )
      );
    } catch (error) {
      console.error('Get device info error:', error);
      return res.status(500).json(
        errorResponse(
          error.message || 'Failed to get device information',
          process.env.NODE_ENV === 'development' ? error.stack : null
        )
      );
    }
  }
}

export default systemAuthOTPController;