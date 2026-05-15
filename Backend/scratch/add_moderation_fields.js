import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

async function migrate() {
  try {
    console.log("Updating stay_listings table...");
    const queryInterface = sequelize.getQueryInterface();
    
    // Add moderationStatus if not exists
    await queryInterface.addColumn("stay_listings", "moderationStatus", {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Suspended"),
      defaultValue: "Pending",
    });
    
    // Add rejectionReason if not exists
    await queryInterface.addColumn("stay_listings", "rejectionReason", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    
    console.log("Successfully updated stay_listings table.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
