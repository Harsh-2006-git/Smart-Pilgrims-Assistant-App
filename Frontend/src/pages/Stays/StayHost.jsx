import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Loader2, MapPin, ArrowLeft, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { API_V1 } from "../../config/api";

const API = `${API_V1}/stays`;

const mapIcon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapClickMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return position ? <Marker position={position} icon={mapIcon} /> : null;
}

const emptyRoom = () => ({
    roomType: "Dorm / shared",
    capacity: 4,
    pricePerNight: 250,
    availableRooms: 6,
    checkInTime: "12:00",
    checkOutTime: "10:00",
});

const StayHost = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [position, setPosition] = useState([23.1765, 75.7849]);
    const [propertyFiles, setPropertyFiles] = useState([]);
    const [rooms, setRooms] = useState([emptyRoom()]);
    const [roomFiles, setRoomFiles] = useState([[]]);
    const [form, setForm] = useState({
        propertyName: "",
        ownerName: "",
        ownerContact: "",
        description: "",
        address: "",
        city: "Ujjain",
        state: "Madhya Pradesh",
        routeOrTempleNearby: "Mahakaleshwar corridor",
        stayType: "Dharamshala",
        distanceToTempleKm: "",
        food: true,
        washroom: true,
        parking: false,
        familyRooms: false,
        wifi: false,
        security: true,
        medicalNearby: false,
    });

    const addRoom = () => {
        setRooms((r) => [...r, emptyRoom()]);
        setRoomFiles((f) => [...f, []]);
    };

    const removeRoom = (idx) => {
        if (rooms.length <= 1) return;
        setRooms((r) => r.filter((_, i) => i !== idx));
        setRoomFiles((f) => f.filter((_, i) => i !== idx));
    };

    const updateRoom = (idx, patch) => {
        setRooms((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    };

    const setRoomRowFiles = (idx, fileList) => {
        setRoomFiles((f) => {
            const next = [...f];
            next[idx] = [...fileList];
            return next;
        });
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
            () => alert("Location permission denied")
        );
    };

    const reverseGeocode = async () => {
        const [lat, lng] = position;
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const res = await fetch(url, { headers: { "Accept-Language": "en" } });
            const data = await res.json();
            const addr = data.address || {};
            setForm((f) => ({
                ...f,
                address: data.display_name?.slice(0, 200) || f.address,
                city: addr.city || addr.town || addr.village || f.city,
                state: addr.state || f.state,
            }));
        } catch {
            alert("Reverse geocode failed — fill address manually.");
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/auth");
            return;
        }

        const roomsPayload = rooms.map(({ roomType, capacity, pricePerNight, availableRooms, checkInTime, checkOutTime }) => ({
            roomType,
            capacity: Number(capacity) || 1,
            pricePerNight: Number(pricePerNight) || 0,
            availableRooms: Number(availableRooms) || 1,
            checkInTime,
            checkOutTime,
        }));

        const fd = new FormData();
        fd.append("propertyName", form.propertyName);
        fd.append("ownerName", form.ownerName);
        fd.append("ownerContact", form.ownerContact);
        fd.append("description", form.description);
        fd.append("address", form.address);
        fd.append("city", form.city);
        fd.append("state", form.state);
        fd.append("routeOrTempleNearby", form.routeOrTempleNearby);
        fd.append("stayType", form.stayType);
        fd.append("latitude", String(position[0]));
        fd.append("longitude", String(position[1]));
        if (form.distanceToTempleKm) fd.append("distanceToTempleKm", form.distanceToTempleKm);
        fd.append(
            "facilities",
            JSON.stringify({
                food: form.food,
                washroom: form.washroom,
                parking: form.parking,
                familyRooms: form.familyRooms,
                wifi: form.wifi,
                security: form.security,
                medicalNearby: form.medicalNearby,
            })
        );
        fd.append("rooms", JSON.stringify(roomsPayload));

        for (const file of propertyFiles) {
            fd.append("propertyImages", file);
        }
        roomFiles.forEach((files, idx) => {
            files.forEach((file) => {
                fd.append(`roomImages_${idx}`, file);
            });
        });

        setSaving(true);
        try {
            await axios.post(API, fd, {
                headers: { Authorization: `Bearer ${token}` },
            });
            navigate("/stays");
        } catch (err) {
            alert(err.response?.data?.message || "Could not create listing.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />
            <div className="pt-28 pb-8 max-w-4xl mx-auto px-4">
                <Link to="/stays" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase mb-8">
                    <ArrowLeft size={14} /> All stays
                </Link>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">List your stay</h1>
                <p className="text-gray-500 text-sm mb-10">
                    Property photos and each room’s photos upload to <strong>Cloudinary</strong> (folder{" "}
                    <code className="text-orange-700">ujjain_yatra/stays</code>). Map tap sets GPS; use reverse geocode to
                    fill address when possible.
                </p>

                <form onSubmit={submit} className="space-y-8 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg">
                    <div className="rounded-2xl overflow-hidden border h-72 relative z-0">
                        <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
                            <MapClickMarker position={position} setPosition={setPosition} />
                        </MapContainer>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={useMyLocation}
                            className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase"
                        >
                            <MapPin className="inline mr-1" size={14} />
                            Use my location
                        </button>
                        <button
                            type="button"
                            onClick={reverseGeocode}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase"
                        >
                            Reverse geocode pin
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            ["propertyName", "Property name"],
                            ["ownerName", "Owner / manager name"],
                            ["ownerContact", "Contact phone"],
                            ["city", "City"],
                            ["state", "State"],
                            ["routeOrTempleNearby", "Route / temple nearby"],
                            ["distanceToTempleKm", "Distance to temple (km, optional)"],
                        ].map(([key, label]) => (
                            <label key={key} className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">{label}</span>
                                <input
                                    className="mt-1 w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm"
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    required={["propertyName", "ownerName", "ownerContact", "city", "state"].includes(key)}
                                />
                            </label>
                        ))}
                    </div>

                    <label className="block">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Full address</span>
                        <textarea
                            className="mt-1 w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold text-sm min-h-[80px]"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Description</span>
                        <textarea
                            className="mt-1 w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold text-sm min-h-[100px]"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </label>

                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Stay type</span>
                        <select
                            className="mt-1 w-full px-4 py-3 rounded-xl bg-gray-50 border font-bold"
                            value={form.stayType}
                            onChange={(e) => setForm({ ...form, stayType: e.target.value })}
                        >
                            {["Dharamshala", "Lodge", "Hotel", "Homestay", "Guesthouse", "Other"].map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            ["food", "Food"],
                            ["washroom", "Washroom"],
                            ["parking", "Parking"],
                            ["familyRooms", "Family rooms"],
                            ["wifi", "WiFi"],
                            ["security", "Security"],
                            ["medicalNearby", "Medical nearby"],
                        ].map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Property photos → Cloudinary</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="mt-2 block w-full text-sm"
                            onChange={(e) => setPropertyFiles([...e.target.files])}
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Room types</h3>
                            <button
                                type="button"
                                onClick={addRoom}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-orange-600"
                            >
                                <Plus size={16} /> Add room type
                            </button>
                        </div>
                        {rooms.map((room, idx) => (
                            <div key={idx} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Room #{idx + 1}</span>
                                    {rooms.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRoom(idx)}
                                            className="text-red-500 p-1"
                                            aria-label="Remove room"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <label className="block text-xs font-bold">
                                        Type
                                        <input
                                            className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                                            value={room.roomType}
                                            onChange={(e) => updateRoom(idx, { roomType: e.target.value })}
                                        />
                                    </label>
                                    <label className="block text-xs font-bold">
                                        Price / night (₹)
                                        <input
                                            type="number"
                                            className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                                            value={room.pricePerNight}
                                            onChange={(e) => updateRoom(idx, { pricePerNight: e.target.value })}
                                        />
                                    </label>
                                    <label className="block text-xs font-bold">
                                        Capacity
                                        <input
                                            type="number"
                                            className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                                            value={room.capacity}
                                            onChange={(e) => updateRoom(idx, { capacity: e.target.value })}
                                        />
                                    </label>
                                    <label className="block text-xs font-bold">
                                        Available rooms (inventory)
                                        <input
                                            type="number"
                                            className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                                            value={room.availableRooms}
                                            onChange={(e) => updateRoom(idx, { availableRooms: e.target.value })}
                                        />
                                    </label>
                                    <label className="block text-xs font-bold">
                                        Check-in time
                                        <input
                                            className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                                            value={room.checkInTime}
                                            onChange={(e) => updateRoom(idx, { checkInTime: e.target.value })}
                                        />
                                    </label>
                                    <label className="block text-xs font-bold">
                                        Check-out time
                                        <input
                                            className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                                            value={room.checkOutTime}
                                            onChange={(e) => updateRoom(idx, { checkOutTime: e.target.value })}
                                        />
                                    </label>
                                </div>
                                <label className="block text-xs font-bold text-gray-600">
                                    Room photos → Cloudinary (<code className="text-orange-700">roomImages_{idx}</code>)
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="mt-1 block w-full text-sm"
                                        onChange={(e) => setRoomRowFiles(idx, [...e.target.files])}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : null}
                        Publish listing
                    </button>
                </form>
            </div>
            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default StayHost;
