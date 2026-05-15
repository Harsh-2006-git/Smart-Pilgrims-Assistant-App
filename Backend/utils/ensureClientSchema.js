import { sequelize } from "../config/database.js";

export const ensureClientSchema = async () => {
  const [columns] = await sequelize.query("SHOW COLUMNS FROM clients LIKE 'stayHostVerified'");

  if (!columns.length) {
    await sequelize.query(
      "ALTER TABLE clients ADD COLUMN stayHostVerified TINYINT(1) NOT NULL DEFAULT 0 AFTER userType"
    );
    console.log("✅ Added clients.stayHostVerified column");
  }
};
