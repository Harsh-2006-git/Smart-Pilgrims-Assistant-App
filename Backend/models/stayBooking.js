import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Client from "./client.js";
import StayListing from "./stayListing.js";
import StayRoom from "./stayRoom.js";

const StayBooking = sequelize.define(
  "StayBooking",
  {
    stay_booking_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stay_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: StayListing,
        key: "stay_id",
      },
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "stay_rooms",
        key: "room_id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Client,
        key: "client_id",
      },
    },
    guestName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guestPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkInDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    guests: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    roomsBooked: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Confirmed", "Rejected", "CheckedIn", "Completed", "Cancelled"),
      defaultValue: "Pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("Pending", "Paid", "Failed", "Refunded"),
      defaultValue: "Pending",
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "stay_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

StayBooking.belongsTo(StayListing, { foreignKey: "stay_id", as: "stay", onDelete: "CASCADE" });
StayBooking.belongsTo(StayRoom, { foreignKey: "room_id", as: "room" });
StayBooking.belongsTo(Client, { foreignKey: "user_id", as: "user" });

export default StayBooking;
