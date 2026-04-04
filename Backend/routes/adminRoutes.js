import express from "express";
import {
    getAdminStats,
    getAllUsers,
    getAllTickets,
    getAllLostFound,
    getZoneDensity,
    getSignageData,
    createAlert,
    getAllAlerts,
    toggleAlert,
    deleteAlert,
    getActiveAlerts,
    checkAdmin
} from "../controllers/adminController.js";
import authenticateClient from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public route - any user can fetch active alerts
router.get("/alerts/active", getActiveAlerts);

// Admin check route
router.get("/check", authenticateClient, checkAdmin);

// Protected admin routes
router.get("/stats", authenticateClient, getAdminStats);
router.get("/users", authenticateClient, getAllUsers);
router.get("/tickets", authenticateClient, getAllTickets);
router.get("/lostfound", authenticateClient, getAllLostFound);
router.get("/density", authenticateClient, getZoneDensity);
router.get("/signage", authenticateClient, getSignageData);

// Alert CRUD
router.post("/alerts", authenticateClient, createAlert);
router.get("/alerts", authenticateClient, getAllAlerts);
router.put("/alerts/:id/toggle", authenticateClient, toggleAlert);
router.delete("/alerts/:id", authenticateClient, deleteAlert);

export default router;

