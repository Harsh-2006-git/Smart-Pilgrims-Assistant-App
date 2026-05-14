// controllers/zoneController.js
import { Op } from "sequelize";
import Client from "../models/client.js";
import Zone from "../models/zone.js";
import ZoneTracker from "../models/zoneTracker.js";
import FamilyMember from "../models/familyMember.js";
import QRCode from "qrcode";

import QRCodeModel from "../models/qrCode.js";

export const generateQRCodeForUser = async (req, res, next) => {
  try {
    const { client_id, unique_code } = req.user;

    if (!unique_code || !client_id) {
      return res.status(400).json({ message: "Invalid user data" });
    }

    // Data to encode in QR
    const qrData = { unique_code };

    // Generate QR code as base64
    const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));

    // Save QR in DB if not exists
    let qrRecord = await QRCodeModel.findOne({ where: { unique_code } });
    if (!qrRecord) {
      qrRecord = await QRCodeModel.create({
        client_id, // <--- must include client_id
        unique_code,
        qr_image: qrImage,
      });
    }

    res.json({ qrImage });
  } catch (error) {
    next(error);
  }
};

// Get user info from scanned QR
export const getInfoFromQRScan = async (req, res, next) => {
  try {
    const { qr_data } = req.body; // scanned QR data from frontend

    if (!qr_data) {
      return res.status(400).json({ message: "QR data is required" });
    }

    // If QR is a base64 image, decode it first (optional)
    // Assuming QR scanner already extracts the content (JSON string)
    let userInfo;
    try {
      userInfo = JSON.parse(qr_data);
    } catch (err) {
      return res.status(400).json({ message: "Invalid QR format" });
    }

    // Return the decoded user info
    res.json({ user: userInfo });
  } catch (error) {
    next(error);
  }
};

// controllers/zoneController.js
export const scanZone = async (req, res, next) => {
  try {
    const { unique_code, zone_id, latitude, longitude } = req.body;
    let client = await Client.findOne({ where: { unique_code } });
    let familyMember = null;

    if (!client) {
      familyMember = await FamilyMember.findOne({
        where: { unique_code },
        include: [{ model: Client, as: "client" }]
      });
    }

    if (!client && !familyMember) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const trackerWhere = client
      ? { client_id: client.client_id }
      : { member_id: familyMember.member_id };

    // Get the last scan
    const lastScan = await ZoneTracker.findOne({
      where: trackerWhere,
      order: [["scanned_at", "DESC"]],
    });

    // If zone_id provided -> Enter/Move
    if (zone_id) {
      const targetZoneId = parseInt(zone_id);

      // Auto-exit handling: If they were in a different zone, decrement that zone's count
      if (lastScan && lastScan.current_zone_id && parseInt(lastScan.current_zone_id) !== targetZoneId) {
        // 1. Decrement count in the previous zone
        await Zone.decrement("client_count", {
          where: { zone_id: lastScan.current_zone_id },
        });

        // 2. Create an explicit "Exit" record for history to show they left the previous zone
        await ZoneTracker.create({
          client_id: client ? client.client_id : null,
          member_id: familyMember ? familyMember.member_id : null,
          last_zone_id: lastScan.current_zone_id,
          current_zone_id: null,
          latitude: latitude || null,
          longitude: longitude || null,
          scanned_at: new Date(Date.now() - 1000), // 1 second before the move
        });
      }

      await Zone.increment("client_count", {
        where: { zone_id: targetZoneId },
      });

      const newTracker = await ZoneTracker.create({
        client_id: client ? client.client_id : null,
        member_id: familyMember ? familyMember.member_id : null,
        last_zone_id: lastScan ? lastScan.current_zone_id : null,
        current_zone_id: targetZoneId,
        latitude: latitude || null,
        longitude: longitude || null,
      });

      return res.json({
        message: "Zone entered successfully",
        tracker: newTracker,
        participant: client ? client.name : familyMember.name,
        locationDetected: latitude && longitude ? "Success" : "Manual",
      });
    }

    // Exit logic
    if (lastScan && lastScan.current_zone_id) {
      await Zone.decrement("client_count", {
        where: { zone_id: lastScan.current_zone_id },
      });

      const exitTracker = await ZoneTracker.create({
        client_id: client ? client.client_id : null,
        member_id: familyMember ? familyMember.member_id : null,
        last_zone_id: lastScan.current_zone_id,
        current_zone_id: null,
        latitude: latitude || null,
        longitude: longitude || null,
      });

      return res.json({
        message: "Zone exit recorded successfully",
        tracker: exitTracker,
        participant: client ? client.name : familyMember.name,
      });
    }

    return res.status(400).json({ message: "Participant not in any zone" });
  } catch (error) {
    next(error);
  }
};
export const getZoneDensity = async (req, res, next) => {
  try {
    const zones = await Zone.findAll({
      attributes: ["zone_id", "name", "client_count"],
    });

    // Format response
    const density = zones.map((zone) => ({
      zone_id: zone.zone_id,
      zone_name: zone.name,
      density: zone.client_count,
    }));

    // 👉 Total density (all zones combined)
    const totalDensity = zones.reduce((sum, z) => sum + z.client_count, 0);

    res.json({
      totalDensity,
      zones: density,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserZoneHistory = async (req, res, next) => {
  try {
    let client_id;

    // Mode 1: Fetch own history from JWT (GET request)
    if (req.user && req.user.client_id && req.method === "GET") {
      client_id = req.user.client_id;
    }

    // Mode 2: Lookup by phone or email (POST request)
    else if (req.method === "POST" && req.body && (req.body.phone || req.body.email)) {
      const client = await Client.findOne({
        where: {
          ...(req.body.phone && { phone: req.body.phone }),
          ...(req.body.email && { email: req.body.email }),
        },
      });

      if (!client) {
        return res.status(404).json({ message: "User not found" });
      }
      client_id = client.client_id;
    }
    else {
      return res.status(400).json({ message: "Invalid request" });
    }

    // NEW: Handle filtering by specific member_id if requested
    const targetMemberId = (req.body && req.body.member_id) || (req.query && req.query.member_id);

    let scanWhere;
    if (targetMemberId) {
      scanWhere = { member_id: targetMemberId };
    } else if (req.query.type === 'self') {
      // ONLY Primary User history
      scanWhere = { client_id: client_id, member_id: null };
    } else {
      // Combined history for client and all family members
      const familyMembers = await FamilyMember.findAll({
        where: { client_id },
        attributes: ['member_id']
      });
      const memberIds = familyMembers ? familyMembers.map(m => m.member_id) : [];
      
      scanWhere = {
        [Op.or]: [
          { client_id: client_id },
          { member_id: { [Op.in]: memberIds } }
        ]
      };
    }

    // Fetch scan history with Client included
    const scans = await ZoneTracker.findAll({
      where: scanWhere,
      include: [
        { model: Zone, as: "currentZone", attributes: ["name"] },
        { model: Zone, as: "lastZone", attributes: ["name"] },
        { model: FamilyMember, as: "familyMember", attributes: ["name"] },
        { model: Client, as: "client", attributes: ["name"] }
      ],
      order: [["scanned_at", "ASC"]],
    });

    // All records (no filtering) to allow showing Live GPS updates too
    const history = scans.map((scan, i) => {
      const nextScan = scans[i + 1];
      const isHandover = scan.last_zone_id !== scan.current_zone_id;

      const enterTime = new Date(scan.scanned_at).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const leaveTime = nextScan
        ? new Date(nextScan.scanned_at).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        : null;

      const durationSpent = nextScan
        ? Math.floor(
          (new Date(nextScan.scanned_at) - new Date(scan.scanned_at)) / 1000
        )
        : null;

      return {
        participant: scan.familyMember ? scan.familyMember.name : (scan.client && scan.client.name ? scan.client.name : "Master Devotee"),
        last_zone: scan.lastZone ? scan.lastZone.name : (isHandover ? "Outer Perimeter" : "No Zone Change"),
        current_zone: scan.currentZone ? scan.currentZone.name : (isHandover ? "Exit Point" : "Staying in Zone"),
        latitude: scan.latitude,
        longitude: scan.longitude,
        enter_time: enterTime,
        leave_time: leaveTime,
        duration_spent: durationSpent,
        tracking_type: isHandover ? "Terminal Scan" : "Live GPS Ping"
      };
    });
    res.json({ client_id, history, type: targetMemberId ? 'family_member' : (req.query.type || 'combined') });
  } catch (error) {
    next(error);
  }
};

// Periodic (5 min) Live Location Logging for Primary User
export const recordLiveLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const { client_id } = req.user;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Coordinates missing" });
    }

    // Get current zone of the user
    const lastScan = await ZoneTracker.findOne({
      where: { client_id },
      order: [["scanned_at", "DESC"]],
    });

    const update = await ZoneTracker.create({
      client_id,
      last_zone_id: lastScan ? lastScan.current_zone_id : null,
      current_zone_id: lastScan ? lastScan.current_zone_id : null, // Logging position within current zone
      latitude,
      longitude,
      scanned_at: new Date()
    });

    res.json({ message: "Location logged", tracker: update });
  } catch (error) {
    next(error);
  }
};

export const clearUserZoneHistory = async (req, res, next) => {
  try {
    const { client_id } = req.user;
    await ZoneTracker.destroy({ where: { client_id } });
    res.json({ message: "Journey history cleared successfully" });
  } catch (error) {
    next(error);
  }
};
