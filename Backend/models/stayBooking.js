// models/stayBooking.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Client from "./client.js";
import StayRoom from "./stayRoom.js";

const StayBooking = sequelize.define(
    "StayBooking",
    {
        stay_booking_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        stay_room_id: {
            type: DataTypes.INTEGER,
            references: { model: StayRoom, key: "room_id" },
            allowNull: false,
        },
        pilgrim_id: {
            type: DataTypes.INTEGER,
            references: { model: Client, key: "client_id" },
            allowNull: true,
        },
        guestName: { type: DataTypes.STRING, allowNull: true },
        guestEmail: { type: DataTypes.STRING, allowNull: true },
        checkInDate: { type: DataTypes.DATEONLY, allowNull: false },
        checkOutDate: { type: DataTypes.DATEONLY, allowNull: false },
        roomsBooked: { type: DataTypes.INTEGER, defaultValue: 1 },
        guests: { type: DataTypes.INTEGER, defaultValue: 1 },
        contactPhone: { type: DataTypes.STRING, allowNull: false },
        status: {
            type: DataTypes.ENUM("Pending", "Confirmed", "Cancelled", "Completed"),
            defaultValue: "Pending",
        },
        totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        specialRequests: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        tableName: "stay_bookings",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

StayBooking.belongsTo(StayRoom, { foreignKey: "stay_room_id", as: "room" });
StayBooking.belongsTo(Client, { foreignKey: "pilgrim_id", as: "pilgrim" });

export default StayBooking;
