import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  Loader2
} from "lucide-react";
import axios from "axios";
import { API_V1, resolveMediaUrl } from "../../../config/api";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getStoredUser, isAdminUser } from "../../../utils/access";

const StayAdminPanel = () => {
  const user = getStoredUser();
  const [stays, setStays] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [selectedStay, setSelectedStay] = useState(null);
  const [modulating, setModulating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const token = localStorage.getItem("token");

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [staysRes, bookingsRes] = await Promise.all([
        axios.get(`${API_V1}/admin/stays`, {
          params: { status: filter },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_V1}/stay-bookings/admin/all-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStays(staysRes.data);
      
      // Calculate basic stats for admin
      const allStays = staysRes.data;
      const allBookings = bookingsRes.data;
      
      setStats({
        totalStays: allStays.length,
        pendingStays: allStays.filter(s => s.moderationStatus === 'Pending').length,
        activeStays: allStays.filter(s => s.isActive && s.moderationStatus === 'Approved').length,
        totalBookings: allBookings.length,
        totalRevenue: allBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
      });
    } catch (error) {
      console.error("Admin data fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleModerate = async (stayId, action) => {
    if (action === 'reject' && !rejectionReason) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setModulating(true);
      await axios.patch(`${API_V1}/admin/stays/${stayId}/moderate`, {
        action,
        reason: action === 'reject' ? rejectionReason : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedStay(null);
      setRejectionReason("");
      fetchAdminData();
    } catch {
      alert(`Failed to ${action} stay`);
    } finally {
      setModulating(false);
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <ShieldCheck className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Administrator access required</h2>
            <p className="text-slate-500 mt-3">This moderation workspace is only available to administrators.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-600 rounded-lg text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Platform Moderation</h1>
          </div>
          <p className="text-slate-500">SacredStay Governance & Quality Assurance Panel</p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatBox title="Total Listings" value={stats?.totalStays || 0} icon={<Building2 />} color="orange" />
          <StatBox title="Pending Review" value={stats?.pendingStays || 0} icon={<AlertTriangle />} color="amber" />
          <StatBox title="Active Bookings" value={stats?.totalBookings || 0} icon={<CalendarCheck />} color="emerald" />
          <StatBox title="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} icon={<TrendingUp />} color="blue" />
        </div>

        {/* Filters & Actions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {['Pending', 'Approved', 'Rejected', 'Suspended', 'All'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status 
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-100' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search property or owner..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none min-w-[300px]"
            />
          </div>
        </div>

        {/* Listings Queue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property & Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
                    </td>
                  </tr>
                ) : stays.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No listings found for this filter.
                    </td>
                  </tr>
                ) : (
                  stays.map((stay) => (
                    <tr key={stay.stay_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mr-3 text-orange-600 font-bold">
                            {stay.propertyName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{stay.propertyName}</div>
                            <div className="text-xs text-slate-500 flex items-center">
                              <Users className="w-3 h-3 mr-1" /> {stay.owner?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{stay.city}</div>
                        <div className="text-xs text-slate-500">{stay.state}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          stay.moderationStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          stay.moderationStatus === 'Pending' ? 'bg-blue-100 text-blue-700' :
                          stay.moderationStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stay.moderationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(stay.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedStay(stay)}
                          className="px-4 py-1.5 text-sm font-medium bg-slate-100 hover:bg-orange-600 hover:text-white rounded-lg transition-all"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {selectedStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Review Listing: {selectedStay.propertyName}</h3>
              <button onClick={() => setSelectedStay(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-orange-600" /> Property Images
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedStay.propertyImages?.map((img, i) => (
                      <img key={i} src={resolveMediaUrl(img)} alt="" className="w-full h-32 object-cover rounded-lg border border-slate-100" />
                    ))}
                    {(!selectedStay.propertyImages || selectedStay.propertyImages.length === 0) && (
                      <div className="col-span-2 py-8 text-center bg-slate-50 rounded-lg text-slate-400 border-2 border-dashed border-slate-200">
                        No images uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedStay.description || "No description provided."}</p>
                  </div>
                  {selectedStay.rejectionReason ? (
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                      <p className="text-xs text-rose-500 font-medium uppercase tracking-wider">Last Rejection Reason</p>
                      <p className="text-sm font-semibold text-rose-700 mt-1">{selectedStay.rejectionReason}</p>
                    </div>
                  ) : null}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 font-medium">Property Type</p>
                      <p className="text-sm font-bold text-slate-900">{selectedStay.stayType}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 font-medium">Total Rooms</p>
                      <p className="text-sm font-bold text-slate-900">{selectedStay.rooms?.length || 0} Configured</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Owner Information</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-bold">{selectedStay.owner?.name}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-bold">{selectedStay.owner?.phone}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-bold">{selectedStay.owner?.email || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-4">Moderation Decision</h4>
                
                {selectedStay.moderationStatus === 'Pending' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason (only if rejecting)</label>
                      <textarea 
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="Explain why this listing is being rejected..."
                        rows="3"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleModerate(selectedStay.stay_id, 'approve')}
                        disabled={modulating}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {modulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Approve & Go Live
                      </button>
                      <button 
                        onClick={() => handleModerate(selectedStay.stay_id, 'reject')}
                        disabled={modulating}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {modulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        Reject Listing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-slate-600">This listing has already been <span className="font-bold text-slate-900">{selectedStay.moderationStatus}</span>.</p>
                    {selectedStay.moderationStatus === 'Approved' && (
                      <button 
                        onClick={() => handleModerate(selectedStay.stay_id, 'suspend')}
                        className="mt-3 text-amber-600 font-bold hover:underline"
                      >
                        Suspend Listing
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const StatBox = ({ title, value, icon, color }) => {
  const colors = {
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600"
  };
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
};

export default StayAdminPanel;
