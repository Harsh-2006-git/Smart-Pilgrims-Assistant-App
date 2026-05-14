import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Compass, User, LogOut, ChevronDown, Globe, CreditCard, ShieldCheck, LogIn } from "lucide-react";
import GuidePage from "../pages/guide";
import logo from "../assets/logo.png";
import { resolveMediaUrl } from "../config/api";

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "mr", label: "मराठी", flag: "🇮🇳" },
    { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
    { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
    { code: "te", label: "తెలుగు", flag: "🇮🇳" },
    { code: "bn", label: "বাংলা", flag: "🇮🇳" },
    { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
    { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "ur", label: "اردो", flag: "🇮🇳" },
    { code: "or", label: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

const Header = () => {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [activeLang, setActiveLang] = useState(LANGUAGES[0]);
    const guideRef = useRef(null);
    const langRef = useRef(null);
    const [user, setUser] = useState(null);
    const isAuthenticated = Boolean(localStorage.getItem("token"));

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) setUser(JSON.parse(savedUser));
        
        // Language restoration from localStorage or cookie
        const savedLangCode = localStorage.getItem("google-translate-lang");
        const cookieMatch = document.cookie.match(/googtrans=\/en\/([a-z]{2,})/);
        const activeCode = savedLangCode || (cookieMatch ? cookieMatch[1] : 'en');
        
        const found = LANGUAGES.find(l => l.code === activeCode);
        if (found) setActiveLang(found);
    }, []);

    useEffect(() => {
        const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setIsLangOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const killBanner = () => {
            const banner = document.querySelector('.goog-te-banner-frame');
            if (banner) {
                // If the user feels the header is covered, we allow the body top 
                // to work naturally and our header top logic (below) will sync it.
                // We only hide it if it's explicitly broken.
            }
        };
        const observer = new MutationObserver(killBanner);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    const [headerTop, setHeaderTop] = useState(0);
    useEffect(() => {
        const update = () => {
            const raw = document.body.style.top || '0px';
            const val = parseInt(raw, 10);
            setHeaderTop(isNaN(val) || val < 0 ? 0 : val);
        };
        update();
        const obs = new MutationObserver(update);
        obs.observe(document.body, { attributes: true, attributeFilter: ['style'] });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                new window.google.translate.TranslateElement(
                    { 
                        pageLanguage: 'en', 
                        includedLanguages: 'en,hi,mr,gu,ta,te,bn,kn,ml,pa,ur,or', 
                        autoDisplay: false,
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE 
                    },
                    'google_translate_element_hidden'
                );
            }
        };
        if (!document.getElementById('google-translate-script')) {
            const s = document.createElement('script');
            s.id = 'google-translate-script';
            s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            s.async = true;
            document.body.appendChild(s);
        }
    }, []);

    const changeLanguage = (lang) => {
        setActiveLang(lang);
        setIsLangOpen(false);
        localStorage.setItem("google-translate-lang", lang.code);
        
        const setCookie = (code) => {
            const domain = window.location.hostname;
            const domainParts = domain.split('.');
            const mainDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domain;
            
            if (code === "en") {
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
                document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${mainDomain}`;
                document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
            } else {
                document.cookie = `googtrans=/en/${code}; path=/`;
                document.cookie = `googtrans=/en/${code}; path=/; domain=.${mainDomain}`;
                document.cookie = `googtrans=/en/${code}; path=/; domain=${domain}`;
            }
        };

        setCookie(lang.code);

        const gtCombo = document.querySelector('.goog-te-combo');
        if (gtCombo) {
            gtCombo.value = lang.code;
            gtCombo.dispatchEvent(new Event('change'));
            // Small delay to ensure translation triggers before any potential reload
            setTimeout(() => {
                if (lang.code === "en") window.location.reload();
            }, 100);
        } else {
            window.location.reload();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("google-translate-lang"); // Reset on logout if desired
        setUser(null);
        navigate("/");
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleNavigation = (target) => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
        if (target.startsWith("http")) { window.location.href = target; return; }
        if (target.startsWith("/")) { navigate(target); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        if (location.pathname === "/") {
            const section = document.getElementById(target);
            if (section) {
                const offset = 100;
                const sectionTop = section.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: sectionTop - offset, behavior: "smooth" });
                return;
            }
        }
        navigate("/#" + target);
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        // Nudge Google Translate on route changes
        const gtCombo = document.querySelector('.goog-te-combo');
        if (gtCombo && activeLang.code !== 'en') {
            gtCombo.value = activeLang.code;
            gtCombo.dispatchEvent(new Event('change'));
        }
        return () => window.removeEventListener("scroll", handleScroll);
    }, [location.pathname, activeLang.code]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (guideRef.current && !guideRef.current.contains(event.target)) {
                setShowGuide(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navItems = [
        { name: "Home", target: "/" },
        { name: "Services", target: "services" },
        { name: "Family Mode", target: "/family-mode" },
        { name: "Parking", target: "/parking" },
        { name: "Stays", target: "/stays" },
        { name: "Admin", target: "/admin" },
    ];

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                body { overflow-x: hidden; width: 100%; }
                #google_translate_element_hidden { display: none !important; }
                .goog-te-banner-frame { 
                    display: block !important; 
                }
                .goog-te-balloon-frame { display: none !important; }
                .goog-logo-link { display: none !important; }
                .goog-te-gadget { color: transparent !important; }
                .goog-te-gadget span { display: none !important; }
                #goog-gt-tt { display: none !important; visibility: hidden !important; }
                .goog-te-spinner-pos { display: none !important; }
                font { background-color: transparent !important; box-shadow: none !important; }
            `}} />

            <div id="google_translate_element_hidden" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} />

            <header
                style={{ top: `${headerTop}px` }}
                className={`fixed left-0 w-full z-50 bg-white border-b border-gray-100 transition-all duration-300 ${isScrolled ? "py-2 shadow-md" : "py-3 shadow-sm"}`}
            >
                <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 flex justify-between items-center box-border relative">
                    
                    {/* Logo Section */}
                    <div className="flex items-center flex-shrink-0">
                        <button onClick={() => handleNavigation("/")} className="flex items-center gap-1.5 sm:gap-3 active:scale-95 transition-transform">
                            <div className="h-9 w-9 sm:h-12 lg:h-14 lg:w-14 rounded-full overflow-hidden flex items-center justify-center border-2 border-orange-50 bg-white shadow-sm flex-shrink-0">
                                {!imgError ? (
                                    <img src={logo} alt="Logo" className="h-full w-full object-cover" onError={() => setImgError(true)} />
                                ) : (
                                    <div className="text-xl sm:text-2xl lg:text-4xl text-orange-600 font-bold">🕉</div>
                                )}
                            </div>
                            <span className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-700 whitespace-nowrap">
                                Divya<span className="text-orange-600">Yatra</span>
                            </span>
                        </button>
                    </div>

                    {/* Nav Desktop */}
                    <nav className="hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavigation(item.target)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${(location.pathname === item.target || (location.pathname === '/' && location.hash === `#${item.target}`)) ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-orange-600 hover:bg-white/50"}`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </nav>

                    {/* Right Controls */}
                    <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                        {/* Profile Control */}
                        {isAuthenticated ? (
                            <div className="relative group/profile">
                                <button
                                    onClick={() => { if (window.innerWidth < 1280) setIsProfileOpen(!isProfileOpen); }}
                                    className="flex items-center gap-2 sm:gap-3 pl-1 pr-1 lg:pr-5 py-1 rounded-full border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all active:scale-95 xl:group-hover/profile:border-orange-500"
                                >
                                    <div className="h-8 w-8 sm:h-11 rounded-full overflow-hidden border-2 border-orange-50 bg-orange-100 flex-shrink-0">
                                        {user?.profile_image || user?.photo ? (
                                            <img src={user.profile_image ? resolveMediaUrl(user.profile_image) : user.photo} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-600 text-sm sm:text-lg font-bold">
                                                {user?.name?.[0]?.toUpperCase() || "Y"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="hidden lg:flex flex-col text-left">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase leading-none mb-1">Pass Holder</span>
                                        <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{user?.name || "Devotee"}</span>
                                    </div>
                                    <ChevronDown size={14} className="hidden lg:block text-slate-400 xl:group-hover/profile:rotate-180 transition-transform" />
                                </button>

                                {/* Profile Dropdown */}
                                <div className={`absolute right-0 top-full pt-2 w-56 transition-all duration-300 z-50 transform ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'} xl:group-hover/profile:opacity-100 xl:group-hover/profile:visible xl:group-hover/profile:translate-y-0`}>
                                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                        <div className="p-3 bg-slate-50 border-b border-gray-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 pr-1 flex justify-between">
                                                <span>Account</span>
                                                <button onClick={() => setIsProfileOpen(false)} className="xl:hidden"><X size={12} /></button>
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-base">{user?.name?.[0]?.toUpperCase() || "?"}</div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Devotee"}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email || "ujjain.yatra@auth"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-1.5 bg-white space-y-0.5">
                                            <button onClick={() => handleNavigation("/admin")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-orange-600 font-bold text-xs transition-all shadow-md shadow-slate-900/10 mb-1">
                                                <ShieldCheck size={16} className="text-orange-400" /> Master Console
                                            </button>
                                            <button onClick={() => handleNavigation("/profile")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-xs transition-all"><User size={16} className="text-slate-400" /> My Profile</button>
                                            <button onClick={() => handleNavigation("/nearby")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-xs transition-all"><Compass size={16} className="text-slate-400" /> Navigator</button>
                                            <div className="pt-1.5 mt-1.5 border-t border-slate-50">
                                                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-bold text-xs transition-all"><LogOut size={16} /> Log Out</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleNavigation("/auth")}
                                className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-full bg-orange-600 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:bg-slate-900 transition-all active:scale-95"
                            >
                                <LogIn size={16} />
                                <span className="hidden sm:inline">Login</span>
                            </button>
                        )}

                        {/* Mobile Language Trigger */}
                        <div className="relative xl:hidden">
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="h-8 w-8 sm:h-11 sm:w-11 flex flex-col items-center justify-center rounded-full bg-orange-50/50 border border-orange-100 text-orange-600 active:scale-95 transition-all shadow-sm"
                            >
                                <Globe size={14} className="mb-0.5" />
                                <span className="text-[8px] font-black leading-none">{activeLang.code.toUpperCase()}</span>
                            </button>
                            
                            <div className={`fixed sm:absolute right-4 sm:right-0 top-20 sm:top-full mt-2 w-[calc(100vw-2rem)] sm:w-60 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[200] transition-all duration-300 transform ${isLangOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-4 scale-95'}`}>
                                <div className="px-5 py-4 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100/50">
                                    <div className="flex items-center gap-2 mb-1"><Globe size={14} className="text-orange-600" /><span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Select Language</span></div>
                                    <p className="text-[11px] font-medium text-slate-500">Transform your divine experience</p>
                                </div>
                                <div className="py-2 max-h-[320px] overflow-y-auto hide-scrollbar">
                                    {LANGUAGES.slice(0, 7).map((lang) => (
                                        <button key={lang.code} onClick={() => changeLanguage(lang)} className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-all active:scale-[0.98] ${activeLang.code === lang.code ? 'bg-orange-50/70 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3"><span className="text-xl leading-none scale-110">{lang.flag}</span><span className="text-sm font-semibold">{lang.label}</span></div>
                                            {activeLang.code === lang.code && <div className="h-1.5 w-1.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)]" />}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => { setIsLangOpen(false); setIsMenuOpen(true); }} className="w-full py-4 bg-slate-900 text-[10px] font-bold text-white uppercase tracking-[0.2em] text-center active:bg-orange-600 transition-colors">Browse All Languages</button>
                            </div>
                        </div>

                        {/* Desktop Language Trigger */}
                        <div ref={langRef} className="relative hidden xl:block">
                            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-2 bg-white border border-gray-100 hover:border-orange-300 px-3 py-2 rounded-xl shadow-sm transition-all hover:shadow-md active:scale-95 group">
                                <div className="p-1 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Globe size={14} /></div>
                                <div className="flex flex-col text-left"><span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Language</span><span className="text-xs font-bold text-slate-700 truncate max-w-[60px]">{activeLang.label}</span></div>
                                <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200] transition-all duration-200 ${isLangOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                                <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100"><p className="text-[9px] font-black uppercase tracking-widest text-orange-500">🌐 Select Language</p></div>
                                <div className="py-1.5 max-h-[300px] overflow-y-auto">
                                    {LANGUAGES.map((lang) => (
                                        <button key={lang.code} onClick={() => changeLanguage(lang)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-orange-50 ${activeLang.code === lang.code ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'}`}>
                                            <span className="text-lg">{lang.flag}</span><span className="text-sm font-semibold">{lang.label}</span>
                                            {activeLang.code === lang.code && <span className="ml-auto text-[10px] font-black text-orange-500 uppercase tracking-wider">Active</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hamburger Menu Toggle */}
                        <button onClick={toggleMenu} className="xl:hidden p-2 rounded-full border border-gray-100 bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-75 flex-shrink-0">
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Sidebar Overlay and Menu */}
                <div className={`xl:hidden fixed inset-0 z-[60] transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                    <div className={`absolute right-0 top-0 bottom-0 w-[280px] xs:w-80 bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="flex flex-col h-full bg-white">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center border border-orange-100 flex-shrink-0">
                                        {!imgError ? <img src={logo} alt="Logo" className="h-full w-full object-cover" /> : <div className="text-lg text-orange-600 font-bold">🕉</div>}
                                    </div>
                                    <span className="text-lg font-bold tracking-tight text-slate-700">Divya<span className="text-orange-600">Yatra</span></span>
                                </div>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-orange-600 transition-colors"><X size={20} /></button>
                            </div>
                            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">Spiritual Navigation</p>
                                {navItems.map((item) => (
                                    <button key={item.name} onClick={() => handleNavigation(item.target)} className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-orange-50 group transition-all">
                                        <span className="font-bold text-slate-800 group-hover:text-orange-600">{item.name}</span>
                                        <Compass size={18} className="text-slate-200 group-hover:text-orange-500 transition-colors" />
                                    </button>
                                ))}
                                <button onClick={() => handleNavigation("/ticket")} className="w-full mt-4 bg-orange-600 text-white p-4 rounded-2xl font-black flex items-center justify-between shadow-lg shadow-orange-500/20 active:scale-95">BOOK TICKETS<CreditCard size={18} /></button>
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">Language Settings</p>
                                    <div className="grid grid-cols-2 gap-2 px-2">
                                        {LANGUAGES.map((lang) => (
                                            <button key={lang.code} onClick={() => { changeLanguage(lang); setIsMenuOpen(false); }} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${activeLang.code === lang.code ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm font-bold' : 'bg-white border-gray-100 text-slate-700 hover:border-orange-200'}`}><span className="text-base">{lang.flag}</span><span className="text-xs">{lang.label}</span></button>
                                        ))}
                                    </div>
                                </div>
                            </nav>
                            <div className="p-6 border-t border-gray-100 bg-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Settings</p>
                                {isAuthenticated ? (
                                    <div className="space-y-3">
                                        <button onClick={() => handleNavigation("/profile")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-orange-500 transition-all text-left">
                                            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-orange-50 bg-orange-100 flex-shrink-0">
                                                {user?.profile_image || user?.photo ? <img src={user.profile_image ? resolveMediaUrl(user.profile_image) : user.photo} alt="Profile" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-600 text-sm font-bold">{user?.name?.[0]?.toUpperCase() || "Y"}</div>}
                                            </div>
                                            <div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Devotee"}</p><p className="text-[11px] text-slate-500">View Profile Dashboard</p></div>
                                        </button>
                                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all"><LogOut size={16} /> Logout Account</button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleNavigation("/auth")} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-slate-900 transition-all">
                                        <LogIn size={16} /> Login / Register
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Support Guide Panel */}
            {showGuide && (
                <div ref={guideRef} className="fixed top-24 right-4 sm:right-10 z-[70] w-[calc(100%-2rem)] sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center"><div className="flex items-center gap-3"><Compass className="text-orange-500" size={18} /><span className="font-black uppercase tracking-widest text-xs">Yatra Support</span></div><button onClick={() => setShowGuide(false)} className="hover:text-orange-600 transition-colors"><X size={20} /></button></div>
                    <div className="flex-1 overflow-auto bg-slate-50 p-2 hide-scrollbar"><GuidePage /></div>
                </div>
            )}
        </>
    );
};

export default Header;
