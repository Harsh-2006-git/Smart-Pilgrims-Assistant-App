// controllers/lostFoundController.js
import LostFound from "../models/LostFound.js";

export const createLostFound = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    const { email, phone } = req.user; // from token
    const image = req.file ? req.file.path : null;

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
    next(error);
  }
};

export const getLostFoundItems = async (req, res, next) => {
  try {
    const items = await LostFound.findAll({
      order: [["uploadedAt", "DESC"]],
    });
    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, message: "No items available" });
    }
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
};
