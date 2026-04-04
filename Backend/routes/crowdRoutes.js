import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CROWD_BACKEND_URL = process.env.CROWD_SERVICE_URL || "http://127.0.0.1:5773";

// The Crowd Detection Service is now deployed independently from the Node.js backend.
// Simply set CROWD_SERVICE_URL in your .env file to point to your new python service endpoint.

export const initCrowdAI = (backendPath) => {
    console.log(`📡 Connecting to Crowd AI Service at ${CROWD_BACKEND_URL}`);
};

// Proxy Middleware for AI Endpoints
router.use(
    "/",
    createProxyMiddleware({
        target: CROWD_BACKEND_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/api/v1/crowd": "",
        },
        ws: true,
        onError: (err, req, res) => {
            res.status(502).json({
                error: "AI Neural Core is offline",
                message: "The AI engine is currently initializing or unavailable."
            });
        },
    })
);

export default router;
