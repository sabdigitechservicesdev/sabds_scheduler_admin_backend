import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

// Create main logs directory
const logBaseDir = path.join(process.cwd(), "logs");

// Ensure logs directory exists
if (!fs.existsSync(logBaseDir)) {
  fs.mkdirSync(logBaseDir, { recursive: true });
}

// Store created loggers to avoid recreation
const loggerCache = {};

// Get or create a logger for a specific category
const getCategoryLogger = (categoryName) => {
  // Use 'system' as default if no category specified
  const category = categoryName || 'system';

  // Return cached logger if exists
  if (loggerCache[category]) {
    return loggerCache[category];
  }

  // Create directory for this category if it doesn't exist
  const categoryLogDir = path.join(logBaseDir, `${category}_logs`);
  if (!fs.existsSync(categoryLogDir)) {
    fs.mkdirSync(categoryLogDir, { recursive: true });
  }

  // Create new logger for this category
  const categoryLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, message }) => `${timestamp} ${message}`)
    ),
    transports: [
      new DailyRotateFile({
        filename: path.join(categoryLogDir, "%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "30d",
      }),
      new winston.transports.Console(),
    ],
  });

  // Cache the logger for future use
  loggerCache[category] = categoryLogger;
  return categoryLogger;
};

// Middleware to log API requests and responses
export const logApi = (req, res, next) => {
  const requestStartTime = Date.now();
  const { method, originalUrl, ip, body, logCategory = 'system' } = req;

  // Store the original response.send method
  const originalSend = res.send.bind(res);

  // Override response.send to log response
  res.send = (responseData) => {
    const responseTime = Date.now() - requestStartTime;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
    } catch {
      parsedResponse = responseData;
    }

    // Get device information if available
    const deviceInfo = req.deviceInfo ? JSON.stringify(req.deviceInfo) : "N/A";

    // Create log entry
    const logEntry = `[${method}] ${originalUrl} | Status: ${res.statusCode} | Time: ${responseTime} ms | IP: ${ip} | Device: ${deviceInfo} | Body: ${JSON.stringify(body)} | Response: ${JSON.stringify(parsedResponse)}`;

    // Get the appropriate logger for this category
    const categoryLogger = getCategoryLogger(logCategory);
    categoryLogger.info(logEntry);

    // Call the original send method
    return originalSend(responseData);
  };

  next();
};

// Export helpers for direct use
export const getLoggerForCategory = (categoryName) => getCategoryLogger(categoryName);

export default { logApi, getLoggerForCategory };