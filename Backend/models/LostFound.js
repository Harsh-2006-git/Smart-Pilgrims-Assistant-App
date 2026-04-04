// models/LostFound.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const LostFound = sequelize.define("LostFound", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  image: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM("lost", "found"),
    allowNull: false,
  },
  reportedByEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reportedByPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // auto sets current date/time
  },
});

export default LostFound;
