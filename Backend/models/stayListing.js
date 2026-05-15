import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Client from "./client.js";
import StayRoom from "./stayRoom.js";

const StayListing = sequelize.define(
  "StayListing",
  {
    stay_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Client,
        key: "client_id",
      },
    },
    propertyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stayType: {
      type: DataTypes.ENUM("Homestay", "Dharamshala", "Lodge", "Hotel", "Guest House", "Ashram"),
      defaultValue: "Homestay",
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pilgrimageRoute: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nearbyTemple: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    distanceFromTempleKm: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    checkInTime: {
      type: DataTypes.TIME,
      defaultValue: "12:00:00",
    },
    checkOutTime: {
      type: DataTypes.TIME,
      defaultValue: "10:00:00",
    },
    foodAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    washroom: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    parking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    familyRooms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    wifi: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    security: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    medicalAssistanceNearby: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    propertyImages: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue("propertyImages");
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue("propertyImages", JSON.stringify(value || []));
      },
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    moderationStatus: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Suspended"),
      defaultValue: "Pending",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "stay_listings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

StayListing.belongsTo(Client, { foreignKey: "owner_id", as: "owner" });
StayListing.hasMany(StayRoom, { foreignKey: "stay_id", as: "rooms", onDelete: "CASCADE" });
StayRoom.belongsTo(StayListing, { foreignKey: "stay_id", as: "stay" });

export default StayListing;
