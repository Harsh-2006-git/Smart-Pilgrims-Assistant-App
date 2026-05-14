// SarthiX: Pilgrim Management System v1.1 mergency Response Optimized
import * as dotenv from "dotenv";
import express, { json, response } from "express";
import { connectDB, sequelize } from "./config/database.js";
import errorHandler from "./middlewares/errorHandler.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";

import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import zoneRoutes from "./routes/ZoneRoutes.js";
import LostFound from "./routes/lostFoundRoutes.js";
import TicketRoute from "./routes/ticketRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import familyMemberRoutes from "./routes/familyMemberRoutes.js";

import nearbyRoutes from "./routes/nearbyRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import Alert from "./models/alert.js";
import GuardianMapping from "./models/GuardianMapping.js"; // Force Sequelize sync
import LocationLog from "./models/LocationLog.js"; // Force Sequelize sync

import cors from "cors";
import path from "path";
import { createServer } from "http";
import { initSocket } from "./socket/socketHandler.js";

import { fileURLToPath } from "url";
import crowdRoutes, { initCrowdAI } from "./routes/crowdRoutes.js";

// Try loading local .env first, then fallback to parent directory .env
dotenv.config();
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const PORT = process.env.PORT || 3001;
const app = express();

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration - Allow local development and production origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://divya-yatra-tit.vercel.app",
  "https://divyayatra-tic.onrender.com",
  "https://www.divyayatra.xyz"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  })
);

// Middleware - FIX 2: Correct order
app.use(json());
app.use(express.urlencoded({ extended: true })); // Move this up before routes
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // FIX 3: Allow cross-origin resources
  }),
);

// Static file serving - FIX 4: Better path resolution
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add a test route to check if files exist
app.get("/test-upload/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "File not found", path: filePath });
    }
  });
});

// Apply global rate limiter
app.use(globalLimiter);

// Routes
app.use("/api/v1/crowd", crowdRoutes);
app.get("/", (req, res) => {
  res.send("hello");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/zone", zoneRoutes);
app.use("/api/v1/lost", LostFound);
app.use("/api/v1/ticket", TicketRoute);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/parking", parkingRoutes);
app.use("/api/v1/booking", bookingRoutes);
app.use("/api/v1/family", familyMemberRoutes);

app.use("/api/v1/nearby", nearbyRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);
app.use("/api/v1/location", locationRoutes);


app.use(errorHandler);


// Serverless Compatibility and Server Initialization
let isInitialized = false;

const initializeApp = async () => {
  if (isInitialized) return;
  try {
    console.log("🔄 Divya Yatra Server Initializing...");
    await connectDB();
    await sequelize.sync();
    console.log("✅ Database Connected");

    const backendRoot = path.dirname(fileURLToPath(import.meta.url));
    initCrowdAI(backendRoot);
    console.log("🧠 AI Neural Core active");

    isInitialized = true;
  } catch (error) {
    console.error("❌ Failed to ignite server:", error.message);
    throw error;
  }
};

// Create HTTP server
const httpServer = createServer(app);
// Initialize Socket.IO
const io = initSocket(httpServer);

// If we are running in Vercel, we can export the app and initialize DB
// We attach a middleware that ensures the DB is connected before handling requests
app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await initializeApp();
      if (!isInitialized) {
        return res.status(503).json({ message: "Server initializing, please wait..." });
      }
    } catch (err) {
      return res.status(500).json({ message: "Server failed to initialize", error: err.message });
    }
  }
  next();
});

if (process.env.VERCEL && process.env.NODE_ENV === "production") {
  // Vercel Serverless Function entry point
  console.log("📱 Running in Serverless Mode");
} else {
  // Local development entry point
  const startServer = async () => {
    // Check if we are in a non-production/non-CI environment before clearing
    if (process.env.NODE_ENV !== "production" && !process.env.RENDER) {
      process.stdout.write("\u001b[2J\u001b[0;0H");
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Initializing on port ${PORT}...`);

    await initializeApp();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("📧 Email system ready");
      console.log("🛰️  Real-time Socket.io active");
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  };

  startServer();
}

export default app;
