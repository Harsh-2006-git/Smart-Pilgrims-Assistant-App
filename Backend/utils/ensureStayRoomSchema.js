import { sequelize } from "../config/database.js";

export const ensureStayRoomSchema = async () => {
  try {
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'stay_rooms'");
    if (!tables?.length) {
      return;
    }

    const [columns] = await sequelize.query("SHOW COLUMNS FROM stay_rooms LIKE 'isActive'");
    if (columns?.length) {
      return;
    }

    await sequelize.query(
      "ALTER TABLE stay_rooms ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1 AFTER roomImages"
    );

    console.log("Added stay_rooms.isActive column");
  } catch (error) {
    console.warn("ensureStayRoomSchema skipped:", error.message);
  }
};
