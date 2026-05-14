import express from "express";
import {
    getAdminStats,
    getAllUsers,
    getAllTickets,
    getAllLostFound,
    getZoneDensity,
    getActiveAlerts,
    createAlert,
    deactivateAlert,
    handleSOS,
    getSOSAlerts,
    deleteSOS
} from "../controllers/adminController.js";
import authenticateClient from "../middlewares/authMiddleware.js";
import { sosLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Apply auth middleware for safety (could also check for isAdmin role)
router.get("/stats", authenticateClient, getAdminStats);
router.get("/users", authenticateClient, getAllUsers);
router.get("/tickets", authenticateClient, getAllTickets);
router.get("/lostfound", authenticateClient, getAllLostFound);
router.get("/density", authenticateClient, getZoneDensity);
router.get("/alerts/active", getActiveAlerts); // Public access for AlertBanner
router.post("/alerts", authenticateClient, createAlert); // Admin only alert creation
router.patch("/alerts/:id/deactivate", authenticateClient, deactivateAlert);
router.post("/sos", authenticateClient, sosLimiter, handleSOS);
router.get("/sos", authenticateClient, getSOSAlerts);
router.delete("/sos/:id", authenticateClient, deleteSOS);

export default router;
