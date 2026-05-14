// controllers/stayController.js — pilgrimage stays: listings + bookings only (images via Cloudinary)
import { Op } from "sequelize";
import { eachDayOfInterval, parseISO, isBefore, isValid } from "date-fns";
import StayListing from "../models/stayListing.js";
import StayRoom from "../models/stayRoom.js";
import StayBooking from "../models/stayBooking.js";
import StayFavorite from "../models/stayFavorite.js";
import Client from "../models/client.js";
import { sequelize } from "../config/database.js";
import {
    sendStayNewBookingEmails,
    sendStayConfirmedEmail,
    sendStayCancellationEmails,
    sendStayCheckInReminderEmails,
} from "../utils/emailService.js";

StayListing.hasMany(StayRoom, { foreignKey: "stay_id", as: "rooms" });
StayRoom.belongsTo(StayListing, { foreignKey: "stay_id", as: "listing" });

const OWNER_ATTRS = ["client_id", "name", "phone", "email"];

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function parseJsonField(raw, fallback) {
    if (raw == null || raw === "") return fallback;
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function cloudinaryPath(file) {
    if (!file) return "";
    const p = file.path || file.secure_url || "";
    return String(p).replace(/\\/g, "/");
}

/** Multer .any(): propertyImages[] + roomImages_0, roomImages_1, … → Cloudinary URLs */
function partitionStayUploads(files) {
    const propertyImages = [];
    const roomImagesByIndex = {};
    for (const f of files || []) {
        const url = cloudinaryPath(f);
        if (!url) continue;
        if (f.fieldname === "propertyImages") {
            propertyImages.push(url);
            continue;
        }
        const m = /^roomImages_(\d+)$/.exec(f.fieldname);
        if (m) {
            const i = Number(m[1]);
            if (!roomImagesByIndex[i]) roomImagesByIndex[i] = [];
            roomImagesByIndex[i].push(url);
        }
    }
    return { propertyImages, roomImagesByIndex };
}

function assertAllowedStayUploadFields(files) {
    for (const f of files || []) {
        if (f.fieldname === "propertyImages") continue;
        if (/^roomImages_\d+$/.test(f.fieldname)) continue;
        return false;
    }
    return true;
}

function eachOccupiedNightStr(checkInStr, checkOutStr) {
    const start = parseISO(checkInStr);
    const end = parseISO(checkOutStr);
    if (!isValid(start) || !isValid(end) || !isBefore(start, end)) return [];
    const lastNight = new Date(end);
    lastNight.setDate(lastNight.getDate() - 1);
    return eachDayOfInterval({ start, end: lastNight }).map((d) => d.toISOString().slice(0, 10));
}

async function maxRoomsUsedOnAnyNight(stay_room_id, checkInStr, checkOutStr, excludeBookingId = null) {
    const nights = eachOccupiedNightStr(checkInStr, checkOutStr);
    if (nights.length === 0) return 0;
    let maxUsed = 0;
    for (const d of nights) {
        const where = {
            stay_room_id,
            status: { [Op.in]: ["Pending", "Confirmed"] },
            checkInDate: { [Op.lte]: d },
            checkOutDate: { [Op.gt]: d },
        };
        if (excludeBookingId) where.stay_booking_id = { [Op.ne]: excludeBookingId };
        const sum = await StayBooking.sum("roomsBooked", { where });
        const used = sum ? Number(sum) : 0;
        if (used > maxUsed) maxUsed = used;
    }
    return maxUsed;
}

function minRoomPrice(listing) {
    const rooms = listing.rooms || [];
    if (!rooms.length) return null;
    return Math.min(...rooms.map((r) => Number(r.pricePerNight)));
}

export const listStays = async (req, res) => {
    try {
        const { q, stayType, minPrice, maxPrice, food, wifi, parking, lat, lng, radiusKm } = req.query;

        const where = { isActive: true, isApproved: true };
        if (stayType) where.stayType = stayType;
        if (q) {
            where[Op.or] = [
                { propertyName: { [Op.like]: `%${q}%` } },
                { city: { [Op.like]: `%${q}%` } },
                { address: { [Op.like]: `%${q}%` } },
                { routeOrTempleNearby: { [Op.like]: `%${q}%` } },
            ];
        }

        const listings = await StayListing.findAll({
            where,
            include: [
                { model: StayRoom, as: "rooms", required: false },
                { model: Client, as: "owner", attributes: OWNER_ATTRS },
            ],
            order: [["created_at", "DESC"]],
        });

        let rows = listings.map((l) => l.toJSON());
        const minP = minPrice != null ? Number(minPrice) : null;
        const maxP = maxPrice != null ? Number(maxPrice) : null;

        rows = rows.filter((l) => {
            const pmin = minRoomPrice(l);
            if (pmin == null) return true;
            if (minP != null && pmin < minP) return false;
            if (maxP != null && pmin > maxP) return false;
            const f = l.facilities || {};
            if (food === "1" && !f.food) return false;
            if (wifi === "1" && !f.wifi) return false;
            if (parking === "1" && !f.parking) return false;
            return true;
        });

        if (lat != null && lng != null && radiusKm != null) {
            const la = Number(lat);
            const ln = Number(lng);
            const r = Number(radiusKm);
            rows = rows.filter((l) => haversineKm(la, ln, Number(l.latitude), Number(l.longitude)) <= r);
            rows.sort(
                (a, b) =>
                    haversineKm(la, ln, Number(a.latitude), Number(a.longitude)) -
                    haversineKm(la, ln, Number(b.latitude), Number(b.longitude))
            );
        }

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStayById = async (req, res) => {
    try {
        const stay = await StayListing.findByPk(req.params.stayId, {
            include: [
                {
                    model: StayRoom,
                    as: "rooms",
                    separate: true,
                    order: [
                        ["sortOrder", "ASC"],
                        ["room_id", "ASC"],
                    ],
                },
                { model: Client, as: "owner", attributes: OWNER_ATTRS },
            ],
        });
        if (!stay) return res.status(404).json({ message: "Stay not found" });
        res.json(stay);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyStayListings = async (req, res) => {
    try {
        const owner_id = req.user.client_id;
        const rows = await StayListing.findAll({
            where: { owner_id },
            include: [{ model: StayRoom, as: "rooms" }],
            order: [["created_at", "DESC"]],
        });
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Pilgrim bookings + bookings for listings you own */
export const getMyStayBookings = async (req, res) => {
    try {
        const client_id = req.user.client_id;

        const pilgrim = await StayBooking.findAll({
            where: { pilgrim_id: client_id },
            include: [
                {
                    model: StayRoom,
                    as: "room",
                    include: [{ model: StayListing, as: "listing" }],
                },
            ],
            order: [["created_at", "DESC"]],
        });

        const myStays = await StayListing.findAll({
            where: { owner_id: client_id },
            attributes: ["stay_id"],
        });
        const ids = myStays.map((s) => s.stay_id);
        let host = [];
        if (ids.length) {
            const rooms = await StayRoom.findAll({
                where: { stay_id: { [Op.in]: ids } },
                attributes: ["room_id"],
            });
            const roomIds = rooms.map((r) => r.room_id);
            host = await StayBooking.findAll({
                where: { stay_room_id: { [Op.in]: roomIds } },
                include: [
                    { model: StayRoom, as: "room", include: [{ model: StayListing, as: "listing" }] },
                    { model: Client, as: "pilgrim", attributes: OWNER_ATTRS },
                ],
                order: [["checkInDate", "ASC"]],
            });
        }

        res.json({ pilgrim, host });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createStayListing = async (req, res) => {
    if (req.files && !assertAllowedStayUploadFields(req.files)) {
        return res.status(400).json({ message: "Invalid file field names. Use propertyImages and roomImages_0, roomImages_1, …" });
    }

    const t = await sequelize.transaction();
    try {
        const owner_id = req.user.client_id;
        const {
            propertyName,
            ownerName,
            ownerContact,
            description,
            address,
            city,
            state,
            routeOrTempleNearby,
            stayType,
            latitude,
            longitude,
            distanceToTempleKm,
            facilities: facilitiesRaw,
            rooms: roomsRaw,
        } = req.body;

        const facilities = parseJsonField(facilitiesRaw, {});
        const rooms = parseJsonField(roomsRaw, []);
        if (!Array.isArray(rooms) || rooms.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: "At least one room type is required (rooms JSON array)." });
        }

        const { propertyImages: uploadedProperty, roomImagesByIndex } = partitionStayUploads(req.files);

        const listing = await StayListing.create(
            {
                owner_id,
                propertyName,
                ownerName,
                ownerContact,
                description,
                address,
                city,
                state,
                routeOrTempleNearby,
                stayType: stayType || "Dharamshala",
                latitude,
                longitude,
                distanceToTempleKm: distanceToTempleKm || null,
                propertyImages: uploadedProperty,
                facilities,
                isApproved: true,
            },
            { transaction: t }
        );

        for (let i = 0; i < rooms.length; i++) {
            const r = rooms[i];
            const fromUpload = roomImagesByIndex[i] || [];
            const fromJson = Array.isArray(r.roomImages) ? r.roomImages.filter((u) => typeof u === "string") : [];
            const mergedRoomImages = [...fromUpload, ...fromJson].slice(0, 12);

            await StayRoom.create(
                {
                    stay_id: listing.stay_id,
                    roomType: r.roomType || "General",
                    capacity: Number(r.capacity) || 2,
                    pricePerNight: Number(r.pricePerNight) || 0,
                    availableRooms: Number(r.availableRooms) || 1,
                    checkInTime: r.checkInTime || "12:00",
                    checkOutTime: r.checkOutTime || "10:00",
                    roomImages: mergedRoomImages,
                    sortOrder: i,
                },
                { transaction: t }
            );
        }

        await t.commit();
        const full = await StayListing.findByPk(listing.stay_id, {
            include: [{ model: StayRoom, as: "rooms" }],
        });
        res.status(201).json({ message: "Stay listed successfully", data: full });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

export const updateStayListing = async (req, res) => {
    if (req.files && !assertAllowedStayUploadFields(req.files)) {
        return res.status(400).json({ message: "Invalid file field names. Use propertyImages and roomImages_0, roomImages_1, …" });
    }

    const t = await sequelize.transaction();
    try {
        const listing = await StayListing.findByPk(req.params.stayId, { transaction: t });
        if (!listing) {
            await t.rollback();
            return res.status(404).json({ message: "Stay not found" });
        }
        if (listing.owner_id !== req.user.client_id) {
            await t.rollback();
            return res.status(403).json({ message: "Not authorized" });
        }

        const {
            propertyName,
            ownerName,
            ownerContact,
            description,
            address,
            city,
            state,
            routeOrTempleNearby,
            stayType,
            latitude,
            longitude,
            distanceToTempleKm,
            facilities: facilitiesRaw,
            rooms: roomsRaw,
            replaceRooms,
        } = req.body;

        const patch = {};
        if (propertyName != null) patch.propertyName = propertyName;
        if (ownerName != null) patch.ownerName = ownerName;
        if (ownerContact != null) patch.ownerContact = ownerContact;
        if (description != null) patch.description = description;
        if (address != null) patch.address = address;
        if (city != null) patch.city = city;
        if (state != null) patch.state = state;
        if (routeOrTempleNearby != null) patch.routeOrTempleNearby = routeOrTempleNearby;
        if (stayType != null) patch.stayType = stayType;
        if (latitude != null) patch.latitude = latitude;
        if (longitude != null) patch.longitude = longitude;
        if (distanceToTempleKm != null) patch.distanceToTempleKm = distanceToTempleKm;
        if (facilitiesRaw != null) patch.facilities = parseJsonField(facilitiesRaw, listing.facilities);

        const { propertyImages: newProperty, roomImagesByIndex } = partitionStayUploads(req.files);
        if (newProperty.length > 0) patch.propertyImages = newProperty;

        await listing.update(patch, { transaction: t });

        if (replaceRooms === "true" || replaceRooms === true) {
            const rooms = parseJsonField(roomsRaw, []);
            if (!Array.isArray(rooms) || rooms.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "rooms must be a non-empty array when replaceRooms is set." });
            }
            await StayRoom.destroy({ where: { stay_id: listing.stay_id }, transaction: t });
            for (let i = 0; i < rooms.length; i++) {
                const r = rooms[i];
                const fromUpload = roomImagesByIndex[i] || [];
                const fromJson = Array.isArray(r.roomImages) ? r.roomImages.filter((u) => typeof u === "string") : [];
                const mergedRoomImages = [...fromUpload, ...fromJson].slice(0, 12);

                await StayRoom.create(
                    {
                        stay_id: listing.stay_id,
                        roomType: r.roomType || "General",
                        capacity: Number(r.capacity) || 2,
                        pricePerNight: Number(r.pricePerNight) || 0,
                        availableRooms: Number(r.availableRooms) || 1,
                        checkInTime: r.checkInTime || "12:00",
                        checkOutTime: r.checkOutTime || "10:00",
                        roomImages: mergedRoomImages,
                        sortOrder: i,
                    },
                    { transaction: t }
                );
            }
        }

        await t.commit();
        const full = await StayListing.findByPk(listing.stay_id, {
            include: [{ model: StayRoom, as: "rooms" }],
        });
        res.json({ message: "Stay updated", data: full });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

export const deleteStayListing = async (req, res) => {
    try {
        const listing = await StayListing.findByPk(req.params.stayId);
        if (!listing) return res.status(404).json({ message: "Stay not found" });
        if (listing.owner_id !== req.user.client_id) {
            return res.status(403).json({ message: "Not authorized" });
        }
        await listing.destroy();
        res.json({ message: "Stay listing removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleStayListing = async (req, res) => {
    try {
        const listing = await StayListing.findByPk(req.params.stayId);
        if (!listing) return res.status(404).json({ message: "Stay not found" });
        if (listing.owner_id !== req.user.client_id) {
            return res.status(403).json({ message: "Not authorized" });
        }
        listing.isActive = !listing.isActive;
        await listing.save();
        res.json({ message: `Stay is now ${listing.isActive ? "active" : "inactive"}`, data: listing });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createStayBooking = async (req, res) => {
    try {
        const { stayId } = req.params;
        const {
            stay_room_id,
            checkInDate,
            checkOutDate,
            roomsBooked,
            guests,
            contactPhone: phoneRaw,
            specialRequests,
            guestName,
            guestEmail,
        } = req.body;

        const contactPhone = String(phoneRaw || "").trim();
        if (!contactPhone) {
            return res.status(400).json({ message: "contactPhone is required" });
        }

        const pilgrim_id = req.user?.client_id ?? null;
        if (!pilgrim_id) {
            if (!String(guestName || "").trim() || !String(guestEmail || "").trim()) {
                return res.status(400).json({
                    message: "Sign in or provide guestName and guestEmail for booking notifications.",
                });
            }
        }

        const listing = await StayListing.findByPk(stayId);
        if (!listing || !listing.isActive || !listing.isApproved) {
            return res.status(404).json({ message: "Stay not available" });
        }
        if (pilgrim_id && listing.owner_id === pilgrim_id) {
            return res.status(400).json({ message: "You cannot book your own listing." });
        }

        const room = await StayRoom.findOne({
            where: { room_id: stay_room_id, stay_id: stayId },
        });
        if (!room) return res.status(404).json({ message: "Room type not found for this stay." });

        const rb = Math.max(1, Number(roomsBooked) || 1);
        const g = Math.max(1, Number(guests) || 1);
        const maxUsed = await maxRoomsUsedOnAnyNight(room.room_id, checkInDate, checkOutDate);
        if (maxUsed + rb > room.availableRooms) {
            return res.status(400).json({ message: "Not enough rooms available for these dates." });
        }

        const nights = eachOccupiedNightStr(checkInDate, checkOutDate).length;
        if (nights < 1) {
            return res.status(400).json({ message: "Invalid check-in / check-out dates." });
        }

        const totalAmount = (Number(room.pricePerNight) * rb * nights).toFixed(2);

        const booking = await StayBooking.create({
            stay_room_id: room.room_id,
            pilgrim_id,
            guestName: pilgrim_id ? null : String(guestName).trim(),
            guestEmail: pilgrim_id ? null : String(guestEmail).trim(),
            checkInDate,
            checkOutDate,
            roomsBooked: rb,
            guests: g,
            contactPhone: contactPhone || (req.user?.phone ? String(req.user.phone).trim() : ""),
            specialRequests: specialRequests || null,
            status: "Pending",
            totalAmount,
        });

        const withDeps = await StayBooking.findByPk(booking.stay_booking_id, {
            include: [
                { model: StayRoom, as: "room", include: [{ model: StayListing, as: "listing" }] },
                { model: Client, as: "pilgrim", attributes: OWNER_ATTRS },
            ],
        });

        const owner = await Client.findByPk(listing.owner_id);
        const pilgrim = pilgrim_id ? await Client.findByPk(pilgrim_id) : null;
        sendStayNewBookingEmails({
            listing,
            room,
            booking: withDeps,
            owner,
            pilgrim,
            guestEmail: booking.guestEmail,
            guestName: booking.guestName,
        }).catch(() => {});

        res.status(201).json({
            message: "Booking request submitted (Pending until host confirms)",
            booking: withDeps,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const confirmStayBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await StayBooking.findByPk(bookingId, {
            include: [
                { model: StayRoom, as: "room", include: [{ model: StayListing, as: "listing" }] },
                { model: Client, as: "pilgrim", attributes: OWNER_ATTRS },
            ],
        });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        const listing = booking.room?.listing;
        if (!listing || listing.owner_id !== req.user.client_id) {
            return res.status(403).json({ message: "Only the listing owner can confirm" });
        }
        if (booking.status !== "Pending") {
            return res.status(400).json({ message: "Only Pending bookings can be confirmed" });
        }
        booking.status = "Confirmed";
        await booking.save();

        const travelerEmail = booking.pilgrim?.email || booking.guestEmail;
        sendStayConfirmedEmail({ listing, booking, travelerEmail }).catch(() => {});

        res.json({ message: "Booking confirmed", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelStayBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const phoneFromBody = String(req.body?.contactPhone || req.query?.contactPhone || "").trim();

        const booking = await StayBooking.findByPk(bookingId, {
            include: [
                { model: StayRoom, as: "room", include: [{ model: StayListing, as: "listing" }] },
                { model: Client, as: "pilgrim", attributes: OWNER_ATTRS },
            ],
        });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status === "Cancelled") {
            return res.json({ message: "Already cancelled", booking });
        }

        const listing = booking.room?.listing;
        const uid = req.user?.client_id;
        let allowed = false;
        if (uid) {
            allowed =
                booking.pilgrim_id === uid ||
                (listing && listing.owner_id === uid) ||
                (booking.pilgrim_id == null && booking.contactPhone && req.user?.phone &&
                    String(booking.contactPhone).trim() === String(req.user.phone).trim());
        }
        if (!allowed && phoneFromBody && String(booking.contactPhone).trim() === phoneFromBody) {
            allowed = true;
        }
        if (!allowed) {
            return res.status(403).json({ message: "Not authorized — sign in or send matching contactPhone" });
        }

        booking.status = "Cancelled";
        await booking.save();

        const owner = listing ? await Client.findByPk(listing.owner_id) : null;
        const pilgrim = booking.pilgrim_id ? await Client.findByPk(booking.pilgrim_id) : null;
        sendStayCancellationEmails({
            listing,
            booking,
            owner,
            pilgrim,
            guestEmail: booking.guestEmail,
        }).catch(() => {});

        res.json({ message: "Booking cancelled", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Public: view status with booking id + phone verification */
export const getStayBookingStatusPublic = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const contactPhone = String(req.query.contactPhone || "").trim();
        if (!contactPhone) {
            return res.status(400).json({ message: "contactPhone query is required" });
        }
        const booking = await StayBooking.findByPk(bookingId, {
            include: [
                { model: StayRoom, as: "room", include: [{ model: StayListing, as: "listing" }] },
                { model: Client, as: "pilgrim", attributes: ["name", "phone"] },
            ],
        });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (String(booking.contactPhone).trim() !== contactPhone) {
            return res.status(403).json({ message: "Phone does not match this booking" });
        }
        const listing = booking.room?.listing;
        res.json({
            stay_booking_id: booking.stay_booking_id,
            status: booking.status,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            roomsBooked: booking.roomsBooked,
            guests: booking.guests,
            totalAmount: booking.totalAmount,
            propertyName: listing?.propertyName,
            city: listing?.city,
            ownerContact: listing?.ownerContact,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const client_id = req.user.client_id;
        const { stayId } = req.params;
        const listing = await StayListing.findByPk(stayId);
        if (!listing) return res.status(404).json({ message: "Stay not found" });
        await StayFavorite.findOrCreate({
            where: { client_id, stay_id: stayId },
            defaults: { client_id, stay_id: stayId },
        });
        res.json({ message: "Saved" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const client_id = req.user.client_id;
        const { stayId } = req.params;
        await StayFavorite.destroy({ where: { client_id, stay_id: stayId } });
        res.json({ message: "Removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const listFavorites = async (req, res) => {
    try {
        const client_id = req.user.client_id;
        const favs = await StayFavorite.findAll({
            where: { client_id },
            include: [
                {
                    model: StayListing,
                    as: "listing",
                    include: [{ model: StayRoom, as: "rooms" }, { model: Client, as: "owner", attributes: OWNER_ATTRS }],
                },
            ],
            order: [["created_at", "DESC"]],
        });
        res.json(favs.map((f) => f.listing).filter(Boolean));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** POST with header x-stay-cron-secret matching STAY_CRON_SECRET (set in env for your scheduler). */
export const runStayCheckInRemindersCron = async (req, res) => {
    try {
        const secret = process.env.STAY_CRON_SECRET;
        if (!secret || req.header("x-stay-cron-secret") !== secret) {
            return res.status(401).json({ message: "Invalid or missing cron secret" });
        }
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dStr = tomorrow.toISOString().slice(0, 10);

        const rows = await StayBooking.findAll({
            where: { checkInDate: dStr, status: "Confirmed" },
            include: [
                { model: StayRoom, as: "room", include: [{ model: StayListing, as: "listing" }] },
                { model: Client, as: "pilgrim", attributes: OWNER_ATTRS },
            ],
        });

        for (const b of rows) {
            const listing = b.room?.listing;
            const owner = listing ? await Client.findByPk(listing.owner_id) : null;
            const pilgrim = b.pilgrim_id ? await Client.findByPk(b.pilgrim_id) : null;
            sendStayCheckInReminderEmails({
                listing,
                booking: b,
                owner,
                pilgrim,
                guestEmail: b.guestEmail,
            }).catch(() => {});
        }

        res.json({ message: `Sent up to ${rows.length} check-in reminder(s)` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
