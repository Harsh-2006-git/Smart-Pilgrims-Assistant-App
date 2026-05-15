import express from "express";
import authenticateClient from "../middlewares/authMiddleware.js";
import { requireStayManager, requireRole } from "../middlewares/authorizeAccess.js";
import {
  cancelStayBooking,
  createStayBooking,
  getMyStayBookings,
  getStayBookingsForOwner,
  getOwnerOverview,
  getOwnerBookings,
  verifyStayBooking,
  getAdminStayBookings,
  updateStayBookingStatus,
} from "../controllers/stayBookingController.js";

const router = express.Router();

router.use(authenticateClient);

// Guest Routes
router.post("/", createStayBooking);
router.post("/verify", verifyStayBooking);
router.get("/my-bookings", getMyStayBookings);
router.patch("/:bookingId/cancel", cancelStayBooking);

// Owner Routes
router.get("/owner/overview", requireStayManager, getOwnerOverview);
router.get("/owner/bookings", requireStayManager, getOwnerBookings);
router.get("/stay/:stayId", requireStayManager, getStayBookingsForOwner);
router.patch("/owner/status/:bookingId", requireStayManager, updateStayBookingStatus);

// Admin Routes
router.get("/admin/all-bookings", requireRole(["Admin"]), getAdminStayBookings);

export default router;
