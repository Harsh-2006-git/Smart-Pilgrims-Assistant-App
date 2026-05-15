import React, { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, FileText, Loader2, Mail, MapPin, MessageCircleMore, Phone, Printer, QrCode, Sparkles, XCircle } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { API_V1, resolveMediaUrl } from "../../config/api";

const BACKEND_URL = API_V1;

const StayBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/stay-bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data || []);
      setSelectedBooking(response.data?.[0] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("token");
      await axios.patch(
        `${BACKEND_URL}/stay-bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Could not cancel this booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const getImageUrl = (booking) => {
    const source = booking.stay?.propertyImages?.[0] || booking.stay?.roomImages?.[0];
    return source
      ? resolveMediaUrl(source)
      : "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80";
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
      <Header />

      <div className="border-b border-orange-100 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_42%),linear-gradient(180deg,#fffdf9_0%,#fffaf3_100%)] pt-32 pb-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
              <Sparkles size={14} /> Stay Reservations
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 md:text-6xl">
              My <span className="text-orange-600">Stay Bookings</span>
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-400">
              Track room reservations, host contacts, and entry QR passes in one place.
            </p>
          </div>

          <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/45">Total Reservations</p>
            <p className="mt-3 text-5xl font-black tracking-tight text-orange-500">{bookings.length}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-[2.5rem] bg-white p-20 text-center">
                <Loader2 className="mx-auto animate-spin text-orange-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-[2.5rem] border border-dashed border-orange-200 bg-white p-20 text-center">
                <FileText className="mx-auto mb-5 text-orange-300" size={42} />
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">No stay bookings yet</h3>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Once you reserve a room, it will appear here.
                </p>
              </div>
            ) : (
              bookings.map((booking) => (
                <button
                  key={booking.stay_booking_id}
                  type="button"
                  onClick={() => setSelectedBooking(booking)}
                  className={`flex w-full items-center gap-5 rounded-[2.5rem] border-2 bg-white p-6 text-left transition-all ${
                    selectedBooking?.stay_booking_id === booking.stay_booking_id
                      ? "border-orange-500 shadow-2xl shadow-orange-100/30"
                      : "border-transparent shadow-sm hover:border-orange-100"
                  }`}
                >
                  <div className="hidden h-24 w-24 overflow-hidden rounded-[1.5rem] bg-orange-50 sm:block">
                    <img src={getImageUrl(booking)} alt={`Preview for ${booking.stay?.propertyName}`} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-orange-600">
                        {booking.checkInDate} to {booking.checkOutDate}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                          booking.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-600"
                            : booking.status === "Rejected" || booking.status === "Cancelled"
                              ? "bg-rose-50 text-rose-600"
                              : booking.status === "Pending"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-900">
                      {booking.stay?.propertyName}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <MapPin size={13} className="text-orange-500" /> {booking.stay?.city}, {booking.stay?.state}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black tracking-tight text-slate-900">Rs. {booking.totalAmount}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {booking.roomsBooked} room(s)
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="lg:sticky lg:top-32 lg:h-fit">
            {selectedBooking ? (
              <div className="rounded-[3rem] border border-orange-100 bg-white p-8 shadow-2xl shadow-orange-100/30">
                <div className="mb-8 text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
                    <QrCode size={13} className="text-orange-400" /> Stay Pass
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                    {selectedBooking.stay?.propertyName}
                  </h2>
                </div>

                {selectedBooking.qrCode ? (
                  <div className="mb-8 rounded-[2rem] border border-orange-100 bg-orange-50/40 p-6 text-center">
                    <img
                      src={selectedBooking.qrCode}
                      alt={`QR code for stay booking ${selectedBooking.stay_booking_id}`}
                      className="mx-auto h-56 w-56"
                    />
                  </div>
                ) : (
                  <div className="mb-8 rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    QR pass will appear after confirmation
                  </div>
                )}

                <div className="space-y-4 rounded-[2rem] bg-orange-50/50 p-6">
                  <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guest</span>
                    <span className="text-sm font-black text-slate-900">{selectedBooking.guestName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check-in</span>
                    <span className="text-sm font-black text-slate-900">{selectedBooking.checkInDate}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check-out</span>
                    <span className="text-sm font-black text-slate-900">{selectedBooking.checkOutDate}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guests</span>
                    <span className="text-sm font-black text-slate-900">{selectedBooking.guests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rooms</span>
                    <span className="text-sm font-black text-slate-900">{selectedBooking.roomsBooked}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-[2rem] bg-orange-50/50 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Host Contact</p>
                  {selectedBooking.stay?.contactNumber || selectedBooking.stay?.whatsappNumber || selectedBooking.stay?.contactEmail ? (
                    <div className="mt-4 space-y-3">
                      {selectedBooking.stay?.contactNumber ? (
                        <a
                          href={`tel:${selectedBooking.stay.contactNumber}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
                        >
                          <Phone size={14} /> Call Host
                        </a>
                      ) : null}
                      {selectedBooking.stay?.whatsappNumber || selectedBooking.stay?.contactNumber ? (
                        <a
                          href={`https://wa.me/${String(selectedBooking.stay.whatsappNumber || selectedBooking.stay.contactNumber).replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-600"
                        >
                          <MessageCircleMore size={14} /> WhatsApp
                        </a>
                      ) : null}
                      {selectedBooking.stay?.contactEmail ? (
                        <a
                          href={`mailto:${selectedBooking.stay.contactEmail}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-orange-50"
                        >
                          <Mail size={14} /> Email Host
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Contact will appear after confirmation.
                    </p>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
                  >
                    <Printer size={14} /> Print Stay Pass
                  </button>

                  {["Pending", "Confirmed"].includes(selectedBooking.status) ? (
                    <button
                      onClick={() => cancelBooking(selectedBooking.stay_booking_id)}
                      disabled={cancellingId === selectedBooking.stay_booking_id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-rose-600"
                    >
                      {cancellingId === selectedBooking.stay_booking_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Cancel Booking
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-orange-200 bg-white p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Select a booking to inspect the stay pass
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

export default StayBookings;
