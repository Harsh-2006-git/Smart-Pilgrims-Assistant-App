// controllers/lostFoundController.js
import LostFound from "../models/LostFound.js";

export const createLostFound = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const { email, phone } = req.user; // from token
    const image = req.file ? req.file.path.replace(/\\/g, "/") : null;

    const item = await LostFound.create({
      title,
      description,
      status,
      reportedByEmail: email,
      reportedByPhone: phone,
      image,
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLostFoundItems = async (req, res) => {
  try {
    const items = await LostFound.findAll({
      order: [["uploadedAt", "DESC"]],
    });
    if (!items) {
      res.status(500).json({ success: false, message: "NO item available" });
    }
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
