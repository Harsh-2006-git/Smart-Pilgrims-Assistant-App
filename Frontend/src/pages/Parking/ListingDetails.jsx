import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
    MapPin,
    Clock,
    IndianRupee,
    AlertCircle,
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Shield
} from "lucide-react";
import axios from "axios";
import { API_V1, resolveMediaUrl } from "../../config/api";

const BACKEND_URL = API_V1;

const ListingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [bookingData, setBookingData] = useState({
        vehicleNumber: "",
        startTime: "",
        endTime: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchSlotDetails = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/parking/${id}`);
                setSlot(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlotDetails();
    }, [id]);

    const handleBooking = async (e) => {
        e.preventDefault();
        setError("");
        setProcessing(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${BACKEND_URL}/booking`,
                { parking_slot_id: id, ...bookingData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Simple verification step (Simulated)
            await axios.post(`${BACKEND_URL}/booking/verify`,
                { razorpay_order_id: res.data.order.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Booking failed.");
        } finally {
            setProcessing(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return "https://images.unsplash.com/photo-1506521781263-d8422e82f27a";
        return resolveMediaUrl(path);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
    );

    if (!slot) return <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-black tracking-widest">Infratructure error</div>;

    const totalHours = bookingData.startTime && bookingData.endTime
        ? Math.ceil((new Date(bookingData.endTime) - new Date(bookingData.startTime)) / (1000 * 60 * 60))
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />

            {/* Simple Sweet Hero */}
            <div className="pt-32 pb-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 hover:text-orange-600 transition-colors">
                        <ArrowLeft size={14} /> Back to network
                    </button>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase mb-4">
                                <Shield size={12} /> Verified Space
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{slot.title}</h1>
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                <MapPin size={16} className="text-orange-500" /> {slot.address}
                            </div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-3xl text-white text-center min-w-[180px]">
                            <span className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Standard Rate</span>
                            <span className="text-3xl font-black text-orange-500 tracking-tighter">₹{slot.pricePerHour}</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase ml-1">/HR</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                {success ? (
                    <div className="bg-white p-16 rounded-[3rem] text-center shadow-2xl border border-gray-50 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white shadow-lg rotate-12">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Booking Confirmed!</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] mt-2 mb-10 tracking-widest">Your digital entry pass is now ready</p>
                        <button onClick={() => navigate('/parking/my-bookings')} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-xl">Go to My Passes</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Media & Info */}
                        <div className="lg:col-span-7 space-y-10">
                            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-gray-100 p-2">
                                <img src={getImageUrl(slot.images?.[0])} className="w-full h-full object-cover rounded-[2.5rem]" alt={`High resolution view of ${slot.title} parking space`} />
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Infrastructure Logs</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed italic">"{slot.description || "No specific instructions provided by host."}"</p>
                            </div>
                        </div>

                        {/* Booking Terminal */}
                        <div className="lg:col-span-5 h-fit">
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 ring-8 ring-gray-100/30">
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-8">Booking Terminal</h3>

                                <form onSubmit={handleBooking} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Vehicle Assignment</label>
                                        <input required type="text" placeholder="MH 12 AB 1234" value={bookingData.vehicleNumber} onChange={e => setBookingData({ ...bookingData, vehicleNumber: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-black text-sm uppercase transition-all" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Arrival Wave</label>
                                            <input required type="datetime-local" value={bookingData.startTime} onChange={e => setBookingData({ ...bookingData, startTime: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 font-bold text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Departure Wave</label>
                                            <input required type="datetime-local" value={bookingData.endTime} onChange={e => setBookingData({ ...bookingData, endTime: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 font-bold text-xs" />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-4">
                                        <div className="flex justify-between items-center opacity-40">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Protocol Fee</span>
                                            <span className="text-[9px] font-black uppercase italic">₹0.00</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest">Total Valuation</span>
                                            <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{totalHours * slot.pricePerHour}</span>
                                        </div>
                                    </div>

                                    <button disabled={processing} type="submit" className="w-full py-6 bg-orange-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-xl shadow-orange-500/20 active:scale-95">
                                        {processing ? <Loader2 size={18} className="animate-spin" /> : "Initiate Reservation"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default ListingDetails;
