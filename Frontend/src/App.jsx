import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Auth from "./pages/auth";
import Home from "./pages/index1";
import LostAndFound from "./pages/LostAndFound";
import LiveDarshan from "./pages/LiveDarshan";
import ProtectedRoute from "./components/PrivateRoute";
import ProfilePage from "./pages/profile";
import Ticket from "./pages/ticket";
import Density from "./pages/density";
import CrowdDetector from "./pages/CrowdDetector";
import MapPage from "./pages/MapPage";
import AdminPage from "./pages/AdminPage";
import CrowdSimulation from "./pages/CrowdSimulation";

import ParkingMarketplace from "./pages/Parking/ParkingMarketplace";
import ListingDetails from "./pages/Parking/ListingDetails";
import ParkingHost from "./pages/Parking/ParkingHost";
import MyBookings from "./pages/Parking/MyBookings";
import StayMarketplace from "./pages/Stays/StayMarketplace";
import StayDetails from "./pages/Stays/StayDetails";
import StayHost from "./pages/Stays/StayHost";
import StayBookings from "./pages/Stays/StayBookings";
import AIAssistantPage from "./pages/AIAssistantPage";
import AIAssistant from "./components/AIAssistant";
import NearbyServices from "./pages/NearbyServices";
import ChatbotPage from "./pages/ChatbotPage";
import ScrollToTop from "./components/ScrollToTop";
import AlertBanner from "./components/AlertBanner";
import TrackingPage from "./pages/TrackingPage";
import FollowMePage from "./pages/FollowMe";
import FamilyMode from "./pages/FamilyMode";
import StayOwnerDashboard from "./pages/Stays/Owner/StayOwnerDashboard";
import StayOwnerBookings from "./pages/Stays/Owner/StayOwnerBookings";
import StayAdminPanel from "./pages/Stays/Admin/StayAdminPanel";


function App() {
  // Synchronously check for token on initial render so ProtectedRoute
  // doesn't flash-redirect to /auth before useEffect runs.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const base64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
      }
      return true;
    } catch {
      // Token exists but can't be decoded client-side — trust the backend.
      return true;
    }
  });
  const location = useLocation();

  // Keep checking token validity on mount (covers edge cases like
  // token being removed by another tab).
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        if (payload.exp * 1000 < Date.now()) {
          console.warn("Session expired. Logging out.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(true);
      }
    }
  }, []);

  return (
    <div className="app">
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <Auth setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route path="/live-darshan" element={<LiveDarshan />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/lost-and-found" element={<LostAndFound />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/density" element={<Density />} />
        <Route path="/crowd-detection" element={<CrowdDetector />} />
        <Route path="/map" element={<MapPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={["Admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/crowd-simulation" element={<CrowdSimulation />} />

        <Route path="/parking" element={<ParkingMarketplace />} />
        <Route path="/parking/:id" element={<ListingDetails />} />
        <Route path="/parking/host" element={<ParkingHost />} />
        <Route path="/parking/my-bookings" element={<MyBookings />} />
        
        {/* SacredStay - Integrated Role-Based Routing */}
        <Route path="/stays" element={<StayMarketplace />} />
        <Route path="/stays/:id" element={<StayDetails />} />
        <Route
          path="/stays/my-bookings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <StayBookings />
            </ProtectedRoute>
          }
        />

        {/* SacredStay - Owner Management Routes */}
        <Route
          path="/owner/stays"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <StayOwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/stays/bookings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <StayOwnerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/stays/new"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <StayHost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/stays/:id/edit"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <StayHost />
            </ProtectedRoute>
          }
        />
        
        {/* Legacy/Redirect Routes */}
        <Route path="/stays/host" element={<Navigate to="/owner/stays/new" replace />} />

        {/* SacredStay - Admin Routes */}
        <Route
          path="/admin/stays"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={["Admin"]}>
              <StayAdminPanel />
            </ProtectedRoute>
          }
        />

        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/nearby" element={<NearbyServices />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/guardian-panel" element={<FollowMePage />} />
        <Route path="/family-mode" element={<FamilyMode />} />

        {/* Catch-all route at the very bottom */}
        <Route path="*" element={<Navigate to="/auth" />} />

      </Routes>
      {location.pathname !== '/auth' && <AlertBanner />}
    </div>
  );
}

export default App;
