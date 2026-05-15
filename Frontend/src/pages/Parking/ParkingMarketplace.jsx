import React, { useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
    MapPin,
    Search,
    Car,
    Bike,
    LayoutGrid,
    Map as MapIcon,
    ChevronRight,
    Sparkles,
    Loader2
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_V1, resolveMediaUrl } from "../../config/api";

const BACKEND_URL = API_V1;

const ParkingMarketplace = () => {
    const [parkingSlots, setParkingSlots] = useState([]);
    const [filteredSlots, setFilteredSlots] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [selectedType, setSelectedType] = useState("All");

    const [userLocation, setUserLocation] = useState(null);
    const [findingNearest, setFindingNearest] = useState(false);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        fetchParkingSlots();
    }, []);

    useEffect(() => {
        filterSlots();
    }, [parkingSlots, searchInput, selectedType]);

    useEffect(() => {
        if (viewMode === "map") {
            initMap();
        }
    }, [viewMode, filteredSlots, userLocation]);

    const fetchParkingSlots = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/parking`);
            setParkingSlots(res.data);
            setFilteredSlots(res.data);
        } catch (error) {
            console.error("Error fetching parking slots:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterSlots = () => {
        let filtered = [...parkingSlots];
        if (selectedType !== "All") filtered = filtered.filter((s) => s.parkingType === selectedType);
        if (searchInput) {
            filtered = filtered.filter(
                (s) =>
                    s.title.toLowerCase().includes(searchInput.toLowerCase()) ||
                    s.address.toLowerCase().includes(searchInput.toLowerCase())
            );
        }
        setFilteredSlots(filtered);
    };

    const getImageUrl = (path) => {
        if (!path) return "https://images.unsplash.com/photo-1506521781263-d8422e82f27a";
        return resolveMediaUrl(path);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const findNearest = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setFindingNearest(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });

                // Sort slots by distance
                const sorted = [...parkingSlots].sort((a, b) => {
                    const distA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
                    const distB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
                    return distA - distB;
                });

                setFilteredSlots(sorted);
                setFindingNearest(false);
                if (viewMode === "map" && mapInstance.current) {
                    mapInstance.current.setView([latitude, longitude], 15);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                setFindingNearest(false);
                alert("Could not get your location. Please ensure location permissions are granted.");
            }
        );
    };

    const initMap = () => {
        if (!window.L || !mapRef.current) return;
        const L = window.L;
        if (mapInstance.current) mapInstance.current.remove();

        const map = L.map(mapRef.current).setView([23.1765, 75.7849], 13);
        mapInstance.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        // User Marker
        if (userLocation) {
            const userIcon = L.divIcon({
                className: 'custom-div-icon',
                html: "<div style='background-color:#3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);'></div>",
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(map).bindPopup("You are here");
        }

        const hotspotSlot = filteredSlots.length > 0
            ? filteredSlots.reduce((prev, current) => (prev.totalSlots > current.totalSlots) ? prev : current)
            : null;

        filteredSlots.forEach((slot) => {
            if (slot.latitude && slot.longitude) {
                const isHotspot = hotspotSlot && slot.slot_id === hotspotSlot.slot_id;

                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style='background-color:${isHotspot ? "#ea580c" : "#1e293b"}; width: ${isHotspot ? "30px" : "20px"}; height: ${isHotspot ? "30px" : "20px"}; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: ${isHotspot ? "12px" : "8px"}; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);' class="${isHotspot ? 'animate-bounce' : ''}">P</div>`,
                    iconSize: [isHotspot ? 30 : 20, isHotspot ? 30 : 20],
                    iconAnchor: [isHotspot ? 15 : 10, isHotspot ? 15 : 10]
                });

                const marker = L.marker([slot.latitude, slot.longitude], { icon }).addTo(map);
                marker.bindPopup(`
                    <div class="p-3 font-jakarta min-w-[150px]">
                        ${isHotspot ? '<span class="bg-orange-100 text-orange-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full mb-2 inline-block">High Availability 🔥</span>' : ''}
                        <h3 class="font-black text-slate-900 uppercase tracking-tighter mb-1">${slot.title}</h3>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">${slot.address.substring(0, 40)}...</p>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-orange-600 font-black text-sm">₹${slot.pricePerHour}/hr</span>
                            <span class="text-[8px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg">${slot.totalSlots} SLOTS</span>
                        </div>
                        <a href="/parking/${slot.slot_id}" class="block w-full text-center bg-slate-900 text-white text-[9px] py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95">View Details</a>
                    </div>
                `, { closeButton: false, offset: [0, -10] });
                markersRef.current.push(marker);

                if (isHotspot) {
                    marker.openPopup();
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />

            {/* Simple Sweet Hero */}
            <div className="pt-32 pb-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                    >
                        <Sparkles size={14} /> Available Spots Now
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                        Park <span className="text-orange-600">Smartly</span> Anywhere
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-xl mx-auto mb-10">
                        Find, Book & Park your vehicle in seconds.
                    </p>

                    {/* Search Bar Attached to Hero */}
                    <div className="max-w-4xl mx-auto bg-white p-3 rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="text"
                                placeholder="Search by location or name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm transition-all focus:bg-white focus:ring-4 ring-orange-50"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={findNearest}
                                disabled={findingNearest}
                                className="px-6 py-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2"
                            >
                                {findingNearest ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                                {findingNearest ? "Calculating..." : "Find Nearest"}
                            </button>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="bg-gray-50 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-all"
                            >
                                <option value="All">All types</option>
                                <option value="Car">Cars</option>
                                <option value="Bike">Bikes</option>
                            </select>
                            <button
                                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                                className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                            >
                                {viewMode === "list" ? <MapIcon size={20} /> : <LayoutGrid size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                {viewMode === "list" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? (
                            Array(8).fill(0).map((_, i) => <div key={i} className="bg-white h-72 rounded-[2rem] animate-pulse"></div>)
                        ) : filteredSlots.map((slot) => (
                            <div key={slot.slot_id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                                <div className="h-44 overflow-hidden relative">
                                    <img src={getImageUrl(slot.images?.[0])} className="w-full h-full object-cover" alt={`Preview of parking slot: ${slot.title} located at ${slot.address}`} />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black text-orange-600 uppercase tracking-widest shadow-sm">
                                            {slot.parkingType}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg truncate mb-1">{slot.title}</h3>
                                    <div className="flex items-center gap-1 text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-6">
                                        <MapPin size={12} className="text-orange-500" /> {slot.address.substring(0, 25)}...
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <div>
                                            <span className="text-xl font-black text-gray-900 tracking-tighter">₹{slot.pricePerHour}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">/hr</span>
                                        </div>
                                        <a href={`/parking/${slot.slot_id}`} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg">Book</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-[600px] bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl p-2">
                        <div ref={mapRef} className="w-full h-full rounded-[2rem] overflow-hidden" />
                    </div>
                )}

                {/* Host CTA */}
                <div className="mt-20 bg-slate-900 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Rent your empty spot</h2>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Join 50+ hosts earning daily in Ujjain.</p>
                    </div>
                    <div className="flex gap-4">
                        <a href="/parking/my-bookings" className="px-8 py-5 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">My History</a>
                        <a href="/parking/host" className="px-8 py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-orange-600 transition-all shadow-2xl shadow-orange-500/20">List Now</a>
                    </div>
                </div>
            </div>

            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default ParkingMarketplace;
