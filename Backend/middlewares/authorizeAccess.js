import Client from "../models/client.js";
import { canManageStays, isAdminUser } from "../utils/accessControl.js";

const deny = (res, message) => res.status(403).json({ message });

const refreshUserAccess = async (req) => {
  if (!req.user?.client_id) {
    return null;
  }

  const client = await Client.findByPk(req.user.client_id, {
    attributes: ["client_id", "userType", "stayHostVerified"],
  });

  if (!client) {
    return null;
  }

  req.user = {
    ...req.user,
    userType: client.userType,
    stayHostVerified: client.stayHostVerified,
  };

  return client;
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.client_id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await refreshUserAccess(req);

    if (!isAdminUser(req.user)) {
      return deny(res, "Administrator access required");
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify admin access" });
  }
};

export const requireStayManager = async (req, res, next) => {
  try {
    if (!req.user?.client_id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await refreshUserAccess(req);

    if (!canManageStays(req.user)) {
      return deny(res, "Verified stay host access required");
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify stay host access" });
  }
};

export const requireRole = (roles) => async (req, res, next) => {
  try {
    if (!req.user?.client_id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await refreshUserAccess(req);

    const userRole = req.user.userType;
    const hasRole = roles.includes(userRole) || isAdminUser(req.user);

    if (!hasRole) {
      return deny(res, `Access denied. Authorized roles: ${roles.join(", ")}`);
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify role permissions" });
  }
};
