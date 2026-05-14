import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Shield, X, AlertTriangle, ChevronRight, PhoneCall } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_V1 } from '../config/api';

const SOSButton = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
    const [error, setError] = useState(null);
    const [cachedLocation, setCachedLocation] = useState(null);

    const preFetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCachedLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                },
                (err) => console.log("Pre-fetch GPS wait/failed"),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
            );
        }
    };

    const handleSOS = async () => {
        setStatus('sending');
        setError(null);

        const triggerBackend = async (lat, lng) => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_V1}/admin/sos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ lat, lng })
                });
                if (response.ok) {
                    setStatus('success');
                    setTimeout(() => { setIsOpen(false); setStatus('idle'); navigate('/admin?tab=sos'); }, 1000);
                } else throw new Error(t("sos.signalInterrupted"));
            } catch (err) {
                setError(err.message);
                setStatus('error');
            }
        };

        if (cachedLocation) {
            await triggerBackend(cachedLocation.latitude, cachedLocation.longitude);
        } else {
            if (!navigator.geolocation) {
                setError(t("sos.geolocationMissing"));
                setStatus('error');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (p) => await triggerBackend(p.coords.latitude, p.coords.longitude),
                (e) => { setError(t("sos.gpsRequired")); setStatus('error'); },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    };

    return (
        <>
            {/* Pulsing Floating Button */}
            <button
                onClick={() => { setIsOpen(true); preFetchLocation(); }}
                className="fixed bottom-24 right-6 z-[100] w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all animate-pulse hover:bg-red-700 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <AlertCircle className="relative z-10" size={28} />
            </button>

            {/* Emergency Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => status !== 'sending' && setIsOpen(false)}></div>
                    
                    <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        <div className="bg-red-600 p-8 text-white text-center relative">
                            <div className="absolute top-4 right-4 group">
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/10 animate-pulse">
                                <Shield size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{t("sos.emergencySos")}</h2>
                            <p className="text-xs text-white/70 font-medium tracking-widest uppercase mt-1">{t("sos.immediateAssistance")}</p>
                        </div>

                        <div className="p-8">
                            {status === 'idle' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-orange-600 mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-bold text-orange-700 leading-tight">
                                            {t("sos.confirmWarning")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSOS}
                                        className="w-full py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                    >
                                        {t("sos.confirmEmergency")} <ChevronRight size={18} />
                                    </button>
                                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t("sos.accidentalActivation")}</p>
                                </div>
                            )}

                            {status === 'sending' && (
                                <div className="py-10 flex flex-col items-center justify-center space-y-6">
                                    <div className="w-16 h-16 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">{t("sos.broadcasting")}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t("sos.secureSatellite")}</p>
                                    </div>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-90 fade-in duration-300">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-2">
                                        <PhoneCall size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-emerald-600 uppercase tracking-tighter italic">{t("sos.helpOnWay")}</h3>
                                        <p className="text-[11px] text-slate-500 font-medium px-6 mt-2 leading-relaxed">
                                            {t("sos.helpOnWayDesc")}
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        {t("sos.liveTrackingActive")}
                                    </div>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="space-y-6 text-center">
                                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                                        <X size={32} />
                                    </div>
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-700">
                                        {error || t("sos.signalInterrupted")}
                                    </div>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                                    >
                                        {t("sos.tryAgain")}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div> {t("sos.connectionSecure")}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("sos.protocol")}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SOSButton;
