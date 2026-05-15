import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import StayListing from "../models/stayListing.js";
import StayRoom from "../models/stayRoom.js";
import StayBooking from "../models/stayBooking.js";
import Client from "../models/client.js";
import { buildAvailabilitySnapshot, parseDateOnly } from "../utils/stayAvailability.js";
import { notifyStayListingModerated } from "../utils/stayNotificationService.js";

const toFilePath = (file) => file?.path?.replace(/\\/g, "/");

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const normalizeTime = (value, fallback) => {
  if (!value) return fallback;
  return /^\d{2}:\d{2}$/.test(String(value)) ? `${value}:00` : value;
};

const parseArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const buildStayPayload = (body, owner, { partial = false } = {}) => {
  const amenitiesValue = body.amenities !== undefined ? body.amenities : body["amenities[]"];

  const payload = {
    propertyName: body.propertyName,
    stayType: body.stayType,
    ownerName: partial ? body.ownerName : body.ownerName || owner?.name || "Local Host",
    contactNumber: partial ? body.contactNumber : body.contactNumber || owner?.phone || "",
    contactEmail: partial ? body.contactEmail : body.contactEmail || owner?.email || null,
    whatsappNumber: partial ? body.whatsappNumber : body.whatsappNumber || body.contactNumber || owner?.phone || null,
    description: body.description,
    address: body.address,
    city: body.city,
    state: body.state,
    pilgrimageRoute: body.pilgrimageRoute,
    nearbyTemple: body.nearbyTemple,
    distanceFromTempleKm: body.distanceFromTempleKm || null,
    checkInTime: normalizeTime(body.checkInTime, partial ? undefined : "12:00:00"),
    checkOutTime: normalizeTime(body.checkOutTime, partial ? undefined : "10:00:00"),
    foodAvailable:
      body.foodAvailable !== undefined ? parseBoolean(body.foodAvailable) : partial ? undefined : false,
    washroom:
      body.washroom !== undefined ? parseBoolean(body.washroom) : partial ? undefined : true,
    parking:
      body.parking !== undefined ? parseBoolean(body.parking) : partial ? undefined : false,
    familyRooms:
      body.familyRooms !== undefined ? parseBoolean(body.familyRooms) : partial ? undefined : false,
    wifi:
      body.wifi !== undefined ? parseBoolean(body.wifi) : partial ? undefined : false,
    security:
      body.security !== undefined ? parseBoolean(body.security) : partial ? undefined : false,
    medicalAssistanceNearby:
      body.medicalAssistanceNearby !== undefined
        ? parseBoolean(body.medicalAssistanceNearby)
        : partial
          ? undefined
          : false,
    latitude: body.latitude,
    longitude: body.longitude,
    amenities: amenitiesValue !== undefined ? parseArray(amenitiesValue) : partial ? undefined : [],
  };

  if (!partial) {
    return payload;
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
};

const parseRoomsData = (roomsField, uploadedRoomImages) => {
  let roomsData = [];

  if (roomsField === undefined || roomsField === null || roomsField === "") {
    return [];
  }

  if (typeof roomsField === "string") {
    roomsData = JSON.parse(roomsField);
  } else if (Array.isArray(roomsField)) {
    roomsData = roomsField;
  } else {
    roomsData = [roomsField];
  }

  if (!Array.isArray(roomsData) || roomsData.length === 0) {
    return [];
  }

  return roomsData.map((room, index) => {
    const roomType = String(room.roomType || "").trim();
    const capacity = Number(room.capacity);
    const availableRooms = Number(room.availableRooms);
    const pricePerNight = Number(room.pricePerNight);
    const roomId = room.room_id ? Number(room.room_id) : null;
    const existingRoomImages = parseArray(room.existingRoomImages);
    const imageIndices = Array.isArray(room.imageIndices) ? room.imageIndices : [];
    const appendedImages = imageIndices
      .map((imageIndex) => uploadedRoomImages[Number(imageIndex)])
      .filter(Boolean);

    if (!roomType) {
      throw new Error(`Room ${index + 1} is missing a room type`);
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new Error(`Room ${roomType} must have a capacity of at least 1`);
    }

    if (!Number.isFinite(availableRooms) || availableRooms < 1) {
      throw new Error(`Room ${roomType} must have at least 1 available room`);
    }

    if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
      throw new Error(`Room ${roomType} must have a valid nightly price`);
    }

    return {
      room_id: roomId,
      roomType,
      capacity,
      availableRooms,
      pricePerNight,
      description: room.description || "",
      amenities: parseArray(room.amenities),
      roomImages: [...existingRoomImages, ...appendedImages],
      isActive: room.isActive === undefined ? true : parseBoolean(room.isActive),
    };
  });
};

const getStayOwnerDetails = async (ownerId) =>
  Client.findByPk(ownerId, {
    attributes: ["client_id", "name", "email", "phone", "stayHostVerified"],
  });

const buildRoomInclude = ({ includeInactive = false, additionalWhere = {}, required = false } = {}) => ({
  model: StayRoom,
  as: "rooms",
  where: includeInactive ? additionalWhere : { isActive: true, ...additionalWhere },
  required,
});

const applyRoomUpdates = async ({ stayId, roomsPayload, transaction }) => {
  const existingRooms = await StayRoom.findAll({
    where: { stay_id: stayId },
    transaction,
  });

  const existingById = new Map(existingRooms.map((room) => [room.room_id, room]));
  const submittedRoomIds = new Set();

  for (const roomPayload of roomsPayload) {
    if (roomPayload.room_id && existingById.has(roomPayload.room_id)) {
      submittedRoomIds.add(roomPayload.room_id);
      const existingRoom = existingById.get(roomPayload.room_id);
      await existingRoom.update(
        {
          roomType: roomPayload.roomType,
          availableRooms: roomPayload.availableRooms,
          capacity: roomPayload.capacity,
          pricePerNight: roomPayload.pricePerNight,
          description: roomPayload.description,
          amenities: roomPayload.amenities,
          roomImages: roomPayload.roomImages,
          isActive: roomPayload.isActive,
        },
        { transaction }
      );
      continue;
    }

    const createdRoom = await StayRoom.create(
      {
        stay_id: stayId,
        roomType: roomPayload.roomType,
        availableRooms: roomPayload.availableRooms,
        capacity: roomPayload.capacity,
        pricePerNight: roomPayload.pricePerNight,
        description: roomPayload.description,
        amenities: roomPayload.amenities,
        roomImages: roomPayload.roomImages,
        isActive: true,
      },
      { transaction }
    );

    submittedRoomIds.add(createdRoom.room_id);
  }

  for (const existingRoom of existingRooms) {
    if (!submittedRoomIds.has(existingRoom.room_id)) {
      await existingRoom.update({ isActive: false }, { transaction });
    }
  }
};

const sanitizePublicStay = (stay) => {
  const plain = typeof stay.toJSON === "function" ? stay.toJSON() : { ...stay };
  delete plain.contactNumber;
  delete plain.contactEmail;
  delete plain.whatsappNumber;
  delete plain.owner_id;
  delete plain.ownerName;
  return plain;
};

export const createStayListing = async (req, res) => {
  let transaction;

  try {
    const ownerId = req.user.client_id;
    const owner = await getStayOwnerDetails(ownerId);
    const propertyImages = req.files?.propertyImages?.map(toFilePath).filter(Boolean) || [];
    const uploadedRoomImages = req.files?.roomImages?.map(toFilePath).filter(Boolean) || [];
    const roomsPayload = parseRoomsData(req.body.rooms, uploadedRoomImages);

    if (roomsPayload.length === 0) {
      return res.status(400).json({ message: "At least one room type is required" });
    }

    transaction = await sequelize.transaction();

    const newStay = await StayListing.create(
      {
        owner_id: ownerId,
        ...buildStayPayload(req.body, owner),
        propertyImages,
        roomImages: uploadedRoomImages,
        isApproved: false,
        moderationStatus: "Pending",
        rejectionReason: null,
      },
      { transaction }
    );

    await applyRoomUpdates({
      stayId: newStay.stay_id,
      roomsPayload,
      transaction,
    });

    await transaction.commit();

    const createdStay = await StayListing.findByPk(newStay.stay_id, {
      include: [buildRoomInclude({ required: false })],
    });

    res.status(201).json({
      message: "Stay submitted successfully and is pending admin review.",
      data: createdStay,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: error.message || "Failed to create stay listing" });
  }
};

export const getAllStayListings = async (req, res) => {
  try {
    const {
      search,
      city,
      state,
      stayType,
      roomType,
      maxPrice,
      minCapacity,
      guests,
      sortBy,
      checkInDate,
      checkOutDate,
      roomsRequested,
      wifi,
      parking,
      foodAvailable,
      familyRooms,
    } = req.query;

    const where = { isActive: true, moderationStatus: "Approved" };
    const roomWhere = {};

    if (city) where.city = { [Op.like]: `%${city}%` };
    if (state) where.state = { [Op.like]: `%${state}%` };
    if (stayType) where.stayType = stayType;
    if (roomType) roomWhere.roomType = roomType;
    if (maxPrice) roomWhere.pricePerNight = { [Op.lte]: Number(maxPrice) };
    if (minCapacity || guests) roomWhere.capacity = { [Op.gte]: Number(guests || minCapacity) };

    if (wifi === "true") where.wifi = true;
    if (parking === "true") where.parking = true;
    if (foodAvailable === "true") where.foodAvailable = true;
    if (familyRooms === "true") where.familyRooms = true;

    if (search) {
      where[Op.or] = [
        { propertyName: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } },
        { nearbyTemple: { [Op.like]: `%${search}%` } },
        { pilgrimageRoute: { [Op.like]: `%${search}%` } },
      ];
    }

    const stays = await StayListing.findAll({
      where,
      include: [buildRoomInclude({ additionalWhere: roomWhere, required: true })],
      order: [["created_at", "DESC"]],
    });

    let response = stays.map(sanitizePublicStay);

    if (checkInDate && checkOutDate) {
      const requestedGuests = Number(guests || 1);
      const requestedRoomCount = Number(roomsRequested || 1);

      const availability = await Promise.all(
        response.map(async (stay) => ({
          stay,
          snapshot: await buildAvailabilitySnapshot({
            stay,
            checkInDate,
            checkOutDate,
            requestedGuests,
            requestedRooms: requestedRoomCount,
          }),
        }))
      );

      response = availability
        .map(({ stay, snapshot }) => ({
          ...stay,
          rooms: snapshot.rooms.filter((room) => room.canFitGuests),
          availabilitySummary: {
            checkInDate,
            checkOutDate,
            requestedGuests,
            requestedRooms: requestedRoomCount,
            hasAvailability: snapshot.rooms.some((room) => room.canBook),
          },
        }))
        .filter((stay) => stay.availabilitySummary.hasAvailability && stay.rooms.length > 0);
    }

    if (sortBy === "price_low_high" || sortBy === "price_high_low") {
      response.sort((a, b) => {
        const aPrice = Math.min(...a.rooms.map((room) => Number(room.pricePerNight) || Infinity));
        const bPrice = Math.min(...b.rooms.map((room) => Number(room.pricePerNight) || Infinity));
        return sortBy === "price_low_high" ? aPrice - bPrice : bPrice - aPrice;
      });
    } else if (sortBy === "newest") {
      response.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyStayListings = async (req, res) => {
  try {
    const stays = await StayListing.findAll({
      where: { owner_id: req.user.client_id },
      include: [buildRoomInclude({ required: false })],
      order: [["created_at", "DESC"]],
    });

    res.json(stays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStayListingById = async (req, res) => {
  try {
    const stay = await StayListing.findOne({
      where: { stay_id: req.params.id, isActive: true, moderationStatus: "Approved" },
      include: [buildRoomInclude({ required: true })],
    });

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    res.json(sanitizePublicStay(stay));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStayAvailability = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, guests = 1, roomsRequested = 1 } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Check-in and check-out dates are required" });
    }

    const checkIn = parseDateOnly(checkInDate);
    const checkOut = parseDateOnly(checkOutDate);

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }

    const stay = await StayListing.findOne({
      where: { stay_id: req.params.id, isActive: true, moderationStatus: "Approved" },
      include: [buildRoomInclude({ required: true })],
    });

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    const snapshot = await buildAvailabilitySnapshot({
      stay: stay.toJSON(),
      checkInDate,
      checkOutDate,
      requestedGuests: Number(guests || 1),
      requestedRooms: Number(roomsRequested || 1),
    });

    res.json({
      stay_id: stay.stay_id,
      propertyName: stay.propertyName,
      ...snapshot,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStayListingForOwner = async (req, res) => {
  try {
    const stay = await StayListing.findByPk(req.params.id, {
      include: [buildRoomInclude({ required: false })],
    });

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (stay.owner_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(stay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStayListing = async (req, res) => {
  let transaction;

  try {
    const stay = await StayListing.findByPk(req.params.id);

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (stay.owner_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized to update this stay" });
    }

    const owner = await getStayOwnerDetails(req.user.client_id);
    const updateData = buildStayPayload(req.body, owner, { partial: true });
    const newPropertyImages = req.files?.propertyImages?.map(toFilePath).filter(Boolean) || [];
    const uploadedRoomImages = req.files?.roomImages?.map(toFilePath).filter(Boolean) || [];
    const roomsPayload = parseRoomsData(req.body.rooms, uploadedRoomImages);

    if (roomsPayload.length === 0) {
      return res.status(400).json({ message: "At least one active room type is required" });
    }

    if (newPropertyImages.length) {
      updateData.propertyImages = newPropertyImages;
    }

    if (uploadedRoomImages.length) {
      updateData.roomImages = uploadedRoomImages;
    }

    updateData.isApproved = false;
    updateData.moderationStatus = "Pending";
    updateData.rejectionReason = null;
    updateData.isActive = true;

    transaction = await sequelize.transaction();
    await stay.update(updateData, { transaction });
    await applyRoomUpdates({
      stayId: stay.stay_id,
      roomsPayload,
      transaction,
    });
    await transaction.commit();

    const updatedStay = await StayListing.findByPk(stay.stay_id, {
      include: [buildRoomInclude({ required: false })],
    });

    res.json({
      message: "Stay listing updated successfully and sent back for admin review",
      data: updatedStay,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: error.message });
  }
};

export const deleteStayListing = async (req, res) => {
  try {
    const stay = await StayListing.findByPk(req.params.id);

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (stay.owner_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized to delete this stay" });
    }

    const activeBookings = await StayBooking.count({
      where: {
        stay_id: stay.stay_id,
        status: { [Op.in]: ["Pending", "Confirmed", "CheckedIn"] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        message: "This stay has active reservations or pending booking requests. Deactivate it instead of deleting.",
      });
    }

    await stay.destroy();
    res.json({ message: "Stay listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleStayActivity = async (req, res) => {
  try {
    const stay = await StayListing.findByPk(req.params.id);

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (stay.owner_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (stay.isActive) {
      const blockingBookings = await StayBooking.count({
        where: {
          stay_id: stay.stay_id,
          status: { [Op.in]: ["Pending", "Confirmed", "CheckedIn"] },
        },
      });

      if (blockingBookings > 0) {
        return res.status(400).json({
          message: "This stay has active or pending reservations and cannot be deactivated yet.",
        });
      }

      stay.isActive = false;
    } else {
      stay.isActive = true;
    }

    await stay.save();

    res.json({
      message: `Stay listing is now ${stay.isActive ? "active" : "inactive"}`,
      data: stay,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const moderateStayListing = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const stay = await StayListing.findByPk(req.params.id, {
      include: [{ model: Client, as: "owner", attributes: ["email", "name"] }],
    });

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (action === "approve") {
      stay.isApproved = true;
      stay.moderationStatus = "Approved";
      stay.isActive = true;
      stay.rejectionReason = null;
    } else if (action === "reject") {
      if (!String(reason || "").trim()) {
        return res.status(400).json({ message: "A rejection reason is required" });
      }
      stay.isApproved = false;
      stay.moderationStatus = "Rejected";
      stay.isActive = false;
      stay.rejectionReason = String(reason).trim();
    } else if (action === "suspend") {
      stay.isApproved = false;
      stay.isActive = false;
      stay.moderationStatus = "Suspended";
    } else if (action === "reactivate") {
      stay.isApproved = true;
      stay.isActive = true;
      stay.moderationStatus = "Approved";
      stay.rejectionReason = null;
    } else {
      return res.status(400).json({ message: "Invalid moderation action" });
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
      message: actionMessages[action] || "Stay moderation updated successfully",
      data: stay,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStayListings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.moderationStatus = status;
    }

    const stays = await StayListing.findAll({
      where,
      include: [
        { model: Client, as: "owner", attributes: ["client_id", "name", "phone", "email", "stayHostVerified"] },
        buildRoomInclude({ required: false }),
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(stays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
