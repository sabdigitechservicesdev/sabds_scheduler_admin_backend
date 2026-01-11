import systemOTPService from './systemOTP.service.js';
import EmailService from './email.service.js';
import { SystemAdminDetails } from "../models/index.js"

class systemAuthOTPService {
  static async sendOTP(identifier, deviceInfo = null, isUnregistered = false) {
    try {
      console.log('sendOTP called with:', { identifier, deviceInfo, isUnregistered });

      // For unregistered users - STRICT EMAIL VALIDATION FLOW
      if (isUnregistered === true) {
        console.log('Processing OTP request for unregistered user');

        // STRICT VALIDATION: Must be a valid email for unregistered users
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          throw new Error('For unregistered users, identifier must be a valid email address');
        }

        // Check if email already exists
        const existingEmail = await SystemAdminDetails.checkEmailExists(identifier);
        if (existingEmail) {
          throw new Error('Email already registered');
        }

        console.log('Generating OTP for unregistered user...');
        // Generate OTP without admin_id for unregistered users
        const otpResult = await systemOTPService.generateOTPForUnregistered(
          identifier,
          deviceInfo
        );

        console.log('OTP generated successfully for unregistered user:', {
          processId: otpResult.processId,
          userTimezone: otpResult.userTimezone
        });

        console.log('Attempting to send email to unregistered user:', identifier);
        // Send email with device info
        await EmailService.sendOTP(identifier, otpResult.otp, deviceInfo?.deviceName);
        console.log('Email sent successfully to unregistered user');

        return {
          success: true,
          message: 'OTP sent successfully to unregistered email',
          email: identifier,
          processId: otpResult.processId,
          expiresAt: otpResult.expiresAt,
          userTimezone: otpResult.userTimezone
        };
      }

      // EXISTING FLOW FOR REGISTERED USERS
      console.log('Processing registered user OTP request');
      const admin = await SystemAdminDetails.findByLoginIdentifier(identifier);
      console.log('Admin found:', admin ? 'Yes' : 'No');

      // Validate user exists and is active
      if (!admin || admin.is_deleted === 1) {
        throw new Error('User not found');
      }

      if (admin.is_deactivated === 1) {
        throw new Error('Account is deactivated');
      }

      if (admin.status_code !== 'ACT') {
        throw new Error(`Account is ${admin.status_name.toLowerCase()}`);
      }

      console.log('Generating OTP...');
      // Generate OTP with device info
      const otpResult = await systemOTPService.generateOTP(admin.admin_id, admin.email, deviceInfo);
      console.log('OTP generated successfully:', {
        processId: otpResult.processId,
        userTimezone: otpResult.userTimezone
      });

      console.log('Attempting to send email to:', admin.email);
      // Send email with device info
      await EmailService.sendOTP(admin.email, otpResult.otp, deviceInfo?.deviceName);
      console.log('Email sent successfully');

      return {
        success: true,
        message: 'OTP sent successfully',
        adminId: admin.admin_id,
        email: admin.email,
        processId: otpResult.processId,
        expiresAt: otpResult.expiresAt,
        userTimezone: otpResult.userTimezone
      };
    } catch (error) {
      console.error('Error in sendOTP:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  static async verifyOTP(identifier, otp, processId = null, deviceInfo = null, isUnregistered = false) {
    try {
      console.log('verifyOTP called with:', { identifier, otp, processId, deviceInfo, isUnregistered });

      // For unregistered users - STRICT EMAIL VALIDATION FLOW
      if (isUnregistered === true) {
        console.log('Verifying OTP for unregistered user');

        // STRICT VALIDATION: Must be a valid email for unregistered users
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          throw new Error('For unregistered users, identifier must be a valid email address');
        }

        console.log('Verifying OTP for unregistered user with params:', {
          email: identifier,
          otp,
          processId
        });

        // Verify OTP for unregistered user
        const result = await systemOTPService.verifyOTPForUnregistered(
          identifier,
          otp,
          processId,
          deviceInfo
        );

        console.log('OTP verification result for unregistered user:', result);

        return {
          success: true,
          message: 'OTP verified successfully for unregistered email',
          email: identifier,
          processId: result.processId,
          verifiedAt: result.verifiedAt,
          userTimezone: result.userTimezone
        };
      }

      // EXISTING FLOW FOR REGISTERED USERS
      console.log('Verifying OTP for registered user');
      const admin = await SystemAdminDetails.findByLoginIdentifier(identifier);
      console.log('Admin found:', admin ? 'Yes' : 'No');

      // Validate user exists and is active
      if (!admin || admin.is_deleted === 1) {
        throw new Error('User not found');
      }

      if (admin.is_deactivated === 1) {
        throw new Error('Account is deactivated');
      }

      if (admin.status_code !== 'ACT') {
        throw new Error(`Account is ${admin.status_name.toLowerCase()}`);
      }

      console.log('Verifying OTP with params:', {
        adminId: admin.admin_id,
        email: admin.email,
        otp,
        processId
      });

      // Verify OTP with process ID and device info
      const result = await systemOTPService.verifyOTP(
        admin.admin_id,
        admin.email,
        otp,
        processId,
        deviceInfo
      );

      console.log('OTP verification result:', result);

      return {
        success: true,
        message: 'OTP verified successfully',
        adminId: admin.admin_id,
        email: admin.email,
        processId: result.processId,
        verifiedAt: result.verifiedAt,
        userTimezone: result.userTimezone
      };
    } catch (error) {
      console.error('Error in verifyOTP service:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
}

export default systemAuthOTPService;