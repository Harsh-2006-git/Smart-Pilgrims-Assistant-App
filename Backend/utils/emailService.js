import nodemailer from "nodemailer";
import crypto from "crypto";

// Using your Hostinger SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4,
});

/**
 * Generate 6-digit OTP
 * @returns {string} - 6-digit OTP code
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP email for email verification
 * @param {string} email - Client's email address
 * @param {string} otp - 6-digit OTP code
 */
export const sendOTPEmail = async (email, otp) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - Ujjain Yatra</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        .email-container{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;color:#334155;background:linear-gradient(135deg,#ff6b35 0%,#f7931e 50%,#ff8c42 100%);min-height:100vh;padding:20px}
        .email-wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.25)}
        .header{background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:40px 30px;text-align:center;position:relative;overflow:hidden}
        .header::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,.1) 0%,transparent 70%);animation:pulse 4s ease-in-out infinite}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.1);opacity:.8}}
        .logo{width:100px;height:100px;margin:0 auto 20px;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,.3);position:relative;z-index:1;overflow:hidden}
        .logo img{width:90%;height:90%;object-fit:cover;border-radius:50%}
        .company-name{color:#fff;font-size:28px;font-weight:700;margin-bottom:8px;position:relative;z-index:1}
        .tagline{color:rgba(255,255,255,.9);font-size:14px;font-weight:400;position:relative;z-index:1}
        .content{padding:40px 30px}
        .welcome-section{text-align:center;margin-bottom:40px}
        .welcome-icon{width:64px;height:64px;margin:0 auto 24px;background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px}
        .welcome-title{font-size:24px;font-weight:600;color:#111827;margin-bottom:12px}
        .welcome-text{color:#6b7280;font-size:16px;max-width:400px;margin:0 auto}
        .otp-section{background:linear-gradient(135deg,#fff4e6 0%,#fef3c7 100%);border:2px solid #f59e0b;border-radius:16px;padding:32px;text-align:center;margin:32px 0;position:relative;overflow:hidden}
        .otp-section::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#ff6b35,#f7931e,#ff8c42)}
        .otp-label{color:#92400e;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}
        .otp-code{font-size:42px;font-weight:700;color:#111827;font-family:'Courier New',monospace;letter-spacing:6px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.05);margin:16px 0;border:1px solid #f59e0b}
        .otp-helper{color:#92400e;font-size:12px;margin-top:12px}
        .warning-box{background:#fef3cd;border:1px solid #f59e0b;border-radius:12px;padding:20px;margin:24px 0;display:flex;align-items:flex-start;gap:12px}
        .warning-icon{color:#d97706;font-size:20px;margin-top:2px}
        .warning-content h4{color:#92400e;font-size:14px;font-weight:600;margin-bottom:4px}
        .warning-content p{color:#92400e;font-size:14px;margin:0}
        .cta-section{text-align:center;margin:32px 0}
        .cta-button{display:inline-block;background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);color:#fff;text-decoration:none;padding:16px 32px;border-radius:50px;font-weight:600;font-size:16px;box-shadow:0 10px 25px rgba(255,107,53,.3);transition:all .3s ease;border:none}
        .cta-button:hover{transform:translateY(-2px);box-shadow:0 15px 35px rgba(255,107,53,.4)}
        .help-text{color:#9ca3af;font-size:12px;margin-top:16px}
        .security-notice{background:#f0fdf4;border:1px solid #22c55e;border-radius:12px;padding:20px;margin:24px 0;display:flex;align-items:flex-start;gap:12px}
        .security-icon{color:#16a34a;font-size:20px;margin-top:2px}
        .security-content h4{color:#15803d;font-size:14px;font-weight:600;margin-bottom:4px}
        .security-content p{color:#15803d;font-size:14px;margin:0}
        .footer{background:#2d1810;color:#fff;padding:32px 30px}
        .footer-content{text-align:center}
        .footer-title{font-size:18px;font-weight:600;margin-bottom:12px}
        .footer-subtitle{color:#9ca3af;font-size:14px;margin-bottom:20px}
        .footer-links{display:flex;justify-content:center;gap:15px;margin-bottom:24px;flex-wrap:wrap}
        .footer-link{color:#ff8c42;text-decoration:none;font-size:14px;transition:color .3s ease}
        .footer-link:hover{color:#ffab70}
        .footer-divider{height:1px;background:#4a2c1d;margin:24px 0}
        .footer-bottom{text-align:center}
        .footer-bottom p{color:#9ca3af;font-size:12px;margin-bottom:8px}
        .footer-bottom a{color:#ff8c42;text-decoration:none}
        @media (max-width:600px){
            .email-container{padding:10px}
            .header{padding:30px 20px}
            .content{padding:30px 20px}
            .otp-code{font-size:32px;letter-spacing:4px}
            .footer-links{flex-direction:column;gap:12px}
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-wrapper">
            <div class="header">
                <div class="logo">
                    <img src="https://img.freepik.com/premium-vector/sadhu-sitting-meditating-isolated_1076263-601.jpg?w=740" alt="Ujjain Yatra Logo">
                </div>
                <h1 class="company-name">Ujjain Yatra</h1>
                <p class="tagline">Sacred • Spiritual • Meaningful</p>
            </div>
            <div class="content">
                <div class="welcome-section">
                    <div class="welcome-icon">🕉️</div>
                    <h2 class="welcome-title">Email Verification Required</h2>
                    <p class="welcome-text">Welcome to Ujjain Yatra! Please verify your email address using the verification code below to complete your account setup and begin your spiritual journey.</p>
                </div>
                <div class="otp-section">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-helper">Enter this code in the verification form</div>
                </div>
                <div class="warning-box">
                    <div class="warning-icon">⏰</div>
                    <div class="warning-content">
                        <h4>Time Sensitive</h4>
                        <p>This verification code expires in <strong>10 minutes</strong>. If expired, please request a new code from the application.</p>
                    </div>
                </div>
                <div class="cta-section">
                    <a href="#" class="cta-button">Complete Verification →</a>
                    <div class="help-text">Having trouble? Contact our support team for assistance</div>
                </div>
                <div class="security-notice">
                    <div class="security-icon">🛡️</div>
                    <div class="security-content">
                        <h4>Security Notice</h4>
                        <p>If you didn't create an account with Ujjain Yatra, please ignore this email. No account has been created and no further action is required.</p>
                    </div>
                </div>
            </div>
            <div class="footer">
                <div class="footer-content">
                    <h3 class="footer-title">Need Assistance?</h3>
                    <p class="footer-subtitle">Our support team is ready to help you with your spiritual journey</p>
                    <div class="footer-links">
                        <a href="mailto:support@ujjainyatra.com" class="footer-link">📧 Email Support</a>
                        <a href="#" class="footer-link">🌐 Visit Website</a>
                        <a href="#" class="footer-link">Contact Us</a>
                    </div>
                    <div class="footer-divider"></div>
                    <div class="footer-bottom">
                        <p>© 2024 Ujjain Yatra. All rights reserved.</p>
                        <p>This email was sent to ${email} • <a href="#">Privacy Policy</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

  const mailOptions = {
    from: `"Ujjain Yatra" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "🕉️ Email Verification Code - Ujjain Yatra",
    html,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send SOS Emergency Email to Admin
 */
export const sendSOSEmail = async (adminEmail, sosData) => {
    const { user, location, nearbyServices } = sosData;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
    const logoUrl = "https://img.freepik.com/premium-vector/sadhu-sitting-meditating-isolated_1076263-601.jpg?w=740";

    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>SOS Dispatch</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; padding: 40px 0;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 32px; overflow: hidden; border-collapse: collapse; box-shadow: 0 40px 100px rgba(0,0,0,0.5);">
                    <!-- Brand Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 60px 40px; border-bottom: 8px solid #991b1b;">
                            <div style="background: #ffffff; color: #ef4444; padding: 8px 18px; border-radius: 50px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; display: inline-block; margin-bottom: 25px;">Active Emergency</div>
                            <div style="width: 100px; height: 100px; background: rgba(255,255,255,0.15); border-radius: 50%; padding: 5px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.3);">
                                <img src="${logoUrl}" alt="Ujjain Yatra Logo" width="100" height="100" style="display: block; border-radius: 50%; object-fit: cover;" />
                            </div>
                            <h1 style="margin: 0; font-size: 34px; font-weight: 900; color: #ffffff; letter-spacing: -1.5px; text-transform: uppercase;">COMMAND CENTER</h1>
                            <p style="margin: 10px 0 0; font-size: 14px; font-weight: 600; color: #ffffff; opacity: 0.8; letter-spacing: 1px;">SOS DISPATCH PROTOCOL ALPHA-3</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <!-- Pilgrim Profile -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 2px solid #fee2e2; border-radius: 24px; padding: 24px; margin-bottom: 30px;">
                                <tr>
                                    <td width="60" style="vertical-align: middle;">
                                        <div style="width: 60px; height: 60px; background-color: #ef4444; border-radius: 18px; line-height: 60px; text-align: center; color: #ffffff; font-size: 24px; font-weight: 900;">${(user.name || "P").charAt(0)}</div>
                                    </td>
                                    <td style="padding-left: 20px; vertical-align: middle;">
                                        <h3 style="margin: 0; font-size: 20px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px;">${user.name || "Unknown Pilgrim"}</h3>
                                        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 1.5px;">${user.userType || 'Pilgrim'} Security Alert</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Contact Grid -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;">
                                        <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Primary Mobile</span>
                                        <span style="font-size: 14px; font-weight: 700; color: #1e293b; display: block;">${user.phone || "Not Provided"}</span>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;">
                                        <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Verified Email</span>
                                        <span style="font-size: 14px; font-weight: 700; color: #1e293b; display: block;">${user.email || "Not Provided"}</span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Satellite Position -->
                            <div style="background-color: #000000; color: #38bdf8; padding: 30px; border-radius: 20px; font-family: 'Courier New', Courier, monospace; font-size: 14px; border: 1px solid rgba(56,189,248,0.3); line-height: 1.6;">
                                <span style="color: #0ea5e9; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">LIVE SATLOCK COORDINATES</span><br/>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="color: #38bdf8; margin-top: 10px;">
                                    <tr><td width="40" style="font-weight: 900;">LAT:</td><td>${location.lat}</td></tr>
                                    <tr><td width="40" style="font-weight: 900;">LNG:</td><td>${location.lng}</td></tr>
                                    <tr><td width="40" style="font-weight: 900;">STS:</td><td>Precise Lock (± 5m)</td></tr>
                                </table>
                            </div>

                            <!-- Track Action Button -->
                            <div style="padding: 40px 0 0;">
                                <a href="${googleMapsUrl}" style="display: block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 22px; border-radius: 20px; text-align: center; font-weight: 900; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 15px 30px rgba(30,41,59,0.3);">📍 Tracking: Reach Pilgrim</a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #1e293b; padding: 40px; color: #94a3b8;">
                            <span style="font-size: 18px; font-weight: 900; color: #ffffff; display: block; margin-bottom: 8px; letter-spacing: 1px;">DIVINE YATRA</span>
                            <p style="margin: 0; font-size: 12px; font-weight: 600;">Automated Security Dispatcher • Mission Control</p>
                            <div style="margin-top: 25px; font-size: 10px; opacity: 0.5;">© 2024 Command and Control • Emergency System Protocol Alpha</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const mailOptions = {
        from: `"🚨 COMMAND CENTER" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🚨 EMERGENCY: SOS Alert from ${user.name} - ACTION REQUIRED`,
        html,
        priority: 'high'
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Send reset password email to client
 * @param {string} email - Client's email address
 * @param {string} resetToken - JWT reset token
 */
export const sendResetPasswordEmail = async (email, resetToken) => {
  const mailOptions = {
    from: `"Ujjain Yatra" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Ujjain Yatra Password",
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - Ujjain Yatra</title>
        <style>
            body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);margin:0;padding:20px}
            .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.25)}
            .header{background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:40px 30px;text-align:center;color:#fff}
            .content{padding:40px 30px}
            .button{display:inline-block;background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);color:#fff;text-decoration:none;padding:16px 32px;border-radius:50px;font-weight:600;margin:20px 0}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Ujjain Yatra</h1>
                <p>Password Reset Request</p>
            </div>
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password for your Ujjain Yatra account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="http://yourdomain.com/reset?token=${resetToken}" class="button">Reset Password</a>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>This link will expire in 1 hour for security purposes.</p>
            </div>
        </div>
    </body>
    </html>`,
  };
  await transporter.sendMail(mailOptions);
};

const stayMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

async function staySend(to, subject, html) {
  if (!stayMailConfigured() || !to) return;
  await transporter.sendMail({
    from: `"Divya Yatra Stays" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

/** New Pending booking: notify owner (request) and traveler (submitted). */
export const sendStayNewBookingEmails = async ({ listing, room, booking, owner, pilgrim, guestEmail, guestName }) => {
  const travelerEmail = pilgrim?.email || guestEmail;
  const travelerLabel = pilgrim?.name || guestName || "Traveler";
  const ownerHtml = `<p>You have a new <strong>stay booking request</strong> for <strong>${listing.propertyName}</strong>.</p>
    <ul><li>Guest: ${travelerLabel}</li><li>Phone: ${booking.contactPhone}</li><li>Room: ${room.roomType}</li>
    <li>Check-in: ${booking.checkInDate}</li><li>Check-out: ${booking.checkOutDate}</li><li>Rooms: ${booking.roomsBooked}</li><li>Booking #${booking.stay_booking_id}</li></ul>
    <p>Please confirm or contact the guest in your host dashboard.</p>`;
  const travelerHtml = `<p>Your booking request for <strong>${listing.propertyName}</strong> has been <strong>submitted</strong> (reference #${booking.stay_booking_id}).</p>
    <p>Status: <strong>Pending</strong> until the host confirms.</p>
    <ul><li>Room: ${room.roomType}</li><li>Check-in: ${booking.checkInDate}</li><li>Check-out: ${booking.checkOutDate}</li></ul>
    <p>Host phone: <strong>${listing.ownerContact}</strong></p>`;
  if (owner?.email) await staySend(owner.email, `New booking request — ${listing.propertyName}`, ownerHtml).catch(() => {});
  if (travelerEmail) await staySend(travelerEmail, `Booking submitted — ${listing.propertyName}`, travelerHtml).catch(() => {});
};

export const sendStayConfirmedEmail = async ({ listing, booking, travelerEmail }) => {
  const html = `<p>Your stay at <strong>${listing.propertyName}</strong> is <strong>confirmed</strong>.</p>
    <p>Booking #${booking.stay_booking_id} · ${booking.checkInDate} → ${booking.checkOutDate}</p>
    <p>Host: ${listing.ownerContact}</p>`;
  if (travelerEmail) await staySend(travelerEmail, `Stay confirmed — ${listing.propertyName}`, html).catch(() => {});
};

export const sendStayCancellationEmails = async ({ listing, booking, owner, pilgrim, guestEmail }) => {
  const subj = `Booking cancelled — ${listing?.propertyName || "Stay"}`;
  const body = `<p>Booking #${booking.stay_booking_id} has been cancelled.</p><p>${booking.checkInDate} → ${booking.checkOutDate}</p>`;
  const tEmail = pilgrim?.email || guestEmail;
  if (tEmail) await staySend(tEmail, subj, body).catch(() => {});
  if (owner?.email) await staySend(owner.email, subj, body).catch(() => {});
};

/** Call from cron (e.g. daily) for check-in tomorrow */
export const sendStayCheckInReminderEmails = async ({ listing, booking, owner, pilgrim, guestEmail }) => {
  const subj = `Reminder: check-in tomorrow — ${listing?.propertyName || "Your stay"}`;
  const body = `<p>Reminder: check-in on <strong>${booking.checkInDate}</strong> at <strong>${listing?.propertyName || ""}</strong>.</p><p>Host: ${listing?.ownerContact || ""}</p>`;
  const tEmail = pilgrim?.email || guestEmail;
  if (tEmail) await staySend(tEmail, subj, body).catch(() => {});
  if (owner?.email) await staySend(owner.email, `Guest check-in tomorrow — ${listing?.propertyName}`, body).catch(() => {});
};
