import Client from "../models/client.js";
import Ticket from "../models/ticket.js";
import LostFound from "../models/LostFound.js";
import ZoneTracker from "../models/zoneTracker.js";
import Alert from "../models/alert.js";
import SOSAlert from "../models/SOSAlert.js";
import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

import { sendSOSEmail } from "../utils/emailService.js";

export const getAdminStats = async (req, res, next) => {
    try {
        const totalUsers = await Client.count();
        const totalTickets = await Ticket.count();
        const totalLostItems = await LostFound.count();

        // Sum total tickets booked (no_of_tickets field)
        const totalCapacity = await Ticket.sum('no_of_tickets') || 0;

        // Revenue estimation (Dummy calculation: VIP tickets vs General)
        // Since we don't have a price field in the model, let's assume flat rates
        const revenue = totalCapacity * 200; // Average ₹200 per ticket

        res.json({
            totalUsers,
            totalTickets,
            totalCapacity,
            totalLostItems,
            revenue: `₹${(revenue / 100000).toFixed(1)}L`
        });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await Client.findAll({
            attributes: ['client_id', 'name', 'email', 'phone', 'userType', 'profile_image', 'created_at'],
            order: [['created_at', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const getAllTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.findAll({
            include: [{
                model: Client,
                attributes: ['name', 'email']
            }],
            order: [['created_at', 'DESC']]
        });
        res.json(tickets);
    } catch (error) {
        next(error);
    }
};

export const getAllLostFound = async (req, res, next) => {
    try {
        const items = await LostFound.findAll({
            order: [['uploadedAt', 'DESC']]
        });
        res.json(items);
    } catch (error) {
        next(error);
    }
};

export const getZoneDensity = async (req, res, next) => {
    try {
        const latestData = await ZoneTracker.findAll({
            attributes: [
                ['current_zone_id', 'zone_id'],
                [sequelize.fn('COUNT', sequelize.col('client_id')), 'count']
            ],
            where: {
                current_zone_id: { [Op.not]: null }
            },
            group: ['current_zone_id'],
            raw: true
        });
        res.json(latestData);
    } catch (error) {
        next(error);
    }
};
export const getActiveAlerts = async (req, res, next) => {
    try {
        const alerts = await Alert.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']],
            limit: 5
        });
        res.json(alerts);
    } catch (error) {
        next(error);
    }
};

export const createAlert = async (req, res, next) => {
    try {
        const { title, message, severity } = req.body;
        const newAlert = await Alert.create({
            title,
            message,
            severity: severity || 'info',
            is_active: true,
            created_by: req.user?.client_id || null
        });
        res.status(201).json(newAlert);
    } catch (error) {
        next(error);
    }
};

export const deactivateAlert = async (req, res, next) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findByPk(id);
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        alert.is_active = false;
        await alert.save();
        res.json({ message: "Alert deactivated successfully" });
    } catch (error) {
        next(error);
    }
};
export const handleSOS = async (req, res, next) => {
    try {
        const { lat, lng } = req.body;
        // Fetch full user object to ensure we have the name/profile for email
        const user = await Client.findByPk(req.user.client_id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const apiKey = process.env.GEOAPIFY_API_KEY;

        if (!lat || !lng) return res.status(400).json({ message: "Location coordinates required" });

        // PERSIST IN DB FOR DASHBOARD
        await SOSAlert.create({
            client_id: user.client_id,
            lat,
            lng,
            nearby_data: JSON.stringify([])
        });

        // Send Email using emailService (Background check - fire and forget)
        sendSOSEmail(process.env.SMTP_USER, {
            user,
            location: { lat, lng },
            nearbyServices: []
        }).catch(err => console.error("Background SOS Email Error:", err));

        res.json({ success: true, message: "SOS Alert Dispatched to Authorities" });
    } catch (error) {
        next(error);
    }
};

export const getSOSAlerts = async (req, res, next) => {
    try {
        const alerts = await SOSAlert.findAll({
            include: [{
                model: Client,
                attributes: ['name', 'email', 'phone', 'userType', 'profile_image']
            }],
            order: [['created_at', 'DESC']],
            limit: 20
        });
        res.json(alerts);
    } catch (error) {
        next(error);
    }
};

export const deleteSOS = async (req, res, next) => {
    try {
        const { id } = req.params;
        const alert = await SOSAlert.findByPk(id);
        if (!alert) {
            return res.status(404).json({ message: "SOS Alert not found" });
        }
        await alert.destroy();
        res.json({ message: "SOS Alert resolved and removed" });
    } catch (error) {
        next(error);
    }
};
