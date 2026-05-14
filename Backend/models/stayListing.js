// models/stayListing.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Client from "./client.js";

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
            references: { model: Client, key: "client_id" },
            allowNull: false,
        },
        propertyName: { type: DataTypes.STRING, allowNull: false },
        ownerName: { type: DataTypes.STRING, allowNull: false },
        ownerContact: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        address: { type: DataTypes.STRING, allowNull: false },
        city: { type: DataTypes.STRING, allowNull: false },
        state: { type: DataTypes.STRING, allowNull: false },
        routeOrTempleNearby: { type: DataTypes.STRING, allowNull: true },
        stayType: {
            type: DataTypes.ENUM(
                "Dharamshala",
                "Lodge",
                "Hotel",
                "Homestay",
                "Guesthouse",
                "Other"
            ),
            defaultValue: "Dharamshala",
        },
        latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
        longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
        distanceToTempleKm: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        propertyImages: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const v = this.getDataValue("propertyImages");
                return v ? JSON.parse(v) : [];
            },
            set(value) {
                this.setDataValue("propertyImages", JSON.stringify(value || []));
            },
        },
        facilities: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const v = this.getDataValue("facilities");
                return v
                    ? JSON.parse(v)
                    : {
                          food: false,
                          washroom: false,
                          parking: false,
                          familyRooms: false,
                          wifi: false,
                          security: false,
                          medicalNearby: false,
                      };
            },
            set(value) {
                this.setDataValue("facilities", JSON.stringify(value || {}));
            },
        },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        isApproved: { type: DataTypes.BOOLEAN, defaultValue: true },
        ownerVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
        tableName: "stay_listings",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

StayListing.belongsTo(Client, { foreignKey: "owner_id", as: "owner" });

export default StayListing;
