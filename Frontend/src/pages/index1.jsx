import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Ticket,
  Zap,
  Compass,
  BarChart3,
  Video,
  Search,
  Bot,
  Milestone,
  Hospital,
  Hotel,
  Utensils,
  Shield,
  ShieldAlert,
  LayoutDashboard
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_V1 } from "../config/api";
import logo from "../assets/logo.png";

// Optimize: Load image references lazily and only use every 2nd frame to reduce payload by 50%
const imageModules = import.meta.glob('../temple1/*.jpg');
const sortedPaths = Object.keys(imageModules).sort();
// Use every 2nd frame for a smoother balance between performance and quality
const filteredPaths = sortedPaths.filter((_, index) => index % 2 === 0);

const HomePage2 = () => {
  const navigate = useNavigate();
  const heroContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [nightHeroUrl, setNightHeroUrl] = useState(null);
  const [sosStatus, setSosStatus] = useState('idle'); // idle, sending, success, error

  const handleSOS = async () => {
    setSosStatus('sending');
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setSosStatus('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_V1}/admin/sos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ lat: latitude, lng: longitude })
        });

        if (response.ok) {
          setSosStatus('success');
          setTimeout(() => setSosStatus('idle'), 5000);
        } else {
          throw new Error("Failed to reach emergency services");
        }
      } catch (err) {
        alert(err.message);
        setSosStatus('idle');
      }
    }, (err) => {
      alert("Geolocation permission denied. Please enable location for SOS.");
      setSosStatus('idle');
    });
  };

  useEffect(() => {
    let loadedCount = 0;
    const totalToLoad = filteredPaths.length;
    const imgs = [];

    filteredPaths.forEach(async (path, i) => {
      try {
        const module = await imageModules[path]();
        const url = module.default || module;

        // Set the night hero image (using the last image as requested)
        if (i === totalToLoad - 1) {
          setNightHeroUrl(url);
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedCount++;
          setLoadingProgress(Math.floor((loadedCount / totalToLoad) * 100));
          if (loadedCount === totalToLoad) {
            setImagesPreloaded(true);
          }
        };
        imgs[i] = img;
      } catch (err) {
        console.error("Error loading image:", path, err);
        loadedCount++; // Avoid blocking if one fails
      }
    });
    imagesRef.current = imgs;
  }, []);

  const imageUrlsCount = filteredPaths.length;



  useEffect(() => {
    if (!imagesPreloaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const renderFrame = (index) => {
      if (!imagesRef.current[index]) return;
      const img = imagesRef.current[index];
      if (canvas.width !== img.width) canvas.width = img.width;
      if (canvas.height !== img.height) canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };

    renderFrame(0);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (heroContainerRef.current) {
            const rect = heroContainerRef.current.getBoundingClientRect();
            const maxScroll = rect.height - window.innerHeight;
            let progress = 0;
            if (rect.top < 0) {
              progress = Math.min(1, Math.abs(rect.top) / maxScroll);
            }
            const maxIndex = imageUrlsCount - 1;
            const index = Math.min(maxIndex, Math.max(0, Math.floor(progress * maxIndex)));
            renderFrame(index);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [imagesPreloaded]);




  const handleNavigation = (target) => {
    console.log("Home: Navigating to", target);
    if (target.startsWith("http")) {
      window.location.href = target;
      return;
    }

    const section = document.getElementById(target);
    if (section) {
      const offset = 100; // adjust this value to match your navbar height
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: sectionTop - offset,
        behavior: "smooth",
      });
      return;
    }

    // Otherwise, navigate as usual
    navigate(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const services = [
    {
      title: "Priority Ticketing System",
      description:
        "Book your yatra tickets with priority allocation and time slots",
      icon: <Ticket className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: ["Time-slot booking", "VIP priority", "Real-time availability"],
      link: "/ticket"
    },
    {
      title: "Urban Mobility & Planning",
      description: "Real-time tracking of crowd density in each zone.",
      icon: <Zap className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: [
        "Zone-wise Density Monitoring",
        "Smart Alerts & Notifications",
        "RFID-based Entry & Exit",
      ],
      link: "/density"
    },
    {
      title: "Family Safety Mode",
      description: "Real-time family tracking with live route, SOS alerts & guardian notifications",
      icon: <Shield className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: [
        "Live Location Stream",
        "Voice & Sound SOS Alerts",
        "Guardian Rescue Route",
      ],
      link: "/family-mode"
    },
    {
      title: "Crowd Detection & Alerts",
      description: "Monitor crowd density in temples & ghats for safety",
      icon: <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: [
        "Real-time heatmaps",
        "Density alerts",
        "Prevent overcrowding",
      ],
      link: "/crowd-detection"
    },
    {
      title: "Live Darshan",
      description: "Watch temple ceremonies from anywhere with HD streaming",
      icon: <Video className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: [
        "Multiple camera views",
        "24/7 streaming",
        "Mobile-friendly access",
      ],
      link: "/live-darshan"
    },
    {
      title: "AI-based Lost & Found",
      description: "Locate lost items with AI-powered tracking and notifications",
      icon: <Search className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: ["Item registration", "AI image matching", "Real-time alerts"],
      link: "/lost-and-found"
    },
    {
      title: "Interactive Divine Map",
      description: "A 3D-integrated digital map of Ujjain with GPS navigation for devotees.",
      icon: <MapPin className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: ["3D Temple Icons", "Ghat-wise Distance", "Live Crowd Heatmap"],
      link: "/map"
    },
    {
      title: "Pilgrim Stays & Lodging",
      description:
        "List or book dharamshalas, lodges, and homestays with maps, filters, and host contact — safe stays for the yatra.",
      icon: <Hotel className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: ["GPS on map", "Book rooms", "List with Cloudinary photos"],
      link: "/stays"
    },
    {
      title: "AI Yatra Planner",
      description: "Plan your spiritual journey with our AI-powered travel assistant.",
      icon: <Bot className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: ["Custom Itinerary", "Multilingual Support", "24/7 AI Guidance"],
      link: "/chatbot"
    },
    {
      title: "Admin Master Dashboard",
      description: "Centralized control panel for monitoring and managing yatra operations.",
      icon: <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />,
      features: ["Real-time Monitoring", "Emergency Controls", "System Analytics"],
      link: "/admin"
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 text-gray-800 leading-relaxed font-sans">
      <Header />



      {/* Hero Section with Scroll Animation */}
      <section
        ref={heroContainerRef}
        className={`relative w-full ${imagesPreloaded ? "h-[250vh]" : "h-[calc(100vh-80px)]"} mt-[80px] bg-transparent transition-all duration-700`}
      >
        <div className="sticky top-[80px] h-[calc(100vh-80px)] w-full flex items-center justify-center lg:justify-start text-white overflow-hidden bg-slate-900">
          {/* Night View Image (shown while loading) */}
          <div
            className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${imagesPreloaded ? "opacity-0" : "opacity-100"}`}
            style={{
              backgroundImage: `url(${nightHeroUrl})`,
              backgroundPosition: 'center 20%'
            }}
          >
            {!imagesPreloaded && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Divine Portal Syncing... {loadingProgress}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover object-top z-0 transition-opacity duration-1000 ${imagesPreloaded ? "opacity-100" : "opacity-0"}`}
          ></canvas>

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50 lg:bg-gradient-to-r lg:from-black/60 lg:via-black/20 lg:to-transparent z-[1] pointer-events-none"></div>

          <div className="absolute inset-0 overflow-hidden z-[1] pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-orange-300/30 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              ></div>
            ))}
          </div>

          <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 xl:px-16 mt-8 lg:mt-16">
            <div className="flex flex-col lg:flex-row justify-between items-center w-full">
              <div className="text-center lg:text-left animate-fadeInUp max-w-xl">
                <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black mb-1 drop-shadow-2xl bg-gradient-to-r from-white via-orange-100 to-orange-200 bg-clip-text text-transparent leading-[1.2] tracking-tight whitespace-nowrap py-2">
                  Welcome to Divya Yatra
                </h1>
                <p className="text-base md:text-lg lg:text-xl mb-4 drop-shadow-lg font-semibold text-orange-100">
                  Begin Your Sacred Journey
                </p>
                <p className="hidden md:block text-sm lg:text-base mb-6 max-w-lg text-white/90 leading-relaxed font-medium drop-shadow whitespace-pre-line mx-auto lg:mx-0">
                  Experience divine blessings at Mahakaleshwar Jyotirlinga and immerse yourself in centuries of spiritual heritage.
                </p>
                <div className="flex flex-row gap-2 sm:gap-3 justify-center lg:justify-start">
                  <button
                    onClick={() => handleNavigation("/ticket")}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-full font-bold text-[10px] sm:text-xs md:text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-1 transform border border-indigo-400/30"
                  >
                    Start Your Journey
                  </button>
                  <button
                    onClick={() => handleNavigation("darshan")}
                    className="hidden md:flex px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-black/40 hover:bg-white/20 text-white border border-white/30 rounded-full font-bold text-[10px] sm:text-xs md:text-sm transition-all duration-300 hover:-translate-y-1 transform backdrop-blur-md shadow-md"
                  >
                    Watch Live Darshan
                  </button>
                  <button
                    onClick={handleSOS}
                    disabled={sosStatus === 'sending'}
                    className={`px-5 py-2.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full font-black text-[10px] sm:text-[10px] md:text-sm transition-all duration-300 flex items-center gap-2 group transform hover:-translate-y-1 shadow-2xl ${sosStatus === 'success'
                        ? 'bg-emerald-600 text-white shadow-emerald-500/50 scale-105'
                        : 'bg-red-600 text-white border border-red-500/40 shadow-red-600/50 hover:bg-red-700'
                      }`}
                  >
                    <ShieldAlert size={18} className={`${sosStatus === 'sending' ? 'animate-spin' : 'animate-pulse group-hover:scale-125 transition-transform'}`} />
                    <span className="tracking-tighter">
                      {sosStatus === 'idle' && "EMERGENCY SOS"}
                      {sosStatus === 'sending' && "BROADCASTING..."}
                      {sosStatus === 'success' && "HELP DISPATCHED!"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex relative items-center pointer-events-none mt-8 lg:mt-0">
                <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-[260px] lg:h-[260px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute w-full h-full border border-orange-400/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                  <div className="absolute w-[85%] h-[85%] border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                  <div className="relative z-20 flex flex-col items-center">
                    <div className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden border-2 md:border-4 border-orange-400/40 shadow-[0_0_30px_rgba(234,88,12,0.4)] bg-transparent">
                      <img src={logo} alt="Divya Yatra Logo" className="w-full h-full object-cover filter brightness-110" />
                    </div>
                    <div className="flex flex-col items-center mt-3 md:mt-4 z-30">
                      <div className="w-6 md:w-8 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mb-1 shadow-[0_0_10px_rgba(234,88,12,0.6)]"></div>
                      <p className="text-[8px] md:text-[10px] lg:text-xs text-orange-100 font-bold tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">
                        Faith • Peace • Devotion
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full border border-orange-400/20 scale-110 animate-pulse"></div>
                </div>

                <div className="absolute inset-0 animate-[orbit_15s_linear_infinite] flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-[260px] lg:h-[260px] border border-white/10 rounded-full flex items-center justify-center">
                    <div className="absolute top-0 w-2 h-2 md:w-3 md:h-3 bg-gradient-to-br from-orange-300 to-red-500 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.8)]"></div>
                  </div>
                </div>

                <div className="absolute inset-0 animate-[orbit_25s_linear_infinite_reverse] flex items-center justify-center pointer-events-none">
                  <div className="relative w-[200px] h-[200px] md:w-[220px] md:h-[220px] lg:w-[300px] lg:h-[300px] border border-white/10 rounded-full">
                    <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 lg:bottom-8 lg:left-8 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK FINDER SECTION - KEPT STYLED BUT ORIGINAL SIZE */}
      <section className="relative z-20 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-3xl border border-orange-100 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(234,88,12,0.15)] p-3 md:p-4 flex flex-col md:flex-row items-center gap-4 hover:shadow-[0_30px_70px_-15px_rgba(234,88,12,0.25)] transition-all duration-500">
            <div className="px-6 py-2 border-r border-orange-100 hidden lg:flex flex-col items-center">
              <Zap className="text-orange-500 mb-1" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Quick Find</span>
            </div>

            <div className="flex-1 w-full grid grid-cols-5 gap-2 md:gap-6 px-2">
              {[
                { id: 'temple', label: 'Mandir', icon: <Milestone size={20} />, color: 'bg-pink-500', aura: 'bg-pink-500/10' },
                { id: 'restaurant', label: 'Food', icon: <Utensils size={20} />, color: 'bg-amber-500', aura: 'bg-amber-500/10' },
                { id: 'hospital', label: 'Medical', icon: <Hospital size={20} />, color: 'bg-red-500', aura: 'bg-red-500/10' },
                { id: 'police', label: 'Police', icon: <Shield size={20} />, color: 'bg-blue-600', aura: 'bg-blue-600/10' },
                { id: 'hotel', label: 'Stay', icon: <Hotel size={20} />, color: 'bg-purple-600', aura: 'bg-purple-600/10' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/nearby?category=${item.id}`)}
                  className="group flex flex-col items-center gap-2 py-2 rounded-2xl hover:bg-orange-50/50 transition-all relative"
                >
                  <div className={`absolute inset-0 ${item.aura} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-md`}></div>
                  <div className={`${item.color} w-10 h-10 md:w-14 md:h-14 rounded-xl shadow-lg border-2 border-white flex items-center justify-center text-white relative z-10 transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-110`}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] md:text-[11px] font-black text-slate-800 tracking-tight uppercase group-hover:text-orange-600 relative z-10">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="hidden xl:flex flex-col items-center px-8 border-l border-orange-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mb-1"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">Live Navigation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-10 py-16 lg:py-24">
        {/* Services Section */}
        <section id="services" className="mb-20 relative">
          <div className="text-center mb-16 pt-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent leading-tight py-2">
              Our Sacred Services
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete spiritual experience with personalized care and devotion
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <div
                key={service.title}
                onClick={() => handleNavigation(service.link)}
                className="group relative bg-white rounded-xl md:rounded-3xl p-3 md:p-6 border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row items-start gap-3 md:gap-5 mb-3 md:mb-5 font-sans">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl flex-shrink-0 shadow-inner">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-xs md:text-xl font-bold text-slate-800 mb-1 leading-tight">
                      {service.title}
                    </h3>
                    <p className="text-[10px] md:text-sm text-slate-500 line-clamp-2 leading-relaxed hidden md:block">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 md:space-y-2 mt-auto">
                  <div className="grid grid-cols-1 gap-1 md:gap-2">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-xs font-semibold text-slate-400 transition-colors"
                      >
                        <div className="w-1 h-1 bg-orange-400 rounded-full flex-shrink-0"></div>
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 md:pt-4 flex items-center justify-between border-t border-slate-50">
                    <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase text-orange-500 opacity-0 transition-opacity">
                      Go
                    </span>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 transition-all text-xs md:text-base">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section >
        {/* VR Temple Experience Section */}
        <section id="darshan" className="mb-12 lg:mb-20 px-4 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-7xl mx-auto">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-3 lg:space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold py-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent leading-tight">
                Virtual Experience
              </h2>

              <div className="w-16 h-1 lg:w-20 bg-gradient-to-r from-orange-500 to-red-500 mx-auto lg:mx-0 rounded-full"></div>

              <p className="text-xs md:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:max-w-none">
                Immerse yourself in the sacred atmosphere of Mahakaleshwar
                Temple from anywhere. Move your phone or drag with
                your mouse to enjoy a{" "}
                <span className="font-semibold text-orange-600">
                  360° divine darshan
                </span>
                as if you are standing inside.
              </p>

              <ul className="space-y-2 lg:space-y-3 text-gray-700 text-xs md:text-base">
                <li className="flex items-center gap-2 lg:gap-3 justify-center lg:justify-start">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-orange-500 rounded-full"></span>
                  360° Virtual Reality Darshan
                </li>
                <li className="flex items-center gap-2 lg:gap-3 justify-center lg:justify-start">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-orange-500 rounded-full"></span>
                  Works on Mobile & Desktop
                </li>
                <li className="flex items-center gap-2 lg:gap-3 justify-center lg:justify-start">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-orange-500 rounded-full"></span>
                  Fullscreen immersive mode supported
                </li>
              </ul>
            </div>

            {/* Right Content - Video */}
            <div className="relative w-full aspect-video rounded-xl lg:rounded-2xl overflow-hidden shadow-xl lg:shadow-2xl border-2 lg:border-4 border-orange-100">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/A5YdinFdV54?si=Q5olgTQ7ppu14T5d"
                title="Mahakaleshwar Temple VR Darshan"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; vr"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>

        {/* ── HACKATHON IMPACT SECTION ── */}
        <section id="about" className="mb-12 lg:mb-20">
          <div className="text-center mb-8 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-orange-100 border border-orange-200 mb-4 lg:mb-6">
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-orange-600 animate-pulse"></span>
              <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-widest text-orange-700">Built For Bharat's Devotees</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-black py-1 mb-1 lg:mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent tracking-tight leading-tight">
              The Problem We Solve
            </h2>
            <div className="w-12 h-1 lg:w-24 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full mb-4 lg:mb-6"></div>
            <p className="text-sm md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-2">
              Over <strong className="text-orange-600">50 million pilgrims</strong> visit Ujjain annually. In Kumbh Mela, stampedes & lost devotees are <strong className="text-red-600">life-threatening challenges</strong>. Divya Yatra is a <strong className="text-orange-700">smart platform</strong> built to serve every pilgrim.
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-10 lg:mb-16">
            {[
              { stat: '50M+', label: 'Pilgrims', sub: 'Ujjain', color: 'text-orange-600' },
              { stat: '7', label: 'AI', sub: 'Modules', color: 'text-red-600' },
              { stat: '360°', label: 'Darshan', sub: 'Virtual', color: 'text-purple-600' },
              { stat: 'Live', label: 'Safety', sub: 'YOLOv8', color: 'text-blue-600' },
              { stat: '2028', label: 'Kumbh', sub: 'Ready', color: 'text-emerald-600' },
              { stat: '24/7', label: 'AI Support', sub: 'Multilingual', color: 'text-amber-600' },
            ].map((item, idx) => (
              <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-xl p-2.5 md:p-4 text-center shadow-md hover:shadow-xl border border-orange-50 hover:border-orange-200 transition-all duration-300">
                <div className={`text-lg md:text-3xl font-black ${item.color} mb-0.5`}>{item.stat}</div>
                <div className="text-[8px] md:text-[11px] font-black text-slate-700 uppercase tracking-tight mb-0.5">{item.label}</div>
                <div className="text-[7px] md:text-[9px] text-slate-400 font-semibold">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="mb-8 lg:mb-12">
            <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2.5rem] p-6 lg:p-12 text-center shadow-lg border border-orange-100">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent"></div>
              <div className="relative z-10 w-full max-w-4xl mx-auto">
                <div className="text-orange-600 text-lg md:text-3xl lg:text-4xl font-serif mb-2 leading-relaxed font-bold drop-shadow-sm">
                  "आकाशे तारकं लिङ्गं पाताले हाटकेश्वरम् ।<br /> मर्त्यलोके महाकालं लिङ्गत्रय नमोऽस्तु ते ॥"
                </div>
                <p className="text-slate-500 text-[8px] md:text-xs tracking-widest uppercase font-bold px-4">
                  (In the sky is Taraka Linga, in the netherworld Hatakeshwara, and on earth Mahakala. Salutations to the three Lingas)
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 rounded-2xl md:rounded-3xl p-6 md:p-14 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 text-center lg:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-3 lg:mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Mission Mega Event</span>
                </div>
                <h3 className="text-2xl lg:text-5xl font-black tracking-tight py-1 mb-2 lg:mb-3">Simhastha Kumbh <span className="text-yellow-300">2028</span></h3>
                <p className="text-white/80 text-sm lg:text-lg max-w-2xl leading-relaxed">
                  Divya Yatra is engineered to scale for an estimated <strong className="text-yellow-200">100+ million devotees</strong> in Ujjain’s next mega gathering.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 lg:gap-4 shrink-0">
                <div className="hidden lg:block text-8xl font-black text-white/20 leading-none select-none">2028</div>
                <button onClick={() => navigate('/ticket')} className="w-full sm:w-auto px-6 py-3 lg:px-8 lg:py-4 bg-white text-orange-700 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest hover:bg-yellow-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                  Preview <span className="hidden sm:inline">Infrastructure</span> →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main >

      <Footer />

      {/* AI Chatbot Floating Action Button */}
      <button
        onClick={() => handleNavigation("/chatbot")}
        className="fixed bottom-4 md:bottom-8 left-4 md:left-8 z-50 group flex items-center justify-center"
        aria-label="AI Travel Planner ✨"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        <div className="relative h-10 w-10 md:h-14 md:w-14 bg-black/60 backdrop-blur-xl border border-white/20 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-active:scale-95">
          <Bot className="w-5 h-5 md:w-7 md:h-7 text-indigo-300" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 md:h-4 md:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-4 md:w-4 bg-violet-500 text-[5px] md:text-[8px] items-center justify-center font-bold">✨</span>
          </span>
        </div>
      </button>

      {/* Stylish Floating Live Darshan Button */}
      <button
        onClick={() => handleNavigation("/live-darshan")}
        className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 group flex items-center"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        <div className="relative flex items-center gap-1.5 md:gap-3 bg-black/60 backdrop-blur-xl border border-white/20 text-white px-3 md:px-6 py-2 md:py-3.5 rounded-full shadow-2xl transition-all duration-300 group-hover:scale-105 group-active:scale-95">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-ping"></span>
            <span className="relative w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
          </div>
          <span className="text-[8px] md:text-sm font-black tracking-widest uppercase">Live Darshan</span>
        </div>
      </button>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        html { scroll-behavior: smooth; }
        @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div >
  );
};

export default HomePage2;
