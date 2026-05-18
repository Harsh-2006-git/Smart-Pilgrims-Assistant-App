import React, { useState, useEffect } from "react";
import {
  User, Phone, Mail, ArrowRight, Sparkles, Zap, Globe, Activity,
  ShieldCheck, XCircle, LayoutDashboard, Calendar, Compass, CreditCard, MapPin
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";
import { API_V1 } from "../config/api";

const Auth = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState("initial");
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", userType: "Civilian",
    age: "", adminSecret: "", divyangCardId: "",
  });
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [countryCode, setCountryCode] = useState("+91");
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
        setFormData({ name: decodedUser.name || "", email: decodedUser.email || "", phone: "", userType: "Civilian", age: "", adminSecret: "", divyangCardId: "" });
        setStep("registering");
      } else {
        throw new Error("Divine connection lost");
      }
    } catch (error) {
      console.error(error);
      setMessage(t("auth.serviceUnavailable"));
    } finally {
      setIsLoading(false);
    }
  };

  const featureCards = [
    { titleKey: "auth.features.sacredNavTitle", icon: <Compass size={20} />, descKey: "auth.features.sacredNavDesc", color: "text-orange-600", bg: "bg-orange-50" },
    { titleKey: "auth.features.liveDarshanTitle", icon: <Activity size={20} />, descKey: "auth.features.liveDarshanDesc", color: "text-blue-600", bg: "bg-blue-50" },
    { titleKey: "auth.features.smartBookingTitle", icon: <CreditCard size={20} />, descKey: "auth.features.smartBookingDesc", color: "text-emerald-600", bg: "bg-emerald-50" },
    { titleKey: "auth.features.crisisHubTitle", icon: <ShieldCheck size={20} />, descKey: "auth.features.crisisHubDesc", color: "text-purple-600", bg: "bg-purple-50" }
  ];

  return (
    <div className="relative  
    w-full 
    min-h-screen
     overflow-x-hidden
       bg-gradient-to-br
        from-orange-50
        via-white 
        to-blue-50 
        font-['Outfit'] 
        select-none 
         px-3
         py-3
        sm:px-5
         sm:py-6 
         lg:px-8 
         lg:py-8
         ">
      {/* Decorative Orbs */}
      <div className=" absolute top-0 right-0 z-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 pointer-events-none"></div>
      <div className=" absolute bottom-0 left-0 z-0 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px] -ml-32 -mb-32 transition-all duration-1000 pointer-events-none"></div>

      <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-center gap-6 xl:gap-12 relative z-10">
        
        {/* Left Section: Branding & Features */}
        <div className="w-full lg:xl-w-[46%] relative z-10 max-w-xl mx-auto  space-y-1 sm:space-y-2 md:space-y-1 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="w-full flex items-center justify-center lg:justify-start gap-3 md:gap-4">
            <div className="w-8 h-8 sm:h-10 sm:w-10 sm:h-10 md:w-16 md:h-16 flex items-center justify-center">
               <img src={logo} alt="Divya Yatra Application Logo" className="w-full h-full object-contain" />
            </div>
            <div>
               <h3 className="text-[11px] sm:text-lg md:text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">DIVYA YATRA</h3>
               <span className="text-[7px] sm:text-[9px] md:text-xs font-bold text-orange-600 uppercase tracking-widest">Pilgrim Navigator</span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4 text-center lg:text-left px-0 flex flex-col items-center lg:items-start">
            <h1 className=" 
              w-full text-center lg:text-left 
              text-[0.95rem]  
              sm:text-3xl 
              lg:text-6xl
               xl:text-7xl 
               font-black text-slate-900
                tracking-tight leading-[1]
              ">
               <span className="block leading-none"> Step into the </span>
              <span className="
              block leading-none
               mt-[-2px]
              text-transparent 
              bg-clip-text 
              bg-gradient-to-br 
              from-orange-500 via-rose-500 to-orange-500">Divine Journey

              </span>
            </h1>
            <p className="max-w-md mx-auto lg:mx-0 text-slate-600 text-xs sm:text-sm md:text-[16px] font-medium leading-relaxed">
              A unified portal for Pilgrims, Trust, and Administration.
            </p>
          </div>

          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {featureCards.map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-3 sm:p-5 rounded-3xl min-h-[140px] bg-white/90 border backdrop-blur-md border-slate-100 shadow-sm transition-all duration-300   hover:shadow-md hover:-translate-y-1 hover:scale-[1.02]">
                <div className={`p-3 h-fit rounded-xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 leading-none text-sm">{feature.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Sign In Card */}
        <div className="w-full max-w-[420px] mx-auto xl:mx-0 flex flex-col  animate-in fade-in slide-in-from-right-8 duration-700">
           <div className="bg-white/60 backdrop-blur-xl w-full rounded-2xl  md:rounded-[2rem] p-2 sm:p-4 lg:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] text-center border border-white/40">
              
              <div className="relative z-10">
                <div className="space-y-2 flex flex-col items-center w-full">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50/50 border border-orange-100/50 text-xs font-black tracking-widest text-orange-600 uppercase shadow-sm">
                     <Globe size={12} /> DIVINE ACCESS
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-2xl lg:text-[1.8rem] font-black text-slate-900 tracking-tight leading-tight">
                      {step === "initial" ? "Welcome Back" : step === "phone_login" ? "Mobile Login" : "Complete Profile"}
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed px-2">
                      {step === "initial" ? "Sign in to your spiritual workspace" : step === "phone_login" ? "Enter your registered mobile number and password" : "Provide details for your sacred pass"}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                    {step === "initial" ? (
                      <div className="space-y-3 md:space-y-4 flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-500">
                         <div className="w-full p-2 sm:p-4 md:p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-2   shadow-inner">
                            <div className="hidden md:flex relative -mt-8 mb- justify-center">
                               <div className="relative w-16 h-16 bg-white rounded-[2.5rem] shadow-[0_24px_70px_-15px_rgba(15,23,42,0.12)] border border-slate-100 flex items-center justify-center overflow-hidden">
                                  {/* Internal glass structural layers */}
                                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-br from-slate-200/20 to-transparent"></div>
                                  
                                  <div className="w-12 h-10 sm:h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center p-2.5 shadow-inner">
                                     <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shadow-sm">
                                        <User className="text-slate-900" size={18} />
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div className="hidden md:flex flex-col items-center text-center space-y-1 px-2 mb-1">
                               <span className="text-slate-800 font-bold block text-base lg:text-lg tracking-tight">One-Tap Authentication</span>
                               <span className="text-slate-500 text-xs font-medium">Continue securely with your Google account</span>
                            </div>
                            <div className="w-full transition-all duration-300 hover:scale-[1.01] flex justify-center py-0">
                              <div className="max-w-[320px] mx-auto w-full overflow-hidden flex justify-center ">
                              <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setMessage("Connection Failed")}
                                useOneTap
                                theme="outline"
                                shape="pill"
                                size="large"
                                width="260"
                              />
                              </div>
                            </div>
                            <div className="relative  w-full flex items-center justify-center my-1 md:my-2">
                               <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-slate-200"></div>
                               </div>
                               <div className="relative px-3 md:px-4 bg-slate-50/80 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] rounded-full">
                                  Or
                               </div>
                            </div>
                            <button
                               onClick={() => setStep("phone_login")}
                               className="w-full max-w-[280px] mx-auto h-11 sm:h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md "
                            >
                               <Phone size={18} className="text-orange-500 flex-shrink-0" /> 
                               <span>Continue with Mobile Number</span>
                            </button>
                         </div>
                      </div>
                   ) : step === "phone_login" ? (
                     <form className="space-y-4 text-left w-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="space-y-4 w-full">
                          <div className={`flex w-full bg-white border ${
                            formErrors.phone
                             ? 'border-red-400 focus-within:border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.1)]' 
                             : 'border-slate-200 focus-within:border-orange-400 focus-within:shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                             } rounded-xl h-12  overflow-hidden transition-all duration-300 group`}>
                             <div className="flex items-center pl-3 md:pl-4 pr-2 bg-slate-50 border-r border-slate-200 flex-shrink-0">
                                <select
                                  value={countryCode}
                                  onChange={(e) => setCountryCode(e.target.value)}
                                  className="bg-transparent text-slate-700 font-semibold outline-none text-sm md:text-base appearance-none cursor-pointer pr-2 min-w-[85px]"
                                >
                                  <option value="+91">+91 (IN)</option>
                                  <option value="+1">+1 (US)</option>
                                  <option value="+44">+44 (UK)</option>
                                </select>
                             </div>
                             <input
                               type="tel"
                               placeholder="Mobile Number"
                               value={formData.phone}
                               maxLength={10}
                               onChange={(e) => {
                                 setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });
                                 setFormErrors({ ...formErrors, phone: null });
                               }}
                               className="flex-1 min-w-0 bg-transparent px-3 md:px-4 text-slate-800 font-semibold  text-sm md:text-base outline-none placeholder:text-slate-400"
                             />
                          </div>
                          <div className="relative group w-full">
                             <ShieldCheck className={`absolute left-4 md:left-5 top-1/2 -translate-y-1/2 ${formErrors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-orange-500'} transition-colors`} size={18} />
                             <input type="password" placeholder="Password" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFormErrors({ ...formErrors, password: null }); }} className={`w-full bg-white border ${
                              formErrors.password 
                              ? 'border-red-400 focus:border-red-500' 
                              : 'border-slate-200 focus:border-orange-400'
                              } rounded-xl h-12 pl-12 md:pl-14 pr-4 md:pr-6 text-slate-800 font-semibold text-sm md:text-base outline-none transition-all duration-300 placeholder:text-slate-400`} />
                          </div>
                        </div>

                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            if(formData.phone.length !== 10 || !formData.password) {
                               let errs = {};
                               if (formData.phone.length !== 10) errs.phone = true;
                               if (!formData.password) errs.password = true;
                               setFormErrors(errs);
                               setMessage("Please enter a valid 10-digit phone number and password.");
                               return;
                            }
                            setIsLoading(true);
                            setMessage("");
                            try {
                              const response = await fetch(`${API_V1}/auth/login`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ phone: formData.phone, password: formData.password }),
                              });
                              const data = await response.json();
                              if (response.ok) {
                                localStorage.setItem("user", JSON.stringify(data.user));
                                localStorage.setItem("token", data.token);
                                setIsAuthenticated(true);
                                navigate("/");
                              } else { setMessage(data.message); }
                            } catch (err) { setMessage("Login failed. Try again."); }
                            finally { setIsLoading(false); }
                          }}
                          className="w-full h-10 sm:h-12 bg-slate-900 hover:bg-orange-500 text-white rounded-2xl font-bold text-[15px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl mt-4"
                          disabled={isLoading}
                        >
                          {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <>Login <ArrowRight size={18} /></>}
                        </button>
                        
                        <div className="text-center pt-2">
                           <span className="text-xs text-slate-500">New pilgrim? </span>
                           <button type="button" onClick={() => { setFormData({...formData, phone: "", password: ""}); setStep("registering"); }} className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wide">Register Here</button>
                        </div>
                        <button type="button" onClick={() => setStep("initial")} className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-4 hover:text-slate-900 transition-colors">Back to Options</button>
                     </form>
                   ) : (
                     <form className="space-y-4 text-left animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="space-y-3">
                          <div className="relative group">
                             <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input type="email" placeholder={t("auth.emailAddress")} value={formData.email} readOnly className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 pl-14 pr-6 text-slate-500 font-medium outline-none cursor-not-allowed" />
                          </div>
                          <div className="relative group">
                             <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 ${formErrors.email ? 'text-red-400' : 'text-slate-300'} transition-colors`} size={18} />
                             <input type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFormErrors({ ...formErrors, email: null }); }} className={`w-full bg-white border ${formErrors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-orange-400'} rounded-2xl h-14 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all placeholder:text-slate-400`} />
                          </div>
                          <div className={`flex w-full bg-white border ${formErrors.phone ? 'border-red-400 focus-within:border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.1)]' : 'border-slate-200 focus-within:border-orange-400 focus-within:shadow-[0_0_15px_rgba(249,115,22,0.1)]'} rounded-2xl h-14 overflow-hidden transition-all group`}>
                             <div className="flex items-center pl-4 pr-2 bg-slate-50 border-r border-slate-200">
                                <select
                                  value={countryCode}
                                  onChange={(e) => setCountryCode(e.target.value)}
                                  className="bg-transparent text-slate-700 font-bold outline-none text-sm appearance-none cursor-pointer pr-1"
                                >
                                  <option value="+91">+91 (IN)</option>
                                  <option value="+1">+1 (US)</option>
                                  <option value="+44">+44 (UK)</option>
                                </select>
                             </div>
                             <input
                               type="tel"
                               placeholder="Mobile Contact"
                               value={formData.phone}
                               maxLength={10}
                               onChange={(e) => {
                                 setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });
                                 setFormErrors({ ...formErrors, phone: null });
                               }}
                               className="flex-1 min-w-0 bg-transparent px-3 md:px-4 text-slate-800 font-medium text-sm md:text-base outline-none placeholder:text-slate-400"
                             />
                          </div>
                          <div className="relative group w-full">
                             <ShieldCheck
                              className={`absolute left-4 md:left-5 top-1/2 -translate-y-1/2 ${
                                formErrors.password 
                                ? 'text-red-400'
                                 : 'text-slate-400 group-focus-within:text-orange-500'
                                 } transition-colors duration-300`} 
                                 size={18}
                                  />
                             <input
                               type="password"
                               placeholder="Create Password"
                               value={formData.password}
                               onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFormErrors({ ...formErrors, password: null }); }}
                               className={`w-full bg-white border ${
                                formErrors.password 
                                ? 'border-red-400 focus:border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.1)]'
                                 : 'border-slate-200 focus:border-orange-400 focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                                } rounded-xl h-12 pl-12 md:pl-14  pr-4 md:pr-6 text-slate-800 font-medium text-sm md:text-base outline-none transition-all duration-300 placeholder:text-slate-400`}
                             />
                          </div>
                           <div className="relative group">
                             <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                             <select
                                value={formData.userType}
                                onChange={(e) => setFormData({...formData, userType: e.target.value})}
                                className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-xl h-12 pl-14 pr-6 text-slate-800 font-medium outline-none transition-all appearance-none cursor-pointer"
                             >
                                <option value="Civilian">{t("auth.userTypes.civilian")}</option>
                                <option value="Local">{t("auth.userTypes.local")}</option>
                                <option value="Aged">{t("auth.userTypes.aged")}</option>
                                <option value="Child">{t("auth.userTypes.child")}</option>
                                <option value="VIP">{t("auth.userTypes.vip")}</option>
                                <option value="Divyang">{t("auth.userTypes.divyang")}</option>
                                <option value="Sadhu">{t("auth.userTypes.sadhu")}</option>
                                <option value="Admin">{t("auth.userTypes.admin")}</option>
                                <option value="ParkingOwner">{t("auth.userTypes.parkingOwner")}</option>
                             </select>
                             <Globe className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                          </div>

                          {formData.userType === "Admin" && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                              <input 
                                type="password" 
                                placeholder="Admin Secret Verification Code" 
                                value={formData.adminSecret} 
                                onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })} 
                                className="w-full bg-red-50/30 border border-red-100 focus:border-red-400 rounded-2xl h-10 sm:h-12 pl-14 pr-6 text-slate-800 font-bold outline-none transition-all placeholder:text-red-300" 
                              />
                            </div>
                          )}

                          {(formData.userType === "Aged" || formData.userType === "Child") && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="number" 
                                placeholder={formData.userType === "Aged" ? "Enter Age (Years)" : "Enter Child's Age"} 
                                value={formData.age} 
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
                                className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-xl h-10 sm:h-12 pl-12 pr-4 text-slate-800 font-medium outline-none transition-all duration-300 placeholder:text-slate-400" 
                              />
                            </div>
                          )}

                          {formData.userType === "Divyang" && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                              <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 ${formErrors.divyangCardId ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={18} />
                              <input 
                                type="text" 
                                placeholder="Government Divyang Card ID" 
                                value={formData.divyangCardId} 
                                onChange={(e) => { setFormData({ ...formData, divyangCardId: e.target.value }); setFormErrors({ ...formErrors, divyangCardId: null }); }} 
                                className={`w-full bg-white border ${formErrors.divyangCardId ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-orange-400'} rounded-xl h-10 sm:h-12 pl-12 pr-4 text-slate-800 font-medium outline-none transition-all duration-300 placeholder:text-slate-400`} 
                              />
                            </div>
                          )}

                          {formData.userType === "VIP" && (
                            <div className="
                             w-full  rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4  flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300
                             ">
                              <div className="flex items-center justify-center
                               w-10 h-10 
                               rounded-xl 
                               bg-purple-100
                                flex-shrink-0
                              ">
                               <ShieldCheck size={18} 
                               className="text-purple-600"
                                />
                               </div>
                               <div className="flex-1">
                                <h4 className="
                                text-sm
                                sm:text-base
                                font-semibold
                                text-purple-800
                                ">VIP Verification Required</h4>
                               <p className=" mt-1 text-xs sm:text-sm leading-relaxed text-purple-700 font-medium  ">
                                 VIP registrations require manual verification by the Temple Board. Your access will be restricted until approved.
                               </p>
                               </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            if(!formData.name || !formData.phone) { setMessage(t("auth.fillRequiredFields")); return; }
                            if(formData.userType === "Admin" && !formData.adminSecret) { setMessage(t("auth.adminSecretRequired")); return; }
                            if(formData.userType === "Divyang" && !formData.divyangCardId) { setMessage(t("auth.divyangCardRequired")); return; }
                            if((formData.userType === "Aged" || formData.userType === "Child") && !formData.age) { setMessage(t("auth.ageRequired")); return; }

                            setIsLoading(true);
                            try {
                              const response = await fetch(`${API_V1}/auth/register`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...formData, password: formData.password }),
                              });
                              const data = await response.json();
                              if (response.ok) {
                                localStorage.setItem("user", JSON.stringify(data.user));
                                localStorage.setItem("token", data.token);
                                setIsAuthenticated(true);
                                navigate("/");
                              } else { setMessage(data.message); }
                            } catch (err) { setMessage(t("auth.registrationFailed")); }
                            finally { setIsLoading(false); }
                          }}
                          className="w-full h-10 sm:h-12 bg-slate-900 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm md:text-base active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 shadow-md mt-3"
                          disabled={isLoading}
                        >
                          {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <>{t("auth.completeProfileBtn")} <ArrowRight size={18} /></>}
                        </button>
                        
                        <button type="button" onClick={() => setStep("initial")} className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-4 hover:text-slate-900 transition-colors">{t("auth.returnToLogin")}</button>
                     </form>
                   )}

                   {message && (
                     <div className="mt-5 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center gap-2 text-rose-600 text-sm font-medium animate-in fade-in w-full">
                       <XCircle size={16} /> {message}
                     </div>
                   )}
                </div>
              </div>

              <div className="hidden md:block pt-6 w-full relative z-10 ">
                 <div className="w-full relative h-[72px] md:h-[100px] rounded-xl overflow-hidden border border-slate-100 flex items-center bg-slate-50 shadow-inner group">
                    <div className="flex animate-marquee hover:[animation-play-state:paused] w-max py-1.5">
                      {[...slides, ...slides, ...slides, ...slides].map((imgUrl, index) => (
                        <div key={index} className="w-[90px] md:w-[160px] h-[55px] md:h-[85px] flex-shrink-0 mx-1">
                           <img src={imgUrl} alt={`Glimpse of a sacred temple site: ${index % slides.length + 1}`} className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm" />
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Minimal Card Base Glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[80%] h-24 bg-gradient-to-t from-orange-100/40 via-orange-50/20 to-transparent blur-2xl pointer-events-none"></div>

              <style>
                {`
                  @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-marquee {
                    animation: marquee 32s linear infinite;
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
