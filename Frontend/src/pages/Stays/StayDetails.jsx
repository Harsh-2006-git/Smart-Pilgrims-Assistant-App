import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, BedDouble, CalendarDays, CheckCircle2, Heart, Loader2, MapPin, Navigation, Phone, ShieldCheck, Sparkles, Users, Wallet, MessageCircleMore } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import StayLocationMap from "../../components/stays/StayLocationMap";
import { API_V1, resolveMediaUrl } from "../../config/api";

const BACKEND_URL = API_V1;
const FAVORITES_KEY = "divya_yatra_favorite_stays";

const loadFavoriteIds = () => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveFavoriteIds = (ids) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
};

const StayDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stay, setStay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [bookingData, setBookingData] = useState({
    room_id: "",
    guestName: "",
    guestPhone: "",
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    roomsBooked: 1,
    specialRequests: "",
  });

  useEffect(() => {
    const fetchStay = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/stays/${id}`);
        const stayData = response.data;
        setStay(stayData);
        setSelectedImage(stayData?.propertyImages?.[0] || stayData?.roomImages?.[0] || null);
        setBookingData((prev) => ({
          ...prev,
          room_id: stayData?.rooms?.[0]?.room_id || prev.room_id || "",
        }));
      } catch (fetchError) {
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    setFavoriteIds(loadFavoriteIds());
    fetchStay();
  }, [id]);

  const stayImages = useMemo(
    () => [...(stay?.propertyImages || []), ...(stay?.roomImages || [])],
    [stay]
  );

  // Rooms live in stay.rooms[] from the backend JOIN.
  // Fall back gracefully so old data still renders.
  const allRooms = useMemo(() => (Array.isArray(stay?.rooms) ? stay.rooms : []), [stay?.rooms]);
  const selectedRoom = useMemo(() => {
    if (!allRooms.length) return null;
    const roomId = Number(bookingData.room_id);
    return allRooms.find((room) => Number(room.room_id) === roomId) || allRooms[0];
  }, [allRooms, bookingData.room_id]);

  const startingFromPrice = useMemo(() => {
    const prices = allRooms
      .map((room) => Number(room?.pricePerNight))
      .filter((value) => Number.isFinite(value) && value > 0);

    return prices.length ? Math.min(...prices) : null;
  }, [allRooms]);

  const firstRoom = selectedRoom || allRooms[0] || stay || {};

  const isFavorite = favoriteIds.includes(String(id));

  const toggleFavorite = () => {
    const key = String(id);
    const next = isFavorite
      ? favoriteIds.filter((favId) => favId !== key)
      : [...favoriteIds, key];
    setFavoriteIds(next);
    saveFavoriteIds(next);
  };

  const totalNights =
    bookingData.checkInDate && bookingData.checkOutDate
      ? Math.ceil(
          (new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const pricePerNight = Number(firstRoom?.pricePerNight ?? stay?.pricePerNight ?? 0);
  const selectedRoomAvailability = useMemo(
    () =>
      availabilityData?.rooms?.find(
        (room) => Number(room.room_id) === Number(bookingData.room_id)
      ) || null,
    [availabilityData, bookingData.room_id]
  );

  const totalAmount =
    totalNights > 0
      ? totalNights * pricePerNight * Number(bookingData.roomsBooked || 1)
      : 0;

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!bookingData.checkInDate || !bookingData.checkOutDate || !bookingData.room_id) {
        setAvailabilityData(null);
        return;
      }

      try {
        setAvailabilityLoading(true);
        const response = await axios.get(`${BACKEND_URL}/stays/${id}/availability`, {
          params: {
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            guests: bookingData.guests,
            roomsRequested: bookingData.roomsBooked,
          },
        });
        setAvailabilityData(response.data);
      } catch (availabilityError) {
        setAvailabilityData(null);
        setError(
          availabilityError.response?.data?.message ||
            "Could not check live availability for these dates."
        );
      } finally {
        setAvailabilityLoading(false);
      }
    };

    setError("");
    fetchAvailability();
  }, [
    bookingData.checkInDate,
    bookingData.checkOutDate,
    bookingData.guests,
    bookingData.room_id,
    bookingData.roomsBooked,
    id,
  ]);

  const handleBooking = async (event) => {
    event.preventDefault();
    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/auth");
      return;
    }

    if (selectedRoomAvailability && !selectedRoomAvailability.canBook) {
      setError("This room is not available for the selected dates and guest count.");
      return;
    }

    setProcessing(true);

    try {
      const bookingResponse = await axios.post(
        `${BACKEND_URL}/stay-bookings`,
        {
          stay_id: id,
          ...bookingData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Payment is simulated. This marks the booking as paid but it still awaits host confirmation.
      await axios.post(
        `${BACKEND_URL}/stay-bookings/verify`,
        { razorpay_order_id: bookingResponse.data.order.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
    } catch (bookingError) {
      console.error(bookingError);
      setError(bookingError.response?.data?.message || "Could not complete the booking.");
    } finally {
      setProcessing(false);
    }
  };

  const openNavigation = () => {
    if (!stay?.latitude || !stay?.longitude) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${stay.latitude},${stay.longitude}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf3]">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf3] text-[11px] font-black uppercase tracking-widest text-slate-500">
        Stay listing not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] font-jakarta text-slate-900">
      <Header />

      <div className="border-b border-orange-100 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.22),_transparent_42%),linear-gradient(180deg,#fffdf9_0%,#fffaf3_100%)] pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-orange-600"
          >
            <ArrowLeft size={14} /> Back to stays
          </button>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <Sparkles size={13} /> {stay.stayType}
                </span>
                {stay.moderationStatus === "Approved" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <ShieldCheck size={13} /> Verified stay
                  </span>
                ) : null}
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 md:text-6xl">
                {stay.propertyName}
              </h1>
              <p className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <MapPin size={15} className="text-orange-500" /> {stay.address}
              </p>
            </div>

            <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/45">
                {allRooms.length > 1 ? `${allRooms.length} Room Types · Starting From` : "Price Per Night"}
              </p>
              <p className="mt-3 text-5xl font-black tracking-tight text-orange-500">
                Rs. {allRooms.length > 1 ? startingFromPrice ?? "—" : firstRoom.pricePerNight ?? stay.pricePerNight ?? "—"}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/45">
                {(firstRoom.availableRooms ?? stay.availableRooms) ?? "?"} room(s) currently open
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16">
        {success ? (
          <div className="mx-auto max-w-2xl rounded-[3rem] border border-orange-100 bg-white p-16 text-center shadow-2xl shadow-orange-100/40">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-orange-600 text-white shadow-xl shadow-orange-600/20">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Booking request submitted</h2>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Your booking request was sent and is awaiting host confirmation.
            </p>
            <button
              onClick={() => navigate("/stays/my-bookings")}
              className="mt-10 rounded-2xl bg-slate-900 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
            >
              Open My Stay Bookings
            </button>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              <section className="overflow-hidden rounded-[2.8rem] border border-orange-100 bg-white shadow-2xl shadow-orange-100/30">
                <div className="relative h-[420px]">
                  <img
                    src={
                      selectedImage
                        ? resolveMediaUrl(selectedImage)
                        : "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1400&q=80"
                    }
                    alt={`Preview for ${stay.propertyName}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={toggleFavorite}
                    className={`absolute right-6 top-6 rounded-full p-4 transition-all ${
                      isFavorite ? "bg-rose-500 text-white" : "bg-white/90 text-slate-600"
                    }`}
                  >
                    <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>

                {stayImages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3 p-4 md:grid-cols-6">
                    {stayImages.map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`overflow-hidden rounded-[1.2rem] border-2 transition-all ${
                          selectedImage === image ? "border-orange-500" : "border-transparent"
                        }`}
                      >
                        <img src={resolveMediaUrl(image)} alt="Stay gallery" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>

              {allRooms.length > 0 ? (
                <section className="space-y-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Rooms Available</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {allRooms.map((room, idx) => (
                      <div key={room.room_id ?? idx} className="rounded-[2rem] border border-orange-100 bg-white overflow-hidden shadow-sm">
                        {room.roomImages?.length > 0 ? (
                          <div className="flex gap-1 overflow-x-auto">
                            {room.roomImages.map((img, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={resolveMediaUrl(img)}
                                alt={`${room.roomType} photo ${imgIdx + 1}`}
                                className="h-36 min-w-[140px] flex-shrink-0 object-cover first:rounded-tl-[2rem] last:rounded-tr-[2rem]"
                              />
                            ))}
                          </div>
                        ) : null}
                        <div className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-600">{room.roomType}</span>
                            <span className="text-lg font-black text-slate-900">Rs. {room.pricePerNight}<span className="text-[10px] font-bold text-slate-400">/night</span></span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-orange-50/60 px-4 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Capacity</p>
                              <p className="mt-1 font-black text-slate-900">{room.capacity} guest(s)</p>
                            </div>
                            <div className="rounded-xl bg-orange-50/60 px-4 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {availabilityData ? "Remaining" : "Inventory"}
                              </p>
                              <p className="mt-1 font-black text-slate-900">
                                {availabilityData
                                  ? availabilityData.rooms?.find(
                                      (candidate) => Number(candidate.room_id) === Number(room.room_id)
                                    )?.remainingRooms ?? room.availableRooms
                                  : room.availableRooms} room(s)
                              </p>
                            </div>
                          </div>
                          {room.description ? (
                            <p className="mt-4 text-xs font-medium leading-relaxed text-slate-500">{room.description}</p>
                          ) : null}
                          {room.amenities?.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {room.amenities.map(a => (
                                <span key={a} className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-slate-500">{a}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.7rem] bg-orange-50/70 p-4 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Check-in / Check-out</p>
                    <p className="mt-2 text-xl font-black text-slate-900">{stay.checkInTime?.slice(0,5)} / {stay.checkOutTime?.slice(0,5)}</p>
                  </div>
                </section>
              ) : (
                <section className="grid gap-5 md:grid-cols-3">
                  <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Room Type</p>
                    <p className="mt-3 text-xl font-black text-slate-900">{stay.roomType || "—"}</p>
                  </div>
                  <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Capacity</p>
                    <p className="mt-3 text-xl font-black text-slate-900">{stay.capacity ?? "—"} guest(s)</p>
                  </div>
                  <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Check-in / Check-out</p>
                    <p className="mt-3 text-xl font-black text-slate-900">
                      {stay.checkInTime?.slice(0, 5)} / {stay.checkOutTime?.slice(0, 5)}
                    </p>
                  </div>
                </section>
              )}

              <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">About this stay</h2>
                <p className="mt-5 text-sm font-medium leading-relaxed text-slate-600">
                  {stay.description || "No description added by the host yet."}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.7rem] bg-orange-50/70 p-5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pilgrimage Route</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{stay.pilgrimageRoute || "Not specified"}</p>
                  </div>
                  <div className="rounded-[1.7rem] bg-orange-50/70 p-5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nearby Temple</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{stay.nearbyTemple || "Not specified"}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {stay.wifi ? <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">WiFi</span> : null}
                  {stay.foodAvailable ? <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Food</span> : null}
                  {stay.parking ? <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Parking</span> : null}
                  {stay.familyRooms ? <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Family Rooms</span> : null}
                  {stay.security ? <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Security</span> : null}
                  {stay.medicalAssistanceNearby ? <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Medical Nearby</span> : null}
                  {(stay.amenities || []).map((amenity) => (
                    <span key={amenity} className="rounded-full bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Map and navigation</h2>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Pinpointed GPS location for pilgrims and drivers
                    </p>
                  </div>
                  <button
                    onClick={openNavigation}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
                  >
                    <Navigation size={14} /> Navigate
                  </button>
                </div>

                <StayLocationMap
                  position={[Number(stay.latitude), Number(stay.longitude)]}
                  popupText={stay.propertyName}
                  className="h-[320px]"
                />
              </section>
            </div>

            <aside className="space-y-8">
              <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-2xl shadow-orange-100/20">
                <div className="mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Book your stay</h2>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Payment is simulated today. Booking requests require host confirmation.
                  </p>
                </div>

                <form onSubmit={handleBooking} className="space-y-5">
                  {allRooms.length > 0 ? (
                    <div>
                      <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Room Type</label>
                      <select
                        required
                        value={bookingData.room_id}
                        onChange={(event) => setBookingData((prev) => ({ ...prev, room_id: event.target.value }))}
                        className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                      >
                        {allRooms.map((room) => (
                          <option key={room.room_id} value={room.room_id}>
                            {room.roomType} - Rs. {room.pricePerNight}/night - {room.availableRooms} available
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Guest Name</label>
                    <input
                      required
                      type="text"
                      value={bookingData.guestName}
                      onChange={(event) => setBookingData((prev) => ({ ...prev, guestName: event.target.value }))}
                      className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Guest Phone</label>
                    <input
                      required
                      type="text"
                      value={bookingData.guestPhone}
                      onChange={(event) => setBookingData((prev) => ({ ...prev, guestPhone: event.target.value }))}
                      className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Check-in Date</label>
                      <input
                        required
                        type="date"
                        value={bookingData.checkInDate}
                        onChange={(event) => setBookingData((prev) => ({ ...prev, checkInDate: event.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Check-out Date</label>
                      <input
                        required
                        type="date"
                        value={bookingData.checkOutDate}
                        onChange={(event) => setBookingData((prev) => ({ ...prev, checkOutDate: event.target.value }))}
                        min={bookingData.checkInDate || new Date().toISOString().split("T")[0]}
                        className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Guests</label>
                      <input
                        min="1"
                        required
                        type="number"
                        value={bookingData.guests}
                        onChange={(event) => setBookingData((prev) => ({ ...prev, guests: event.target.value }))}
                        className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Rooms Needed</label>
                      <input
                        min="1"
                        required
                        type="number"
                        value={bookingData.roomsBooked}
                        onChange={(event) => setBookingData((prev) => ({ ...prev, roomsBooked: event.target.value }))}
                        className="w-full rounded-2xl border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Special Requests</label>
                    <textarea
                      rows="4"
                      value={bookingData.specialRequests}
                      onChange={(event) => setBookingData((prev) => ({ ...prev, specialRequests: event.target.value }))}
                      className="w-full rounded-[1.5rem] border-2 border-orange-50 bg-orange-50/40 px-5 py-4 font-medium outline-none focus:border-orange-400 focus:bg-white"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-[1.5rem] bg-rose-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-600">
                      {error}
                    </div>
                  ) : null}

                  <div className="rounded-[1.5rem] border border-orange-100 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Live Availability Check
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-600">
                          Availability is reserved at request time and reviewed by the host.
                        </p>
                      </div>
                      {availabilityLoading ? (
                        <Loader2 className="animate-spin text-orange-600" size={18} />
                      ) : null}
                    </div>

                    {availabilityData && selectedRoomAvailability ? (
                      <div className="mt-4 rounded-2xl bg-orange-50/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {selectedRoomAvailability.roomType}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                              selectedRoomAvailability.canBook
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {selectedRoomAvailability.canBook ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rooms Left</p>
                            <p className="mt-1 text-lg font-black text-slate-900">
                              {selectedRoomAvailability.remainingRooms}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Max Guests</p>
                            <p className="mt-1 text-lg font-black text-slate-900">
                              {selectedRoomAvailability.maxGuests}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nightly Rate</p>
                            <p className="mt-1 text-lg font-black text-slate-900">
                              Rs. {selectedRoomAvailability.nightlyRate}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Select dates and room type to check current availability.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[2rem] bg-orange-50/70 p-6">
                    <div className="space-y-3 text-sm font-bold text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> Nights</span>
                        <span>{totalNights > 0 ? totalNights : 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2"><BedDouble size={15} /> Rooms</span>
                        <span>{bookingData.roomsBooked || 1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2"><Users size={15} /> Guests</span>
                        <span>{bookingData.guests || 1}</span>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-orange-100 pt-5">
                      <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Wallet size={14} /> Estimated Total
                      </span>
                      <span className="text-3xl font-black tracking-tight text-slate-900">Rs. {totalAmount}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || availabilityLoading || (availabilityData && selectedRoomAvailability && !selectedRoomAvailability.canBook)}
                    className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-orange-600 px-8 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-orange-600/20 transition-all hover:bg-slate-900"
                  >
                    {processing ? <Loader2 size={18} className="animate-spin" /> : "Request Booking"}
                  </button>
                </form>
              </section>

              <section className="rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/20">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Host contact</h2>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Host contact details are shared after your booking is confirmed.
                </p>

                <div className="mt-6 rounded-[1.7rem] bg-orange-50/70 p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Host Privacy</p>
                  <p className="mt-2 text-lg font-black text-slate-900">Contact unlocked after confirmation</p>
                </div>
                <div className="mt-5 rounded-[1.5rem] bg-orange-50/70 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Contact details appear inside My Stay Bookings only after the host confirms your request.
                </div>
                {stay.distanceFromTempleKm ? (
                  <p className="mt-3 text-xs font-bold text-orange-600">
                    Approx. {stay.distanceFromTempleKm} km from the nearby temple or route.
                  </p>
                ) : null}
              </section>
            </aside>
          </div>
        )}
      </div>

      <Footer />
      <style>{`.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
    </div>
  );
};

export default StayDetails;
