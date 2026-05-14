import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
    MapPin,
    Search,
    LayoutGrid,
    Map as MapIcon,
    ChevronRight,
    Sparkles,
    Loader2,
    IndianRupee,
    Heart,
} from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import { API_V1, resolveMediaUrl } from "../../config/api";

const BACKEND_URL = `${API_V1}/stays`;

const LS_FAV = "stay_favorite_ids";
const readLocalFavs = () => {
    try {
        return JSON.parse(localStorage.getItem(LS_FAV) || "[]").map(Number);
    } catch {
        return [];
    }
};
const writeLocalFavs = (ids) => localStorage.setItem(LS_FAV, JSON.stringify([...new Set(ids)]));

const STAY_TYPES = ["All", "Dharamshala", "Lodge", "Hotel", "Homestay", "Guesthouse", "Other"];

const StayMarketplace = () => {
    const [listings, setListings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [needFood, setNeedFood] = useState(false);
    const [needWifi, setNeedWifi] = useState(false);
    const [needParking, setNeedParking] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [findingNearest, setFindingNearest] = useState(false);
    const [favVersion, setFavVersion] = useState(0);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    const favIds = useMemo(() => readLocalFavs(), [favVersion]);
    const isFav = (stayId) => favIds.includes(Number(stayId));

    const toggleFav = async (e, stayId) => {
        e.preventDefault();
        e.stopPropagation();
        const n = Number(stayId);
        let ids = readLocalFavs();
        const t = localStorage.getItem("token");
        try {
            if (ids.includes(n)) {
                ids = ids.filter((x) => x !== n);
                if (t) await axios.delete(`${BACKEND_URL}/favorites/${n}`, { headers: { Authorization: `Bearer ${t}` } });
            } else {
                ids = [...ids, n];
                if (t) await axios.post(`${BACKEND_URL}/favorites/${n}`, {}, { headers: { Authorization: `Bearer ${t}` } });
            }
            writeLocalFavs(ids);
            setFavVersion((v) => v + 1);
        } catch {
            alert("Could not update saved stay.");
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    useEffect(() => {
        filterListings();
    }, [listings, searchInput, selectedType, minPrice, maxPrice, needFood, needWifi, needParking]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(BACKEND_URL);
            setListings(res.data);
            setFiltered(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const minRoomPrice = (l) => {
        const rooms = l.rooms || [];
        if (!rooms.length) return null;
        return Math.min(...rooms.map((r) => Number(r.pricePerNight)));
    };

    const filterListings = () => {
        let rows = [...listings];
        if (selectedType !== "All") rows = rows.filter((l) => l.stayType === selectedType);
        if (searchInput.trim()) {
            const q = searchInput.toLowerCase();
            rows = rows.filter(
                (l) =>
                    (l.propertyName || "").toLowerCase().includes(q) ||
                    (l.city || "").toLowerCase().includes(q) ||
                    (l.address || "").toLowerCase().includes(q)
            );
        }
        const minP = minPrice ? Number(minPrice) : null;
        const maxP = maxPrice ? Number(maxPrice) : null;
        rows = rows.filter((l) => {
            const p = minRoomPrice(l);
            if (p == null) return true;
            if (minP != null && p < minP) return false;
            if (maxP != null && p > maxP) return false;
            const f = l.facilities || {};
            if (needFood && !f.food) return false;
            if (needWifi && !f.wifi) return false;
            if (needParking && !f.parking) return false;
            return true;
        });
        setFiltered(rows);
    };

    useEffect(() => {
        if (viewMode !== "map") return;
        initMap();
    }, [viewMode, filtered, userLocation]);

    const getImageUrl = (path) => {
        if (!path) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
        return resolveMediaUrl(path);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const findNearest = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported");
            return;
        }
        setFindingNearest(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation({ latitude, longitude });
                const sorted = [...listings].sort(
                    (a, b) =>
                        calculateDistance(latitude, longitude, +a.latitude, +a.longitude) -
                        calculateDistance(latitude, longitude, +b.latitude, +b.longitude)
                );
                setFiltered(sorted);
                setFindingNearest(false);
                if (viewMode === "map" && mapInstance.current) {
                    mapInstance.current.setView([latitude, longitude], 14);
                }
            },
            () => {
                setFindingNearest(false);
                alert("Could not read your location.");
            }
        );
    };

    const initMap = () => {
        if (!mapRef.current) return;
        if (mapInstance.current) mapInstance.current.remove();
        const center = userLocation || { latitude: 23.1765, longitude: 75.7849 };
        const map = L.map(mapRef.current).setView([center.latitude, center.longitude], 13);
        mapInstance.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
        }).addTo(map);
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        if (userLocation) {
            L.marker([userLocation.latitude, userLocation.longitude])
                .addTo(map)
                .bindPopup("You are here");
        }
        filtered.forEach((l) => {
            if (!l.latitude || !l.longitude) return;
            const m = L.marker([+l.latitude, +l.longitude]).addTo(map);
            const p = minRoomPrice(l);
            m.bindPopup(
                `<div class="p-2 min-w-[140px]"><strong>${l.propertyName}</strong><br/><span>From ₹${p ?? "—"}/night</span><br/><a href="/stays/${l.stay_id}">View</a></div>`
            );
            markersRef.current.push(m);
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />
            <div className="pt-32 pb-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                    >
                        <Sparkles size={14} /> Safe stays for pilgrims
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                        Find a <span className="text-orange-600">Stay</span> near the yatra
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-2xl mx-auto mb-10">
                        Dharamshalas, lodges, hotels, and homestays listed by local hosts — browse, filter, book, and
                        contact owners directly.
                    </p>

                    <div className="max-w-5xl mx-auto bg-white p-3 rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row items-stretch gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search city, temple route, or property name..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm focus:ring-4 ring-orange-50"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={findNearest}
                                disabled={findingNearest}
                                className="px-6 py-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shrink-0"
                            >
                                {findingNearest ? <Loader2 className="animate-spin inline" size={16} /> : <MapPin size={16} className="inline mr-2" />}
                                Near me
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                                className="p-4 bg-slate-900 text-white rounded-2xl shrink-0"
                            >
                                {viewMode === "list" ? <MapIcon size={20} /> : <LayoutGrid size={20} />}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center justify-center md:justify-between px-2 pb-2">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                            >
                                {STAY_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
                                <IndianRupee size={14} />
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-20 px-2 py-2 rounded-lg bg-gray-50"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                                <span>—</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-20 px-2 py-2 rounded-lg bg-gray-50"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={needFood} onChange={(e) => setNeedFood(e.target.checked)} />
                                Food
                            </label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={needWifi} onChange={(e) => setNeedWifi(e.target.checked)} />
                                WiFi
                            </label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={needParking} onChange={(e) => setNeedParking(e.target.checked)} />
                                Parking
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                {viewMode === "list" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading
                            ? Array(6)
                                  .fill(0)
                                  .map((_, i) => <div key={i} className="bg-white h-80 rounded-[2rem] animate-pulse" />)
                            : filtered.map((l) => {
                                  const p = minRoomPrice(l);
                                  return (
                                      <div
                                          key={l.stay_id}
                                          className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all"
                                      >
                                          <div className="h-48 overflow-hidden relative">
                                              <img
                                                  src={getImageUrl(l.propertyImages?.[0])}
                                                  alt=""
                                                  className="w-full h-full object-cover"
                                              />
                                              <span className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[8px] font-black text-orange-600 uppercase">
                                                  {l.stayType}
                                              </span>
                                              <button
                                                  type="button"
                                                  title={isFav(l.stay_id) ? "Remove from saved" : "Save stay"}
                                                  onClick={(e) => toggleFav(e, l.stay_id)}
                                                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center hover:bg-white transition-colors"
                                              >
                                                  <Heart
                                                      size={18}
                                                      className={isFav(l.stay_id) ? "text-red-500 fill-red-500" : "text-gray-400"}
                                                  />
                                              </button>
                                          </div>
                                          <div className="p-6">
                                              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg truncate mb-1">
                                                  {l.propertyName}
                                              </h3>
                                              <p className="flex items-center gap-1 text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-4 line-clamp-2">
                                                  <MapPin size={12} className="text-orange-500 shrink-0" />
                                                  {l.city}, {l.state}
                                              </p>
                                              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                                  <div>
                                                      <span className="text-xl font-black text-gray-900">₹{p ?? "—"}</span>
                                                      <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">/night</span>
                                                  </div>
                                                  <Link
                                                      to={`/stays/${l.stay_id}`}
                                                      className="inline-flex items-center gap-1 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600"
                                                  >
                                                      Details <ChevronRight size={14} />
                                                  </Link>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                    </div>
                ) : (
                    <div className="h-[600px] bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl p-2">
                        <div ref={mapRef} className="w-full h-full rounded-[2rem]" />
                    </div>
                )}

                <div className="mt-16 bg-slate-900 rounded-[3rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            List your dharamshala, lodge, or homestay
                        </h2>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest max-w-lg">
                            Help pilgrims stay safely. Add photos, GPS pin, pricing, and amenities in minutes.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            to="/stays/my-bookings"
                            className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                        >
                            My bookings
                        </Link>
                        <Link
                            to="/stays/host"
                            className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                        >
                            List a stay
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default StayMarketplace;
