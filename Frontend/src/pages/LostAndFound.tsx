import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  MapPin,
  Clock,
  Trash2,
  Upload,
  FileSearch,
  History,
  Info,
  Sparkles,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_V1, resolveMediaUrl } from "../config/api";

interface LostItem {
  id: number;
  title: string;
  description: string;
  status: "lost" | "found";
  reportedByEmail: string;
  reportedByPhone: string;
  image?: string;
  uploadedAt: string;
}

interface FormDataType {
  title: string;
  description: string;
  status: "lost" | "found";
}

interface ZoneHistory {
  participant: string;
  last_zone: string | null;
  current_zone: string;
  enter_time: string;
  leave_time: string | null;
  duration_spent: number | null;
  latitude?: number | null;
  longitude?: number | null;
  tracking_type?: 'Terminal Scan' | 'Live GPS Ping';
}

interface LocationTrackingData {
  client_id: string;
  history: ZoneHistory[];
}

const LostAndFound: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"lost-found" | "location-tracking">("lost-found");

  // Lost & Found States
  const [items, setItems] = useState<LostItem[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    status: "lost",
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Location Tracking States
  const [trackingMode, setTrackingMode] = useState<"own" | "other" | null>(null);
  const [searchInput, setSearchInput] = useState({ email: "", phone: "" });
  const [locationHistory, setLocationHistory] = useState<LocationTrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const BASE_URL = API_V1;

  // Fetch lost items
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BASE_URL}/lost/get`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to fetch items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch zone history
  const fetchZoneHistory = async () => {
    try {
      setTrackingLoading(true);
      setTrackingError(null);

      const token = localStorage.getItem("token");
      const requestData: any = {};

      if (trackingMode === "other") {
        if (searchInput.email) requestData.email = searchInput.email;
        if (searchInput.phone) requestData.phone = searchInput.phone;
      }

      const config: any = {
        method: "GET",
        url: `${BASE_URL}/zone/history`,
      };

      if (trackingMode === "own" && token) {
        config.headers = { Authorization: `Bearer ${token}` };
        config.params = { type: 'self' };
      } else if (trackingMode === "other") {
        config.method = "POST";
        config.data = requestData;
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
      }

      const res = await axios(config);
      setLocationHistory(res.data);
      
      if (res.data.history && res.data.history.length > 0) {
        setTimeout(() => initMap(res.data.history), 100);
      }
    } catch (err) {
      console.error("Error fetching zone history:", err);
      setTrackingError("No location history found for this devotee.");
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "lost-found") {
      fetchItems();
    }
  }, [activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("status", formData.status);
    if (image) data.append("image", image);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/lost/upload`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData({ title: "", description: "", status: "lost" });
      setImage(null);
      setSuccess("Your report has been successfully added to the Seva List.");
      setTimeout(() => setSuccess(null), 5000);
      await fetchItems();
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const initMap = (history: ZoneHistory[]) => {
    if (!mapRef.current) return;

    const coords: [number, number][] = history
      .filter(h => h.latitude && h.longitude && h.latitude !== 0)
      .map(h => [h.latitude!, h.longitude!]);

    if (!mapInstance.current) {
      // Use the last coordinate as the center if available, otherwise Ujjain
      const center: [number, number] = coords.length > 0 ? coords[coords.length - 1] : [23.1765, 75.7849];
      mapInstance.current = L.map(mapRef.current).setView(center, 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    // Clear old layers
    if (polylineRef.current) polylineRef.current.remove();
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (coords.length > 0) {
      polylineRef.current = L.polyline(coords, { color: '#f97316', weight: 5, opacity: 0.7 }).addTo(mapInstance.current);
      
      // Add markers for each point
      coords.forEach((c, i) => {
        const marker = L.circleMarker(c, {
          radius: i === coords.length - 1 ? 8 : 4,
          fillColor: i === coords.length - 1 ? '#ef4444' : '#f97316',
          color: '#fff',
          weight: 2,
          fillOpacity: 1
        }).addTo(mapInstance.current!);
        
        marker.bindPopup(`<b>Point ${i + 1}</b><br>${history[i].current_zone}<br>${history[i].enter_time}`);
        markersRef.current.push(marker as any);
      });

      // Fit bounds and zoom in on the latest point
      mapInstance.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to wipe your entire movement history? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/zone/history/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocationHistory(null);
      setSuccess("Your journey path has been reset successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Clear History Error:", err);
      setError("Failed to clear history.");
    }
  };

  const resetTrackingForm = () => {
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    setTrackingMode(null);
    setSearchInput({ email: "", phone: "" });
    setLocationHistory(null);
    setTrackingError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-jakarta">
      <Header />

      {/* Hero Section */}
      <div className="pt-20 pb-4 md:pt-28 md:pb-10 px-4 md:px-6 text-center bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 mb-2 md:mb-3 animate-fade-in-up">
            <Sparkles size={12} className="md:w-3.5 md:h-3.5" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Compassionate Devotee Seva</span>
          </div>
          <h1 className="text-xl md:text-4xl font-black mb-2 md:mb-3 leading-tight text-gray-900">
            {activeTab === "lost-found" ? (
              <>Lost & Found <span className="text-orange-600">Seva List</span></>
            ) : (
              <>Location & Time <span className="text-orange-600">Tracking</span></>
            )}
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto mb-4 md:mb-6 leading-relaxed px-2">
            {activeTab === "lost-found"
              ? "Helping devotees reconnect with their belongings through spiritual unity and AI assistance."
              : "Locate your loved ones or track your own spiritual path through the sacred temple zones."
            }
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent w-full"></div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12 w-full flex-grow">

        {/* Tab Switcher */}
        <div className="mb-6 md:mb-10 flex justify-center">
          <div className="inline-flex bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-1 gap-1">
            <button
              onClick={() => setActiveTab("lost-found")}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold transition-all duration-300 text-[11px] md:text-xs uppercase tracking-wide ${activeTab === "lost-found"
                ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <FileSearch size={14} className="md:w-4 md:h-4" />
              Lost & Found
            </button>
            <button
              onClick={() => setActiveTab("location-tracking")}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold transition-all duration-300 text-[11px] md:text-xs uppercase tracking-wide ${activeTab === "location-tracking"
                ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <MapPin size={14} className="md:w-4 md:h-4" />
              Tracking
            </button>
          </div>
        </div>

        {/* STATUS MESSAGES */}
        {error && (
          <div className="max-w-5xl mx-auto mb-8 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 font-bold text-sm animate-fade-in">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className="max-w-5xl mx-auto mb-8 bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-600 font-bold text-sm animate-fade-in">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {activeTab === "lost-found" ? (
          <div className="space-y-12">
            {/* ADD ITEM FORM */}
            <div className="max-w-5xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
              <div className="bg-slate-900 p-4 md:p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 md:gap-3">
                  <Upload className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />
                  <h2 className="text-sm md:text-xl font-bold">Report Lost/Found Item</h2>
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase opacity-60">Devotee Portal</span>
              </div>

              <form onSubmit={handleSubmit} className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:ml-2">Item Title</label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      type="text"
                      placeholder="What was lost or found?"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:ml-2">Short Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Any identifying marks, color, brand..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800 resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:ml-2">Report Status</label>
                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border-2 border-slate-100">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'lost' })}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${formData.status === 'lost' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}
                      >
                        Lost Item
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'found' })}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${formData.status === 'found' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}
                      >
                        Found Item
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:ml-2">Item Photograph (Optional)</label>
                    <div className="relative group/upload">
                      <input
                        type="file"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        accept="image/*"
                      />
                      <div className="w-full py-10 bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover/upload:bg-orange-100/50 transition-all">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-orange-500 shadow-sm">
                          {image ? <CheckCircle size={24} /> : <Upload size={24} />}
                        </div>
                        <span className="text-xs font-bold text-orange-600">
                          {image ? image.name : "Click or drag to upload"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Submit to Seva List"}
                  </button>
                </div>
              </form>
            </div>

            {/* ITEMS LIST */}
            <div className="max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Active <span className="text-orange-600">Reports</span></h2>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase text-slate-500">Live Sync</span>
                </div>
              </div>

              {loading && items.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <History size={40} className="text-orange-200 animate-spin" />
                  <p className="font-bold text-slate-400">Syncing Seva data...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <Info size={40} className="text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400">No active reports found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <div key={item.id} className="group bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col">
                      <div className="relative w-full h-64 bg-slate-50 flex items-center justify-center p-2">
                        {item.image ? (
                          <img
                            src={resolveMediaUrl(`/uploads/${item.image}`)}
                            alt={`Photograph of ${item.title}`}
                            className="max-w-full max-h-full object-contain drop-shadow-md rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl m-2">
                            <Info size={48} strokeWidth={1} />
                            <span className="text-[10px] font-black uppercase mt-2">No Photo Provided</span>
                          </div>
                        )}
                        <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10 ${item.status === 'lost' ? 'bg-rose-500 text-white' : 'bg-green-500 text-white'}`}>
                          {item.status}
                        </div>
                      </div>

                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-orange-600 transition-colors">{item.title}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-3 leading-relaxed">{item.description}</p>

                        <div className="mt-auto space-y-3">
                          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail size={12} />
                              <span className="text-[10px] font-black uppercase tracking-tighter truncate">{item.reportedByEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Phone size={12} />
                              <span className="text-[10px] font-black uppercase tracking-tighter">{item.reportedByPhone}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">
                            <span>Reported On:</span>
                            <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LOCATION TRACKING CONTENT */
          <div className="max-w-4xl mx-auto space-y-8">

            {!trackingMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setTrackingMode("own")}
                  className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border-2 border-slate-50 hover:border-orange-500 transition-all group text-center"
                >
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-600 group-hover:-translate-y-2 transition-all shadow-xl">
                    <User size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">My Journey Path</h3>
                  <p className="text-sm text-slate-400 font-medium">View your personal movement history within temple zones.</p>
                </button>

                <button
                  onClick={() => setTrackingMode("other")}
                  className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border-2 border-slate-50 hover:border-orange-500 transition-all group text-center"
                >
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-600 group-hover:-translate-y-2 transition-all shadow-xl">
                    <Search size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Locate Someone</h3>
                  <p className="text-sm text-slate-400 font-medium">Search for a devotee's location history by contact details.</p>
                </button>
              </div>
            ) : !locationHistory ? (
              /* SEARCH / LOAD FORM */
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
                <div className="bg-slate-900 p-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    {trackingMode === "own" ? "Personal Tracking History" : "Find Devotee Path"}
                  </h2>
                  <button onClick={resetTrackingForm} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">← Back</button>
                </div>

                <div className="p-8">
                  {trackingMode === "other" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:ml-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input
                            value={searchInput.email}
                            onChange={(e) => setSearchInput({ ...searchInput, email: e.target.value, phone: "" })}
                            type="email"
                            placeholder="devotee@example.com"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:ml-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input
                            value={searchInput.phone}
                            onChange={(e) => setSearchInput({ ...searchInput, phone: e.target.value, email: "" })}
                            type="tel"
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={fetchZoneHistory}
                    disabled={trackingLoading || (trackingMode === 'other' && !searchInput.email && !searchInput.phone)}
                    className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {trackingLoading ? "Retrieving Coordinates..." : (trackingMode === 'own' ? "Access My Path" : "Search Location")}
                  </button>

                  {trackingError && (
                    <p className="mt-4 text-center text-xs font-bold text-rose-500">{trackingError}</p>
                  )}
                </div>
              </div>
            ) : (
              /* HISTORY RESULTS */
              <div className="space-y-8 animate-slide-up">
                <div className="flex items-center justify-between mb-4 bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 md:gap-4 text-slate-800">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                      <History size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-black uppercase tracking-tight">Zone History Result</h3>
                      <p className="text-xs font-bold text-slate-400">Devotee Log: <span className="text-slate-900">#{locationHistory.client_id}</span></p>
                    </div>
                  </div>
                  <button onClick={resetTrackingForm} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">New Search</button>
                </div>

                {locationHistory.history.some(h => h.latitude && h.longitude) && (
                  <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-2 md:p-3 shadow-xl border border-gray-100 mb-8 overflow-hidden transform transition-all hover:shadow-2xl">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 min-w-[40px] h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Visual Breadcrumb Path</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time GPS Coordinate Movement</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">Map Active</span>
                      </div>
                    </div>
                    <div ref={mapRef} className="w-full h-[400px] rounded-[1.5rem] z-0 overflow-hidden shadow-inner border border-gray-50" />
                    {trackingMode === "own" && (
                    <div className="p-4 flex justify-end">
                      <button 
                        onClick={clearHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={12} /> Wipe Journey History
                      </button>
                    </div>
                    )}
                  </div>
                )}

                <div className="space-y-12">
                  {/* Automatic History Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                        Background Location Insights (Last 10 detected)
                    </h3>
                    <div className="overflow-x-auto rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-xl bg-white hide-scrollbar">
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                          <tr>
                            <th className="px-6 py-6 rounded-tl-[2rem]">Participant</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Last Zone</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Current Zone / GPS</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Enter Time</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Leave Time</th>
                            <th className="px-6 py-6 rounded-tr-[2rem] text-center font-black uppercase tracking-widest text-[9px]">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {locationHistory.history.filter(r => r.tracking_type === 'Live GPS Ping').length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest">
                                No Automatic Movement Detected
                              </td>
                            </tr>
                          ) : (
                            locationHistory.history
                              .filter(record => record.tracking_type === 'Live GPS Ping')
                              .slice(-10)
                              .reverse()
                              .map((record, idx) => (
                              <tr key={idx} className="hover:bg-orange-50/50 transition-colors group">
                                <td className="px-6 py-6 border-l-4 border-transparent group-hover:border-orange-500 transition-all">
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-800 text-sm italic group-hover:not-italic transition-all">
                                      {record.participant || "Devotee"}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Automatic GPS</span>
                                  </div>
                                </td>

                                <td className="px-6 py-6">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">online location tracked</span>
                                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Ping Signal 📡</span>
                                  </div>
                                </td>

                                <td className="px-6 py-6 text-xs text-slate-500 font-bold">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[9px] font-black text-indigo-700">LAT: {record.latitude?.toFixed(5)}</span>
                                       <span className="text-[9px] font-black text-indigo-700">LNG: {record.longitude?.toFixed(5)}</span>
                                    </div>
                                </td>

                                <td className="px-6 py-6 text-xs font-black text-slate-500">{record.enter_time}</td>
                                <td className="px-6 py-6">--</td>
                                <td className="px-6 py-6 text-center font-black text-slate-300 text-[10px] uppercase tracking-widest italic">Nil-Ping</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Official Record Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                        Sacred Zone Registrations (Via QR Scans)
                    </h3>
                    <div className="overflow-x-auto rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-xl bg-white hide-scrollbar">
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                          <tr>
                            <th className="px-6 py-6 rounded-tl-[2rem]">Participant</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Last Zone</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Current Zone</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Enter Time</th>
                            <th className="px-6 py-6 font-black uppercase tracking-widest text-[9px]">Leave Time</th>
                            <th className="px-6 py-6 rounded-tr-[2rem] text-center font-black uppercase tracking-widest text-[9px]">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic-last-row">
                          {locationHistory.history.filter(r => r.tracking_type !== 'Live GPS Ping' && r.current_zone !== 'Exit Point').length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">
                                No Official Scans Found.
                              </td>
                            </tr>
                          ) : (
                            locationHistory.history
                              .filter(record => record.tracking_type !== 'Live GPS Ping' && record.current_zone !== 'Exit Point')
                              .reverse()
                              .map((record, idx) => (
                              <tr key={idx} className="hover:bg-orange-50/50 transition-colors group">
                                <td className="px-6 py-6 border-l-4 border-transparent group-hover:border-orange-500 transition-all">
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-800 text-sm italic group-hover:not-italic transition-all">
                                      {record.participant || "Devotee"}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">QR Registered Scan</span>
                                  </div>
                                </td>

                                <td className="px-6 py-6">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{record.last_zone || 'Entry Gate'}</span>
                                </td>

                                <td className="px-6 py-6">
                                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-black text-[10px] uppercase shadow-lg shadow-orange-600/20 transition-transform group-hover:scale-105">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
                                    {record.current_zone}
                                  </div>
                                </td>

                                <td className="px-6 py-6 text-xs font-black text-slate-500">{record.enter_time}</td>

                                <td className="px-6 py-6">
                                  {record.leave_time ? (
                                    <span className="text-xs font-black text-slate-500">{record.leave_time}</span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-widest border border-emerald-200">Currently In</span>
                                  )}
                                </td>

                                <td className="px-6 py-6 text-center">
                                  {record.duration_spent ? (
                                    <span className="font-black text-slate-800 text-sm">
                                      {formatDuration(record.duration_spent)}
                                    </span>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0, 0, 0.2, 1) forwards; }
        .animate-fade-in-up { animation: slide-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LostAndFound;
