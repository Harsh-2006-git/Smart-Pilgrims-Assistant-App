import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Client from "../models/client.js";
import { v4 as uuidv4 } from "uuid";

const SELF_REGISTERABLE_USER_TYPES = ["Civilian", "VIP", "Sadhu", "Admin", "Aged", "ParkingOwner", "Divyang"];

export const register = async (req, res) => {
  try {
    const { name, phone, email, password, userType, adminSecret } = req.body;
    const requestedUserType = userType || "Civilian";

    if (!SELF_REGISTERABLE_USER_TYPES.includes(requestedUserType)) {
      return res.status(400).json({
        message:
          requestedUserType === "StayOwner"
            ? "Stay host access is granted by admin verification, not direct self-registration."
            : "Invalid user type selected.",
      });
    }

    // Strict backend validation for Admin role
    if (requestedUserType === "Admin") {
      const EXPECTED_ADMIN_SECRET = process.env.ADMIN_SECRET || "DIVYA-ADMIN-777";
      if (adminSecret !== EXPECTED_ADMIN_SECRET) {
        return res.status(403).json({ message: "Invalid Admin Secret Code. Registration denied." });
      }
    }

    // check if phone already exists
    const existingPhone = await Client.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone already registered" });
    }
    let unique_code = "RFID-" + uuidv4(); // e.g., RFID-3fa85f64-5717-4562-b3fc-2c963f66afa6

    // check if email already exists (if provided)
    if (email) {
      const existingEmail = await Client.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new client
    const client = await Client.create({
      name,
      phone,
      email: email || null, // allow null if not provided
      userType: requestedUserType,
      unique_code,
      password: hashedPassword,
      stayHostVerified: false,
    });

    // generate jwt token right after registration
    const token = jwt.sign(
      {
        client_id: client.client_id,
        phone: client.phone,
        email: client.email,
        userType: client.userType,
        stayHostVerified: client.stayHostVerified,
        unique_code: client.unique_code,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        client_id: client.client_id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        userType: client.userType,
        stayHostVerified: client.stayHostVerified,
        unique_code: client.unique_code,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Handle duplicate entry gracefully
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: `Duplicate entry: ${error.fields ? JSON.stringify(error.fields) : "already exists"
          }`,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const client = await Client.findOne({ where: { phone } });
    if (!client) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    // generate jwt token
    const token = jwt.sign(
      {
        client_id: client.client_id,
        phone: client.phone,
        email: client.email,
        userType: client.userType,
        stayHostVerified: client.stayHostVerified,
        unique_code: client.unique_code,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        client_id: client.client_id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        unique_code: client.unique_code,
        userType: client.userType,
        stayHostVerified: client.stayHostVerified,
        profile_image: client.profile_image,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const client = await Client.findByPk(req.user.client_id);

    if (!client) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) client.name = name;
    if (phone) client.phone = phone;
    if (email) client.email = email;

    if (req.file) {
      client.profile_image = req.file.path.replace(/\\/g, "/"); // Store URL or normalized local path
    }

    await client.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        client_id: client.client_id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        unique_code: client.unique_code,
        userType: client.userType,
        stayHostVerified: client.stayHostVerified,
        profile_image: client.profile_image,
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchUser = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const client = await Client.findOne({
      where: { phone },
      attributes: ["client_id", "name", "phone", "email", "profile_image"]
    });

    if (!client) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
