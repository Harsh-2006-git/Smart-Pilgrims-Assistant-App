import React, { useState, useEffect, useCallback } from "react";
import { 
  CalendarCheck, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Loader2,
  Hotel
} from "lucide-react";
import axios from "axios";
import { API_V1 } from "../../../config/api";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getStoredUser, hasStayHostAccess, isAdminUser } from "../../../utils/access";

const StayOwnerBookings = () => {
  const user = getStoredUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const token = localStorage.getItem("token");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_V1}/stay-bookings/owner/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookings(res.data || []);
    } catch (error) {
      console.error("Bookings fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <CalendarCheck className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Owner booking workspace only</h2>
            <p className="text-slate-500 mt-3">Admins can monitor bookings from the admin console, but do not act as stay owners.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user && !hasStayHostAccess(user)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <CalendarCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Verified host access required</h2>
            <p className="text-slate-500 mt-3">Only verified stay hosts can access booking management.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await axios.patch(`${API_V1}/stay-bookings/owner/status/${bookingId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch {
      alert("Failed to update booking status");
    }
  };

  const filteredBookings = filter === "All" 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Booking Requests</h1>
          <p className="text-slate-500">Manage your guest reservations and confirmations</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {['All', 'Pending', 'Confirmed', 'Rejected', 'CheckedIn', 'Completed', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === s 
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-100' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
            <p className="text-slate-500">Loading your reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CalendarCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No Bookings Found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              When guests book your stay, their requests will appear here for you to manage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.stay_booking_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-orange-600" />
                    <span className="font-bold text-slate-900">{booking.stay?.propertyName}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                    booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                    booking.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Guest Info */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guest Details</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{booking.guestName}</p>
                          <p className="text-xs text-slate-500">{booking.guestPhone}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={`tel:${booking.guestPhone}`} className="p-2 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-lg transition-colors border border-slate-100">
                          <Phone className="w-4 h-4" />
                        </a>
                        <a href={`mailto:${booking.guestEmail}`} className="p-2 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-lg transition-colors border border-slate-100">
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Booking Dates */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stay Period</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {new Date(booking.checkInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {new Date(booking.checkOutDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.roomsBooked} Room(s) • {booking.guests} Guest(s)
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <span className="text-xs text-slate-500">Total Amount:</span>
                        <span className="text-sm font-bold text-slate-900 ml-1">₹{Number(booking.totalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Special Requests</p>
                      <p className="text-sm text-slate-600 italic">"{booking.specialRequests}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  {booking.status === 'Pending' && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleUpdateStatus(booking.stay_booking_id, 'Confirmed')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirm Booking
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(booking.stay_booking_id, 'Rejected')}
                        className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}

                  {booking.status === 'Confirmed' && (
                    <button 
                      onClick={() => handleUpdateStatus(booking.stay_booking_id, 'CheckedIn')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      Check In Guest
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StayOwnerBookings;
