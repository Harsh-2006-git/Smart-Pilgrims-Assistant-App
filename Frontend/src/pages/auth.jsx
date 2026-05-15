import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  ArrowRight,
  Globe,
  Activity,
  ShieldCheck,
  XCircle,
  Calendar,
  Compass,
  CreditCard,
  MapPin
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { API_V1 } from "../config/api";

const Auth = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState("initial"); // initial, registering
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    userType: "Civilian",
    age: "",
    adminSecret: "",
    divyangCardId: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const slides = [
    "https://cdn.pixabay.com/photo/2016/08/21/19/49/temple-1610625_1280.jpg",
    "https://s-media-cache-ak0.pinimg.com/originals/c3/22/a0/c322a010cd73eb17596d705120bc0132.jpg",
    "https://wallpaperaccess.com/full/9297798.jpg",
    "https://wallpaperbat.com/img/1609509-ram-mandir-photo-a-look-at-the-proposed-model-for-ram-janmbhoomi-temple-in-ayodhya.jpg"
  ];

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage("");
    try {
      const idToken = credentialResponse.credential;
      const decodedUser = jwtDecode(idToken);

      const response = await fetch(`${API_V1}/auth/profile`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
        navigate("/");
      } else if (response.status === 404 || response.status === 401) {
        setFormData({
          name: decodedUser.name || "",
          email: decodedUser.email || "",
          phone: "",
          userType: "Civilian",
          age: "",
          adminSecret: "",
          divyangCardId: "",
        });
        setStep("registering");
      } else {
        throw new Error("Divine connection lost");
      }
    } catch (error) {
      console.error(error);
      setMessage("Service temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const featureCards = [
    { title: "Sacred Navigation", icon: <Compass size={20} />, desc: "Navigate through holy corridors with real-time AI guidance.", color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Live Darshan", icon: <Activity size={20} />, desc: "Witness the divine presence with real-time darshan links.", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Smart Booking", icon: <CreditCard size={20} />, desc: "Seamlessly book tickets, parking, and accommodation.", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Crisis Hub", icon: <ShieldCheck size={20} />, desc: "Advanced emergency tracking and pilgrim safety portal.", color: "text-purple-600", bg: "bg-purple-50" }
  ];

  return (
    <div className="relative h-[100dvh] w-full flex items-center justify-center bg-slate-50 font-['Outfit'] select-none overflow-hidden p-3 md:p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px] -ml-32 -mb-32 transition-all duration-1000 pointer-events-none"></div>

      <div className="w-full max-w-7xl h-full flex flex-col lg:flex-row gap-4 md:gap-12 lg:gap-24 relative z-10 p-2 md:p-6 items-center justify-center">
        
        {/* Left Section: Branding & Features */}
        <div className="w-full lg:w-3/5 space-y-4 md:space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-2 md:gap-4 justify-center lg:justify-start">
            <div className="w-12 h-12 md:w-24 md:h-24 flex items-center justify-center">
               <img src={logo} alt="Divya Yatra Application Logo" className="w-full h-full object-contain" />
            </div>
            <div>
               <h3 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">DIVYA YATRA</h3>
               <span className="text-[8px] md:text-xs font-bold text-orange-600 uppercase tracking-widest">Pilgrim Navigator</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-6 text-center lg:text-left">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95]">
              Step into the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500">Divine Journey</span>
            </h1>
            <p className="max-w-xl mx-auto lg:mx-0 text-slate-500 text-xs md:text-lg font-medium leading-relaxed">
              A unified portal for Pilgrims, Trust, and Administration.
            </p>
          </div>

          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureCards.map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-5 rounded-3xl bg-white border border-slate-100 backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 group">
                <div className={`p-3 h-fit rounded-[1.25rem] ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 leading-none text-sm">{feature.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-snug">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Sign In Card */}
        <div className="w-full lg:w-2/5 animate-in fade-in slide-in-from-right-8 duration-700 max-w-lg mx-auto flex flex-col justify-center">
           <div className="bg-white rounded-2xl md:rounded-[3.5rem] p-4 md:p-10 lg:p-14 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] text-center border border-slate-100 flex flex-col justify-center min-h-0 md:min-h-[600px] relative overflow-hidden">
              
              <div className="relative z-10">
                <div className="space-y-6 flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50/50 border border-orange-100/50 text-[10px] font-black tracking-widest text-orange-600 uppercase shadow-sm">
                     <Globe size={12} /> DIVINE ACCESS
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">
                      {step === "initial" ? "Welcome Back" : "Complete Profile"}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">
                      {step === "initial" ? "Sign in to your spiritual workspace" : "Provide details for your sacred pass"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 md:mt-10">
                    {step === "initial" ? (
                      <div className="space-y-4 md:space-y-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                         <div className="w-full p-6 md:p-8 rounded-[2rem] bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center space-y-4 md:space-y-6 shadow-inner">
                            <div className="hidden md:block relative -mt-16 mb-6">
                               <div className="relative w-22 h-22 bg-white rounded-[2.75rem] shadow-[0_24px_70px_-15px_rgba(15,23,42,0.12)] border border-slate-100 flex items-center justify-center overflow-hidden">
                                  {/* Internal glass structural layers */}
                                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-slate-200/20 to-transparent"></div>
                                  
                                  <div className="w-15 h-15 rounded-[1.75rem] bg-slate-50 border border-slate-200/60 flex items-center justify-center p-2.5 shadow-inner">
                                     <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        <User className="text-slate-900" size={22} />
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div className="hidden md:block text-center space-y-1">
                               <span className="text-slate-800 font-bold block text-lg">One-Tap Authentication</span>
                               <span className="text-slate-400 text-xs font-medium">Continue securely with your Google account</span>
                            </div>
                            <div className="w-full transform transition-all hover:scale-[1.02] flex justify-center py-2">
                              <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setMessage("Connection Failed")}
                                useOneTap
                                theme="outline"
                                shape="pill"
                                size="large"
                                width="250px"
                              />
                            </div>
                         </div>
                      </div>
                   ) : (
                     <form className="space-y-4 text-left animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="space-y-3">
                          <div className="relative group">
                             <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                             <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all placeholder:text-slate-400" />
                          </div>
                          <div className="relative group">
                             <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input type="email" placeholder="Email Address" value={formData.email} readOnly className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 pl-14 pr-6 text-slate-500 font-medium outline-none cursor-not-allowed" />
                          </div>
                          <div className="relative group">
                             <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                             <input
                               type="tel"
                               placeholder="Mobile Contact"
                               value={formData.phone}
                               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                               className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] placeholder:text-slate-400"
                             />
                          </div>
                           <div className="relative group">
                             <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                             <select
                                value={formData.userType}
                                onChange={(e) => setFormData({...formData, userType: e.target.value})}
                                className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all appearance-none cursor-pointer"
                             >
                                <option value="Civilian">Civilian Devotee</option>
                                <option value="Aged">Senior Citizen (60+)</option>
                                <option value="VIP">VIP Delegate</option>
                                <option value="Divyang">Differently Abled (Divyang)</option>
                                <option value="Sadhu">Sadhu / Saint</option>
                                <option value="Admin">Administrator</option>
                                <option value="ParkingOwner">Parking Owner</option>
                                <option value="StayOwner">Stay Owner</option>
                             </select>
                             <Globe className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                          </div>

                          {/* Conditional Fields Based on User Type */}
                          {formData.userType === "Admin" && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                              <input 
                                type="password" 
                                placeholder="Admin Secret Verification Code" 
                                value={formData.adminSecret} 
                                onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })} 
                                className="w-full bg-red-50/50 border border-red-100 focus:border-red-400 rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all placeholder:text-red-300" 
                              />
                            </div>
                          )}

                          {formData.userType === "Aged" && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="number" 
                                placeholder="Enter Age (Years)" 
                                value={formData.age} 
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
                                className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all placeholder:text-slate-400" 
                              />
                            </div>
                          )}

                          {formData.userType === "Divyang" && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                              <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text" 
                                placeholder="Government Divyang Card ID" 
                                value={formData.divyangCardId} 
                                onChange={(e) => setFormData({ ...formData, divyangCardId: e.target.value })} 
                                className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all placeholder:text-slate-400" 
                              />
                            </div>
                          )}

                          {formData.userType === "VIP" && (
                            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                               <ShieldCheck size={18} className="text-purple-600 mt-1 flex-shrink-0" />
                               <p className="text-[11px] font-bold text-purple-700 leading-tight">
                                 VIP registrations require manual verification by the Temple Board. Your access will be restricted until approved.
                               </p>
                            </div>
                          )}

                          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                             <MapPin size={18} className="text-orange-500 mt-1 flex-shrink-0" />
                             <p className="text-[11px] font-bold text-orange-700 leading-tight">
                               Accommodation hosting is granted separately by admin verification. Register as your normal pilgrim category first.
                             </p>
                          </div>
                        </div>

                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            if(!formData.name || !formData.phone) {
                               setMessage("Please fill out all required fields.");
                               return;
                            }

                            // Role specific validation
                            if(formData.userType === "Admin" && !formData.adminSecret) {
                               setMessage("Admin Secret Code is required for this role.");
                               return;
                            }
                            if(formData.userType === "Divyang" && !formData.divyangCardId) {
                               setMessage("Please provide your Government Divyang Card ID.");
                               return;
                            }
                            if(formData.userType === "Aged" && !formData.age) {
                               setMessage("Age verification is required for this category.");
                               return;
                            }

                            setIsLoading(true);
                            try {
                              const response = await fetch(`${API_V1}/auth/register`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...formData, password: 'google_auth_placeholder' }),
                              });
                              const data = await response.json();
                              if (response.ok) {
                                localStorage.setItem("user", JSON.stringify(data.user));
                                localStorage.setItem("token", data.token);
                                setIsAuthenticated(true);
                                navigate("/");
                              } else { setMessage(data.message); }
                            } catch { setMessage("Registration failed. Try again."); }
                            finally { setIsLoading(false); }
                          }}
                          className="w-full h-14 bg-slate-900 hover:bg-orange-600 text-white rounded-2xl font-bold text-[15px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl mt-4"
                          disabled={isLoading}
                        >
                          {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <>Complete Profile <ArrowRight size={18} /></>}
                        </button>
                        
                        <button type="button" onClick={() => setStep("initial")} className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-4 hover:text-slate-900 transition-colors">Return to Login</button>
                     </form>
                   )}

                   {message && (
                     <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center gap-2 text-rose-600 text-[13px] font-bold animate-in bounce-in w-full">
                       <XCircle size={16} /> {message}
                     </div>
                   )}
                </div>
              </div>

              <div className="pt-4 md:pt-8 w-full relative z-10 mt-auto">
                 <div className="w-full relative h-[70px] md:h-[110px] rounded-[1rem] overflow-hidden border border-slate-100 flex items-center bg-slate-50 shadow-inner group">
                    <div className="flex animate-marquee hover:[animation-play-state:paused] w-max py-2">
                      {[...slides, ...slides, ...slides, ...slides].map((imgUrl, index) => (
                        <div key={index} className="w-[100px] md:w-[160px] h-[60px] md:h-[95px] flex-shrink-0 mx-[4px]">
                           <img src={imgUrl} alt={`Glimpse of a sacred temple site: ${index % slides.length + 1}`} className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm" />
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Minimal Card Base Glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-gradient-to-t from-orange-50/50 to-transparent pointer-events-none"></div>

              <style>
                {`
                  @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-168px * 4)); }
                  }
                  .animate-marquee {
                    animation: marquee 20s linear infinite;
                  }
                `}
              </style>

           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
;
