import systemAuthOTPService from "../services/systemAuthOTP.service.js";
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

class systemAuthOTPController {
  static async sendOTP(req, res) {
    try {
      const result = await systemAuthOTPService.sendOTP(
        req.body.identifier,
        req.deviceInfo // Make sure you're passing device info from middleware
      );

      return res.status(200).json(
        successResponse(
          result.message,
          {
            adminId: result.adminId,
            email: result.email,
            processId: result.processId,
            deviceId: result.deviceId,
            deviceName: result.deviceName
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
      const result = await systemAuthOTPService.verifyOTP(
        req.body.identifier,
        req.body.otp,
        req.body.processId,
        req.deviceInfo
      );

      return res.status(200).json(
        successResponse(
          result.message,
          {
            adminId: result.adminId,
            email: result.email,
            processId: result.processId
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