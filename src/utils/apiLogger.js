import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs", "api");

// Create log directory if it doesn't exist
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Winston logger
const apiLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, message }) => `${timestamp} ${message}`)
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, "%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
    }),
    new winston.transports.Console(),
  ],
});

// Middleware to log requests and responses
export const logApi = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip, body } = req;

  // Capture original send
  const originalSend = res.send.bind(res);

  res.send = (data) => {
    const responseTime = Date.now() - start;

    let responseBody;
    try {
      responseBody = JSON.parse(data);
    } catch (e) {
      responseBody = data;
    }

    // Extract device info from request if available
    const deviceInfo = req.deviceInfo ? JSON.stringify(req.deviceInfo) : "N/A";

    apiLogger.info(
      `[${method}] ${url} | Status: ${res.statusCode} | Time: ${responseTime} ms | IP: ${ip} | Device: ${deviceInfo} | Body: ${JSON.stringify(
        body
      )} | Response: ${JSON.stringify(responseBody)}`
    );

    return originalSend(data);
  };

  next();
};

export default apiLogger;