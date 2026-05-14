import Ticket from "../models/ticket.js";
import Client from "../models/client.js";
import QRCode from "qrcode";
// Create Ticket
export const createTicket = async (req, res, next) => {
  try {
    const { date, time, temple, no_of_tickets, category } = req.body;
    const client_id = req.user.client_id;
    if (no_of_tickets > 10) {
      return res
        .status(400)
        .json({ message: "Max 10 tickets allowed per booking." });
    }

    const client = await Client.findByPk(client_id);
    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const ticket = await Ticket.create({
      client_id,
      date,
      time,
      temple,
      no_of_tickets,
      category: category || "normal",
    });

    const qrData = {
      ticket_id: ticket.ticket_id,
      client_id: ticket.client_id,
      temples: ticket.temple,
      date: ticket.date,
      time: ticket.time,
      category: ticket.category,
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Save QR code back into ticket
    ticket.qr_code = qrCode;
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

// Get Tickets by Client ID
export const getTicketsByClient = async (req, res, next) => {
  try {
    const client_id = req.user.client_id;

    const tickets = await Ticket.findAll({
      where: { client_id },
      attributes: [
        "ticket_id",
        "date",
        "time",
        "temple",
        "no_of_tickets",
        "category",
        "qr_code", // 👈 explicitly include QR code
        "created_at",
      ],
      include: [
        {
          model: Client,
          attributes: ["client_id", "name", "phone", "email", "userType"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!tickets.length) {
      return res.status(200).json([]);
    }

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};
