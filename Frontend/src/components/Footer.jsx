import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Phone,
    Mail,
    MapPin,
    ArrowRight,
    ShieldCheck,
    Zap
} from "lucide-react";

const Footer = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <footer id="contact" className="bg-[#050505] text-white pt-10 md:pt-16 pb-6 md:pb-8 px-6 relative overflow-hidden border-t border-white/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-16">

                    {/* Brand Identity */}
                    <div className="md:col-span-5 space-y-4 md:space-y-8 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="group cursor-pointer">
                            <div className="flex items-center gap-3 text-2xl md:text-3xl font-black italic tracking-tighter transition-all duration-300 group-hover:scale-105">
                                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">DIVYA</span>
                                <span className="text-white relative">
                                    YATRA
                                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                                </span>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t("footer.sacredPortal")}</span>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm font-medium">
                            {t("footer.tagline")}
                        </p>

                        <div className="hidden md:flex gap-3 md:gap-4">
                            {[Facebook, Twitter, Instagram, Youtube].map((Icon, idx) => (
                                <a key={idx} href="#" className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-white/[0.03] flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-500 border border-white/5 hover:border-orange-500 shadow-lg relative group">
                                    <Icon size={18} className="relative z-10" />
                                    <div className="absolute inset-0 bg-orange-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Experience Links */}
                    <div className="hidden md:block md:col-span-3 lg:px-12 border-l border-white/5">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-500 mb-8 flex items-center gap-2">
                            <Zap size={14} /> {t("footer.explorer")}
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { labelKey: "footer.links.liveDarshan", path: "/live-darshan" },
                                { labelKey: "footer.links.ticketBooking", path: "/ticket" },
                                { labelKey: "footer.links.zoneStatus", path: "/dencity" },
                                { labelKey: "footer.links.lostAndFound", path: "/lostFound" },
                                { labelKey: "footer.links.interactiveMap", path: "/map.html", external: true },
                                { labelKey: "footer.links.cityGuide", path: "#about" }
                            ].map((link) => (
                                <li key={link.labelKey}>
                                    <button
                                        onClick={() => {
                                            if (link.external) window.location.href = link.path;
                                            else navigate(link.path);
                                        }}
                                        className="text-gray-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-0 hover:gap-3 group"
                                    >
                                        <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                                        {t(link.labelKey)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect Section */}
                    <div className="hidden md:flex md:col-span-4 flex-col items-center md:items-start space-y-4 md:space-y-8 md:border-l md:border-white/5 md:pl-12">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-500 mb-0 flex items-center gap-2">
                            {t("footer.support")}
                        </h3>
                        <div className="space-y-3 md:space-y-5 w-full">
                            {[
                                { icon: Phone, text: t("footer.phone"), sub: t("footer.phoneSub") },
                                { icon: Mail, text: t("footer.email"), sub: t("footer.emailSub") },
                                { icon: MapPin, text: t("footer.location"), sub: t("footer.locationSub") }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-gray-300 group justify-center md:justify-start cursor-default">
                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:border-orange-500 transition-colors">
                                        <item.icon size={16} className="text-orange-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{item.sub}</p>
                                        <p className="text-sm font-bold text-gray-200">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-6 md:pt-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 text-center md:text-left leading-relaxed">
                            {t("footer.copyright")}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] text-gray-700 font-bold uppercase tracking-widest">
                            <ShieldCheck size={10} className="text-green-500/50" />
                            {t("footer.verifiedSecure")}
                        </div>
                    </div>
                    <div className="flex gap-6 md:gap-10 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {["Security", "Privacy", "Terms", "API"].map((link) => (
                            <a key={link} href="#" className="hover:text-orange-500 transition-all transform hover:scale-110">
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
