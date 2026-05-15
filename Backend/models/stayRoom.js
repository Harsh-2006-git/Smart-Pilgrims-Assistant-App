import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const StayRoom = sequelize.define(
  "StayRoom",
  {
    room_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stay_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "stay_listings",
        key: "stay_id",
      },
    },
    roomType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    availableRooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    pricePerNight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    roomImages: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue("roomImages");
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue("roomImages", JSON.stringify(value || []));
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    amenities: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue("amenities");
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue("amenities", JSON.stringify(value || []));
      },
    },
  },
  {
    tableName: "stay_rooms",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default StayRoom;
