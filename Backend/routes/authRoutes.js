import express from "express";
import Client from "../models/client.js";
import { register, login, updateProfile, searchUser } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import { profileStorage } from "../config/cloudinary.js";
const upload = multer({ storage: profileStorage });

import authenticateClient from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateClient, async (req, res) => {
  try {
    if (!req.user || req.user.firebaseOnly) {
      return res.status(404).json({ message: "User not registered in local database" });
    }

    const client = await Client.findByPk(req.user.client_id, {
      attributes: [
        "client_id",
        "name",
        "phone",
        "email",
        "unique_code",
        "userType",
        "stayHostVerified",
        "profile_image",
        "created_at",
        "updated_at",
      ],
    });

    if (!client) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate local JWT to keepeverything consistent
    const localToken = jwt.sign(
      {
        client_id: client.client_id,
        phone: client.phone,
        email: client.email,
        userType: client.userType,
        stayHostVerified: client.stayHostVerified,
        unique_code: client.unique_code,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Welcome to profile",
      user: client,
      token: localToken
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/search", authenticateClient, searchUser);
router.put("/profile", authenticateClient, upload.single("profile_image"), updateProfile);

export default router;
