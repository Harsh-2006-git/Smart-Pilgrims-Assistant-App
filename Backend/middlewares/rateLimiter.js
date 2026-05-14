import rateLimit from "express-rate-limit";

// Global rate limiter to prevent general DDoS
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes."
    }
});

// Stricter rate limiter for sensitive routes like auth (login/register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 requests per 15 minutes for auth routes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts from this IP, please try again after 15 minutes."
    }
});

// Stricter rate limiter for SOS/Emergency to prevent spam but ensure availability
export const sosLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 SOS requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "SOS endpoint rate limit exceeded to prevent spam. Please contact authorities directly if in immediate danger."
    }
});
