import { Op } from "sequelize";
import QRCode from "qrcode";
import Client from "../models/client.js";
import StayListing from "../models/stayListing.js";
import StayRoom from "../models/stayRoom.js";
import StayBooking from "../models/stayBooking.js";
import { sequelize } from "../config/database.js";
import {
  contactVisibleToGuestStatuses,
  getBlockedRoomCount,
  parseDateOnly,
  calculateNights,
} from "../utils/stayAvailability.js";
import {
  notifyGuestStayConfirmed,
  notifyGuestStayRejected,
  notifyOwnerNewStayBooking,
  notifyStayCancellation,
} from "../utils/stayNotificationService.js";

const buildStayInclude = () => [
  { model: Client, as: "owner", attributes: ["name", "email", "phone"] },
  {
    model: StayRoom,
    as: "rooms",
    where: { isActive: true },
    required: false,
  },
];

const getBookingRoomFromStay = (stay, roomId) => {
  if (!stay?.rooms?.length) {
    return null;
  }

  if (roomId) {
    return stay.rooms.find((room) => Number(room.room_id) === Number(roomId)) || null;
  }

  return stay.rooms[0] || null;
};

const sanitizeBookingForGuest = (booking) => {
  const plain = booking.toJSON();

  if (plain.stay && !contactVisibleToGuestStatuses.includes(plain.status)) {
    delete plain.stay.contactNumber;
    delete plain.stay.contactEmail;
    delete plain.stay.whatsappNumber;
    delete plain.stay.ownerName;
  }

  return plain;
};

export const createStayBooking = async (req, res) => {
  let transaction;

  try {
    const {
      stay_id,
      room_id,
      checkInDate,
      checkOutDate,
      guests,
      roomsBooked,
      specialRequests,
      guestName,
      guestPhone,
    } = req.body;

    if (!stay_id) {
      return res.status(400).json({ message: "stay_id is required" });
    }

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Check-in and check-out dates are required" });
    }

    const requestedRooms = Number(roomsBooked);
    const requestedGuests = Number(guests);

    if (!Number.isInteger(requestedRooms) || requestedRooms < 1) {
      return res.status(400).json({ message: "roomsBooked must be at least 1" });
    }

    if (!Number.isInteger(requestedGuests) || requestedGuests < 1) {
      return res.status(400).json({ message: "guests must be at least 1" });
    }

    const checkIn = parseDateOnly(checkInDate);
    const checkOut = parseDateOnly(checkOutDate);

    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: "Invalid check-in/check-out date" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (checkIn < today) {
      return res.status(400).json({ message: "Check-in date must be today or later" });
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    if (!Number.isFinite(nights) || nights <= 0) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }

    const user = await Client.findByPk(req.user.client_id);
    const stay = await StayListing.findByPk(stay_id, {
      include: buildStayInclude(),
    });

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (stay.owner_id === req.user.client_id) {
      return res.status(400).json({ message: "You cannot book your own stay listing" });
    }

    if (!stay.isActive || stay.moderationStatus !== "Approved") {
      return res.status(400).json({ message: "This stay is not currently available for booking" });
    }

    const targetRoom = getBookingRoomFromStay(stay, room_id);
    if (!targetRoom || !targetRoom.isActive) {
      return res.status(404).json({ message: "Selected room type not found" });
    }

    if (requestedGuests > Number(targetRoom.capacity) * requestedRooms) {
      return res.status(400).json({
        message: `This room can accommodate up to ${Number(targetRoom.capacity) * requestedRooms} guests for ${requestedRooms} room(s)`,
      });
    }

    transaction = await sequelize.transaction();

    const lockedRoom = await StayRoom.findByPk(targetRoom.room_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!lockedRoom || !lockedRoom.isActive) {
      throw new Error("Selected room type not found");
    }

    const blockedRooms = await getBlockedRoomCount({
      stayId: stay.stay_id,
      roomId: lockedRoom.room_id,
      checkInDate,
      checkOutDate,
      transaction,
    });

    const remainingRooms = Number(lockedRoom.availableRooms) - Number(blockedRooms);
    if (requestedRooms > remainingRooms) {
      await transaction.rollback();
      return res.status(400).json({
        message: `${Math.max(remainingRooms, 0)} ${lockedRoom.roomType} room(s) left for the selected dates`,
      });
    }

    const totalAmount = nights * Number(lockedRoom.pricePerNight) * requestedRooms;
    const simulatedOrderId = `stay_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const booking = await StayBooking.create(
      {
        stay_id: stay.stay_id,
        room_id: lockedRoom.room_id,
        user_id: req.user.client_id,
        guestName: guestName || user?.name || "Pilgrim",
        guestPhone: guestPhone || user?.phone || req.user.phone || "",
        guestEmail: user?.email || req.user.email || null,
        checkInDate,
        checkOutDate,
        guests: requestedGuests,
        roomsBooked: requestedRooms,
        specialRequests: specialRequests || null,
        totalAmount,
        paymentId: simulatedOrderId,
        status: "Pending",
        paymentStatus: "Pending",
      },
      { transaction }
    );

    await transaction.commit();

    await notifyOwnerNewStayBooking({
      to: stay.contactEmail || stay.owner?.email,
      stay,
      booking,
      guest: booking,
    });

    res.status(201).json({
      message: "Booking request created and reserved pending host review",
      booking,
      order: { id: simulatedOrderId, amount: totalAmount * 100 },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: error.message });
  }
};

export const verifyStayBooking = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ message: "razorpay_order_id is required" });
    }

    const booking = await StayBooking.findOne({
      where: { paymentId: razorpay_order_id },
      include: [
        { model: StayListing, as: "stay" },
        { model: Client, as: "user", attributes: ["name", "email", "phone"] },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Stay booking not found" });
    }

    if (booking.user_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized to verify this booking" });
    }

    if (!["Pending", "Confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot verify payment for a ${booking.status} booking` });
    }

    booking.paymentStatus = "Paid";
    await booking.save();

    res.json({
      message: "Payment marked as paid (simulated). Booking is awaiting host confirmation.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyStayBookings = async (req, res) => {
  try {
    const bookings = await StayBooking.findAll({
      where: { user_id: req.user.client_id },
      include: [
        { model: StayListing, as: "stay" },
        { model: StayRoom, as: "room", attributes: ["room_id", "roomType", "capacity", "pricePerNight"] },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(bookings.map(sanitizeBookingForGuest));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelStayBooking = async (req, res) => {
  try {
    const booking = await StayBooking.findByPk(req.params.bookingId, {
      include: [
        { model: StayListing, as: "stay", include: [{ model: Client, as: "owner", attributes: ["email"] }] },
        { model: Client, as: "user", attributes: ["email", "name"] },
        { model: StayRoom, as: "room", attributes: ["roomType"] },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Stay booking not found" });
    }

    if (booking.user_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (!["Pending", "Confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: "This booking can no longer be cancelled" });
    }

    booking.status = "Cancelled";
    booking.paymentStatus = booking.paymentStatus === "Paid" ? "Refunded" : booking.paymentStatus;
    await booking.save();

    await Promise.all([
      notifyStayCancellation({
        to: booking.guestEmail || booking.user?.email,
        stay: booking.stay,
        booking,
        label: "Your",
      }),
      notifyStayCancellation({
        to: booking.stay?.contactEmail || booking.stay?.owner?.email,
        stay: booking.stay,
        booking,
        label: "A guest",
      }),
    ]);

    res.json({ message: "Stay booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStayBookingsForOwner = async (req, res) => {
  try {
    const stay = await StayListing.findByPk(req.params.stayId);

    if (!stay) {
      return res.status(404).json({ message: "Stay listing not found" });
    }

    if (stay.owner_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const bookings = await StayBooking.findAll({
      where: { stay_id: req.params.stayId },
      include: [
        { model: Client, as: "user", attributes: ["name", "phone", "email"] },
        { model: StayRoom, as: "room", attributes: ["room_id", "roomType", "capacity", "pricePerNight"] },
      ],
      order: [["checkInDate", "ASC"]],
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOwnerOverview = async (req, res) => {
  try {
    const userId = req.user.client_id;
    const properties = await StayListing.findAll({
      where: { owner_id: userId },
      attributes: ["stay_id", "propertyName", "isApproved", "moderationStatus", "rejectionReason"],
    });

    const propertyIds = properties.map((property) => property.stay_id);

    if (propertyIds.length === 0) {
      return res.json({
        totalProperties: 0,
        approvedProperties: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        rejectedBookings: 0,
        totalRevenue: 0,
        recentBookings: [],
      });
    }

    const allBookings = await StayBooking.findAll({
      where: { stay_id: { [Op.in]: propertyIds } },
      include: [
        {
          model: StayListing,
          as: "stay",
          attributes: ["propertyName", "city", "stayType"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      totalProperties: properties.length,
      approvedProperties: properties.filter((property) => property.moderationStatus === "Approved").length,
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter((booking) => booking.status === "Confirmed").length,
      pendingBookings: allBookings.filter((booking) => booking.status === "Pending").length,
      rejectedBookings: allBookings.filter((booking) => booking.status === "Rejected").length,
      totalRevenue: allBookings
        .filter((booking) => ["Confirmed", "CheckedIn", "Completed"].includes(booking.status))
        .reduce((sum, booking) => sum + Number(booking.totalAmount), 0),
      recentBookings: allBookings.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOwnerBookings = async (req, res) => {
  try {
    const userId = req.user.client_id;
    const properties = await StayListing.findAll({
      where: { owner_id: userId },
      attributes: ["stay_id"],
    });

    const propertyIds = properties.map((property) => property.stay_id);
    if (propertyIds.length === 0) {
      return res.json([]);
    }

    const bookings = await StayBooking.findAll({
      where: { stay_id: { [Op.in]: propertyIds } },
      include: [
        {
          model: StayListing,
          as: "stay",
          attributes: ["stay_id", "propertyName", "city", "state", "stayType"],
        },
        { model: StayRoom, as: "room", attributes: ["room_id", "roomType", "capacity", "pricePerNight"] },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStayBookings = async (req, res) => {
  try {
    const { status, stay_id } = req.query;
    const where = {};

    if (status) where.status = status;
    if (stay_id) where.stay_id = stay_id;

    const bookings = await StayBooking.findAll({
      where,
      include: [
        { model: StayListing, as: "stay" },
        { model: Client, as: "user", attributes: ["name", "phone", "email"] },
        { model: StayRoom, as: "room", attributes: ["room_id", "roomType", "capacity", "pricePerNight"] },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStayBookingStatus = async (req, res) => {
  let transaction;

  try {
    const { status } = req.body;
    const booking = await StayBooking.findByPk(req.params.bookingId, {
      include: [
        { model: StayListing, as: "stay" },
        { model: Client, as: "user", attributes: ["name", "email", "phone"] },
        { model: StayRoom, as: "room", attributes: ["room_id", "roomType", "capacity", "pricePerNight", "availableRooms"] },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Stay booking not found" });
    }

    if (booking.stay?.owner_id !== req.user.client_id) {
      return res.status(403).json({ message: "Not authorized to manage this booking" });
    }

    const nextStatus = String(status || "").trim();
    const allowedStatuses = ["Confirmed", "Rejected", "CheckedIn", "Completed", "Cancelled"];

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const currentStatus = booking.status;
    if (currentStatus === nextStatus) {
      return res.json({ message: `Booking status is already ${nextStatus}`, booking });
    }

    const ensureTransition = (allowedFrom) => {
      if (!allowedFrom.includes(currentStatus)) {
        return res.status(400).json({
          message: `Cannot change booking status from ${currentStatus} to ${nextStatus}`,
        });
      }
      return null;
    };

    if (nextStatus === "Confirmed") {
      const invalid = ensureTransition(["Pending"]);
      if (invalid) return;

      if (!booking.stay || !booking.stay.isActive || booking.stay.moderationStatus !== "Approved") {
        return res.status(400).json({ message: "This stay is not currently available" });
      }

      transaction = await sequelize.transaction();

      const lockedRoom = await StayRoom.findByPk(booking.room_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!lockedRoom || !lockedRoom.isActive) {
        await transaction.rollback();
        return res.status(400).json({ message: "Selected room type is no longer available" });
      }

      const blockedRooms = await getBlockedRoomCount({
        stayId: booking.stay_id,
        roomId: booking.room_id,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        excludeBookingId: booking.stay_booking_id,
        transaction,
      });

      const remainingRooms = Number(lockedRoom.availableRooms) - Number(blockedRooms);
      if (Number(booking.roomsBooked) > remainingRooms) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Not enough availability to confirm. ${Math.max(remainingRooms, 0)} room(s) left for those dates.`,
        });
      }

      booking.status = "Confirmed";

      const qrData = JSON.stringify({
        stay_booking_id: booking.stay_booking_id,
        propertyName: booking.stay?.propertyName,
        guestName: booking.guestName,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomsBooked: booking.roomsBooked,
      });

      booking.qrCode = await QRCode.toDataURL(qrData);
      await booking.save({ transaction });
      await transaction.commit();
      transaction = null;

      await notifyGuestStayConfirmed({
        to: booking.guestEmail || booking.user?.email,
        stay: booking.stay,
        booking,
      });

      return res.json({ message: "Booking confirmed", booking });
    }

    if (nextStatus === "Rejected") {
      const invalid = ensureTransition(["Pending"]);
      if (invalid) return;

      booking.status = "Rejected";
      booking.paymentStatus = booking.paymentStatus === "Paid" ? "Refunded" : booking.paymentStatus;
      await booking.save();

      await notifyGuestStayRejected({
        to: booking.guestEmail || booking.user?.email,
        stay: booking.stay,
        booking,
      });

      return res.json({ message: "Booking rejected", booking });
    }

    if (nextStatus === "CheckedIn") {
      const invalid = ensureTransition(["Confirmed"]);
      if (invalid) return;

      booking.status = "CheckedIn";
      await booking.save();
      return res.json({ message: "Guest checked in", booking });
    }

    if (nextStatus === "Completed") {
      const invalid = ensureTransition(["CheckedIn"]);
      if (invalid) return;

      booking.status = "Completed";
      await booking.save();
      return res.json({ message: "Booking completed", booking });
    }

    if (nextStatus === "Cancelled") {
      const invalid = ensureTransition(["Confirmed"]);
      if (invalid) return;

      booking.status = "Cancelled";
      booking.paymentStatus = booking.paymentStatus === "Paid" ? "Refunded" : booking.paymentStatus;
      await booking.save();

      await Promise.all([
        notifyStayCancellation({
          to: booking.guestEmail || booking.user?.email,
          stay: booking.stay,
          booking,
          label: "Your",
        }),
        notifyStayCancellation({
          to: booking.stay?.contactEmail,
          stay: booking.stay,
          booking,
          label: "A host",
        }),
      ]);

      return res.json({ message: "Booking cancelled", booking });
    }

    return res.status(400).json({ message: "Unsupported status transition" });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: error.message });
  }
};
