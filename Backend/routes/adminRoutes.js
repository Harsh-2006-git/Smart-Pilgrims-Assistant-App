import express from "express";
import {
    getAdminStats,
    getAllUsers,
    getAllStayListingsForAdmin,
    getAllTickets,
    getAllLostFound,
    getZoneDensity,
    getActiveAlerts,
    createAlert,
    deactivateAlert,
    handleSOS,
    getSOSAlerts,
    deleteSOS,
    moderateStayListing,
    updateUserStayHostAccess
} from "../controllers/adminController.js";
import authenticateClient from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/authorizeAccess.js";

const router = express.Router();

router.get("/alerts/active", getActiveAlerts); // Public access for AlertBanner

router.use(authenticateClient);
router.post("/sos", handleSOS);
router.use(requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/stay-host", updateUserStayHostAccess);
router.get("/tickets", getAllTickets);
router.get("/lostfound", getAllLostFound);
router.get("/density", getZoneDensity);
router.get("/stays", getAllStayListingsForAdmin);
router.patch("/stays/:id/moderate", moderateStayListing);
router.post("/alerts", createAlert); // Admin only alert creation
router.patch("/alerts/:id/deactivate", deactivateAlert);
router.get("/sos", getSOSAlerts);
router.delete("/sos/:id", deleteSOS);

export default router;
