import Client from "../models/client.js";
import Ticket from "../models/ticket.js";
import LostFound from "../models/LostFound.js";
import ZoneTracker from "../models/zoneTracker.js";
import Alert from "../models/alert.js";
import SOSAlert from "../models/SOSAlert.js";
import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

import { sendSOSEmail } from "../utils/emailService.js";

export const getAdminStats = async (req, res) => {
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
        console.error("Admin Stats Error:", error);
        res.status(500).json({ message: "Error fetching admin stats" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await Client.findAll({
            attributes: ['client_id', 'name', 'email', 'phone', 'userType', 'profile_image', 'created_at'],
            order: [['created_at', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error("Admin Users Error:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
};

export const getAllTickets = async (req, res) => {
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
        console.error("Admin Tickets Error:", error);
        res.status(500).json({ message: "Error fetching tickets" });
    }
};

export const getAllLostFound = async (req, res) => {
    try {
        const items = await LostFound.findAll({
            order: [['uploadedAt', 'DESC']]
        });
        res.json(items);
    } catch (error) {
        console.error("Admin LostFound Error:", error);
        res.status(500).json({ message: "Error fetching lost/found items", error: error.message });
    }
};

export const getZoneDensity = async (req, res) => {
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
        console.error("Admin ZoneDensity Error:", error);
        res.status(500).json({ message: "Error fetching zone density", error: error.message });
    }
};
export const getActiveAlerts = async (req, res) => {
    try {
        const alerts = await Alert.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']],
            limit: 5
        });
        res.json(alerts);
    } catch (error) {
        console.error("Admin ActiveAlerts Error:", error);
        res.status(500).json({ message: "Error fetching active alerts", error: error.message });
    }
};

export const createAlert = async (req, res) => {
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
        console.error("Admin CreateAlert Error:", error);
        res.status(500).json({ message: "Error creating alert", error: error.message });
    }
};

export const deactivateAlert = async (req, res) => {
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
        console.error("Admin DeactivateAlert Error:", error);
        res.status(500).json({ message: "Error deactivating alert", error: error.message });
    }
};
// Cooldown window (in seconds) to prevent duplicate SOS submissions
const SOS_COOLDOWN_SECONDS = 30;

export const handleSOS = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        // Fetch full user object to ensure we have the name/profile for email
        const user = await Client.findByPk(req.user.client_id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const apiKey = process.env.GEOAPIFY_API_KEY;

        if (!lat || !lng) return res.status(400).json({ message: "Location coordinates required" });

        // DUPLICATE PREVENTION: Reject if the same user already has an SOS alert
        // created within the cooldown window (covers rapid clicks & concurrent requests)
        const cooldownCutoff = new Date(Date.now() - SOS_COOLDOWN_SECONDS * 1000);
        const recentAlert = await SOSAlert.findOne({
            where: {
                client_id: user.client_id,
                created_at: { [Op.gte]: cooldownCutoff }
            }
        });
        if (recentAlert) {
            return res.status(429).json({
                message: `SOS already dispatched. Please wait ${SOS_COOLDOWN_SECONDS} seconds before sending another alert.`
            });
        }

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
        console.error("SOS System Error:", error.message);
        res.status(500).json({ message: "Failed to broadcast SOS" });
    }
};

export const getSOSAlerts = async (req, res) => {
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
        console.error("Admin Fetch SOS Error:", error);
        res.status(500).json({ message: "Error fetching SOS alerts" });
    }
};

export const deleteSOS = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await SOSAlert.findByPk(id);
        if (!alert) {
            return res.status(404).json({ message: "SOS Alert not found" });
        }
        await alert.destroy();
        res.json({ message: "SOS Alert resolved and removed" });
    } catch (error) {
        console.error("Admin Delete SOS Error:", error);
        res.status(500).json({ message: "Error deleting SOS alert" });
    }
};
