import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import OTPService from '../services/systemOTP.service.js';

dotenv.config();

// Create the pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql.railway.internal',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AqrKWilwhOaQvGxwYRBEzZbqoXluTyYI',
  database: process.env.DB_NAME || 'sabds_scheduler_test_db',
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
};

// Run OTP cleanup job
const runOTPCleanup = async () => {
  try {
    await OTPService.cleanExpiredOTPs();
  } catch (err) {
    console.error('❌ OTP cleanup failed:', err.message);
  }
};

// Initialize OTP cleanup after database connection is established
const initializeOTPCleanup = async () => {
  try {
    // Wait for database connection to be ready
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ OTP cleanup initialization skipped - Database not connected');
      return;
    }

    // Parse cleanup interval from environment (default to 5 minutes)
    const cleanupIntervalMinutes = parseInt(process.env.OTP_CLEANUP_INTERVAL_MINUTES) || 5;
    const cleanupOnStartup = process.env.OTP_CLEANUP_ON_STARTUP !== 'false'; // default true

    // Convert minutes to milliseconds
    const cleanupIntervalMs = cleanupIntervalMinutes * 60 * 1000;

    // Run cleanup on startup if enabled (immediately)
    if (cleanupOnStartup) {
      try {
        console.log(`⏰ Running initial OTP cleanup...`);
        await runOTPCleanup();
        console.log(`✅ Initial OTP cleanup completed`);
      } catch (err) {
        console.error('❌ Initial OTP cleanup failed:', err.message);
      }
    }

    // ✅ FIXED: Schedule Frepeat every 5 minutes
    const now = new Date();
    const firstCleanupTime = new Date(now.getTime() + cleanupIntervalMs);

    console.log(`✅ OTP cleanup job scheduled successfully`);
    console.log(`⏱️  Cleanup interval: ${cleanupIntervalMinutes} minutes`);
    console.log(`⏰ Next cleanup scheduled at: ${firstCleanupTime.toLocaleTimeString()}`);

    // Schedule first cleanup after 5 minutes
    setTimeout(() => {
      console.log(`⏰ Running first scheduled OTP cleanup...`);
      runOTPCleanup();

      // Then set up recurring cleanup every 5 minutes
      const cleanupJob = setInterval(() => {
        console.log(`⏰ Running scheduled OTP cleanup (every ${cleanupIntervalMinutes} minutes)`);
        runOTPCleanup();
      }, cleanupIntervalMs);

      // Store interval ID for potential cleanup
      process.otpCleanupIntervalId = cleanupJob;

    }, cleanupIntervalMs);

  } catch (error) {
    console.error('❌ Failed to setup OTP cleanup job:', error.message);
  }
};

// Call initialization - but wait a bit to ensure everything is loaded
setTimeout(() => {
  initializeOTPCleanup();
}, 3000); // Wait 3 seconds to ensure all modules are loaded

export default pool;