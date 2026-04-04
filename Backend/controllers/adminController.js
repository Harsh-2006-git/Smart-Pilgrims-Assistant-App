import Client from "../models/client.js";
import Ticket from "../models/ticket.js";
import LostFound from "../models/LostFound.js";
import ZoneTracker from "../models/zoneTracker.js";
import Alert from "../models/alert.js";
import Zone from "../models/zone.js";
import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

// Admin email whitelist
const ADMIN_EMAILS = ["arunbhadouriya06@gmail.com"];

// Any authenticated user can access admin console
export const isAdmin = (req) => {
    return !!req.user;
};

export const getAdminStats = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        const totalUsers = await Client.count();
        const totalTickets = await Ticket.count();
        const totalLostItems = await LostFound.count();
        const activeAlerts = await Alert.count({ where: { is_active: true } });


        // Total capacity from all zones
        const totalCapacity = await Zone.sum('capacity') || 0;

        // Total current crowd across all zones
        const totalCrowdResult = await ZoneTracker.count({
            where: { current_zone_id: { [Op.not]: null } }
        });
        const totalCrowd = totalCrowdResult || 0;

        // Tickets per day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const ticketsPerDay = await Ticket.findAll({
            attributes: [
                'date',
                [sequelize.fn('COUNT', sequelize.col('ticket_id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('no_of_tickets')), 'totalDevotees']
            ],
            where: {
                created_at: { [Op.gte]: sevenDaysAgo }
            },
            group: ['date'],
            order: [['date', 'ASC']],
            raw: true
        });

        // User type breakdown
        const userTypeBreakdown = await Client.findAll({
            attributes: [
                'userType',
                [sequelize.fn('COUNT', sequelize.col('client_id')), 'count']
            ],
            group: ['userType'],
            raw: true
        });

        // Category breakdown (tickets)
        const categoryBreakdown = await Ticket.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('ticket_id')), 'count']
            ],
            group: ['category'],
            raw: true
        });

        // Recent registrations (last 7 days)
        const recentUsers = await Client.count({
            where: { created_at: { [Op.gte]: sevenDaysAgo } }
        });

        // Today's bookings
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayBookings = await Ticket.count({
            where: { created_at: { [Op.gte]: todayStart } }
        });

        res.json({
            totalUsers,
            totalTickets,
            totalCapacity,
            totalCrowd,
            totalLostItems,
            activeAlerts,
            recentUsers,
            todayBookings,
            userTypeBreakdown,
            ticketsPerDay,
            categoryBreakdown
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ message: "Error fetching admin stats", error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

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
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

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
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

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
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        // Get all zones with their capacity
        const zones = await Zone.findAll({ raw: true });
        
        // Get current counts from ZoneTracker
        const counts = await ZoneTracker.findAll({
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

        // Combine zones with real counts and real capacity
        const densityData = zones.map(zone => {
            const currentCount = counts.find(c => c.zone_id === zone.zone_id)?.count || 0;
            return {
                zone_id: zone.zone_id,
                name: zone.name,
                count: parseInt(currentCount),
                capacity: zone.capacity || 500
            };
        });

        res.json(densityData);
    } catch (error) {
        console.error("Admin ZoneDensity Error:", error);
        res.status(500).json({ message: "Error fetching zone density", error: error.message });
    }
};

// ==================== SIGNAGE (LIVE DIGITAL BOARD DATA) ====================

export const getSignageData = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        // Get all zones and their current crowd counts
        const zones = await Zone.findAll({ raw: true });
        const counts = await ZoneTracker.findAll({
            attributes: [
                ['current_zone_id', 'zone_id'],
                [sequelize.fn('COUNT', sequelize.col('client_id')), 'count']
            ],
            where: { current_zone_id: { [Op.not]: null } },
            group: ['current_zone_id'],
            raw: true
        });

        const totalCrowd = counts.reduce((sum, c) => sum + parseInt(c.count || 0), 0);
        const totalCapacity = zones.reduce((sum, z) => sum + (z.capacity || 500), 0);
        const crowdPercent = totalCapacity > 0 ? (totalCrowd / totalCapacity) * 100 : 0;

        // Determine density level
        let densityLevel = 'LIGHT';
        if (crowdPercent > 80) densityLevel = 'EXTREME';
        else if (crowdPercent > 60) densityLevel = 'HEAVY';
        else if (crowdPercent > 40) densityLevel = 'MODERATE';

        // Estimated queue time based on crowd density (rough heuristic)
        let queueMinutes = Math.round(crowdPercent * 0.5); // 0.5 min per % of capacity
        if (queueMinutes < 1) queueMinutes = 1;

        // Today's ticket count
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTickets = await Ticket.count({
            where: { created_at: { [Op.gte]: todayStart } }
        });

        // Active alerts
        const activeAlerts = await Alert.findAll({
            where: { is_active: true },
            attributes: ['alert_id', 'title', 'message', 'severity'],
            order: [['created_at', 'DESC']],
            limit: 3,
            raw: true
        });

        // Darshan status based on time and density
        const currentHour = new Date().getHours();
        let darshanStatus = 'OPEN';
        if (currentHour < 5 || currentHour >= 21) darshanStatus = 'CLOSED';
        else if (crowdPercent > 90) darshanStatus = 'PAUSED';

        // Per-zone breakdown for the display
        const zoneBreakdown = zones.map(zone => {
            const zoneCount = parseInt(counts.find(c => c.zone_id === zone.zone_id)?.count || 0);
            const zoneCap = zone.capacity || 500;
            const zonePercent = zoneCap > 0 ? (zoneCount / zoneCap) * 100 : 0;
            let zoneStatus = 'Low';
            if (zonePercent > 80) zoneStatus = 'Critical';
            else if (zonePercent > 50) zoneStatus = 'High';
            else if (zonePercent > 25) zoneStatus = 'Moderate';
            return {
                zone_id: zone.zone_id,
                name: zone.name,
                count: zoneCount,
                capacity: zoneCap,
                percent: Math.round(zonePercent),
                status: zoneStatus
            };
        });

        res.json({
            darshanStatus,
            queueMinutes,
            densityLevel,
            totalCrowd,
            totalCapacity,
            crowdPercent: Math.round(crowdPercent),
            todayTickets,
            activeAlerts,
            zones: zoneBreakdown,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error("Signage Data Error:", error);
        res.status(500).json({ message: "Error fetching signage data", error: error.message });
    }
};

// ==================== ALERT CRUD ====================

export const createAlert = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        const { title, message, severity } = req.body;
        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        const alert = await Alert.create({
            title,
            message,
            severity: severity || "info",
            is_active: true,
            created_by: req.user.client_id
        });

        res.status(201).json(alert);
    } catch (error) {
        console.error("Create Alert Error:", error);
        res.status(500).json({ message: "Error creating alert", error: error.message });
    }
};

export const getAllAlerts = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        const alerts = await Alert.findAll({
            include: [{
                model: Client,
                attributes: ['name', 'email']
            }],
            order: [['created_at', 'DESC']]
        });
        res.json(alerts);
    } catch (error) {
        console.error("Get Alerts Error:", error);
        res.status(500).json({ message: "Error fetching alerts" });
    }
};

export const toggleAlert = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        const { id } = req.params;
        const alert = await Alert.findByPk(id);
        if (!alert) return res.status(404).json({ message: "Alert not found" });

        alert.is_active = !alert.is_active;
        await alert.save();

        res.json(alert);
    } catch (error) {
        console.error("Toggle Alert Error:", error);
        res.status(500).json({ message: "Error toggling alert" });
    }
};

export const deleteAlert = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

        const { id } = req.params;
        const alert = await Alert.findByPk(id);
        if (!alert) return res.status(404).json({ message: "Alert not found" });

        await alert.destroy();
        res.json({ message: "Alert deleted successfully" });
    } catch (error) {
        console.error("Delete Alert Error:", error);
        res.status(500).json({ message: "Error deleting alert" });
    }
};

// Public endpoint - returns active alerts for all users
export const getActiveAlerts = async (req, res) => {
    try {
        const alerts = await Alert.findAll({
            where: { is_active: true },
            attributes: ['alert_id', 'title', 'message', 'severity', 'created_at'],
            order: [['created_at', 'DESC']],
            limit: 10
        });
        res.json(alerts);
    } catch (error) {
        console.error("Active Alerts Error:", error);
        res.status(500).json({ message: "Error fetching active alerts" });
    }
};

// Check if current user is admin
export const checkAdmin = async (req, res) => {
    try {
        res.json({ isAdmin: isAdmin(req) });
    } catch (error) {
        res.status(500).json({ isAdmin: false });
    }
};
