import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import systemAuthRoutes from "./routes/systemAuth.routes.js";
import systemAuthOTPRoutes from "./routes/systemAuthOTP.routes.js";
import systemPeakListRoutes from "./routes/systemPickList.routes.js";
import systemProfileRoutes from "./routes/systemProfile.routes.js";

import { errorHandler } from "./utils/errorHandler.js";
import { logApi } from "./utils/apiLogger.js";
import deviceInfoMiddleware from "./middleware/deviceInfo.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- Security -------------------- */
app.use(helmet());

/* -------------------- CORS -------------------- */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.CORS_ORIGIN,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

/* -------------------- Body Parsers -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- DEVICE INFO MIDDLEWARE -------------------- */
app.use(deviceInfoMiddleware);

/* -------------------- API LOGGING -------------------- */
app.use(logApi);

/* -------------------- Morgan Console Logs -------------------- */
app.use(
  morgan(
    (tokens, req, res) =>
      [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens["response-time"](req, res) + " ms",
      ].join(" "),
    {
      stream: { write: (message) => console.log(message.trim()) },
    }
  )
);

/* -------------------- LOG CATEGORY MIDDLEWARES -------------------- */
// Clear, self-explanatory middleware names
const logToSystem = (req, res, next) => {
  req.logCategory = 'system';
  next();
};

const logToClient = (req, res, next) => {
  req.logCategory = 'client';
  next();
};

const logToPartner = (req, res, next) => {
  req.logCategory = 'partner';
  next();
};

const logToPublic = (req, res, next) => {
  req.logCategory = 'public';
  next();
};

// Generic version for custom categories
const logToCategory = (categoryName) => {
  return (req, res, next) => {
    req.logCategory = categoryName;
    next();
  };
};

/* -------------------- Health Check -------------------- */
app.get("/health", logToSystem, (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Scheduler Auth API",
  });
});

/* -------------------- System Admin Routes -------------------- */
app.use("/api/system-admin/peak-list",
  logToSystem,  // Clear: Logs go to system category
  systemPeakListRoutes
);

app.use("/api/system-admin/auth",
  logToSystem,  // Clear: Logs go to system category
  systemAuthRoutes
);

app.use("/api/system-admin/profile",
  logToSystem,  // Clear: Logs go to system category
  systemProfileRoutes
);

app.use("/api/system-admin/otp",
  logToSystem,  // Clear: Logs go to system category
  systemAuthOTPRoutes
);

/* -------------------- Future Routes Examples -------------------- */
// Example 1: Client routes (when you create them)
// app.use("/api/client/auth", logToClient, clientAuthRoutes);
// app.use("/api/client/profile", logToClient, clientProfileRoutes);

// Example 2: Public API routes
// app.use("/api/public/data", logToPublic, publicDataRoutes);

// Example 3: Partner API routes
// app.use("/api/partner/v1", logToPartner, partnerRoutes);

// Example 4: Special categories
// app.use("/api/analytics", logToCategory('analytics'), analyticsRoutes);
// app.use("/api/internal", logToCategory('internal'), internalRoutes);

/* -------------------- 404 Handler -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/* -------------------- Global Error Handler -------------------- */
app.use(errorHandler);

/* -------------------- Start Server -------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});