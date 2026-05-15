import express from "express";
import multer from "multer";
import authenticateClient from "../middlewares/authMiddleware.js";
import { requireStayManager, requireRole } from "../middlewares/authorizeAccess.js";
import { stayStorage } from "../config/cloudinary.js";
import {
  createStayListing,
  deleteStayListing,
  getAllStayListings,
  getAdminStayListings,
  getStayAvailability,
  getStayListingForOwner,
  getMyStayListings,
  getStayListingById,
  moderateStayListing,
  toggleStayActivity,
  updateStayListing,
} from "../controllers/stayController.js";

const router = express.Router();
const upload = multer({ storage: stayStorage });

// Public Routes
router.get("/", getAllStayListings);
router.get("/:id/availability", getStayAvailability);
router.get("/:id", getStayListingById);

// Protected Routes
router.use(authenticateClient);

// Owner Routes
router.get("/owner/my-listings", requireStayManager, getMyStayListings);
router.get("/owner/listings/:id", requireStayManager, getStayListingForOwner);
router.post(
  "/",
  requireStayManager,
  upload.fields([
    { name: "propertyImages", maxCount: 6 },
    { name: "roomImages", maxCount: 6 },
  ]),
  createStayListing
);
router.put(
  "/:id",
  requireStayManager,
  upload.fields([
    { name: "propertyImages", maxCount: 6 },
    { name: "roomImages", maxCount: 6 },
  ]),
  updateStayListing
);
router.delete("/:id", requireStayManager, deleteStayListing);
router.patch("/:id/toggle", requireStayManager, toggleStayActivity);

// Admin Routes
router.get("/admin/all-listings", requireRole(["Admin"]), getAdminStayListings);
router.patch("/admin/moderate/:id", requireRole(["Admin"]), moderateStayListing);

export default router;
