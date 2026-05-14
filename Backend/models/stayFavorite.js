// models/stayFavorite.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import Client from "./client.js";
import StayListing from "./stayListing.js";

const StayFavorite = sequelize.define(
    "StayFavorite",
    {
        favorite_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        client_id: {
            type: DataTypes.INTEGER,
            references: { model: Client, key: "client_id" },
            allowNull: false,
        },
        stay_id: {
            type: DataTypes.INTEGER,
            references: { model: StayListing, key: "stay_id" },
            allowNull: false,
        },
    },
    {
        tableName: "stay_favorites",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [{ unique: true, fields: ["client_id", "stay_id"] }],
    }
);

StayFavorite.belongsTo(StayListing, { foreignKey: "stay_id", as: "listing" });
StayFavorite.belongsTo(Client, { foreignKey: "client_id", as: "client" });

export default StayFavorite;
