import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CROWD_BACKEND_URL = "http://127.0.0.1:5773";

// AI Process Management
let aiProcess = null;


export const initCrowdAI = (backendPath) => {
    if (process.env.VERCEL) {
        console.warn("⚠️ AI Core disabled in Vercel Serverless Mode. Please deploy the Python AI service separately and update CROWD_BACKEND_URL.");
        return;
    }

    if (aiProcess) return;

    const pythonPath = process.platform === "win32" ? "py" : "python3";
    const scriptPath = path.join(backendPath, "AI_Core", "crowd_engine.py");

    try {
        // Fix for DeprecationWarning and Security: verify python exists or use shell: false
        // Using shell: false is safer and removes the warning
        aiProcess = spawn(pythonPath, [scriptPath], {
            stdio: "inherit",
            shell: false,
            cwd: path.join(backendPath, "AI_Core"),
            detached: false
        });

        aiProcess.on("error", (err) => {
            console.warn("⚠️ AI Core failed to start (Flask may not be installed):", err.message);
            aiProcess = null;
        });

        aiProcess.on("exit", (code) => {
            if (code !== 0) {
                console.warn("⚠️ AI Core process exited with code:", code);
            }
            aiProcess = null;
        });

        process.on("exit", () => {
            if (aiProcess) {
                try {
                    aiProcess.kill();
                } catch (e) {
                    // Ignore kill errors
                }
            }
        });
    } catch (err) {
        console.warn("⚠️ Failed to spawn AI Core:", err.message);
        aiProcess = null;
    }
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
