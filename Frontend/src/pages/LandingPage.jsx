import React from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Activity, CreditCard, ShieldCheck, ArrowRight, MapPin, Calendar, Phone } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const featureCards = [
    { title: "Sacred Navigation", icon: <Compass size={24} />, desc: "Navigate through holy corridors with real-time AI guidance.", color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Live Darshan", icon: <Activity size={24} />, desc: "Witness the divine presence with real-time darshan links.", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Smart Booking", icon: <CreditCard size={24} />, desc: "Seamlessly book tickets, parking, and accommodation.", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Crisis Hub", icon: <ShieldCheck size={24} />, desc: "Advanced emergency tracking and pilgrim safety portal.", color: "text-purple-600", bg: "bg-purple-50" }
  ];

  const currentSlide = 0;
  const slides = [
    "https://cdn.pixabay.com/photo/2016/08/21/19/49/temple-1610625_1280.jpg",
    "https://s-media-cache-ak0.pinimg.com/originals/c3/22/a0/c322a010cd73eb17596d705120bc0132.jpg",
    "https://wallpaperaccess.com/full/9297798.jpg",
    "https://wallpaperbat.com/img/1609509-ram-mandir-photo-a-look-at-the-proposed-model-for-ram-janmbhoomi-temple-in-ayodhya.jpg"
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white font-['Outfit']">
      <Header />
      
      {/* Hero Section */}
      <div className="relative pt-16 pb-24 px-4 md:px-6 lg:px-8 overflow-hidden">
        {/* Background Decorative Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute -bottom-20 left-0 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px] -ml-32 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 justify-center mb-12">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">DIVYA YATRA</h3>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Pilgrim Navigator</span>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left: Text & CTA */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                  Step into the<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500">Divine Journey</span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 font-medium max-w-xl leading-relaxed">
                  Your ultimate companion for seamless pilgrimage. Navigate, book, and experience the divine with confidence using our AI-powered platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("/auth")} className="px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-orange-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Start Your Journey <ArrowRight size={18} />
                </button>
                <button onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="px-8 py-3.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-orange-300 hover:bg-orange-50 transition-all">
                  Learn More
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <p className="text-2xl font-black text-orange-600">50K+</p>
                  <p className="text-xs text-slate-500 font-medium">Pilgrims Served</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-600">25+</p>
                  <p className="text-xs text-slate-500 font-medium">Holy Sites</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">99.8%</p>
                  <p className="text-xs text-slate-500 font-medium">Uptime</p>
                </div>
              </div>
            </div>

            {/* Right: Image Carousel */}
            <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700 shadow-2xl">
              <div
                className="w-full h-full transition-transform duration-1000 ease-in-out"
                style={{
                  backgroundImage: `url(${slides[currentSlide % slides.length]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
            </div>
          </div>

          {/* Features Grid */}
          <div id="services" className="scroll-mt-28">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-4 tracking-tight">What We Offer</h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
              Everything you need for a sacred and seamless pilgrimage experience
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/20 transition-all duration-300"
                >
                  <div className={`p-4 w-fit rounded-2xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Begin Your Sacred Journey?</h2>
            <p className="text-orange-100 mb-6 max-w-xl mx-auto">
              Join thousands of pilgrims who trust Divya Yatra for their spiritual journey
            </p>
            <button onClick={() => navigate("/ticket")} className="px-8 py-3.5 rounded-full bg-white text-orange-600 font-bold hover:shadow-lg transition-all hover:-translate-y-1">
              Get Started Now
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LandingPage;
