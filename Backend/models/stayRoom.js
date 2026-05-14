// models/stayRoom.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import StayListing from "./stayListing.js";

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
            references: { model: StayListing, key: "stay_id" },
            allowNull: false,
        },
        roomType: { type: DataTypes.STRING, allowNull: false },
        capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
        pricePerNight: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        availableRooms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        checkInTime: { type: DataTypes.STRING(16), allowNull: true, defaultValue: "12:00" },
        checkOutTime: { type: DataTypes.STRING(16), allowNull: true, defaultValue: "10:00" },
        roomImages: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const v = this.getDataValue("roomImages");
                return v ? JSON.parse(v) : [];
            },
            set(value) {
                this.setDataValue("roomImages", JSON.stringify(value || []));
            },
        },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
        tableName: "stay_rooms",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default StayRoom;
