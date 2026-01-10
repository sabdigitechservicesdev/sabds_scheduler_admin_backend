import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import systemAuthRoutes from "./routes/systemAuth.routes.js";
import systemAuthOTPRoutes from "./routes/systemAuthOTP.routes.js";
import peakListRoutes from "./routes/systemPickList.routes.js";
import profileRoutes from "./routes/profile.routes.js";

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

/* -------------------- Health Check -------------------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Scheduler Auth API",
  });
});

/* -------------------- Routes -------------------- */
app.use("/api/peak-list", peakListRoutes);
app.use("/api/system-admin/auth", systemAuthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/auth", systemAuthOTPRoutes);

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