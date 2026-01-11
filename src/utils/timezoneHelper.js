import lookup from 'geoip-lite';
import moment from 'moment-timezone';

class TimezoneHelper {
  // Detect user's timezone based on IP address
  static detectUserTimezone(ipAddress = null) {
    try {
      // If no IP provided, default to IST (India Standard Time)
      if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
        return 'Asia/Kolkata'; // Default to IST
      }

      // Lookup location from IP
      const geo = lookup(ipAddress);
      if (geo && geo.timezone) {
        return geo.timezone;
      }

      // Default to IST if cannot detect
      return 'Asia/Kolkata';
    } catch (error) {
      console.error('Error detecting timezone:', error);
      return 'Asia/Kolkata'; // Default to IST
    }
  }

  // Get current time in specific timezone
  static getCurrentTimeInTimezone(timezone = 'Asia/Kolkata') {
    try {
      return moment().tz(timezone);
    } catch (error) {
      console.error('Error getting time in timezone:', error);
      return moment().tz('Asia/Kolkata'); // Fallback to IST
    }
  }

  // Convert to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss) - stores as-is
  static toMySQLDateTime(dateTime) {
    try {
      return dateTime.format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
      console.error('Error converting to MySQL datetime:', error);
      return moment().format('YYYY-MM-DD HH:mm:ss');
    }
  }

  // Parse MySQL DATETIME string - assumes it's in the provided timezone
  static parseMySQLDateTime(mysqlDateTime, timezone = 'Asia/Kolkata') {
    try {
      // Parse as local time in specified timezone
      return moment.tz(mysqlDateTime, 'YYYY-MM-DD HH:mm:ss', timezone);
    } catch (error) {
      console.error('Error parsing MySQL datetime:', error);
      return moment().tz(timezone);
    }
  }

  // Add minutes to given time in same timezone
  static addMinutes(dateTime, minutes) {
    try {
      return dateTime.clone().add(minutes, 'minutes');
    } catch (error) {
      console.error('Error adding minutes:', error);
      return dateTime;
    }
  }

  // Get current time in device's timezone
  static getCurrentDeviceTime(ipAddress) {
    const timezone = this.detectUserTimezone(ipAddress);
    return this.getCurrentTimeInTimezone(timezone);
  }

  // Calculate expiry time based on device's local time
  static calculateExpiryTime(currentDeviceTime, expiryMinutes) {
    return this.addMinutes(currentDeviceTime, expiryMinutes);
  }

  // Validate if current time (in device's timezone) is after expiry time
  static isExpired(expiryTimeString, deviceIp = null) {
    try {
      // Get current time in device's timezone
      const currentDeviceTime = this.getCurrentDeviceTime(deviceIp);
      const deviceTimezone = this.detectUserTimezone(deviceIp);

      // Parse expiry time (which was stored in device's timezone when created)
      const expiryTime = this.parseMySQLDateTime(expiryTimeString, deviceTimezone);

      // Compare in same timezone
      return currentDeviceTime.isAfter(expiryTime);
    } catch (error) {
      console.error('Error checking expiry:', error);
      return true; // If error, consider expired
    }
  }

  // Calculate time difference between stored time and current time in same timezone
  static getTimeDifferenceSeconds(storedTimeString, deviceIp = null) {
    try {
      // Get current time in device's timezone
      const currentDeviceTime = this.getCurrentDeviceTime(deviceIp);
      const deviceTimezone = this.detectUserTimezone(deviceIp);

      // Parse stored time (which was stored in device's timezone when created)
      const storedTime = this.parseMySQLDateTime(storedTimeString, deviceTimezone);

      // Calculate difference in seconds
      return currentDeviceTime.diff(storedTime, 'seconds');
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return 0;
    }
  }

  // Format date for response
  static formatForResponse(dateTime, format = 'YYYY-MM-DD HH:mm:ss') {
    try {
      return dateTime.format(format);
    } catch (error) {
      console.error('Error formatting for response:', error);
      return moment().format(format);
    }
  }

  // Parse any datetime string to moment in specific timezone
  static parseToTimezone(datetimeString, timezone = 'Asia/Kolkata') {
    try {
      return moment.tz(datetimeString, timezone);
    } catch (error) {
      console.error('Error parsing datetime to timezone:', error);
      return moment().tz(timezone);
    }
  }
}

export default TimezoneHelper;