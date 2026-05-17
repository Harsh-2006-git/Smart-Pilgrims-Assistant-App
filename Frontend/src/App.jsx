import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import AIAssistantPage from "./pages/AIAssistantPage";
import AIAssistant from "./components/AIAssistant";
import NearbyServices from "./pages/NearbyServices";
import ChatbotPage from "./pages/ChatbotPage";
import ScrollToTop from "./components/ScrollToTop";
import AlertBanner from "./components/AlertBanner";
import TrackingPage from "./pages/TrackingPage";
import FollowMePage from "./pages/FollowMe";
import FamilyMode from "./pages/FamilyMode";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
          console.warn("Session expired. Logging out.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
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
        <Route path="/lostFound" element={<LostAndFound />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/density" element={<Density />} />
        <Route path="/crowd-detection" element={<CrowdDetector />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/crowd-simulation" element={<CrowdSimulation />} />

        <Route path="/parking" element={<ParkingMarketplace />} />
        <Route path="/parking/:id" element={<ListingDetails />} />
        <Route path="/parking/host" element={<ParkingHost />} />
        <Route path="/parking/my-bookings" element={<MyBookings />} />
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
