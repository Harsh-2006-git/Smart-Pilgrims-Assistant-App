import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Client from "../models/client.js";
import { v4 as uuidv4 } from "uuid";


export const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, userType, adminSecret } = req.body;

    // Strict backend validation for Admin role
    if (userType === "Admin") {
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
      userType,
      unique_code,
      password: hashedPassword,
    });

    // generate jwt token right after registration
    const token = jwt.sign(
      {
        client_id: client.client_id,
        phone: client.phone,
        email: client.email,
        userType: client.userType,
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
        unique_code: client.unique_code,
      },
    });
  } catch (error) {
    // Handle duplicate entry gracefully
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: `Duplicate entry: ${error.fields ? JSON.stringify(error.fields) : "already exists"
          }`,
      });
    }

    next(error);
  }
};

// LOGIN
export const login = async (req, res, next) => {
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
        profile_image: client.profile_image,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, email, userType } = req.body;
    const client = await Client.findByPk(req.user.client_id);

    if (!client) {
      return res.status(404).json({ message: "User not found" });
    }

    // Role change restriction
    if (userType === "Admin" && client.userType !== "Admin") {
      return res.status(403).json({ message: "Unauthorized role change to Admin" });
    }

    // Update fields
    if (name) client.name = name;
    if (phone) client.phone = phone;
    if (email) client.email = email;
    if (userType) client.userType = userType;

    if (req.file) {
      client.profile_image = req.file.path; // Store the Cloudinary URL
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
        profile_image: client.profile_image,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchUser = async (req, res, next) => {
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
    next(error);
  }
};
