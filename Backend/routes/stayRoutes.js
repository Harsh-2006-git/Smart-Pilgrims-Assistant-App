// routes/stayRoutes.js — listings, bookings (guest or JWT), favorites, notifications (email + cron)
import express from "express";
import multer from "multer";
import authenticateClient from "../middlewares/authMiddleware.js";
import optionalAuth from "../middlewares/optionalAuthMiddleware.js";
import { stayStorage } from "../config/cloudinary.js";
import {
    listStays,
    getStayById,
    getMyStayListings,
    getMyStayBookings,
    createStayListing,
    updateStayListing,
    deleteStayListing,
    toggleStayListing,
    createStayBooking,
    confirmStayBooking,
    cancelStayBooking,
    getStayBookingStatusPublic,
    addFavorite,
    removeFavorite,
    listFavorites,
    runStayCheckInRemindersCron,
} from "../controllers/stayController.js";

const router = express.Router();
const upload = multer({
    storage: stayStorage,
    limits: { fileSize: 10 * 1024 * 1024, files: 40 },
});

router.get("/my-listings", authenticateClient, getMyStayListings);
router.get("/my-bookings", authenticateClient, getMyStayBookings);

router.get("/favorites", authenticateClient, listFavorites);
router.post("/favorites/:stayId", authenticateClient, addFavorite);
router.delete("/favorites/:stayId", authenticateClient, removeFavorite);

router.get("/bookings/:bookingId/status", getStayBookingStatusPublic);
router.patch("/bookings/:bookingId/cancel", optionalAuth, cancelStayBooking);
router.patch("/bookings/:bookingId/confirm", authenticateClient, confirmStayBooking);

router.post("/cron/check-in-reminders", runStayCheckInRemindersCron);

router.get("/", listStays);
router.get("/:stayId", getStayById);

router.post("/", authenticateClient, upload.any(), createStayListing);
router.put("/:stayId", authenticateClient, upload.any(), updateStayListing);
router.delete("/:stayId", authenticateClient, deleteStayListing);
router.patch("/:stayId/toggle", authenticateClient, toggleStayListing);
router.post("/:stayId/bookings", optionalAuth, createStayBooking);

export default router;
