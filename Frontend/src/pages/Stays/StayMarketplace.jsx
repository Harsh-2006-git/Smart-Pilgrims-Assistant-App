import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Heart, House, LayoutGrid, Loader2, Map as MapIcon, MapPin, Navigation, Search, ShieldCheck, Sparkles, Utensils, Wifi, CarFront, Users, Building2 } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { API_V1, resolveMediaUrl } from "../../config/api";
import { stayMarkerIcon, userMarkerIcon } from "../../components/stays/stayMapIcons";
import { getStoredUser, isStayManager, isAdminUser } from "../../utils/access";

const BACKEND_URL = API_V1;
const FAVORITES_KEY = "divya_yatra_favorite_stays";

const getFavoriteIds = () => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveFavoriteIds = (ids) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getStayStartingPrice = (stay) => {
  const rooms = Array.isArray(stay?.rooms) ? stay.rooms : [];
  const roomPrices = rooms
    .map((room) => Number(room?.pricePerNight))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (roomPrices.length) {
    return Math.min(...roomPrices);
  }

  const fallback = Number(stay?.pricePerNight);
  return Number.isFinite(fallback) ? fallback : null;
};

function FitMapBounds({ stays, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];

    stays.forEach((stay) => {
      if (stay.latitude && stay.longitude) {
        bounds.push([Number(stay.latitude), Number(stay.longitude)]);
      }
    });

    if (userLocation) {
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([23.1765, 75.7849], 12);
    }
  }, [map, stays, userLocation]);

  return null;
}

const StayMarketplace = () => {
  const user = getStoredUser();
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const isAdmin = isLoggedIn && isAdminUser(user);
  const canManageStays = isLoggedIn && isStayManager(user);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [searchInput, setSearchInput] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [filters, setFilters] = useState({
    wifi: false,
    foodAvailable: false,
    parking: false,
    familyRooms: false,
    favoritesOnly: false,
  });
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [findingNearest, setFindingNearest] = useState(false);

  useEffect(() => {
    setFavoriteIds(getFavoriteIds());
    fetchStays();
  }, []);

  const fetchStays = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/stays`);
      setStays(response.data || []);
    } catch (error) {
      console.error("Error fetching stays:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (stayId) => {
    const key = String(stayId);
    const next = favoriteIds.includes(key)
      ? favoriteIds.filter((id) => id !== key)
      : [...favoriteIds, key];

    setFavoriteIds(next);
    saveFavoriteIds(next);
  };

  const filteredStays = useMemo(() => {
    let next = [...stays];

    if (selectedType !== "All") {
      next = next.filter((stay) => stay.stayType === selectedType);
    }

    if (maxPrice) {
      const cap = Number(maxPrice);
      next = next.filter((stay) => {
        const price = getStayStartingPrice(stay);
        return price !== null && price <= cap;
      });
    }

    if (filters.wifi) next = next.filter((stay) => stay.wifi);
    if (filters.foodAvailable) next = next.filter((stay) => stay.foodAvailable);
    if (filters.parking) next = next.filter((stay) => stay.parking);
    if (filters.familyRooms) next = next.filter((stay) => stay.familyRooms);
    if (filters.favoritesOnly) next = next.filter((stay) => favoriteIds.includes(String(stay.stay_id)));

    if (searchInput) {
      const query = searchInput.toLowerCase();
      next = next.filter((stay) =>
        [
          stay.propertyName,
          stay.address,
          stay.city,
          stay.state,
          stay.nearbyTemple,
          stay.pilgrimageRoute,
        ]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))
      );
    }

    if (userLocation) {
      next = next
        .map((stay) => ({
          ...stay,
          distanceKm: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            Number(stay.latitude),
            Number(stay.longitude)
          ),
        }))
        .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return next;
  }, [favoriteIds, filters, maxPrice, searchInput, selectedType, stays, userLocation]);

  const findNearest = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFindingNearest(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFindingNearest(false);
      },
      (error) => {
        console.error(error);
        setFindingNearest(false);
        alert("Could not access your location. Please allow location access and try again.");
      }
    );
  };

  const getImageUrl = (stay) => {
    const source = stay.propertyImages?.[0] || stay.roomImages?.[0];
    return source
      ? resolveMediaUrl(source)
      : "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80";
  };

  // Rooms are stored in stay.rooms[] from the backend join.
  // Fall back to top-level fields for backwards compatibility.
  const getFirstRoom = (stay) => stay?.rooms?.[0] || stay || {};

  const toggleFilter = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const filterPills = [
    { key: "wifi", label: "WiFi", icon: Wifi },
    { key: "foodAvailable", label: "Food", icon: Utensils },
    { key: "parking", label: "Parking", icon: CarFront },
    { key: "familyRooms", label: "Family Rooms", icon: Users },
    { key: "favoritesOnly", label: "Favorites", icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5ef] font-jakarta text-slate-900">
      <Header />

      <div className="border-b border-orange-100 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_42%),linear-gradient(180deg,#fffaf3_0%,#fffdf9_100%)] pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
              <Sparkles size={14} /> Sacred Stay Network
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-black uppercase tracking-tighter text-slate-900 md:text-6xl">
              Find a <span className="text-orange-600">Safe Stay</span> on Your Pilgrimage Route
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-bold uppercase tracking-widest text-slate-400">
              Browse dharamshalas, lodges, homestays, and local rooms with map access, room details, and host confirmation.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-6xl rounded-[2rem] border border-orange-100 bg-white p-4 shadow-2xl shadow-orange-100/40">
            <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.6fr_auto]">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by property, city, temple, or route..."
                  className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 py-4 pl-14 pr-5 text-sm font-bold outline-none transition-all focus:border-orange-400 focus:bg-white"
                />
              </div>

              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 text-[11px] font-black uppercase tracking-widest outline-none"
              >
                <option value="All">All Stays</option>
                <option value="Homestay">Homestay</option>
                <option value="Dharamshala">Dharamshala</option>
                <option value="Lodge">Lodge</option>
                <option value="Hotel">Hotel</option>
                <option value="Guest House">Guest House</option>
                <option value="Ashram">Ashram</option>
              </select>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max Rs./night"
                className="rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 text-sm font-bold outline-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={findNearest}
                  disabled={findingNearest}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-orange-600 transition-all hover:bg-orange-100"
                >
                  {findingNearest ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                  {findingNearest ? "Finding..." : "Nearest"}
                </button>
                <button
                  onClick={() => setViewMode((prev) => (prev === "list" ? "map" : "list"))}
                  className="rounded-2xl bg-slate-900 p-4 text-white transition-all hover:bg-orange-600"
                >
                  {viewMode === "list" ? <MapIcon size={20} /> : <LayoutGrid size={20} />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {filterPills.map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => toggleFilter(pill.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    filters[pill.key]
                      ? "border-orange-500 bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                      : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600"
                  }`}
                >
                  {React.createElement(pill.icon, { size: 13 })} {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16">
        {viewMode === "map" ? (
          <div className="overflow-hidden rounded-[2.5rem] border border-orange-100 bg-white p-2 shadow-2xl shadow-orange-100/40">
            <MapContainer center={[23.1765, 75.7849]} zoom={12} className="h-[620px] w-full rounded-[2rem]">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitMapBounds stays={filteredStays} userLocation={userLocation} />

              {userLocation ? (
                <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userMarkerIcon}>
                  <Popup>You are here</Popup>
                </Marker>
              ) : null}

              {filteredStays.map((stay) => (
                <Marker
                  key={stay.stay_id}
                  position={[Number(stay.latitude), Number(stay.longitude)]}
                  icon={stayMarkerIcon}
                >
                  <Popup>
                    <div className="min-w-[220px] font-jakarta">
                      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-orange-500">{stay.stayType}</p>
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{stay.propertyName}</h3>
                      <p className="mt-2 text-[11px] font-semibold text-slate-500">{stay.address}</p>
                      <p className="mt-3 text-sm font-black text-slate-900">
                        Rs. {getStayStartingPrice(stay) ?? "—"} / night
                      </p>
                      <a
                        href={`/stays/${stay.stay_id}`}
                        className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                      >
                        View Stay
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : loading ? (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse rounded-[2rem] bg-white shadow-sm" />
            ))}
          </div>
        ) : filteredStays.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-orange-200 bg-white p-20 text-center">
            <Building2 className="mx-auto mb-5 text-orange-300" size={44} />
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">No stays matched these filters</h3>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-slate-400">
              Try another route, city, or facility combination.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {filteredStays.map((stay) => {
              const isFavorite = favoriteIds.includes(String(stay.stay_id));

              return (
                <article
                  key={stay.stay_id}
                  className="group overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-lg shadow-orange-100/20 transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={getImageUrl(stay)}
                      alt={`Stay preview for ${stay.propertyName}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
                        {stay.stayType}
                      </span>
                      {stay.moderationStatus === "Approved" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                          <ShieldCheck size={11} /> Verified
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => toggleFavorite(stay.stay_id)}
                      className={`absolute right-4 top-4 rounded-full p-3 transition-all ${
                        isFavorite ? "bg-rose-500 text-white" : "bg-white/90 text-slate-600"
                      }`}
                    >
                      <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black uppercase tracking-tight text-white">{stay.propertyName}</h3>
                      <p className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/75">
                        <MapPin size={13} /> {stay.city}, {stay.state}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    {(() => {
                      const room = getFirstRoom(stay);
                      const price = getStayStartingPrice(stay) ?? room.pricePerNight ?? stay.pricePerNight;
                      const rooms = room.availableRooms ?? stay.availableRooms;
                      const capacity = room.capacity ?? stay.capacity;
                      const roomType = room.roomType ?? stay.roomType;
                      const totalRoomTypes = stay.rooms?.length || 1;
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] bg-orange-50/60 p-4 text-center">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">From</p>
                              <p className="mt-1 text-sm font-black text-slate-900">Rs. {price ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rooms</p>
                              <p className="mt-1 text-sm font-black text-slate-900">{rooms ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Capacity</p>
                              <p className="mt-1 text-sm font-black text-slate-900">{capacity ? `${capacity} guests` : "—"}</p>
                            </div>
                          </div>

                          <p className="mt-5 min-h-[56px] text-sm font-medium leading-relaxed text-slate-500">
                            {stay.description || "A comfortable and safe rest point for pilgrims and families on the route."}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {stay.wifi ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">WiFi</span> : null}
                            {stay.foodAvailable ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">Food</span> : null}
                            {stay.parking ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">Parking</span> : null}
                            {stay.familyRooms ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">Family Rooms</span> : null}
                            {stay.nearbyTemple ? <span className="rounded-full bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-600">{stay.nearbyTemple}</span> : null}
                          </div>

                          <div className="mt-6 flex items-center justify-between border-t border-orange-100 pt-5">
                            <div>
                              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <House size={13} /> {roomType || "Room"}
                                {totalRoomTypes > 1 ? <span className="text-orange-500">+{totalRoomTypes - 1} more</span> : null}
                              </p>
                              {stay.distanceKm ? (
                                <p className="mt-2 text-xs font-bold text-orange-600">{stay.distanceKm.toFixed(1)} km away</p>
                              ) : null}
                            </div>
                            <a
                              href={`/stays/${stay.stay_id}`}
                              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
                            >
                              Explore Stay
                            </a>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-20 rounded-[3rem] bg-slate-900 p-10 md:p-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-300">
                <Building2 size={14} /> Local Community Hosts
              </p>
              <h2 className="max-w-2xl text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                Own a dharamshala, lodge, homestay, or spare room on the route?
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-bold uppercase tracking-widest text-white/45">
                Publish your stay, add room photos, set room availability, and help pilgrims find a safe place to rest.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="/stays/my-bookings"
                className="rounded-2xl bg-white/10 px-7 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/20"
              >
                My Stay Bookings
              </a>
              <a
                href={
                  isAdmin
                    ? "/admin/stays"
                    : canManageStays
                      ? "/owner/stays"
                      : "/stays/host"
                }
                className="rounded-2xl bg-orange-600 px-7 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white hover:text-orange-600"
              >
                {isAdmin
                  ? "Open Stay Moderation"
                  : canManageStays
                    ? "Manage Your Stays"
                    : "Become a Verified Host"}
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
    </div>
  );
};

export default StayMarketplace;
