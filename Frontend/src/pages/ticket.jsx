import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Users,
  CheckCircle,
  QrCode,
  Ticket as TicketIcon,
  Clock,
  MapPin,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_V1 } from "../config/api";

const DivyaYatraBooking = () => {
  const [activeTab, setActiveTab] = useState("book");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [clientInfo, setClientInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [bookedTickets, setBookedTickets] = useState([]);
  const [timeSlotCapacity, setTimeSlotCapacity] = useState({});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("normal");

  const categories = {
    normal: { label: "Normal", limit: 60, color: "text-blue-600", bg: "bg-blue-50" },
    vip: { label: "VIP", limit: 10, color: "text-purple-600", bg: "bg-purple-50" },
    elderly: { label: "Elderly", limit: 10, color: "text-amber-600", bg: "bg-amber-50" },
    divyang: { label: "Divyang", limit: 10, color: "text-emerald-600", bg: "bg-emerald-50" },
    priest: { label: "Priest", limit: 10, color: "text-rose-600", bg: "bg-rose-50" },
  };

  const timeSlots = [
    "08:00 AM",
    "08:30 AM",
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM",
  ];

  const formatTimeRange = (slot) => {
    const slotIndex = timeSlots.indexOf(slot);
    if (slotIndex === -1) return slot;
    if (slotIndex === timeSlots.length - 1) {
      // Manual calculation for the last slot (adding 30 mins)
      if (slot === "08:00 PM") return "08:00 PM to 08:30 PM";
      return slot;
    }
    return `${slot} to ${timeSlots[slotIndex + 1]}`;
  };

  const API = axios.create({
    baseURL: API_V1,
  });

  // Get JWT token from localStorage
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Initialize random slot capacity
  useEffect(() => {
    const initialCapacity = {};
    timeSlots.forEach((slot) => {
      initialCapacity[slot] = {
        booked: {
          normal: Math.floor(Math.random() * 30),
          vip: Math.floor(Math.random() * 5),
          elderly: Math.floor(Math.random() * 5),
          divyang: Math.floor(Math.random() * 5),
          priest: Math.floor(Math.random() * 5),
        },
        maxCapacity: 100,
      };
    });
    setTimeSlotCapacity(initialCapacity);
  }, []);

  // Fetch tickets for logged-in client
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      // Prefill clientInfo and auto-select category from localStorage
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setClientInfo(prev => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
        }));

        // Map userType to category
        const userTypeMap = {
          "Civilian": "normal",
          "VIP": "vip",
          "Aged": "elderly",
          "Sadhu": "priest",
          "Divyang": "divyang",
          "Admin": "normal"
        };
        
        if (user.userType && userTypeMap[user.userType]) {
          setSelectedCategory(userTypeMap[user.userType]);
        }
      }

      const res = await API.get("/ticket/get", config);
      console.log("API Response:", res.data);

      if (res.data && Array.isArray(res.data)) {
        setBookedTickets(res.data);
      } else if (res.data && res.data.tickets) {
        setBookedTickets(res.data.tickets);
      } else {
        setBookedTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      if (error.response?.status === 404) {
        setBookedTickets([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getNextAvailableSlot = (requestedTime, requestedTickets, category) => {
    const currentIndex = timeSlots.indexOf(requestedTime);
    for (let i = currentIndex; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      const categoryBooked = timeSlotCapacity[slot]?.booked[category] || 0;
      const categoryLimit = categories[category].limit;
      const available = categoryLimit - categoryBooked;
      
      if (available >= requestedTickets) return slot;
    }
    return null;
  };

  const handleBooking = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !clientInfo.name ||
      !clientInfo.email
    ) {
      alert("Please fill all required fields");
      return;
    }

    const availableSlot = getNextAvailableSlot(selectedTime, ticketCount, selectedCategory);
    if (!availableSlot) {
      alert(`Only ${categories[selectedCategory].limit} tickets are reserved for ${categories[selectedCategory].label} category in each slot. This category is currently full for your selected time. Please try another time or date.`);
      return;
    }

    try {
      setLoading(true);
      const ticketData = {
        date: selectedDate,
        time: availableSlot,
        temple: "Mahakaleshwar",
        no_of_tickets: ticketCount,
        category: selectedCategory,
      };

      const res = await API.post("/ticket/create", ticketData, config);

      setTimeSlotCapacity((prev) => ({
        ...prev,
        [availableSlot]: {
          ...prev[availableSlot],
          booked: {
            ...prev[availableSlot].booked,
            [selectedCategory]: prev[availableSlot].booked[selectedCategory] + ticketCount,
          },
        },
      }));

      // Refresh tickets list
      await fetchTickets();

      setAnimateSuccess(true);
      setTimeout(() => setAnimateSuccess(false), 3000);

      setShowBookingForm(false);
      setClientInfo({ name: "", email: "", phone: "" });
      setTicketCount(1);
      setSelectedDate("");
      setSelectedTime("");

      // Switch to tickets tab
      setActiveTab("tickets");

      if (availableSlot !== selectedTime) {
        alert(
          `Requested time ${selectedTime} was full. You've been allocated ${availableSlot} instead.`
        );
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(
        error.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatus = (slot) => {
    const capacity = timeSlotCapacity[slot];
    if (!capacity) return "available";
    const totalBooked = Object.values(capacity.booked).reduce((a, b) => a + b, 0);
    const available = capacity.maxCapacity - totalBooked;
    if (available === 0) return "full";
    if (available <= 10) return "filling";
    return "available";
  };

  const getSlotColor = (status) => {
    switch (status) {
      case "full":
        return "bg-red-500";
      case "filling":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadTicket = (ticket) => {
    // Create a simple text version for download
    const ticketText = `
    DIVYA YATRA - DARSHAN TICKET
    ════════════════════════════════
    
    Ticket ID: ${ticket.ticket_id}
    Temple: Mahakaleshwar Jyotirlinga
    
    Date: ${formatDate(ticket.date)}
    Time: ${ticket.time}
    Tickets: ${ticket.no_of_tickets}
    
    Visitor Details:
    Name: ${ticket.Client?.name || "N/A"}
    Phone: ${ticket.Client?.phone || "N/A"}
    Email: ${ticket.Client?.email || "N/A"}
    
    Booked on: ${new Date(ticket.created_at).toLocaleString("en-IN")}
    
    ════════════════════════════════
    Please carry this ticket and a valid ID
    `;

    const blob = new Blob([ticketText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `divya-yatra-ticket-${ticket.ticket_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const BookingTab = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Booking Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
        <div className="flex items-center mb-6">
          <Calendar className="w-8 h-8 text-orange-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">
            Book Your Darshan
          </h2>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">
            Select Time Slot
          </label>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {timeSlots.map((slot) => {
              const status = getSlotStatus(slot);
              const capacity = timeSlotCapacity[slot];
              const totalBooked = capacity ? Object.values(capacity.booked).reduce((a, b) => a + b, 0) : 0;
              const available = capacity ? capacity.maxCapacity - totalBooked : 100;
              const isSelected = selectedTime === slot;
              
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  disabled={status === "full"}
                  className={`relative p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 text-left flex flex-col group ${
                    isSelected
                      ? "border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200 ring-offset-1"
                      : status === "full"
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-100 bg-white hover:border-orange-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 md:mb-2">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Clock size={12} className={isSelected ? "text-orange-600" : "text-gray-400"} />
                      <span className={`font-bold text-xs md:text-sm ${isSelected ? "text-orange-900" : "text-gray-700"}`}>
                        {slot}
                      </span>
                    </div>
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getSlotColor(status)} shadow-sm`}></div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-orange-600" : "text-gray-400"}`}>
                      Available
                    </span>
                    <span className={`text-[10px] md:text-xs font-black ${isSelected ? "text-orange-700" : "text-gray-600"}`}>
                      {available}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white rounded-full p-0.5 shadow-lg">
                      <CheckCircle size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">
            Select Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(categories).map(([key, cat]) => {
              const isAccessible = selectedCategory === key;
              return (
                <button
                  key={key}
                  disabled={!isAccessible}
                  onClick={() => setSelectedCategory(key)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1 ${selectedCategory === key
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-300 opacity-50 cursor-not-allowed"
                    }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{cat.label}</span>
                    {isAccessible && <CheckCircle size={10} className="text-orange-500" />}
                  </div>
                  <span className="text-[10px] opacity-70">Limit: {cat.limit}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-gray-400 italic">
            * Category auto-selected based on your profile authorization.
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Number of {categories[selectedCategory].label}s
          </label>
          <div className="relative group/select">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/select:text-orange-500 transition-colors" size={20} />
            <select
              value={ticketCount}
              onChange={(e) => setTicketCount(Number(e.target.value))}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-10 focus:border-orange-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer font-bold text-slate-800"
            >
              {[...Array(10).keys()].map((num) => (
                <option key={num + 1} value={num + 1}>
                  {num + 1} {categories[selectedCategory].label}{num > 0 ? "s" : ""}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBookingForm(true)}
          disabled={!selectedDate || !selectedTime || loading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
          ) : null}
          Continue to Book Darshan
        </button>
      </div>

      {/* Availability Overview */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center mb-6">
          <Users className="w-8 h-8 text-orange-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">
            Today's Availability
          </h2>
        </div>
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
          {timeSlots.map((slot) => {
            const capacity = timeSlotCapacity[slot];
            if (!capacity) return null;
            const totalBooked = Object.values(capacity.booked).reduce((a, b) => a + b, 0);
            const totalAvailable = capacity.maxCapacity - totalBooked;
            
            return (
              <div
                key={slot}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Slot Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                    <span className="font-black text-gray-900 text-lg">{formatTimeRange(slot)}</span>
                  </div>
                  <div className="bg-orange-50 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-orange-600">
                      {totalAvailable} / {capacity.maxCapacity} Seats Available
                    </span>
                  </div>
                </div>
                
                {/* Individual Category Row */}
                <div className="space-y-4">
                  {Object.entries(categories).map(([key, cat]) => {
                    const booked = capacity.booked[key] || 0;
                    const left = cat.limit - booked;
                    const percentage = (booked / cat.limit) * 100;
                    
                    return (
                      <div key={key} className="group/cat">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter w-14">
                              {cat.label}
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                              {left} <span className="text-[10px] text-gray-400 font-normal">left</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">
                            {booked}/{cat.limit}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${
                              percentage >= 100 ? 'bg-red-500' : 
                              percentage > 80 ? 'bg-orange-400' :
                              percentage > 50 ? 'bg-blue-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Availability Legend */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Filling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Full</span>
          </div>
        </div>
      </div>
    </div>
  );

  const TicketsTab = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
            <TicketIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Pilgrimage Passes</h2>
            <p className="text-xs text-gray-500">View and manage your darshan bookings</p>
          </div>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-orange-600"
          title="Refresh Tickets"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-orange-600" />
            <p className="text-gray-400 font-medium">Loading your sacred passes...</p>
          </div>
        </div>
      ) : bookedTickets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:gap-8">
          {bookedTickets.map((ticket) => (
            <div key={ticket.ticket_id} className="group relative bg-white rounded-2xl md:rounded-3xl shadow-lg md:shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 max-w-4xl mx-auto w-full">
              {/* Ticket Container */}
              <div className="flex flex-col md:flex-row">

                {/* Main Info Section */}
                <div className="flex-grow p-5 md:p-8 bg-gradient-to-br from-white to-gray-50">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div>
                      <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2 mr-2">
                        Confirmed Entry
                      </span>
                      <span className={`inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2 ${ticket.category === 'vip' ? 'bg-purple-100 text-purple-700' : ticket.category === 'elderly' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ticket.category || 'Normal'}
                      </span>
                      <h3 className="text-lg md:text-3xl font-black text-gray-900 leading-tight">
                        Mahakaleshwar<span className="hidden md:inline"><br /></span> <span className="text-orange-600">Jyotirlinga</span>
                      </h3>
                    </div>
                    {/* Ticket ID on Mobile */}
                    <div className="md:hidden text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ID</p>
                      <p className="font-mono font-bold text-gray-800 text-sm">#{ticket.ticket_id ? String(ticket.ticket_id).slice(0, 6) : "UNK"}</p>
                    </div>
                    {/* Ticket ID on Desktop */}
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ticket ID</p>
                      <p className="font-mono font-bold text-gray-800 text-lg">#{ticket.ticket_id ? String(ticket.ticket_id).slice(0, 8) : "UNK"}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                    <div className="bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none">
                      <div className="flex items-center gap-1.5 md:gap-2 text-gray-400 mb-0.5 md:mb-1">
                        <Calendar size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-xs font-bold uppercase">Date</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm md:text-lg">{new Date(ticket.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none">
                      <div className="flex items-center gap-1.5 md:gap-2 text-gray-400 mb-0.5 md:mb-1">
                        <Clock size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-xs font-bold uppercase">Time Range</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm md:text-lg">{formatTimeRange(ticket.time)}</p>
                    </div>
                    <div className="bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none">
                      <div className="flex items-center gap-1.5 md:gap-2 text-gray-400 mb-0.5 md:mb-1">
                        <Users size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-xs font-bold uppercase">Devotees</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm md:text-lg">{ticket.no_of_tickets} <span className="text-xs text-gray-500 font-normal">Person(s)</span></p>
                    </div>
                    <div className="bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none">
                      <div className="flex items-center gap-1.5 md:gap-2 text-gray-400 mb-0.5 md:mb-1">
                        <Users size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-xs font-bold uppercase">Visitor</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm md:text-lg truncate max-w-[100px] md:max-w-[120px]">{ticket.Client?.name || clientInfo.name}</p>
                    </div>
                  </div>

                  {/* Footer / Download */}
                  <div className="pt-4 md:pt-6 border-t border-dashed border-gray-300 flex justify-between items-center">
                    <div className="text-[10px] md:text-xs text-gray-400 font-medium">
                      Booked: {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => downloadTicket(ticket)}
                      className="text-orange-600 hover:text-orange-700 font-bold text-xs md:text-sm flex items-center gap-1 hover:underline bg-orange-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none"
                    >
                      <Download size={14} className="md:w-4 md:h-4" /> Download
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative md:w-px md:h-auto h-px w-full bg-gray-200">
                  <div className="absolute top-1/2 left-0 md:left-1/2 md:top-0 w-4 h-4 md:w-6 md:h-6 bg-gray-50 rounded-full md:-translate-x-1/2 -translate-y-1/2 md:translate-y-0 shadow-inner z-10 -ml-2 md:ml-0"></div>
                  <div className="absolute top-1/2 right-0 md:left-1/2 md:bottom-0 w-4 h-4 md:w-6 md:h-6 bg-gray-50 rounded-full md:-translate-x-1/2 -translate-y-1/2 md:-translate-y-0 shadow-inner z-10 -mr-2 md:mr-0"></div>
                </div>

                {/* QR Section */}
                <div className="p-4 md:p-6 md:w-72 bg-gray-50 flex flex-row md:flex-col items-center justify-between md:justify-center border-l md:border-l-0 md:border-l-dashed border-gray-200 gap-4">
                  <div className="flex flex-col md:items-center">
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 md:text-center">Scan Entry</p>
                    <p className="md:hidden font-mono font-bold text-lg text-gray-900">
                      Scan Code →
                    </p>
                    <p className="hidden md:block font-mono font-bold text-lg text-gray-900">
                      #{ticket.ticket_id ? String(ticket.ticket_id).slice(0, 6) : "UNK"}
                    </p>
                  </div>

                  <div className="bg-white p-2 md:p-4 rounded-xl shadow-sm border border-gray-100">
                    {ticket.qr_code ? (
                      <img src={ticket.qr_code} alt={`QR code for ticket ${ticket.ticket_id}`} className="w-20 h-20 md:w-40 md:h-40 object-contain" />
                    ) : (
                      <QrCode className="w-20 h-20 md:w-40 md:h-40 text-gray-200" />
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <TicketIcon className="w-10 h-10 text-orange-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Bookings Found</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Your spiritual journey awaits. Book your first darshan slot to receive your digital pass.</p>
          <button
            onClick={() => setActiveTab("book")}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl"
          >
            Book Now
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="pt-24 pb-8 md:pt-28 md:pb-10 px-6 text-center bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 mb-3 animate-fade-in-up">
            <Sparkles size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sacred Darshan Booking</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight text-gray-900">
            Book Your <span className="text-orange-600">Divine Visit</span>
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
            Reserve your slot for Mahakaleshwar Jyotirlinga Darshan. Experience peace, devotion, and seamless entry.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent w-full"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-12 w-full">
        {/* Success Modal */}
        {animateSuccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center transform animate-bounce-short max-w-sm mx-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-500 mb-6">Your sacred slot has been reserved successfully.</p>
              <button
                onClick={() => setAnimateSuccess(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}



        {/* Tabs - Centered & Responsive */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 gap-2">
            <button
              onClick={() => setActiveTab("book")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === "book"
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <Calendar size={18} />
              Book Slot
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === "tickets"
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <TicketIcon size={18} />
              My Tickets
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "book" ? <BookingTab /> : <TicketsTab />}

        {/* Booking Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Complete Your Booking
              </h3>

              <div className="space-y-4">
                <input
                  type="text"
                  value={clientInfo.name}
                  onChange={(e) =>
                    setClientInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Full Name *"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) =>
                    setClientInfo((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Email *"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) =>
                    setClientInfo((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Phone Number"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="bg-orange-50 p-4 rounded-xl mt-6 border border-orange-100">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <TicketIcon size={16} className="text-orange-600" />
                  Booking Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-bold text-gray-800">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reserved Slot</span>
                    <span className="font-bold text-gray-800">{formatTimeRange(selectedTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="font-bold text-orange-600">{categories[selectedCategory].label}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                    <span className="text-gray-500">Total Devotees</span>
                    <span className="font-black text-gray-900">{ticketCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowBookingForm(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                  ) : null}
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Ticket ID: {selectedTicket.ticket_id}
                </p>
                {selectedTicket.qr_code ? (
                  <img
                    src={selectedTicket.qr_code}
                    alt={`QR code for ticket ${selectedTicket.ticket_id}`}
                    className="w-64 h-64 mx-auto border-4 border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold mb-2">
                  Scan this QR code at the temple entrance
                </p>
                <p>
                  {formatDate(selectedTicket.date)} at {selectedTicket.time}
                </p>
                <p>{selectedTicket.no_of_tickets} ticket(s)</p>
              </div>

              <button
                onClick={() => downloadTicket(selectedTicket)}
                className="mt-6 w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Ticket</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div >
  );
};

export default DivyaYatraBooking;
