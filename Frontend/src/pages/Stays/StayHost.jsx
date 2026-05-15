import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Building2, Camera, CheckCircle2, Loader2, MapPin, Navigation, ShieldCheck, Sparkles, X, LayoutList } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import StayLocationMap from "../../components/stays/StayLocationMap";
import { API_V1, resolveMediaUrl } from "../../config/api";
import { getStoredUser, hasStayHostAccess, isAdminUser } from "../../utils/access";

const BACKEND_URL = API_V1;
const defaultPosition = { latitude: 23.1765, longitude: 75.7849 };

const amenitySuggestions = [
  "Hot water",
  "Blankets",
  "Temple shuttle",
  "Women-friendly stay",
  "First-aid kit",
  "CCTV coverage",
  "Group check-in",
  "Wheelchair access",
];

const facilityFields = [
  { key: "foodAvailable", label: "Food availability" },
  { key: "washroom", label: "Washroom" },
  { key: "parking", label: "Parking" },
  { key: "familyRooms", label: "Family rooms" },
  { key: "wifi", label: "WiFi" },
  { key: "security", label: "Security" },
  { key: "medicalAssistanceNearby", label: "Medical assistance nearby" },
  { key: "wheelchairAccess", label: "Wheelchair accessible" },
  { key: "cctv", label: "CCTV surveillance" },
  { key: "fireExtinguisher", label: "Fire extinguishers" },
  { key: "backupGenerator", label: "Power backup" },
];

const facilityAmenityMap = {
  wheelchairAccess: "Wheelchair access",
  cctv: "CCTV surveillance",
  fireExtinguisher: "Fire extinguishers",
  backupGenerator: "Power backup",
};

const createInitialRoomData = () => ({
  room_id: null,
  roomType: "Double",
  capacity: 2,
  pricePerNight: "",
  availableRooms: 1,
  description: "",
  amenities: [],
  existingRoomImages: [],
  roomFiles: [],
  imagePreviews: [],
});

const createInitialFormData = (user = {}) => ({
  propertyName: "",
  stayType: "Homestay",
  ownerName: user.name || "",
  contactNumber: user.phone || "",
  contactEmail: user.email || "",
  whatsappNumber: user.phone || "",
  description: "",
  address: "",
  city: "",
  state: "",
  pilgrimageRoute: "",
  nearbyTemple: "",
  distanceFromTempleKm: "",
  rooms: [createInitialRoomData()],
  foodAvailable: false,
  washroom: true,
  parking: false,
  familyRooms: false,
  wifi: false,
  security: false,
  medicalAssistanceNearby: false,
  wheelchairAccess: false,
  cctv: false,
  fireExtinguisher: false,
  backupGenerator: false,
  amenities: [],
  latitude: defaultPosition.latitude.toString(),
  longitude: defaultPosition.longitude.toString(),
});

const buildRoomFormData = (room = {}) => ({
  room_id: room.room_id || null,
  roomType: room.roomType || "Double",
  capacity: room.capacity || 2,
  pricePerNight: room.pricePerNight || "",
  availableRooms: room.availableRooms || 1,
  description: room.description || "",
  amenities: Array.isArray(room.amenities) ? room.amenities : [],
  existingRoomImages: Array.isArray(room.roomImages) ? room.roomImages : [],
  roomFiles: [],
  imagePreviews: Array.isArray(room.roomImages) ? room.roomImages.map(resolveMediaUrl).filter(Boolean) : [],
});

const hydrateFormFromStay = (stay, user = {}) => {
  const base = createInitialFormData(user);
  const amenities = Array.isArray(stay.amenities) ? stay.amenities : [];

  return {
    ...base,
    ...stay,
    rooms: Array.isArray(stay.rooms) && stay.rooms.length
      ? stay.rooms.filter((room) => room.isActive !== false).map(buildRoomFormData)
      : [createInitialRoomData()],
    amenities: amenities.filter((amenity) => !Object.values(facilityAmenityMap).includes(amenity)),
    wheelchairAccess: amenities.includes(facilityAmenityMap.wheelchairAccess),
    cctv: amenities.includes(facilityAmenityMap.cctv),
    fireExtinguisher: amenities.includes(facilityAmenityMap.fireExtinguisher),
    backupGenerator: amenities.includes(facilityAmenityMap.backupGenerator),
    latitude: String(stay.latitude ?? base.latitude),
    longitude: String(stay.longitude ?? base.longitude),
  };
};

const StayHost = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const token = localStorage.getItem("token");
  const canManage = hasStayHostAccess(currentUser);
  const isAdmin = isAdminUser(currentUser);
  const [loading, setLoading] = useState(false);
  const [fetchingStay, setFetchingStay] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [propertyImages, setPropertyImages] = useState([]);
  const [submissionState, setSubmissionState] = useState(null);
  const [formData, setFormData] = useState(() => createInitialFormData(currentUser));

  const fetchStayForEdit = useCallback(async () => {
    if (!editId || !token) return;
    try {
      setFetchingStay(true);
      const response = await axios.get(`${BACKEND_URL}/stays/owner/listings/${editId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stay = response.data;

      setFormData(hydrateFormFromStay(stay, currentUser));
    } catch (err) {
      console.error("Failed to fetch stay for edit:", err);
      alert("Could not load property details.");
      navigate("/owner/stays");
    } finally {
      setFetchingStay(false);
    }
  }, [currentUser, editId, navigate, token]);

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const freshUser = response.data?.user;
      const freshToken = response.data?.token;

      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        if (!editId) {
          setFormData((prev) => ({
            ...prev,
            ownerName: prev.ownerName || freshUser.name || "",
            contactNumber: prev.contactNumber || freshUser.phone || "",
            contactEmail: prev.contactEmail || freshUser.email || "",
            whatsappNumber: prev.whatsappNumber || freshUser.phone || "",
          }));
        }
      }

      if (freshToken) {
        localStorage.setItem("token", freshToken);
      }
    } catch (error) {
      console.error("Could not refresh host access:", error);
    }
  }, [token, editId]);

  useEffect(() => {
    if (editId) {
      fetchStayForEdit();
    } else {
      refreshCurrentUser();
    }
  }, [editId, fetchStayForEdit, refreshCurrentUser]);

  const selectedPosition = useMemo(
    () => [Number(formData.latitude) || defaultPosition.latitude, Number(formData.longitude) || defaultPosition.longitude],
    [formData.latitude, formData.longitude]
  );

  const updateFromCoordinates = async (latitude, longitude) => {
    setLocLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const addressInfo = response.data?.address || {};

      setFormData((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: response.data?.display_name || prev.address,
        city: addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.county || prev.city,
        state: addressInfo.state || prev.state,
      }));
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setFormData((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }));
    } finally {
      setLocLoading(false);
    }
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, createInitialRoomData()]
    }));
  };

  const removeRoomType = (index) => {
    if (formData.rooms.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
    // Also need to handle cleaning up room files associated with this index if we were tracking them strictly
  };

  const updateRoom = (index, field, value) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setFormData(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const handleRoomImagesChange = (index, files) => {
    const fileArray = Array.from(files);
    const updatedRooms = [...formData.rooms];
    const previews = fileArray.map(file => URL.createObjectURL(file));
    updatedRooms[index] = { 
      ...updatedRooms[index], 
      roomFiles: fileArray,
      imagePreviews: [
        ...(updatedRooms[index].existingRoomImages || []).map(resolveMediaUrl),
        ...previews,
      ]
    };
    
    setFormData(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const toggleRoomAmenity = (roomIndex, amenity) => {
    const updatedRooms = [...formData.rooms];
    const currentAmenities = updatedRooms[roomIndex].amenities;
    if (currentAmenities.includes(amenity)) {
      updatedRooms[roomIndex].amenities = currentAmenities.filter(a => a !== amenity);
    } else {
      updatedRooms[roomIndex].amenities = [...currentAmenities, amenity];
    }
    setFormData(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await updateFromCoordinates(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error(error);
        setLocLoading(false);
        alert("Could not fetch your location. Please allow location access and try again.");
      }
    );
  };

  const handleMapSelect = async (latlng) => {
    await updateFromCoordinates(latlng.lat, latlng.lng);
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      alert("You must be logged in to list a stay.");
      return;
    }

    // Basic Validation
    if (!formData.propertyName || !formData.address || !formData.city || !formData.state) {
      alert("Please fill in all basic property details (Name, Address, City, State).");
      return;
    }

    const invalidRoom = formData.rooms.find(r => !r.roomType || !r.pricePerNight || !r.capacity);
    if (invalidRoom) {
      alert("Each room type must have a Type, Price, and Capacity specified.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      const mergedAmenities = Array.from(
        new Set([
          ...formData.amenities,
          ...Object.entries(facilityAmenityMap)
            .filter(([key]) => formData[key])
            .map(([, label]) => label),
        ])
      );

      // Append general info
      Object.keys(formData).forEach((key) => {
        if (
          key !== "propertyImages" &&
          key !== "rooms" &&
          key !== "amenities" &&
          !Object.keys(facilityAmenityMap).includes(key)
        ) {
          data.append(key, formData[key]);
        }
      });

      // Handle amenities
      mergedAmenities.forEach((amenity) => data.append("amenities[]", amenity));

      // Append property images
      propertyImages.forEach((file) => {
        data.append("propertyImages", file);
      });

      // Handle multi-rooms and their images
      let allRoomFiles = [];
      const roomsToSubmit = formData.rooms.map((room) => {
        const startIndex = allRoomFiles.length;
        const roomFiles = room.roomFiles || [];
        allRoomFiles = [...allRoomFiles, ...roomFiles];
        
        // Track indices for the backend mapping
        const imageIndices = roomFiles.map((_, i) => startIndex + i);
        
        return {
          room_id: room.room_id || undefined,
          roomType: room.roomType,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          availableRooms: room.availableRooms,
          description: room.description,
          amenities: room.amenities,
          existingRoomImages: room.existingRoomImages || [],
          imageIndices
        };
      });

      data.append("rooms", JSON.stringify(roomsToSubmit));
      allRoomFiles.forEach((file) => {
        data.append("roomImages", file);
      });

      const url = editId ? `${BACKEND_URL}/stays/${editId}` : `${BACKEND_URL}/stays`;
      const method = editId ? "put" : "post";

      const response = await axios({
        method,
        url,
        data,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSubmissionState(response.data?.data || { moderationStatus: "Pending" });
      setFormData(createInitialFormData(currentUser));
      setPropertyImages([]);
      
      setTimeout(() => {
        navigate("/owner/stays");
      }, 3000);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to publish stay listing");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
        <Header />
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 pt-32 pb-16">
          <div className="rounded-[3rem] border border-orange-100 bg-white p-12 text-center shadow-2xl shadow-orange-100/30">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-900 text-white">
              <ShieldCheck size={38} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Sign in to manage stays</h2>
            <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
              Stay listing is only available for authenticated host accounts.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="mt-8 rounded-2xl bg-orange-600 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900"
            >
              Go to Sign In
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (fetchingStay) {
    return (
      <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
        <Header />
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 pt-32 pb-16">
          <div className="rounded-[3rem] border border-orange-100 bg-white p-12 text-center shadow-2xl shadow-orange-100/30">
            <Loader2 className="mx-auto animate-spin text-orange-600" size={32} />
            <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Loading stay details for editing
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
        <Header />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 pt-32 pb-16">
          <div className="rounded-[3rem] border border-orange-100 bg-white p-12 text-center shadow-2xl shadow-orange-100/30">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-900 text-white shadow-lg shadow-slate-200/50">
              <ShieldCheck size={38} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Owner workspace only</h2>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-400">
              Admins review and moderate stay listings, but do not operate the owner dashboard.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/admin?tab=stays")}
                className="rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
              >
                Open Stay Moderation
              </button>
              <button
                onClick={() => navigate("/stays")}
                className="rounded-2xl bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200 transition-all hover:text-orange-600"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
        <Header />
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 pt-32 pb-16">
          <div className="rounded-[3rem] border border-orange-100 bg-white p-12 text-center shadow-2xl shadow-orange-100/30">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-amber-50 text-amber-600 shadow-lg shadow-amber-100/50">
              <MapPin size={38} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Verified host access required</h2>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-400">
              Your account is active, but stay publishing is enabled only after admin host verification.
            </p>
            <div className="mt-8 rounded-[2rem] bg-orange-50/60 p-6 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">What to do next</p>
              <p className="mt-3 text-sm font-bold leading-relaxed text-slate-700">
                Ask the project admin to grant stay-host access to your account. Once approved, this page will unlock the
                full listing and management workspace automatically.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/stays")}
                className="rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
              >
                Back to Marketplace
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="rounded-2xl bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200 transition-all hover:text-orange-600"
              >
                Open My Profile
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submissionState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf3] font-jakarta">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-orange-600 text-white shadow-xl shadow-orange-600/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            {submissionState.moderationStatus === "Approved" ? "Stay listed successfully" : "Stay submitted for review"}
          </h2>
          <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {submissionState.moderationStatus === "Approved"
              ? "Your listing is now visible in the stay marketplace."
              : "Your listing is saved and waiting for admin approval before it goes live."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSubmissionState(null)}
              className="rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
            >
              Add Another Listing
            </button>
            <button
              onClick={() => navigate("/stays")}
              className="rounded-2xl bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200 transition-all hover:text-orange-600"
            >
              Open Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
      <Header />

      <div className="border-b border-orange-100 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_42%),linear-gradient(180deg,#fffdf9_0%,#fffaf3_100%)] pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
            <Sparkles size={14} /> Host Accommodation
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 md:text-6xl">
            {editId ? "Edit your" : "Publish a"} <span className="text-orange-600">Pilgrim Stay</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-bold uppercase tracking-widest text-slate-400">
            {editId 
              ? "Update your property details, room configurations, and location to keep your listing accurate."
              : "Add your property, upload rooms, pin the exact map location, and help devotees rest safely on the route."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10">
          <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <ShieldCheck size={13} /> Access Status
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Verified stay host</h2>
                <p className="mt-4 text-sm font-bold leading-relaxed text-slate-600">
                  Your stay listings are submitted under your verified host access. Any future edits will go back through admin review before going live again.
                </p>
              </div>
              <button 
                onClick={() => navigate("/owner/stays")}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
              >
                Back to Dashboard
              </button>
            </div>
          </section>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
              <div className="mb-8">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <Building2 size={13} /> Property Details
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Stay identity</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Property Name</label>
                  <input
                    required
                    type="text"
                    value={formData.propertyName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, propertyName: event.target.value }))}
                    placeholder="e.g. Shiv Shakti Dharamshala"
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Stay Type</label>
                  <select
                    value={formData.stayType}
                    onChange={(event) => setFormData((prev) => ({ ...prev, stayType: event.target.value }))}
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none"
                  >
                    <option value="Homestay">Homestay</option>
                    <option value="Dharamshala">Dharamshala</option>
                    <option value="Lodge">Lodge</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Ashram">Ashram</option>
                  </select>
                </div>

                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Owner Name</label>
                  <input
                    required
                    type="text"
                    value={formData.ownerName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, ownerName: event.target.value }))}
                    placeholder="Host or caretaker name"
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</label>
                  <input
                    required
                    type="text"
                    value={formData.contactNumber}
                    onChange={(event) => setFormData((prev) => ({ ...prev, contactNumber: event.target.value }))}
                    placeholder="Host phone number"
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(event) => setFormData((prev) => ({ ...prev, contactEmail: event.target.value }))}
                    placeholder="Optional host email"
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp Number</label>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(event) => setFormData((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                    placeholder="Optional WhatsApp number"
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea
                    required
                    rows="5"
                    value={formData.description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe the stay, atmosphere, cleanliness, safety, and what pilgrims should know before arriving."
                    className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-medium outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>
              </div>
            </section>

            {formData.rooms.map((room, roomIndex) => (
              <section key={roomIndex} className="relative rounded-[3rem] border border-orange-100 bg-white p-10 shadow-2xl shadow-orange-100/30">
                {roomIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => removeRoomType(roomIndex)}
                    className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
                
                <div className="mb-10">
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600">
                    <ShieldCheck size={14} /> Room Type #{roomIndex + 1}
                  </p>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Configure Room</h2>
                </div>

                <div className="grid gap-8">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Room Name/Type</label>
                      <select
                        value={room.roomType}
                        onChange={(e) => updateRoom(roomIndex, 'roomType', e.target.value)}
                        className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/30 px-6 py-4 text-sm font-bold text-slate-900 transition-all focus:border-orange-500 focus:bg-white outline-none"
                      >
                        <option value="Single">Single Room</option>
                        <option value="Double">Double Room</option>
                        <option value="Dormitory">Dormitory / Hall</option>
                        <option value="Family">Family Room</option>
                        <option value="Suite">Premium Suite</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity per room</label>
                      <input
                        type="number"
                        value={room.capacity}
                        onChange={(e) => updateRoom(roomIndex, 'capacity', e.target.value)}
                        className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/30 px-6 py-4 text-sm font-bold text-slate-900 transition-all focus:border-orange-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Price per night (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1200"
                        value={room.pricePerNight}
                        onChange={(e) => updateRoom(roomIndex, 'pricePerNight', e.target.value)}
                        className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/30 px-6 py-4 text-sm font-bold text-slate-900 transition-all focus:border-orange-500 focus:bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Available Rooms</label>
                      <input
                        type="number"
                        value={room.availableRooms}
                        onChange={(e) => updateRoom(roomIndex, 'availableRooms', e.target.value)}
                        className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/30 px-6 py-4 text-sm font-bold text-slate-900 transition-all focus:border-orange-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Room Description</label>
                    <textarea
                      rows="3"
                      value={room.description}
                      onChange={(e) => updateRoom(roomIndex, 'description', e.target.value)}
                      placeholder="Special features of this specific room type..."
                      className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/30 px-6 py-4 text-sm font-bold text-slate-900 transition-all focus:border-orange-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Room Specific Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {amenitySuggestions.map((amenity) => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleRoomAmenity(roomIndex, amenity)}
                          className={`rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                            room.amenities.includes(amenity)
                              ? "bg-orange-600 text-white shadow-lg"
                              : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                          }`}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Room Images</label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-orange-200 bg-orange-50/20 transition-all hover:bg-orange-50">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleRoomImagesChange(roomIndex, e.target.files)}
                        />
                        <Camera className="text-orange-400" size={24} />
                        <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Upload Room Images</span>
                      </label>
                      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                        {room.imagePreviews && room.imagePreviews.map((preview, i) => (
                          <img key={i} src={preview} alt="Room" className="h-32 w-32 rounded-2xl object-cover shadow-md" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))}

            <button
              type="button"
              onClick={addRoomType}
              className="group flex w-full items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-orange-200 py-8 text-[11px] font-black uppercase tracking-widest text-orange-400 transition-all hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600"
            >
              <LayoutList className="group-hover:animate-bounce" size={20} />
              + Add Another Room Type
            </button>

            <section className="rounded-[3rem] border border-orange-100 bg-white p-10 shadow-2xl shadow-orange-100/30">
              <div className="mb-8">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <Sparkles size={14} /> Facilities & Amenities
                </p>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Facilities and Comfort</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {facilityFields.map((facility) => (
                  <button
                    key={facility.key}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, [facility.key]: !prev[facility.key] }))}
                    className={`flex items-center justify-between rounded-2xl border-2 px-6 py-4 transition-all ${
                      formData[facility.key]
                        ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "border-orange-50 bg-orange-50/30 text-slate-600"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{facility.label}</span>
                    {formData[facility.key] ? <CheckCircle2 size={16} /> : <div className="h-4 w-4 rounded-full border-2 border-orange-200" />}
                  </button>
                ))}
              </div>

              <div className="mt-10">
                <label className="mb-4 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Amenity Tags</label>
                <div className="flex flex-wrap gap-2">
                  {amenitySuggestions.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                        formData.amenities.includes(amenity)
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                    <MapPin size={13} /> GPS and Address
                  </p>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Location pin</h2>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
                >
                  {locLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  {locLoading ? "Locating..." : "Use My Location"}
                </button>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                  <input
                    required
                    type="text"
                    value={formData.address}
                    onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">City</label>
                    <input
                      required
                      type="text"
                      value={formData.city}
                      onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))}
                      className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">State</label>
                    <input
                      required
                      type="text"
                      value={formData.state}
                      onChange={(event) => setFormData((prev) => ({ ...prev, state: event.target.value }))}
                      className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Pilgrimage Route</label>
                    <input
                      type="text"
                      value={formData.pilgrimageRoute}
                      onChange={(event) => setFormData((prev) => ({ ...prev, pilgrimageRoute: event.target.value }))}
                      placeholder="e.g. Mahakal Corridor"
                      className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nearby Temple</label>
                    <input
                      type="text"
                      value={formData.nearbyTemple}
                      onChange={(event) => setFormData((prev) => ({ ...prev, nearbyTemple: event.target.value }))}
                      placeholder="e.g. Mahakaleshwar Temple"
                      className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Distance from temple/route (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.distanceFromTempleKm}
                    onChange={(event) => setFormData((prev) => ({ ...prev, distanceFromTempleKm: event.target.value }))}
                    placeholder="Optional"
                    className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <StayLocationMap
                  position={selectedPosition}
                  onSelect={handleMapSelect}
                  popupText="Drag or click to pin the exact stay location"
                  className="h-[320px]"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-orange-50/60 px-4 py-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Latitude</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{formData.latitude}</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50/60 px-4 py-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Longitude</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{formData.longitude}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
              <div className="mb-8">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <Camera size={13} /> Media Uploads
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Property images</h2>
              </div>

              <div className="grid gap-6">
                <label className="rounded-[2rem] border-2 border-dashed border-orange-200 bg-orange-50/30 p-6 text-center transition-all hover:bg-orange-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setPropertyImages(Array.from(event.target.files || []))}
                  />
                  <Camera className="mx-auto mb-3 text-orange-400" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {propertyImages.length ? `${propertyImages.length} property image(s) selected` : "Upload property images"}
                  </p>
                </label>
                <div className="rounded-[2rem] bg-orange-50/50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Room photos are uploaded inside each room configuration card above, so every room type keeps its own image set.
                  </p>
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-orange-600 px-8 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-orange-600/20 transition-all hover:bg-slate-900"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Publish Stay Listing"}
            </button>
          </div>
        </form>
      </div>


      <Footer />
      <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
    </div>
  );
};

export default StayHost;
