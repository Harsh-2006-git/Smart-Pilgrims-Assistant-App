import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
    MapPin,
    Loader2,
    ArrowLeft,
    Phone,
    Shield,
    IndianRupee,
    Wifi,
    Car,
    UtensilsCrossed,
    Users,
    Building2,
    Heart,
} from "lucide-react";
import axios from "axios";
import { API_V1, resolveMediaUrl } from "../../config/api";

const API = `${API_V1}/stays`;
const LS_FAV = "stay_favorite_ids";

const readLocalFavs = () => {
    try {
        return JSON.parse(localStorage.getItem(LS_FAV) || "[]").map(Number);
    } catch {
        return [];
    }
};
const writeLocalFavs = (ids) => {
    localStorage.setItem(LS_FAV, JSON.stringify([...new Set(ids)]));
};

const icon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const StayDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [stay, setStay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [roomId, setRoomId] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [roomsBooked, setRoomsBooked] = useState(1);
    const [guests, setGuests] = useState(1);
    const [contactPhone, setContactPhone] = useState("");
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState(null);
    const [saved, setSaved] = useState(false);

    const token = () => localStorage.getItem("token");

    useEffect(() => {
        const u = localStorage.getItem("user");
        if (u) {
            try {
                const p = JSON.parse(u).phone;
                if (p) setContactPhone(p);
            } catch {
                /* ignore */
            }
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API}/${id}`);
                setStay(res.data);
                const rooms = res.data.rooms || [];
                if (rooms[0]) setRoomId(String(rooms[0].room_id));

                let fav = readLocalFavs().includes(Number(id));
                const t = token();
                if (t) {
                    try {
                        const fr = await axios.get(`${API}/favorites`, { headers: { Authorization: `Bearer ${t}` } });
                        const apiIds = (fr.data || []).map((l) => l.stay_id);
                        const merged = [...new Set([...readLocalFavs(), ...apiIds])];
                        writeLocalFavs(merged);
                        fav = merged.includes(Number(id));
                    } catch {
                        /* ignore */
                    }
                }
                setSaved(fav);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const img = (path) =>
        path ? resolveMediaUrl(path) : "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";

    const toggleSaved = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const n = Number(id);
        let ids = readLocalFavs();
        const t = token();
        const nowSaved = !saved;
        try {
            if (nowSaved) {
                if (!ids.includes(n)) ids = [...ids, n];
                if (t) await axios.post(`${API}/favorites/${n}`, {}, { headers: { Authorization: `Bearer ${t}` } });
            } else {
                ids = ids.filter((x) => x !== n);
                if (t) await axios.delete(`${API}/favorites/${n}`, { headers: { Authorization: `Bearer ${t}` } });
            }
            writeLocalFavs(ids);
            setSaved(nowSaved);
        } catch {
            alert("Could not update saved stays.");
        }
    };

    const book = async (e) => {
        e.preventDefault();
        setError("");
        const t = token();
        if (!t) {
            if (!guestName.trim() || !guestEmail.trim()) {
                setError("Enter your name and email so we can send booking updates — or sign in.");
                return;
            }
        }
        if (!roomId || !checkIn || !checkOut) {
            setError("Choose room and dates.");
            return;
        }
        if (!contactPhone.trim()) {
            setError("Phone is required.");
            return;
        }
        setProcessing(true);
        try {
            const headers = {};
            if (t) headers.Authorization = `Bearer ${t}`;
            const body = {
                stay_room_id: Number(roomId),
                checkInDate: checkIn,
                checkOutDate: checkOut,
                roomsBooked,
                guests,
                contactPhone: contactPhone.trim(),
            };
            if (!t) {
                body.guestName = guestName.trim();
                body.guestEmail = guestEmail.trim();
            }
            const res = await axios.post(`${API}/${id}/bookings`, body, { headers });
            const bid = res.data?.booking?.stay_booking_id;
            setBookingRef(bid);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Booking failed.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-orange-600" size={32} />
            </div>
        );
    }
    if (!stay) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-gray-500">
                Stay not found
            </div>
        );
    }

    const f = stay.facilities || {};
    const pos = [Number(stay.latitude), Number(stay.longitude)];

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />
            <div className="pt-28 pb-12 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 hover:text-orange-600"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase mb-3">
                                <Shield size={12} /> {stay.ownerVerified ? "Verified host" : "Community listing"}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-3">
                                {stay.propertyName}
                            </h1>
                            <p className="text-gray-500 text-sm max-w-2xl">{stay.description}</p>
                            <div className="flex flex-wrap gap-3 mt-4 text-xs font-bold text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                    <MapPin size={14} className="text-orange-500" />
                                    {stay.address}, {stay.city}, {stay.state}
                                </span>
                                {stay.routeOrTempleNearby && (
                                    <span className="text-orange-700">Near: {stay.routeOrTempleNearby}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={toggleSaved}
                                className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border ${
                                    saved ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50 border-gray-200 text-gray-600"
                                }`}
                            >
                                <Heart size={16} fill={saved ? "currentColor" : "none"} /> Save stay
                            </button>
                            <a
                                href={`tel:${stay.ownerContact}`}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                            >
                                <Phone size={16} /> Contact host
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                    <div className="aspect-video rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg bg-white p-1">
                        <img src={img(stay.propertyImages?.[0])} alt="" className="w-full h-full object-cover rounded-[1.8rem]" />
                    </div>
                    {(stay.rooms || []).some((r) => (r.roomImages || []).length > 0) && (
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Room photos (Cloudinary)</h4>
                            <div className="flex flex-wrap gap-2">
                                {(stay.rooms || []).flatMap((r) =>
                                    (r.roomImages || []).map((src, i) => (
                                        <img
                                            key={`${r.room_id}-${i}`}
                                            src={img(src)}
                                            alt=""
                                            className="h-20 w-28 object-cover rounded-xl border border-gray-100"
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { k: "food", label: "Food", icon: UtensilsCrossed, on: f.food },
                            { k: "wifi", label: "WiFi", icon: Wifi, on: f.wifi },
                            { k: "parking", label: "Parking", icon: Car, on: f.parking },
                            { k: "familyRooms", label: "Family rooms", icon: Users, on: f.familyRooms },
                        ].map((x) => (
                            <div
                                key={x.k}
                                className={`rounded-2xl p-4 border text-center ${
                                    x.on ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50 border-gray-100 text-gray-400"
                                }`}
                            >
                                <x.icon className="mx-auto mb-2" size={20} />
                                <span className="text-[9px] font-black uppercase tracking-wider">{x.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-[2rem] overflow-hidden border border-gray-100 h-72 shadow-inner bg-white">
                        <MapContainer center={pos} zoom={15} className="h-full w-full z-0" scrollWheelZoom={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
                            <Marker position={pos} icon={icon}>
                                <Popup>{stay.propertyName}</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                    <p className="text-[11px] text-gray-500">
                        <a
                            className="text-orange-600 font-bold underline"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${stay.latitude},${stay.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open route navigation
                        </a>{" "}
                        (Google Maps).
                    </p>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    {success ? (
                        <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl text-center space-y-4">
                            <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Request submitted</p>
                            <p className="text-gray-500 text-sm">
                                Status: <strong className="text-orange-600">Pending</strong> until the host confirms. You will
                                get an email when SMTP is configured.
                            </p>
                            {bookingRef != null && (
                                <p className="text-xs text-gray-600">
                                    Reference <strong>#{bookingRef}</strong>
                                </p>
                            )}
                            <div className="flex flex-col gap-3 pt-4">
                                {bookingRef != null && (
                                    <Link
                                        to={`/stays/booking-status?bookingId=${bookingRef}&contactPhone=${encodeURIComponent(contactPhone.trim())}`}
                                        className="inline-block px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Track booking status
                                    </Link>
                                )}
                                <Link
                                    to="/stays/my-bookings"
                                    className="inline-block px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                >
                                    My stay bookings
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={book} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-5">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Building2 size={20} className="text-orange-600" /> Book a room
                            </h3>
                            {!token() && (
                                <p className="text-[11px] text-gray-500">
                                    No account needed — add name and email for notifications. Or{" "}
                                    <button type="button" className="text-orange-600 font-bold underline" onClick={() => navigate("/auth")}>
                                        sign in
                                    </button>
                                    .
                                </p>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Room type</label>
                                <select
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm"
                                >
                                    {(stay.rooms || []).map((r) => (
                                        <option key={r.room_id} value={r.room_id}>
                                            {r.roomType} — ₹{r.pricePerNight}/night (max {r.availableRooms} rooms)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Check-in</label>
                                    <input
                                        type="date"
                                        required
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Check-out</label>
                                    <input
                                        type="date"
                                        required
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Rooms</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={roomsBooked}
                                        onChange={(e) => setRoomsBooked(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Guests</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={guests}
                                        onChange={(e) => setGuests(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Your phone</label>
                                <input
                                    type="tel"
                                    required
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold"
                                />
                            </div>
                            {!token() && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Your name</label>
                                        <input
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Your email</label>
                                        <input
                                            type="email"
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold"
                                        />
                                    </div>
                                </>
                            )}
                            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex justify-center items-center gap-2"
                            >
                                {processing ? <Loader2 className="animate-spin" size={18} /> : <IndianRupee size={18} />}
                                Submit booking request
                            </button>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                The host will confirm your dates. Pay the host as you arrange. Emails send when SMTP env vars are
                                set on the server.
                            </p>
                        </form>
                    )}
                </div>
            </div>

            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default StayDetail;
