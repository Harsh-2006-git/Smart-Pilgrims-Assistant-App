import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Shield,
  Star,
  Crown,
  Sparkles,
  Download,
  Radio,
  CreditCard,
  Edit2,
  Camera,
  Save,
  X,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Users,
  Search,
  Link,
  Lock,
  Eye,
  MapPin
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";
import { API_V1, resolveMediaUrl } from "../config/api";

const ProfileRfidPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rfidData, setRfidData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", relationship: "Parent" });
  const [myGuardians, setMyGuardians] = useState([]);
  const [trackingList, setTrackingList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const cardRef = useRef(null);
  const downloadWrapperRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchFamilyMembers();
    fetchGuardians();
    fetchTrackingList();
    fetchPendingRequests();
  }, [navigate]);

  const fetchGuardians = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/location/my-guardians`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyGuardians(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchTrackingList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/location/tracking-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTrackingList(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/location/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPendingRequests(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleApproveRequest = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/location/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setSuccess("Request approved! You can now track this devotee. ✨");
        fetchPendingRequests();
        fetchTrackingList();
      }
    } catch (err) { console.error(err); }
  };

  const handleSearchUser = async (e) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setSearchResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/auth/search?phone=${searchPhone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSearchResult(data);
      else setError(data.message || "User not found");
    } catch (err) { setError("Search failed"); }
    finally { setIsSearching(false); }
  };

  const handleLinkUser = async (guardianId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/location/guardian`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ guardianId }),
      });
      if (res.ok) {
        setSuccess("Tracking request sent! Waiting for approval.");
        setShowSearchModal(false);
        fetchGuardians();
      } else {
        const data = await res.json();
        setError(data.message || "Link failed");
      }
    } catch (err) { console.error(err); }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // Skip if no token — fetchProfile will handle redirect
      const res = await fetch(`${API_V1}/family/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // Token is invalid/expired — fetchProfile will handle the redirect
        return;
      }
      const data = await res.json();
      if (res.ok) setFamilyMembers(data.members || []);
    } catch (err) {
      console.error("Family fetch failed", err);
    }
  };

  const handleAddFamily = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/family/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(familyForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFamilyMembers([...familyMembers, data.member]);
        setShowFamilyModal(false);
        setFamilyForm({ name: "", relationship: "Parent" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFamily = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/family/remove/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFamilyMembers(familyMembers.filter(m => m.member_id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      const res = await fetch(`${API_V1}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Token is expired or invalid — clear storage and redirect to login
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setEditForm({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            userType: data.user.userType || "Civilian",
          });
          generateRfid(data.user);
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          setLoading(false);
          return;
        }
      }

      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setEditForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          userType: u.userType || "Civilian",
        });
        setLoading(false);
      } else {
        localStorage.removeItem("token");
        navigate("/auth");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const generateRfid = async (profileUser) => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/zone/generate`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRfidData(data);
      else setError(data.message || "Failed to generate RFID tag");
    } catch {
      setError("Something went wrong");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (editForm.userType === "Admin" && user.userType !== "Admin") {
      setError("You cannot elevate your role to Admin.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      formData.append("phone", editForm.phone);
      // Removed: formData.append("userType", editForm.userType);
      if (profileImage) {
        formData.append("profile_image", profileImage);
      }

      const res = await fetch(`${API_V1}/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setSuccess("Profile updated successfully! ✨");
        setIsEditing(false);
        setProfileImage(null);
        setPreviewUrl(null);
      } else {
        setError(data.message || "Update failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const downloadRfidCard = () => {
    if (!downloadWrapperRef.current) return;
    setTimeout(() => {
      htmlToImage
        .toPng(downloadWrapperRef.current, {
          backgroundColor: "#ffffff",
          quality: 1,
          pixelRatio: 4,
          style: {
            transform: 'scale(1)',
            opacity: '1'
          }
        })
        .then((dataUrl) => {
          saveAs(dataUrl, `${user.name.replace(/\s+/g, "_")}_rfid_card_full.png`);
        })
        .catch((err) => console.error("Download failed", err));
    }, 100);
  };

  const getDevoteeIcon = (level) => {
    switch (level) {
      case "Premium": return <Crown className="w-5 h-5 text-amber-500" />;
      case "Gold": return <Star className="w-5 h-5 text-yellow-500" />;
      case "Admin": return <Shield className="w-5 h-5 text-rose-600" />;
      default: return <Shield className="w-5 h-5 text-orange-500" />;
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Left Panel: Profile Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[10px] font-bold text-orange-700 uppercase tracking-wider border border-orange-100">
                    {getDevoteeIcon(user.userType)}
                    {user.userType}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-slate-50 text-slate-400 hover:text-orange-600 transition-all rounded-full"
                      title="Edit Profile"
                    >
                      <Edit2 size={20} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center mb-8">
                  <div className="relative group/avatar cursor-pointer">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-white border-2 border-slate-100 shadow-sm transition-transform active:scale-95">
                      <div className="w-full h-full rounded-full bg-slate-50 overflow-hidden flex items-center justify-center">
                        {previewUrl || (user.profile_image ? resolveMediaUrl(user.profile_image) : null) ? (
                          <img src={previewUrl || resolveMediaUrl(user.profile_image)} alt={`${user.name}'s Profile Picture`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-4xl font-black">
                            {user.name?.[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <label className="absolute bottom-1 right-1 bg-orange-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-orange-700 transition-colors border-2 border-white">
                        <Camera size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="text-center mt-5">
                      <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                      <p className="text-slate-500 text-sm flex items-center justify-center gap-1.5 mt-1">
                        <Calendar size={14} className="text-orange-500" />
                        Devotee since {new Date(user.created_at).getFullYear()}
                      </p>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Identifier</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                      >
                        <Save size={18} /> Sync Details
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); setPreviewUrl(null); }}
                        className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mr-4 shrink-0">
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact Email</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{user.email || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mr-4 shrink-0">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile Number</p>
                        <p className="text-sm font-semibold text-slate-700">{user.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-center gap-2"> <AlertCircle size={14} /> {error}</div>}
                {success && <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl flex items-center gap-2"> <CheckCircle size={14} /> {success}</div>}
              </div>
            </div>
          </div>

          {/* Right Panel: RFID Card */}
          <div className="lg:col-span-7 space-y-8 flex flex-col items-center">

            <div className="w-full max-w-[440px] lg:sticky lg:top-28">
              {/* HIDDEN DOWNLOAD WRAPPER - Contains both sides for high-quality export */}
              <div className="fixed -left-[2000px] top-0 pointer-events-none">
                <div ref={downloadWrapperRef} className="p-10 bg-white flex flex-col gap-10 w-[600px]">
                  {/* FRONT SIDE (REPLICATED FOR EXPORT) */}
                  <div className="aspect-[1.6/1] w-full bg-white rounded-[2rem] p-8 text-slate-800 shadow-2xl border border-slate-100 relative overflow-hidden ring-1 ring-black/5">
                    {/* Same logic as visible card */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none font-mono text-[7px] leading-[10px] rotate-12 -translate-x-10 -translate-y-10">
                      {(user.name + " ").repeat(2000)}
                    </div>
                    <div className="flex justify-between items-start relative z-10 mb-8">
                      <div className="flex items-center gap-3">
                        <img src={logo} alt="Divya Yatra Mandir Logo" className="h-full w-auto object-contain" onError={() => setImgError(true)} />
                        <div className="border-l border-slate-200 pl-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 mb-0.5">DIVYA</p>
                          <p className="text-[11px] font-bold text-slate-400">SMART TRAVELER</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Radio className="text-slate-300 mb-1" size={16} />
                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">NFC ENABLED</span>
                      </div>
                    </div>
                    <div className="mb-8 w-14 h-10 bg-[#dcdcdc] rounded-md shadow-sm border border-slate-300/50"></div>
                    <div className="flex justify-between items-end relative z-10">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Pass Holder</p>
                          <h4 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">{user.name}</h4>
                        </div>
                        <div className="flex gap-10">
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                            <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>{user.userType}
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">System ID</p>
                            <p className="text-[11px] font-mono font-bold text-slate-800 uppercase">RFID-{user.id?.toString().padStart(6, '0')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 ring-4 ring-slate-50">
                        <img src={rfidData?.qrImage} alt={`QR code for ${user.name}'s digital pass`} className="w-20 h-20" />
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="aspect-[1.6/1] w-full bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`, backgroundSize: '24px 24px' }}></div>
                    </div>
                    <div className="relative z-10 h-full flex flex-col items-center justify-center">
                      <div className="mb-4 text-center">
                        <img src={logo} alt="" role="presentation" className="h-10 mx-auto mb-2 brightness-0 invert opacity-40" />
                        <p className="text-[8px] font-black tracking-[0.4em] text-orange-400 uppercase">Sacred Journey Verified</p>
                      </div>
                      <div className="bg-white p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(249,115,22,0.3)] transform transition-transform">
                        <img src={rfidData?.qrImage} alt={`Enlarged QR code for ${user.name}'s digital pass`} className="w-44 h-44 object-contain" />
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scan for Fast Access & Navigation</p>
                        <p className="text-[7px] text-slate-500 italic opacity-60">This pass is non-transferable and property of Divya Yatra Authorities.</p>
                      </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-sm md:text-lg font-bold text-slate-900 bg-orange-50 px-3 py-1 rounded-lg flex items-center gap-2">
                  <CreditCard className="text-orange-500" size={18} /> Spiritual Digital Pass
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Active</span>
                </div>
              </div>

              {rfidData ? (
                <div className="perspective-1000 group">
                  <div
                    ref={cardRef}
                    className="aspect-[1.6/1] w-full bg-white rounded-2xl md:rounded-[1.25rem] p-4 sm:p-7 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden transition-all duration-700 border border-slate-100 ring-1 ring-black/5"
                  >
                    {/* Security Microprint */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none font-mono text-[5px] sm:text-[6px] leading-[8px] rotate-12 -translate-x-10 -translate-y-10">
                      {(user.name + " ").repeat(2000)}
                    </div>

                    {/* Header: User Logo or Fallback */}
                    <div className="flex justify-between items-start relative z-10 mb-4 sm:mb-8">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-7 sm:h-10 w-auto flex items-center">
                          {!imgError ? (
                            <img
                              src={logo}
                              alt="Divya Yatra Mandir Logo"
                              className="h-full w-auto object-contain"
                              onError={() => setImgError(true)}
                            />
                          ) : (
                            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl">🕉</div>
                          )}
                        </div>
                        <div className="border-l border-slate-200 pl-2 sm:pl-3">
                          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 leading-none mb-0.5">DIVYA</p>
                          <p className="text-[9px] sm:text-[11px] font-bold text-slate-400">SMART TRAVELER</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 flex items-center justify-center mb-1">
                          <Radio className="text-slate-300" size={14} />
                        </div>
                        <span className="text-[5px] sm:text-[6px] font-black text-slate-300 uppercase tracking-widest text-center">NFC ENABLED</span>
                      </div>
                    </div>

                    {/* Smart Chip */}
                    <div className="mb-4 sm:mb-6 w-10 h-7 sm:w-12 sm:h-9 bg-[#dcdcdc] rounded-md relative shadow-sm overflow-hidden border border-slate-300/50">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-[0.5px] h-[0.5px] bg-black/10"></div>
                      <div className="absolute inset-y-0 left-1/2 -translate-x-[0.5px] w-[0.5px] bg-black/10"></div>
                      <div className="absolute top-1.5 left-1.5 right-1.5 bottom-1.5 rounded-sm border border-black/5"></div>
                    </div>

                    {/* Content Section */}
                    <div className="flex justify-between items-end relative z-10">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <p className="text-[7px] sm:text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1.5">Pass Holder</p>
                          <h4 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-none truncate max-w-[150px] sm:max-w-none">{user.name}</h4>
                        </div>

                        <div className="flex gap-4 sm:gap-10">
                          <div>
                            <p className="text-[7px] sm:text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Category</p>
                            <div className="flex items-center gap-1">
                              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${user.userType === 'Admin' ? 'bg-rose-500' : 'bg-orange-500'}`}></span>
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-800 uppercase tracking-tighter">{user.userType}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[7px] sm:text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">System ID</p>
                            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-800 uppercase tracking-tighter">RFID-{user.id?.toString().padStart(6, '0') || '004921'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="group/qr relative -mr-2 sm:mr-0 scale-90 sm:scale-100">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-orange-500/10 to-transparent blur-xl rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity"></div>
                        <div className="bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 ring-4 ring-slate-50 relative z-10">
                          <img src={rfidData.qrImage} alt={`QR Code for ${user.name}`} className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
                        </div>
                      </div>
                    </div>

                    {/* Holographic Security Feature */}
                    <div className="absolute bottom-5 right-10 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/5 to-white/10 blur-md pointer-events-none"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                  </div>

                  <button
                    onClick={downloadRfidCard}
                    className="mt-8 w-full group/btn bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                  >
                    <Download className="group-hover/btn:-translate-y-1 transition-transform" />
                    Download Official Pass
                  </button>
                </div>
              ) : (
                <div className="aspect-[1.6/1] bg-white border border-slate-200 rounded-[1.25rem] flex flex-col items-center justify-center text-slate-400 gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center animate-pulse border border-slate-100">
                    <Radio size={24} className="text-slate-200" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Encoding Data...</p>
                </div>
              )}

              <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
                <p className="text-[11px] leading-relaxed text-slate-500 relative z-10">
                  <span className="text-orange-600 font-bold block mb-1.5 uppercase tracking-wider">Authentication Protocol</span>
                  This authenticated RFID pass is your primary credential for the smart corridor. Scanners at Temple Gates, VIP Lanes, and Food Counters will verify this token in real-time. Unauthorized duplication is strictly prohibited under spiritual and local governance.
                </p>
              </div>

              {/* FAMILY SECTION */}
              <div className="mt-12 w-full">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Family <span className="text-orange-600">Circle</span></h3>
                  <button
                    onClick={() => setShowFamilyModal(true)}
                    className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                  >
                    + Register Member
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {familyMembers.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-3 text-slate-400">
                      <Users size={32} className="opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No family members registered</p>
                    </div>
                  ) : familyMembers.map(member => (
                    <div key={member.member_id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <img src={member.qr_image} alt={`QR Code for family member ${member.name}`} className="w-12 h-12" />
                        </div>
                        <div>
                          <h5 className="text-sm font-black text-slate-900 leading-tight">{member.name}</h5>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{member.relationship} • {member.unique_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = member.qr_image;
                            link.download = `${member.name}_QR.png`;
                            link.click();
                          }}
                          className="p-2 text-slate-300 hover:text-orange-600 transition-colors"
                          title="Download QR"
                        >
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleRemoveFamily(member.member_id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAFETY & TRACKING CIRCLE */}
              <div className="mt-12 w-full">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Safety <span className="text-blue-600">Circle</span></h3>
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    + Link Existing User
                  </button>
                </div>

                <div className="space-y-6">
                    {/* My Guardians */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Who Can Track Me</p>
                        <div className="grid grid-cols-1 gap-2">
                            {myGuardians.map(g => (
                                <div key={g.mapping_id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Shield size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{g.guardian.name}</p>
                                            <p className="text-[10px] text-slate-400">{g.guardian.phone}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${g.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {g.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                            {myGuardians.length === 0 && <p className="text-[10px] text-slate-400 italic ml-2">No guardians linked</p>}
                        </div>
                    </div>

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 ml-2">
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-[0.2em]">New Association Requests</p>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {pendingRequests.map(req => (
                                    <div key={req.mapping_id} className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm font-bold text-xs">
                                                {req.user.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{req.user.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold italic">Wants you as guardian</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleApproveRequest(req.user.client_id)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* People I track */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">People I Track</p>
                        <div className="grid grid-cols-1 gap-2">
                            {trackingList.map(p => (
                                <div key={p.mapping_id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Eye size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{p.user.name}</p>
                                            <p className="text-[10px] text-slate-400">{p.user.phone}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/guardian-panel')}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all transition-transform active:scale-95"
                                    >
                                        <MapPin size={16} />
                                    </button>
                                </div>
                            ))}
                            {trackingList.length === 0 && <p className="text-[10px] text-slate-400 italic ml-2">Not tracking anyone</p>}
                        </div>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-subtle-float {
          animation: subtle-float 4s ease-in-out infinite;
        }
      `}</style>
      <Footer />

      {/* FAMILY MODAL */}
      <AnimatePresence>
        {showFamilyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16"></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Add Family <span className="text-orange-600">Member</span></h3>

              <form onSubmit={handleAddFamily} className="space-y-5 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={familyForm.name}
                    onChange={e => setFamilyForm({ ...familyForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:border-orange-500 transition-all outline-none font-bold"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</label>
                  <select
                    value={familyForm.relationship}
                    onChange={e => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:border-orange-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                  >
                    <option>Parent</option>
                    <option>Spouse</option>
                    <option>Child</option>
                    <option>Sibling</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all">Generate Pass</button>
                  <button type="button" onClick={() => setShowFamilyModal(false)} className="px-6 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SEARCH MODAL */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
              
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Link <span className="text-blue-600">Devotee</span></h3>
                <button onClick={() => { setShowSearchModal(false); setSearchResult(null); setSearchPhone(""); }} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Search by Mobile No.</p>
                  <form onSubmit={handleSearchUser} className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-4 focus:border-blue-500 transition-all outline-none font-bold placeholder:text-slate-300"
                    />
                    <button 
                      type="submit" 
                      disabled={isSearching}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search size={20} />}
                    </button>
                  </form>
                </div>

                {searchResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-slate-50 rounded-[2rem] border border-blue-100 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-white p-1 border-2 border-blue-100 shadow-sm">
                      {searchResult.profile_image ? (
                        <img src={resolveMediaUrl(searchResult.profile_image)} alt={`${searchResult.name}'s Profile Picture`} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-black">
                          {searchResult.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">{searchResult.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{searchResult.phone}</p>
                    </div>
                    <button 
                      onClick={() => handleLinkUser(searchResult.client_id)}
                      className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Link size={16} /> Link and Request Access
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileRfidPage;
