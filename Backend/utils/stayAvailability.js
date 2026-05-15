import { Op } from "sequelize";
import StayBooking from "../models/stayBooking.js";

export const inventoryBlockingStatuses = ["Pending", "Confirmed", "CheckedIn"];
export const contactVisibleToGuestStatuses = ["Confirmed", "CheckedIn", "Completed"];

export const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const calculateNights = (checkInDate, checkOutDate) => {
  const start = parseDateOnly(checkInDate);
  const end = parseDateOnly(checkOutDate);

  if (!start || !end) {
    return NaN;
  }

  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

export const getBlockedRoomCount = async ({
  stayId,
  roomId,
  checkInDate,
  checkOutDate,
  excludeBookingId,
  transaction,
}) => {
  const where = {
    stay_id: stayId,
    room_id: roomId,
    status: { [Op.in]: inventoryBlockingStatuses },
    checkInDate: { [Op.lt]: checkOutDate },
    checkOutDate: { [Op.gt]: checkInDate },
  };

  if (excludeBookingId) {
    where.stay_booking_id = { [Op.ne]: excludeBookingId };
  }

  return (
    (await StayBooking.sum("roomsBooked", {
      where,
      transaction,
    })) || 0
  );
};

export const buildAvailabilitySnapshot = async ({
  stay,
  checkInDate,
  checkOutDate,
  requestedGuests = 1,
  requestedRooms = 1,
  excludeBookingId,
  transaction,
}) => {
  const nights = calculateNights(checkInDate, checkOutDate);
  const roomSnapshots = await Promise.all(
    (stay.rooms || []).map(async (room) => {
      const blockedRooms = await getBlockedRoomCount({
        stayId: stay.stay_id,
        roomId: room.room_id,
        checkInDate,
        checkOutDate,
        excludeBookingId,
        transaction,
      });

      const totalRooms = Number(room.availableRooms) || 0;
      const remainingRooms = Math.max(totalRooms - Number(blockedRooms), 0);
      const maxGuests = (Number(room.capacity) || 0) * Number(requestedRooms || 1);
      const canFitGuests = Number(requestedGuests || 1) <= maxGuests;
      const canFitRooms = Number(requestedRooms || 1) <= remainingRooms;
      const roomPrice = Number(room.pricePerNight) || 0;

      return {
        room_id: room.room_id,
        roomType: room.roomType,
        totalRooms,
        blockedRooms,
        remainingRooms,
        capacityPerRoom: Number(room.capacity) || 0,
        maxGuests,
        canFitGuests,
        canFitRooms,
        canBook: canFitGuests && canFitRooms && Number.isFinite(nights) && nights > 0,
        nightlyRate: roomPrice,
        totalAmount: Number.isFinite(nights) && nights > 0 ? roomPrice * nights * Number(requestedRooms || 1) : 0,
      };
    })
  );

  return {
    checkInDate,
    checkOutDate,
    requestedGuests: Number(requestedGuests || 1),
    requestedRooms: Number(requestedRooms || 1),
    nights,
    rooms: roomSnapshots,
  };
};
