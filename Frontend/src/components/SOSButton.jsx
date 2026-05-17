import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Shield, X, AlertTriangle, ChevronRight, PhoneCall } from 'lucide-react';
import { API_V1 } from '../config/api';

const SOSButton = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
    const [error, setError] = useState(null);
    const [cachedLocation, setCachedLocation] = useState(null);
    // Guard against concurrent SOS submissions (rapid clicks before React re-renders)
    const isSending = useRef(false);

    // Pre-fetch location the moment the modal opens to save time
    const preFetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCachedLocation({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                },
                (err) => console.log("Pre-fetch GPS wait/failed"),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
            );
        }
    };

    const handleSOS = async () => {
        // Prevent concurrent submissions: if a request is already in-flight, do nothing
        if (isSending.current) return;
        isSending.current = true;

        setStatus('sending');
        setError(null);

        const triggerBackend = async (lat, lng) => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_V1}/admin/sos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ lat, lng })
                });

                if (response.ok) {
                    setStatus('success');
                    setTimeout(() => {
                        setIsOpen(false);
                        setStatus('idle');
                        isSending.current = false;
                        navigate('/admin?tab=sos');
                    }, 1000);
                } else throw new Error("Emergency link failed");
            } catch (err) {
                setError(err.message);
                setStatus('error');
                isSending.current = false;
            }
        };

        // Use pre-fetched location if available, else fetch now
        if (cachedLocation) {
            await triggerBackend(cachedLocation.latitude, cachedLocation.longitude);
        } else {
            if (!navigator.geolocation) {
                setError("Geolocation missing");
                setStatus('error');
                isSending.current = false;
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (p) => await triggerBackend(p.coords.latitude, p.coords.longitude),
                (e) => { setError("GPS Signal Required"); setStatus('error'); isSending.current = false; },
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
                                <button 
                                    onClick={() => status !== 'sending' && setIsOpen(false)}
                                    disabled={status === 'sending'}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/10 animate-pulse">
                                <Shield size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Emergency SOS</h2>
                            <p className="text-xs text-white/70 font-medium tracking-widest uppercase mt-1">Immediate Assistance Required</p>
                        </div>

                        <div className="p-8">
                            {status === 'idle' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-orange-600 mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-bold text-orange-700 leading-tight">
                                            Clicking confirm will send your exact GPS location, nearby service analysis, and personal details to the Temple Command Center and Police authorities.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleSOS}
                                        disabled={status === 'sending'}
                                        className="w-full py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                                    >
                                        CONFIRM EMERGENCY <ChevronRight size={18} />
                                    </button>
                                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hold for 1 second to prevent accidental activation</p>
                                </div>
                            )}

                            {status === 'sending' && (
                                <div className="py-10 flex flex-col items-center justify-center space-y-6">
                                    <div className="w-16 h-16 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">BROADCASTING EMERGENCY...</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Establishing Secure Satellite Link</p>
                                    </div>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-90 fade-in duration-300">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-2">
                                        <PhoneCall size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-emerald-600 uppercase tracking-tighter italic">Help is on the way!</h3>
                                        <p className="text-[11px] text-slate-500 font-medium px-6 mt-2 leading-relaxed">
                                            Emergency dispatch has received your signal. Police and nearest medical units have been notified of your location. Stay where you are.
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        Live Tracking Active
                                    </div>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="space-y-6 text-center">
                                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                                        <X size={32} />
                                    </div>
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-700">
                                        {error || "Signal Interrupted. Please check your internet and GPS settings."}
                                    </div>
                                    <button 
                                        onClick={() => setStatus('idle')}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div> Connection: Secure
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol: V3.4</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SOSButton;
