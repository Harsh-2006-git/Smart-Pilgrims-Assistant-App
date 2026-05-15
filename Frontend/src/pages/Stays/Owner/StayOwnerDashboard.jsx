import React, { useState, useEffect, useCallback } from "react";
import { 
  Building2, 
  Plus, 
  LayoutDashboard, 
  Hotel, 
  CalendarCheck, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  AlertCircle
} from "lucide-react";
import { resolveMediaUrl } from "../../../config/api";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { API_V1 } from "../../../config/api";
import { getStoredUser, hasStayHostAccess, isAdminUser } from "../../../utils/access";

const StayOwnerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getStoredUser();
  const token = localStorage.getItem("token");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, listingsRes] = await Promise.all([
        axios.get(`${API_V1}/stay-bookings/owner/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_V1}/stays/owner/my-listings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setListings(listingsRes.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchDashboardData();
  }, [token, navigate, fetchDashboardData]);

  if (isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Header />
        <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-lg mt-32 mb-auto">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Owner dashboard is host-only</h2>
          <p className="text-slate-500 mb-8">Admins review listings from the moderation console instead of using the owner workspace.</p>
          <Link to="/admin?tab=stays" className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold">Open Stay Moderation</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (user && !hasStayHostAccess(user)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Header />
        <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-lg mt-32 mb-auto">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Verified host access required</h2>
          <p className="text-slate-500 mb-8">You need to be a verified property owner to access the management dashboard.</p>
          <Link to="/stays" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Back to Marketplace</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleDeleteListing = async (stayId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await axios.delete(`${API_V1}/stays/${stayId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch {
      alert("Failed to delete listing");
    }
  };

  const handleToggleStatus = async (stayId) => {
    try {
      await axios.patch(`${API_V1}/stays/${stayId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your pilgrimage accommodations and bookings</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/owner/stays/new"
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium shadow-sm shadow-orange-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Property
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Listings" 
            value={stats?.totalProperties || 0} 
            icon={<Building2 className="w-6 h-6 text-orange-600" />}
            bgColor="bg-orange-50"
          />
          <StatCard 
            title="Approved Stays" 
            value={stats?.approvedProperties || 0} 
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            bgColor="bg-emerald-50"
          />
          <StatCard 
            title="Total Bookings" 
            value={stats?.totalBookings || 0} 
            icon={<CalendarCheck className="w-6 h-6 text-amber-600" />}
            bgColor="bg-amber-50"
          />
          <StatCard 
            title="Total Revenue" 
            value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} 
            icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
          />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Listings Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">My Listings</h2>
            <Link to="/owner/stays/bookings" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center">
              View all bookings <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rooms</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <Hotel className="w-12 h-12 text-slate-200 mb-3" />
                        <p>No listings found. Start by adding your first property!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  listings.map((stay) => (
                    <tr key={stay.stay_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mr-4 overflow-hidden border border-slate-100">
                            {stay.propertyImages?.[0] ? (
                              <img src={resolveMediaUrl(stay.propertyImages[0])} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-6 h-6 text-orange-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{stay.propertyName}</div>
                            <div className="text-xs text-slate-500">{stay.city}, {stay.state}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={stay.moderationStatus} active={stay.isActive} />
                        {stay.rejectionReason ? (
                          <p className="mt-2 max-w-xs text-xs text-rose-600">{stay.rejectionReason}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{stay.stayType}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {stay.rooms?.length || 0} Rooms
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => navigate(`/stays/${stay.stay_id}`)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Preview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => navigate(`/owner/stays/${stay.stay_id}/edit`)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(stay.stay_id)}
                            className={`p-2 rounded-lg transition-all ${stay.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={stay.isActive ? "Deactivate" : "Activate"}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteListing(stay.stay_id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings Section (Preview) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent Booking Requests</h2>
            <Link to="/owner/stays/bookings" className="text-sm font-medium text-orange-600 hover:text-orange-700">
              View All
            </Link>
          </div>
          <div className="p-6">
            {stats?.recentBookings?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.recentBookings.map((booking) => (
                  <div key={booking.stay_booking_id} className="p-4 rounded-xl border border-slate-100 hover:border-orange-100 hover:shadow-md hover:shadow-orange-50/50 transition-all bg-slate-50/30">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Guest</p>
                        <h4 className="font-bold text-slate-900">{booking.guestName}</h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                        booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <Hotel className="w-4 h-4 mr-2 text-slate-400" />
                        {booking.stay?.propertyName}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Link 
                      to="/owner/stays/bookings" 
                      className="w-full py-2 bg-white border border-slate-200 hover:border-orange-600 hover:text-orange-600 text-slate-600 rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                    >
                      Manage Booking
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CalendarCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p>No recent booking requests.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

const StatusBadge = ({ status, active }) => {
  if (!active) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Deactivated</span>;
  }

  switch (status) {
    case "Approved":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Live</span>;
    case "Rejected":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
    case "Suspended":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Suspended</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Pending Review</span>;
  }
};

export default StayOwnerDashboard;
