import { Navigate } from "react-router-dom";
import { getStoredUser } from "../utils/access";

const ProtectedRoute = ({ isAuthenticated, children, allowedRoles }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const user = getStoredUser();
  if (allowedRoles?.length && !allowedRoles.includes(user?.userType)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
