import Client from "../models/client.js";
import Ticket from "../models/ticket.js";
import LostFound from "../models/LostFound.js";
import ZoneTracker from "../models/zoneTracker.js";
import Alert from "../models/alert.js";
import SOSAlert from "../models/SOSAlert.js";
import StayListing from "../models/stayListing.js";
import StayRoom from "../models/stayRoom.js";
import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

import { sendSOSEmail } from "../utils/emailService.js";
import { notifyStayListingModerated } from "../utils/stayNotificationService.js";

export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await Client.count();
        const totalTickets = await Ticket.count();
        const totalLostItems = await LostFound.count();
        const totalStayListings = await StayListing.count();
        const pendingStayListings = await StayListing.count({ where: { isApproved: false, isActive: true } });
        const verifiedStayHosts = await Client.count({ where: { stayHostVerified: true } });

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
            totalStayListings,
            pendingStayListings,
            verifiedStayHosts,
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
            attributes: ['client_id', 'name', 'email', 'phone', 'userType', 'stayHostVerified', 'profile_image', 'created_at'],
            order: [['created_at', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error("Admin Users Error:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
};

export const updateUserStayHostAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { stayHostVerified } = req.body;

        if (typeof stayHostVerified !== "boolean") {
            return res.status(400).json({ message: "stayHostVerified must be true or false" });
        }

        const user = await Client.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.stayHostVerified = stayHostVerified;
        await user.save();

        res.json({
            message: stayHostVerified
                ? "Stay host access granted successfully"
                : "Stay host access revoked successfully",
            user: {
                client_id: user.client_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                userType: user.userType,
                stayHostVerified: user.stayHostVerified,
                profile_image: user.profile_image,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error("Admin Update Stay Host Error:", error);
        res.status(500).json({ message: "Error updating stay host access", error: error.message });
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

export const getAllStayListingsForAdmin = async (req, res) => {
    try {
        const where = {};
        if (req.query.status && req.query.status !== "All") {
            where.moderationStatus = req.query.status;
        }

        const stays = await StayListing.findAll({
            where,
            include: [{
                model: Client,
                as: "owner",
                attributes: ["client_id", "name", "email", "phone", "userType", "stayHostVerified"],
            }, {
                model: StayRoom,
                as: "rooms",
                where: { isActive: true },
                required: false,
            }],
            order: [["created_at", "DESC"]],
        });

        res.json(stays);
    } catch (error) {
        console.error("Admin Stays Error:", error);
        res.status(500).json({ message: "Error fetching stay listings", error: error.message });
    }
};

export const moderateStayListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;

        if (!["approve", "reject", "suspend", "reactivate"].includes(action)) {
            return res.status(400).json({ message: "Invalid moderation action" });
        }

        const stay = await StayListing.findByPk(id, {
            include: [{
                model: Client,
                as: "owner",
                attributes: ["client_id", "name", "email", "phone", "userType", "stayHostVerified"],
            }],
        });

        if (!stay) {
            return res.status(404).json({ message: "Stay listing not found" });
        }

        if (action === "approve") {
            stay.isApproved = true;
            stay.moderationStatus = "Approved";
            stay.isActive = true;
            stay.rejectionReason = null;
        }

        if (action === "reject") {
            if (!String(reason || "").trim()) {
                return res.status(400).json({ message: "A rejection reason is required" });
            }
            stay.isApproved = false;
            stay.moderationStatus = "Rejected";
            stay.isActive = false;
            stay.rejectionReason = String(reason).trim();
        }

        if (action === "suspend") {
            stay.isApproved = false;
            stay.moderationStatus = "Suspended";
            stay.isActive = false;
        }

        if (action === "reactivate") {
            stay.isApproved = true;
            stay.moderationStatus = "Approved";
            stay.isActive = true;
            stay.rejectionReason = null;
        }

        await stay.save();

        await notifyStayListingModerated({
            to: stay.contactEmail || stay.owner?.email,
            stay,
            action,
            reason: stay.rejectionReason,
        });

        const actionMessages = {
            approve: "Stay listing approved successfully",
            reject: "Stay listing rejected successfully",
            suspend: "Stay listing suspended successfully",
            reactivate: "Stay listing reactivated successfully",
        };

        res.json({
            message: actionMessages[action],
            stay,
        });
    } catch (error) {
        console.error("Admin Moderate Stay Error:", error);
        res.status(500).json({ message: "Error moderating stay listing", error: error.message });
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
export const handleSOS = async (req, res) => {
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
