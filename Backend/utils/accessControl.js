export const isAdminUser = (user) => user?.userType === "Admin";
export const isStayOwner = (user) => user?.userType === "StayOwner";
export const isVerifiedStayHost = (user) => Boolean(user?.stayHostVerified);

export const canManageStays = (user) => isVerifiedStayHost(user);

export const stayVisibilityStatus = (stay) => {
  if (!stay) return "unknown";
  if (!stay.isActive) return "inactive";
  if (!stay.isApproved) return "pending";
  return "live";
};
