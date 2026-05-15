// models/client.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Client = sequelize.define(
  "Client",
  {
    client_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: true, unique: true },
    userType: {
      type: DataTypes.ENUM("Civilian", "VIP", "Sadhu", "Admin", "Aged", "ParkingOwner", "Divyang", "StayOwner", "Pilgrim"),
      defaultValue: "Pilgrim",
    },
    stayHostVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    password: { type: DataTypes.STRING, allowNull: true },
    profile_image: { type: DataTypes.STRING, allowNull: true },
    unique_code: { type: DataTypes.STRING, allowNull: true, unique: true }, // QR/RFID code
  },
  {
    tableName: "clients",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Client;
