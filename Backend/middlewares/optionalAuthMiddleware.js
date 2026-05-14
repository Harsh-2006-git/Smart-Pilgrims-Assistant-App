import jwt from "jsonwebtoken";

/** Sets req.user from JWT when present and valid; otherwise req.user is null (no 401). */
export default function optionalAuth(req, res, next) {
    req.user = null;
    const authHeader = req.header("Authorization");
    if (!authHeader) return next();
    const token = authHeader.includes("Bearer ") ? authHeader.replace(/Bearer\s+/i, "").trim() : authHeader.trim();
    if (!token) return next();
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        req.user = null;
    }
    next();
}
