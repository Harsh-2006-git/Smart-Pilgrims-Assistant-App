import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axios from "axios";
import { Loader2, MapPin, Calendar, Phone, CheckCircle } from "lucide-react";
import { API_V1 } from "../../config/api";

const API = `${API_V1}/stays`;

const MyStayBookings = () => {
    const [tab, setTab] = useState("pilgrim");
    const [pilgrim, setPilgrim] = useState([]);
    const [host, setHost] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const auth = localStorage.getItem("token");
        if (!auth) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`${API}/my-bookings`, { headers: { Authorization: `Bearer ${auth}` } });
            setPilgrim(res.data?.pilgrim || []);
            setHost(res.data?.host || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const confirmBooking = async (bookingId) => {
        const auth = localStorage.getItem("token");
        try {
            await axios.patch(`${API}/bookings/${bookingId}/confirm`, {}, { headers: { Authorization: `Bearer ${auth}` } });
            load();
        } catch (e) {
            alert(e.response?.data?.message || "Confirm failed");
        }
    };

    const cancel = async (b) => {
        if (!window.confirm("Cancel this booking?")) return;
        const auth = localStorage.getItem("token");
        const headers = {};
        if (auth) headers.Authorization = `Bearer ${auth}`;
        try {
            await axios.patch(
                `${API}/bookings/${b.stay_booking_id}/cancel`,
                { contactPhone: String(b.contactPhone || "").trim() },
                { headers }
            );
            load();
        } catch (e) {
            alert(e.response?.data?.message || "Cancel failed");
        }
    };

    if (!localStorage.getItem("token")) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <Header />
                <p className="mt-24 text-center font-bold text-gray-600 max-w-md">
                    Sign in to see bookings tied to your account. Guest? Use booking reference + phone on the status page.
                </p>
                <Link to="/stays/booking-status" className="mt-4 text-orange-600 font-black uppercase text-sm">
                    Look up booking status
                </Link>
                <Link to="/auth" className="mt-2 text-slate-600 font-bold text-sm">
                    Go to login
                </Link>
            </div>
        );
    }

    const rows = tab === "pilgrim" ? pilgrim : host;

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />
            <div className="pt-28 pb-16 max-w-3xl mx-auto px-4">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Stay bookings</h1>
                <div className="flex gap-2 mb-8 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setTab("pilgrim")}
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ${
                            tab === "pilgrim" ? "bg-slate-900 text-white" : "bg-white border text-gray-600"
                        }`}
                    >
                        My stays (pilgrim)
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("host")}
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ${
                            tab === "host" ? "bg-slate-900 text-white" : "bg-white border text-gray-600"
                        }`}
                    >
                        Host inbox
                    </button>
                    <Link
                        to="/stays/booking-status"
                        className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-orange-50 text-orange-800 border border-orange-100"
                    >
                        Guest status lookup
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-orange-600" size={32} />
                    </div>
                ) : rows.length === 0 ? (
                    <p className="text-gray-500 font-bold text-center py-16">
                        No bookings here yet.{" "}
                        <Link className="text-orange-600" to="/stays">
                            Browse stays
                        </Link>
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {rows.map((b) => {
                            const listing = b.room?.listing;
                            const title = listing?.propertyName || "Stay";
                            const guestLabel = b.pilgrim?.name || b.guestName || "Guest";
                            return (
                                <li key={b.stay_booking_id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex justify-between items-start gap-4 flex-wrap">
                                        <div>
                                            <p className="font-black text-lg text-slate-900 uppercase tracking-tight">{title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-2">
                                                <Calendar size={12} /> {b.checkInDate} → {b.checkOutDate}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                                                <MapPin size={14} className="text-orange-500" />
                                                {listing?.city}, {listing?.state}
                                            </p>
                                            {tab === "host" && (
                                                <p className="text-sm mt-2 flex items-center gap-2 text-gray-700">
                                                    <Phone size={14} /> {guestLabel} — {b.contactPhone}
                                                </p>
                                            )}
                                            <p className="text-xs mt-2 text-gray-500">
                                                Status:{" "}
                                                <strong
                                                    className={
                                                        b.status === "Confirmed"
                                                            ? "text-green-600"
                                                            : b.status === "Pending"
                                                              ? "text-amber-600"
                                                              : ""
                                                    }
                                                >
                                                    {b.status}
                                                </strong>{" "}
                                                · ₹{b.totalAmount}
                                            </p>
                                            {tab === "pilgrim" && b.status === "Pending" && (
                                                <p className="text-[10px] text-amber-800 mt-2 font-bold uppercase tracking-wide">
                                                    Waiting for host confirmation — you will get an email when SMTP is configured.
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            {tab === "host" && b.status === "Pending" && (
                                                <button
                                                    type="button"
                                                    onClick={() => confirmBooking(b.stay_booking_id)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-white bg-green-600 px-4 py-2 rounded-xl hover:bg-green-700"
                                                >
                                                    <CheckCircle size={14} /> Confirm booking
                                                </button>
                                            )}
                                            {b.status !== "Cancelled" && (
                                                <button
                                                    type="button"
                                                    onClick={() => cancel(b)}
                                                    className="text-[10px] font-black uppercase text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="mt-12 text-center">
                    <Link to="/stays/host" className="text-orange-600 font-black text-[10px] uppercase tracking-widest">
                        + List another property
                    </Link>
                </div>
            </div>
            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default MyStayBookings;
