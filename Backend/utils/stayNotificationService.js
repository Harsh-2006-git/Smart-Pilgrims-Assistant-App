import nodemailer from "nodemailer";

const canSendMail = () =>
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    family: 4,
  });

const sendMail = async ({ to, subject, html }) => {
  if (!to || !canSendMail()) return;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Divya Yatra" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.warn("Stay notification email skipped:", error.message);
  }
};

export const notifyOwnerNewStayBooking = async ({ to, stay, booking, guest }) => {
  await sendMail({
    to,
    subject: `New booking request for ${stay.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">New stay booking request</h2>
        <p><strong>${guest.guestName}</strong> requested a stay at <strong>${stay.propertyName}</strong>.</p>
        <p>Check-in: ${booking.checkInDate}</p>
        <p>Check-out: ${booking.checkOutDate}</p>
        <p>Guests: ${booking.guests}</p>
        <p>Rooms: ${booking.roomsBooked}</p>
        <p>Contact: ${guest.guestPhone}${guest.guestEmail ? ` | ${guest.guestEmail}` : ""}</p>
      </div>
    `,
  });
};

export const notifyGuestStayConfirmed = async ({ to, stay, booking }) => {
  await sendMail({
    to,
    subject: `Stay booking confirmed for ${stay.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Your stay is confirmed</h2>
        <p>Your booking at <strong>${stay.propertyName}</strong> is now confirmed.</p>
        <p>Check-in: ${booking.checkInDate}</p>
        <p>Check-out: ${booking.checkOutDate}</p>
        <p>Rooms: ${booking.roomsBooked}</p>
        <p>Total: Rs. ${booking.totalAmount}</p>
        <p>Owner contact: ${stay.contactNumber}</p>
      </div>
    `,
  });
};

export const notifyGuestStayRejected = async ({ to, stay, booking }) => {
  await sendMail({
    to,
    subject: `Stay booking request not available for ${stay.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Booking request rejected</h2>
        <p>Unfortunately, your booking request at <strong>${stay.propertyName}</strong> could not be accepted for the selected dates.</p>
        <p>Check-in: ${booking.checkInDate}</p>
        <p>Check-out: ${booking.checkOutDate}</p>
        <p>Rooms: ${booking.roomsBooked}</p>
        <p>If you have already paid, a refund will be processed as per policy.</p>
      </div>
    `,
  });
};

export const notifyStayCancellation = async ({ to, stay, booking, label }) => {
  await sendMail({
    to,
    subject: `Stay booking cancelled for ${stay.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Booking cancelled</h2>
        <p>${label} booking for <strong>${stay.propertyName}</strong> was cancelled.</p>
        <p>Check-in: ${booking.checkInDate}</p>
        <p>Check-out: ${booking.checkOutDate}</p>
        <p>Rooms: ${booking.roomsBooked}</p>
      </div>
    `,
  });
};

export const notifyStayListingModerated = async ({ to, stay, action, reason }) => {
  const messages = {
    approve: {
      subject: `Stay listing approved: ${stay.propertyName}`,
      heading: "Your stay listing is now live",
      body: `Your property <strong>${stay.propertyName}</strong> has been approved and is now visible to pilgrims.`,
    },
    reject: {
      subject: `Stay listing requires updates: ${stay.propertyName}`,
      heading: "Your stay listing was rejected",
      body: `Your property <strong>${stay.propertyName}</strong> needs changes before it can go live again.`,
    },
    suspend: {
      subject: `Stay listing suspended: ${stay.propertyName}`,
      heading: "Your stay listing was suspended",
      body: `Your property <strong>${stay.propertyName}</strong> has been suspended from public listing.`,
    },
    reactivate: {
      subject: `Stay listing reactivated: ${stay.propertyName}`,
      heading: "Your stay listing is live again",
      body: `Your property <strong>${stay.propertyName}</strong> has been reactivated and is available to pilgrims again.`,
    },
  };

  const config = messages[action];
  if (!config) return;

  await sendMail({
    to,
    subject: config.subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">${config.heading}</h2>
        <p>${config.body}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      </div>
    `,
  });
};
