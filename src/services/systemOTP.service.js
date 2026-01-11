import crypto from 'crypto';
import pool from '../config/database.js';
import TimezoneHelper from '../utils/timezoneHelper.js';
import moment from 'moment-timezone';

class OTPService {
  constructor() {
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || 5);
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
    this.maxVerificationAttempts = parseInt(process.env.OTP_MAX_VERIFICATION_ATTEMPTS) || 3;
    this.resendCooldown = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;
    this.cleanupInterval = parseInt(process.env.OTP_CLEANUP_INTERVAL_MINUTES) || 5;

    // Start periodic cleanup
    this.startCleanupInterval();
  }

  // Generate process ID as HHMMSS (hours, minutes, seconds)
  generateProcessId() {
    const now = moment();
    const hours = String(now.hours()).padStart(2, '0');
    const minutes = String(now.minutes()).padStart(2, '0');
    const seconds = String(now.seconds()).padStart(2, '0');

    return `${hours}${minutes}${seconds}`;
  }

  // Extract device info from request headers
  extractDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown IP';

    // Create a device fingerprint
    const deviceFingerprint = crypto
      .createHash('md5')
      .update(`${userAgent}-${ipAddress}`)
      .digest('hex')
      .substring(0, 16);

    return {
      deviceId: `device_${deviceFingerprint}`,
      userAgent,
      ipAddress,
      deviceName: this.detectDeviceName(userAgent)
    };
  }

  detectDeviceName(userAgent) {
    const ua = userAgent.toLowerCase();

    // iOS Devices
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('ipod')) return 'iPod';

    // Android Devices
    if (ua.includes('android')) {
      if (ua.includes('mobile')) return 'Android Phone';
      return 'Android Tablet';
    }

    // Windows Devices
    if (ua.includes('windows')) {
      if (ua.includes('phone')) return 'Windows Phone';
      if (ua.includes('tablet')) return 'Windows Tablet';
      return 'Windows PC';
    }

    // macOS Devices
    if (ua.includes('macintosh') || ua.includes('mac os') || ua.includes('macos')) {
      return 'Mac';
    }

    // Linux Devices
    if (ua.includes('linux')) {
      if (ua.includes('android')) return 'Android';
      return 'Linux PC';
    }

    // Common tools
    if (ua.includes('postman')) return 'Postman';
    if (ua.includes('insomnia')) return 'Insomnia';
    if (ua.includes('curl')) return 'cURL';
    if (ua.includes('wget')) return 'Wget';

    // Mobile devices
    if (ua.includes('mobile') || ua.includes('mobi')) return 'Mobile Device';

    return 'Unknown Device';
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // EXISTING METHOD FOR REGISTERED USERS - UNCHANGED
  async generateOTP(adminId, email, deviceInfo = null) {
    const connection = await pool.getConnection();

    try {
      // Generate OTP and unique process ID
      const otp = crypto.randomInt(100000, 999999).toString();
      const processId = this.generateProcessId();

      // Get current time in DEVICE'S timezone
      const currentDeviceTime = TimezoneHelper.getCurrentDeviceTime(deviceInfo?.ipAddress);
      const userTimezone = TimezoneHelper.detectUserTimezone(deviceInfo?.ipAddress);

      // Calculate expiry in DEVICE'S timezone
      const expiresAtDeviceTime = TimezoneHelper.calculateExpiryTime(
        currentDeviceTime,
        this.otpExpiryMinutes
      );

      // Format times for MySQL (in device's local time)
      const formattedCreatedAt = TimezoneHelper.toMySQLDateTime(currentDeviceTime);
      const formattedExpiry = TimezoneHelper.toMySQLDateTime(expiresAtDeviceTime);

      // If device info provided, create device identifier
      const deviceId = deviceInfo?.deviceId || null;
      const deviceName = deviceInfo?.deviceName || null;

      // Check resend cooldown for this device
      const [recentOTPs] = await connection.execute(
        `SELECT created_at FROM system_otps 
         WHERE admin_id = ? AND email = ? AND device_id = ?
         AND is_verified = 0 AND is_valid = 1`,
        [adminId, email, deviceId]
      );

      if (recentOTPs.length > 0) {
        const lastOTP = recentOTPs[0];
        // Check time difference using device's timezone
        const timeSinceLast = TimezoneHelper.getTimeDifferenceSeconds(
          lastOTP.created_at,
          deviceInfo?.ipAddress
        );

        if (timeSinceLast < this.resendCooldown) {
          const waitTime = this.resendCooldown - timeSinceLast;
          throw new Error(`Please wait ${waitTime} seconds before requesting new OTP`);
        }
      }

      // Calculate 5 minutes ago in device's timezone for attempt checking
      const fiveMinutesAgo = currentDeviceTime.clone().subtract(5, 'minutes');
      const formattedFiveMinutesAgo = TimezoneHelper.toMySQLDateTime(fiveMinutesAgo);

      // Check attempt count for this device in last 5 minutes
      const [deviceAttempts] = await connection.execute(
        `SELECT COUNT(*) as count FROM system_otps 
         WHERE admin_id = ? AND email = ? AND device_id = ?
         AND created_at >= ? AND is_valid = 1`,
        [adminId, email, deviceId, formattedFiveMinutesAgo]
      );

      if (deviceAttempts[0].count >= this.maxAttempts) {
        throw new Error('Too many OTP attempts from this device. Please try again 5 minutes later.');
      }

      // Check global attempt count (all devices) in last 5 minutes
      const [globalAttempts] = await connection.execute(
        `SELECT COUNT(*) as count FROM system_otps 
         WHERE admin_id = ? AND email = ? 
         AND created_at >= ? AND is_valid = 1`,
        [adminId, email, formattedFiveMinutesAgo]
      );

      if (globalAttempts[0].count >= this.maxAttempts * 3) {
        throw new Error('Too many OTP attempts from all devices. Please try 5 minutes again later.');
      }

      // Insert new OTP with DEVICE'S LOCAL TIME
      await connection.execute(
        `INSERT INTO system_otps 
         (process_id, admin_id, email, otp_code, device_id, device_name, created_at, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          processId, adminId, email, otp, deviceId, deviceName,
          formattedCreatedAt, // Store in device's local time
          formattedExpiry // Store expiry in device's local time
        ]
      );

      // Return expiry time in user's timezone for response
      return {
        processId,
        otp,
        deviceId,
        deviceName,
        expiresAt: formattedExpiry, // Already in device's timezone
        userTimezone
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // NEW METHOD FOR UNREGISTERED USERS - ENHANCED WITH EMAIL VALIDATION
  async generateOTPForUnregistered(email, deviceInfo = null) {
    const connection = await pool.getConnection();

    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        throw new Error('For unregistered users, identifier must be a valid email address');
      }

      // Generate OTP and unique process ID
      const otp = crypto.randomInt(100000, 999999).toString();
      const processId = this.generateProcessId();

      // Get current time in DEVICE'S timezone
      const currentDeviceTime = TimezoneHelper.getCurrentDeviceTime(deviceInfo?.ipAddress);
      const userTimezone = TimezoneHelper.detectUserTimezone(deviceInfo?.ipAddress);

      // Calculate expiry in DEVICE'S timezone
      const expiresAtDeviceTime = TimezoneHelper.calculateExpiryTime(
        currentDeviceTime,
        this.otpExpiryMinutes
      );

      // Format times for MySQL (in device's local time)
      const formattedCreatedAt = TimezoneHelper.toMySQLDateTime(currentDeviceTime);
      const formattedExpiry = TimezoneHelper.toMySQLDateTime(expiresAtDeviceTime);

      // If device info provided, create device identifier
      const deviceId = deviceInfo?.deviceId || null;
      const deviceName = deviceInfo?.deviceName || null;

      // Check resend cooldown for this device
      const [recentOTPs] = await connection.execute(
        `SELECT created_at FROM system_otps 
         WHERE email = ? AND device_id = ? AND admin_id IS NULL
         AND is_verified = 0 AND is_valid = 1`,
        [email, deviceId]
      );

      if (recentOTPs.length > 0) {
        const lastOTP = recentOTPs[0];
        // Check time difference using device's timezone
        const timeSinceLast = TimezoneHelper.getTimeDifferenceSeconds(
          lastOTP.created_at,
          deviceInfo?.ipAddress
        );

        if (timeSinceLast < this.resendCooldown) {
          const waitTime = this.resendCooldown - timeSinceLast;
          throw new Error(`Please wait ${waitTime} seconds before requesting new OTP`);
        }
      }

      // Calculate 5 minutes ago in device's timezone for attempt checking
      const fiveMinutesAgo = currentDeviceTime.clone().subtract(5, 'minutes');
      const formattedFiveMinutesAgo = TimezoneHelper.toMySQLDateTime(fiveMinutesAgo);

      // Check attempt count for this device in last 5 minutes
      const [deviceAttempts] = await connection.execute(
        `SELECT COUNT(*) as count FROM system_otps 
         WHERE email = ? AND device_id = ? AND admin_id IS NULL
         AND created_at >= ? AND is_valid = 1`,
        [email, deviceId, formattedFiveMinutesAgo]
      );

      if (deviceAttempts[0].count >= this.maxAttempts) {
        throw new Error('Too many OTP attempts from this device. Please try again 5 minutes later.');
      }

      // Check global attempt count (all devices) in last 5 minutes
      const [globalAttempts] = await connection.execute(
        `SELECT COUNT(*) as count FROM system_otps 
         WHERE email = ? AND admin_id IS NULL
         AND created_at >= ? AND is_valid = 1`,
        [email, formattedFiveMinutesAgo]
      );

      if (globalAttempts[0].count >= this.maxAttempts * 3) {
        throw new Error('Too many OTP attempts from all devices. Please try 5 minutes again later.');
      }

      // Insert new OTP with DEVICE'S LOCAL TIME
      await connection.execute(
        `INSERT INTO system_otps 
         (process_id, email, otp_code, device_id, device_name, created_at, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          processId, email, otp, deviceId, deviceName,
          formattedCreatedAt, // Store in device's local time
          formattedExpiry // Store expiry in device's local time
        ]
      );

      // Return expiry time in user's timezone for response
      return {
        processId,
        otp,
        deviceId,
        deviceName,
        expiresAt: formattedExpiry, // Already in device's timezone
        userTimezone
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // EXISTING METHOD FOR REGISTERED USERS - UNCHANGED
  async verifyOTP(adminId, email, otp, processId = null, deviceInfo = null) {
    const connection = await pool.getConnection();

    try {
      // ALWAYS require processId for verification
      if (!processId) {
        throw new Error('Process ID is required for OTP verification');
      }

      // First, check if this processId exists and get its status
      const [otpRecords] = await connection.execute(
        `SELECT * FROM system_otps 
         WHERE admin_id = ? AND email = ? AND process_id = ?
         AND is_valid = 1
         ORDER BY created_at DESC LIMIT 1`,
        [adminId, email, processId]
      );

      if (otpRecords.length === 0) {
        throw new Error('Invalid Process ID. Please request a new OTP.');
      }

      const otpRecord = otpRecords[0];

      // Check if OTP is already verified (is_verified = 1)
      if (otpRecord.is_verified === 1) {
        throw new Error('This OTP has already been used. Please request a new OTP.');
      }

      // Check if OTP is expired using DEVICE'S TIMEZONE
      const isExpired = TimezoneHelper.isExpired(
        otpRecord.expires_at,
        deviceInfo?.ipAddress
      );

      if (isExpired) {
        // Mark OTP as invalid when expired
        await connection.execute(
          `UPDATE system_otps 
           SET is_valid = 0 
           WHERE id = ?`,
          [otpRecord.id]
        );
        throw new Error('OTP has expired. Please request a new OTP.');
      }

      // Now verify the OTP code
      if (otpRecord.otp_code !== otp) {
        // Get current failed attempts and increment
        const currentFailedAttempts = otpRecord.failed_attempts || 0;
        const newFailedAttempts = currentFailedAttempts + 1;

        if (newFailedAttempts >= this.maxVerificationAttempts) {
          // Mark OTP as invalid after max failed attempts
          await connection.execute(
            `UPDATE system_otps 
             SET is_valid = 0, failed_attempts = ?
             WHERE id = ?`,
            [newFailedAttempts, otpRecord.id]
          );
          throw new Error(`Too many failed attempts (${this.maxVerificationAttempts}). OTP has been invalidated. Please request a new OTP.`);
        } else {
          // Update failed attempts count
          await connection.execute(
            `UPDATE system_otps 
             SET failed_attempts = ?
             WHERE id = ?`,
            [newFailedAttempts, otpRecord.id]
          );
          throw new Error(`Invalid OTP code. You have ${this.maxVerificationAttempts - newFailedAttempts} attempt(s) left.`);
        }
      }

      // OTP is valid - mark as verified and reset failed attempts
      // Get current time in DEVICE'S timezone
      const currentDeviceTime = TimezoneHelper.getCurrentDeviceTime(deviceInfo?.ipAddress);
      const userTimezone = TimezoneHelper.detectUserTimezone(deviceInfo?.ipAddress);
      const verifiedDeviceTime = TimezoneHelper.toMySQLDateTime(currentDeviceTime);

      await connection.execute(
        `UPDATE system_otps 
         SET is_verified = 1, verified_at = ?, failed_attempts = 0 
         WHERE id = ?`,
        [verifiedDeviceTime, otpRecord.id]
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        adminId,
        email,
        processId: otpRecord.process_id,
        deviceId: otpRecord.device_id,
        deviceName: otpRecord.device_name,
        verifiedAt: verifiedDeviceTime, // In device's timezone
        userTimezone
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // NEW METHOD FOR UNREGISTERED USERS - ENHANCED WITH EMAIL VALIDATION
  async verifyOTPForUnregistered(email, otp, processId = null, deviceInfo = null) {
    const connection = await pool.getConnection();

    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        throw new Error('For unregistered users, identifier must be a valid email address');
      }

      // ALWAYS require processId for verification
      if (!processId) {
        throw new Error('Process ID is required for OTP verification');
      }

      // First, check if this processId exists and get its status
      const [otpRecords] = await connection.execute(
        `SELECT * FROM system_otps 
         WHERE email = ? AND process_id = ? AND admin_id IS NULL
         AND is_valid = 1
         ORDER BY created_at DESC LIMIT 1`,
        [email, processId]
      );

      if (otpRecords.length === 0) {
        throw new Error('Invalid Process ID. Please request a new OTP.');
      }

      const otpRecord = otpRecords[0];

      // Check if OTP is already verified (is_verified = 1)
      if (otpRecord.is_verified === 1) {
        throw new Error('This OTP has already been used. Please request a new OTP.');
      }

      // Check if OTP is expired using DEVICE'S TIMEZONE
      const isExpired = TimezoneHelper.isExpired(
        otpRecord.expires_at,
        deviceInfo?.ipAddress
      );

      if (isExpired) {
        // Mark OTP as invalid when expired
        await connection.execute(
          `UPDATE system_otps 
           SET is_valid = 0 
           WHERE id = ?`,
          [otpRecord.id]
        );
        throw new Error('OTP has expired. Please request a new OTP.');
      }

      // Now verify the OTP code
      if (otpRecord.otp_code !== otp) {
        // Get current failed attempts and increment
        const currentFailedAttempts = otpRecord.failed_attempts || 0;
        const newFailedAttempts = currentFailedAttempts + 1;

        if (newFailedAttempts >= this.maxVerificationAttempts) {
          // Mark OTP as invalid after max failed attempts
          await connection.execute(
            `UPDATE system_otps 
             SET is_valid = 0, failed_attempts = ?
             WHERE id = ?`,
            [newFailedAttempts, otpRecord.id]
          );
          throw new Error(`Too many failed attempts (${this.maxVerificationAttempts}). OTP has been invalidated. Please request a new OTP.`);
        } else {
          // Update failed attempts count
          await connection.execute(
            `UPDATE system_otps 
             SET failed_attempts = ?
             WHERE id = ?`,
            [newFailedAttempts, otpRecord.id]
          );
          throw new Error(`Invalid OTP code. You have ${this.maxVerificationAttempts - newFailedAttempts} attempt(s) left.`);
        }
      }

      // OTP is valid - mark as verified and reset failed attempts
      // Get current time in DEVICE'S timezone
      const currentDeviceTime = TimezoneHelper.getCurrentDeviceTime(deviceInfo?.ipAddress);
      const userTimezone = TimezoneHelper.detectUserTimezone(deviceInfo?.ipAddress);
      const verifiedDeviceTime = TimezoneHelper.toMySQLDateTime(currentDeviceTime);

      await connection.execute(
        `UPDATE system_otps 
         SET is_verified = 1, verified_at = ?, failed_attempts = 0 
         WHERE id = ?`,
        [verifiedDeviceTime, otpRecord.id]
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        email,
        processId: otpRecord.process_id,
        deviceId: otpRecord.device_id,
        deviceName: otpRecord.device_name,
        verifiedAt: verifiedDeviceTime, // In device's timezone
        userTimezone
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // Modified cleanup method to handle device timezone-based expiry
  async cleanExpiredOTPs() {
    const connection = await pool.getConnection();
    try {
      // Get all unexpired OTPs to check individually
      const [allOTPs] = await connection.execute(
        `SELECT id, expires_at, device_id, ip_address FROM system_otps 
         WHERE is_valid = 1 AND is_verified = 0`
      );

      let expiredCount = 0;

      for (const otpRecord of allOTPs) {
        // Extract IP from device_id or use default
        let ipAddress = null;
        if (otpRecord.device_id && otpRecord.device_id.startsWith('device_')) {
          // Try to extract IP from device_id or use stored IP
          ipAddress = otpRecord.ip_address || null;
        }

        // Check if expired using device's timezone
        const isExpired = TimezoneHelper.isExpired(
          otpRecord.expires_at,
          ipAddress
        );

        if (isExpired) {
          await connection.execute(
            `UPDATE system_otps SET is_valid = 0 WHERE id = ?`,
            [otpRecord.id]
          );
          expiredCount++;
        }
      }

      // Also clean verified OTPs older than 24 hours
      // Use default timezone for this cleanup since it's just old data removal
      const twentyFourHoursAgo = moment().subtract(24, 'hours');
      const formattedTwentyFourHoursAgo = twentyFourHoursAgo.format('YYYY-MM-DD HH:mm:ss');

      const [oldOTPs] = await connection.execute(
        `DELETE FROM system_otps 
         WHERE (is_verified = 1 OR is_valid = 0) 
         AND created_at < ?`,
        [formattedTwentyFourHoursAgo]
      );

      console.log(`[OTP Cleanup] Expired: ${expiredCount}, Old: ${oldOTPs.affectedRows}`);

      return {
        expiredRemoved: expiredCount,
        oldRemoved: oldOTPs.affectedRows
      };
    } catch (error) {
      console.error('[OTP Cleanup] Error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getOTPStats() {
    const connection = await pool.getConnection();
    try {
      const [stats] = await connection.execute(
        `SELECT 
          COUNT(*) as total_otps,
          SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_otps,
          SUM(CASE WHEN is_verified = 0 AND is_valid = 1 THEN 1 ELSE 0 END) as active_otps,
          SUM(CASE WHEN is_valid = 0 THEN 1 ELSE 0 END) as invalid_otps,
          SUM(CASE WHEN admin_id IS NULL THEN 1 ELSE 0 END) as unregistered_otps,
          SUM(CASE WHEN admin_id IS NOT NULL THEN 1 ELSE 0 END) as registered_otps
         FROM system_otps`
      );

      return stats[0];
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Start periodic cleanup interval
  startCleanupInterval() {
    setInterval(async () => {
      try {
        await this.cleanExpiredOTPs();
      } catch (error) {
        console.error('[OTP Cleanup Interval] Error:', error);
      }
    }, this.cleanupInterval * 60 * 1000); // Convert minutes to milliseconds

    console.log(`OTP cleanup scheduled every ${this.cleanupInterval} minutes`);
  }
}

export default new OTPService();