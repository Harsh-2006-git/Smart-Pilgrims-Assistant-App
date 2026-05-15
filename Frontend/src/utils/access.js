export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const isAdminUser = (user) => user?.userType === "Admin";
export const isStayOwner = (user) => user?.userType === "StayOwner";

export const hasStayHostAccess = (user) => Boolean(user?.stayHostVerified);

// StayOwner/stayHostVerified users who are NOT admins — they use the owner dashboard
export const isStayManager = (user) =>
  !isAdminUser(user) && (isStayOwner(user) || hasStayHostAccess(user));

export const canModerateStays = (user) => isAdminUser(user);

export const getStayListingStatusMeta = (stay) => {
  if (!stay?.isActive) {
    return {
      key: "inactive",
      label: "Inactive",
      className: "bg-slate-100 text-slate-600",
    };
  }

  switch (stay?.moderationStatus) {
    case "Approved":
      return {
        key: "live",
        label: "Live",
        className: "bg-emerald-50 text-emerald-600",
      };
    case "Rejected":
      return {
        key: "rejected",
        label: "Rejected",
        className: "bg-red-50 text-red-600",
      };
    case "Suspended":
      return {
        key: "suspended",
        label: "Suspended",
        className: "bg-amber-50 text-amber-600",
      };
    case "Pending":
    default:
      return {
        key: "pending",
        label: "Pending Review",
        className: "bg-blue-50 text-blue-600",
      };
  }
};
