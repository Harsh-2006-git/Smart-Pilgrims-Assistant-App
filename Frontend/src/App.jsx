import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Auth from "./pages/auth";
import LandingPage from "./pages/LandingPage";
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
import StayDetail from "./pages/Stays/StayDetail";
import StayHost from "./pages/Stays/StayHost";
import MyStayBookings from "./pages/Stays/MyStayBookings";
import StayBookingLookup from "./pages/Stays/StayBookingLookup";
import AIAssistantPage from "./pages/AIAssistantPage";
import AIAssistant from "./components/AIAssistant";
import NearbyServices from "./pages/NearbyServices";
import ChatbotPage from "./pages/ChatbotPage";
import ScrollToTop from "./components/ScrollToTop";
import AlertBanner from "./components/AlertBanner";
import TrackingPage from "./pages/TrackingPage";
import FollowMePage from "./pages/FollowMe";
import FamilyMode from "./pages/FamilyMode";

const getValidSession = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Invalid token:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getValidSession);
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(getValidSession());
  }, [location.pathname]);

  const protect = (children) => (
    <ProtectedRoute isAuthenticated={isAuthenticated}>{children}</ProtectedRoute>
  );

  return (
    <div className="app">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <Auth setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/home" element={protect(<Home />)} />
        <Route path="/profile" element={protect(<ProfilePage />)} />

        <Route path="/live-darshan" element={<LiveDarshan />} />
        <Route path="/lost-and-found" element={<LostAndFound />} />
        <Route path="/density" element={<Density />} />
        <Route path="/crowd-detection" element={<CrowdDetector />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/crowd-simulation" element={<CrowdSimulation />} />

        <Route path="/ticket" element={protect(<Ticket />)} />
        <Route path="/parking" element={<ParkingMarketplace />} />
        <Route path="/parking/host" element={protect(<ParkingHost />)} />
        <Route path="/parking/my-bookings" element={protect(<MyBookings />)} />
        <Route path="/parking/:id" element={protect(<ListingDetails />)} />

        <Route path="/stays" element={<StayMarketplace />} />
        <Route path="/stays/host" element={protect(<StayHost />)} />
        <Route path="/stays/my-bookings" element={protect(<MyStayBookings />)} />
        <Route path="/stays/booking-lookup" element={<StayBookingLookup />} />
        <Route path="/stays/booking-status" element={<StayBookingLookup />} />
        <Route path="/stays/:id" element={protect(<StayDetail />)} />

        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/nearby" element={<NearbyServices />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/follow-me" element={<FollowMePage />} />
        <Route path="/guardian-panel" element={<FollowMePage />} />
        <Route path="/family-mode" element={<FamilyMode />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname !== "/auth" && <AlertBanner />}
    </div>
  );
}

export default App;
