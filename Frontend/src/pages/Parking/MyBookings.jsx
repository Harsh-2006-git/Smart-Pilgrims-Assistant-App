import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
    Calendar,
    MapPin,
    Car,
    QrCode,
    Loader2,
    History,
    FileText,
    Printer,
    Sparkles
} from "lucide-react";
import axios from "axios";
import { API_V1, resolveMediaUrl } from "../../config/api";

const BACKEND_URL = API_V1;

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const fetchMyBookings = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${BACKEND_URL}/booking/my-bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBookings(res.data);
                if (res.data.length > 0) setSelectedBooking(res.data[0]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyBookings();
    }, []);

    const getImageUrl = (path) => {
        if (!path) return "https://images.unsplash.com/photo-1506521781263-d8422e82f27a";
        return resolveMediaUrl(path);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-jakarta">
            <Header />

            {/* Hero Section */}
            <div className="pt-32 pb-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                            <History size={14} /> Activity Feed
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                            My <span className="text-orange-600">Transactions</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            Manage your digital entries and booking history.
                        </p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center gap-8 shadow-2xl">
                        <div className="text-center">
                            <span className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Trips</span>
                            <span className="text-3xl font-black text-orange-500 tracking-tighter">{bookings.length}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                            <span className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Status</span>
                            <span className="text-lg font-black uppercase tracking-widest text-green-500">Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* List */}
                    <div className="lg:col-span-7 space-y-6">
                        {loading ? (
                            <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-600" /></div>
                        ) : bookings.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-widest">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                No Activity Detected
                            </div>
                        ) : (
                            bookings.map((booking) => (
                                <div
                                    key={booking.booking_id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className={`bg-white p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center gap-6 ${selectedBooking?.booking_id === booking.booking_id ? 'border-orange-500 shadow-xl scale-[1.02]' : 'border-transparent shadow-sm hover:border-gray-100'}`}
                                >
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 hidden sm:block shrink-0 ring-4 ring-gray-50">
                                        <img src={getImageUrl(booking.parkingSlot?.images?.[0])} className="w-full h-full object-cover" alt={`Preview of booked parking slot: ${booking.parkingSlot?.title}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{new Date(booking.startTime).toLocaleDateString()}</span>
                                            <span className="text-[8px] font-black uppercase text-green-600 px-3 py-1 bg-green-50 rounded-full">{booking.status}</span>
                                        </div>
                                        <h3 className="font-black text-gray-900 uppercase text-lg tracking-tighter truncate max-w-[200px]">{booking.parkingSlot?.title}</h3>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase mt-2">
                                            <MapPin size={12} className="text-orange-500" /> {booking.parkingSlot?.address.substring(0, 30)}...
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="block text-2xl font-black text-gray-900 tracking-tighter">₹{booking.totalAmount}</span>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PAID</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* QR Details */}
                    <div className="lg:col-span-5 h-fit sticky top-32">
                        {selectedBooking ? (
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 ring-8 ring-gray-100/30">
                                <div className="text-center mb-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest mb-6">
                                        <Sparkles size={10} className="text-orange-500" /> Virtual Pass
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-[2rem] inline-block mb-6 border border-gray-100">
                                        <img src={selectedBooking.qrCode} className="w-56 h-56" alt={`Entry QR Code for reservation #${selectedBooking.booking_id} at ${selectedBooking.parkingSlot?.title}`} />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Ready to Enter</h3>
                                    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Scan this at the entrance checkpoint</p>
                                </div>

                                <div className="space-y-4 text-left p-8 bg-gray-50 rounded-[2rem] border border-gray-100 mb-8 font-jakarta">
                                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle ID</span>
                                        <span className="text-xs font-black uppercase text-slate-900">{selectedBooking.vehicleNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-In</span>
                                        <span className="text-xs font-bold text-slate-600">{new Date(selectedBooking.startTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservation ID</span>
                                        <span className="text-xs font-bold text-slate-600">#{selectedBooking.booking_id}00X</span>
                                    </div>
                                </div>

                                <button onClick={() => window.print()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl">
                                    <Printer size={16} /> Print Entry Pass
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest leading-relaxed">
                                Select activity to broadcast pass
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
            <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
        </div>
    );
};

export default MyBookings;
