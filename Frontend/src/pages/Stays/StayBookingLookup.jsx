import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axios from "axios";
import { Loader2, Search } from "lucide-react";
import { API_V1 } from "../../config/api";

const API = `${API_V1}/stays`;

const StayBookingLookup = () => {
    const [bookingId, setBookingId] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState("");

    const lookup = async (e) => {
        e.preventDefault();
        setErr("");
        setResult(null);
        if (!bookingId.trim() || !phone.trim()) {
            setErr("Enter booking reference and the phone number used when booking.");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API}/bookings/${bookingId.trim()}/status`, {
                params: { contactPhone: phone.trim() },
            });
            setResult(res.data);
        } catch (e2) {
            setErr(e2.response?.data?.message || "Could not load status.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />
            <div className="pt-28 pb-20 max-w-lg mx-auto px-4">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Booking status</h1>
                <p className="text-sm text-gray-500 mb-8">
                    Use the booking number and phone you gave when reserving (no login required).
                </p>
                <form onSubmit={lookup} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-lg space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase">Booking reference #</label>
                        <input
                            className="mt-1 w-full px-4 py-3 rounded-xl border bg-gray-50 font-bold"
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            inputMode="numeric"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase">Contact phone</label>
                        <input
                            type="tel"
                            className="mt-1 w-full px-4 py-3 rounded-xl border bg-gray-50 font-bold"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    {err && <p className="text-red-600 text-sm font-bold">{err}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                        Look up
                    </button>
                </form>

                {result && (
                    <div className="mt-8 bg-white rounded-3xl border border-gray-100 p-8 shadow">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                        <p className="text-2xl font-black text-orange-600 uppercase mb-4">{result.status}</p>
                        <ul className="text-sm text-gray-700 space-y-2">
                            <li>
                                <strong>{result.propertyName}</strong> · {result.city}
                            </li>
                            <li>
                                Check-in {result.checkInDate} → Check-out {result.checkOutDate}
                            </li>
                            <li>
                                Rooms {result.roomsBooked} · Guests {result.guests} · ₹{result.totalAmount}
                            </li>
                            <li>
                                Host: <a className="text-orange-600 font-bold" href={`tel:${result.ownerContact}`}>{result.ownerContact}</a>
                            </li>
                        </ul>
                        <p className="text-[10px] text-gray-400 mt-6">
                            Pending = host has not confirmed yet. Confirmed = you are good to coordinate arrival.
                        </p>
                    </div>
                )}

                <p className="text-center mt-10">
                    <Link to="/stays" className="text-orange-600 font-black text-[10px] uppercase tracking-widest">
                        ← Back to stays
                    </Link>
                </p>
            </div>
            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default StayBookingLookup;
