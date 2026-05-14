// controllers/bookingController.js
import Booking from "../models/booking.js";
import ParkingSlot from "../models/parkingSlot.js";
import QRCode from "qrcode";
import { Op } from "sequelize";
// import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

// Simulated payment flow - Razorpay not required for simulation
const razorpay = null;


export const createBooking = async (req, res, next) => {
    try {
        const { parking_slot_id, startTime, endTime, vehicleNumber } = req.body;
        const user_id = req.user.client_id;

        const slot = await ParkingSlot.findByPk(parking_slot_id);
        if (!slot) return res.status(404).json({ message: "Parking slot not found" });

        // Check availability
        const overlappingBookings = await Booking.count({
            where: {
                parking_slot_id,
                status: { [Op.in]: ["Confirmed", "Pending"] },
                [Op.or]: [
                    { startTime: { [Op.between]: [startTime, endTime] } },
                    { endTime: { [Op.between]: [startTime, endTime] } },
                    {
                        [Op.and]: [
                            { startTime: { [Op.lte]: startTime } },
                            { endTime: { [Op.gte]: endTime } },
                        ],
                    },
                ],
            },
        });

        if (overlappingBookings >= slot.totalSlots) {
            return res.status(400).json({ message: "No slots available for this time period" });
        }

        // Calculate total amount
        const durationHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
        const totalAmount = Math.ceil(durationHours * slot.pricePerHour);

        // Simulate Payment Initialization (Skipping Razorpay)
        const simulatedOrderId = `simulated_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const booking = await Booking.create({
            parking_slot_id,
            user_id,
            startTime,
            endTime,
            totalAmount,
            vehicleNumber,
            paymentId: simulatedOrderId,
            status: "Pending",
        });

        res.json({
            message: "Booking initiated (Simulated)",
            booking,
            order: { id: simulatedOrderId, amount: totalAmount * 100 },
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id } = req.body;

        const booking = await Booking.findOne({ where: { paymentId: razorpay_order_id } });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        booking.status = "Confirmed";
        booking.paymentStatus = "Paid";
        booking.paymentId = `sim_pay_${Date.now()}`;

        // Generate QR Code
        const qrData = JSON.stringify({
            booking_id: booking.booking_id,
            vehicleNumber: booking.vehicleNumber,
            startTime: booking.startTime,
            endTime: booking.endTime,
        });
        const qrCodeUrl = await QRCode.toDataURL(qrData);
        booking.qrCode = qrCodeUrl;

        await booking.save();

        res.json({ message: "Payment simulated successfully", booking });
    } catch (error) {
        next(error);
    }
};

export const getMyBookings = async (req, res, next) => {
    try {
        const user_id = req.user.client_id;
        const bookings = await Booking.findAll({
            where: { user_id },
            include: [{ model: ParkingSlot, as: "parkingSlot" }],
            order: [["created_at", "DESC"]],
        });
        res.json(bookings);
    } catch (error) {
        next(error);
    }
};

export const getSlotBookings = async (req, res, next) => {
    try {
        const { slot_id } = req.params;
        const slot = await ParkingSlot.findByPk(slot_id);
        if (!slot) return res.status(404).json({ message: "Parking slot not found" });

        if (slot.owner_id !== req.user.client_id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const bookings = await Booking.findAll({
            where: { parking_slot_id: slot_id },
            include: [{ model: Booking.associations.user.target, as: "user", attributes: ["name", "phone"] }],
            order: [["startTime", "ASC"]],
        });
        res.json(bookings);
    } catch (error) {
        next(error);
    }
};
