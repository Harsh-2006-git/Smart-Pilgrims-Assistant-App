import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Volume2, AlertTriangle } from 'lucide-react';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/admin`;

const AlertBanner = () => {
    const [alerts, setAlerts] = useState([]);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/alerts/active`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (err) {}
    };

    if (alerts.length === 0 || dismissed) return null;

    const tickerText = alerts
        .map(a => `⚠ ${a.title.toUpperCase()}: ${a.message}`)
        .join('     ◆     ');

    return (
        <div className="fixed left-0 w-full z-[49]"
            style={{ top: 'var(--header-height, 56px)' }}>
            
            {/* Main red banner */}
            <div className="relative bg-red-700 text-white overflow-hidden shadow-[0_4px_30px_rgba(220,38,38,0.5)]">
                {/* Pulsing red glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-600 to-red-900 animate-dangerPulse" />
                
                {/* Diagonal warning stripes */}
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)`,
                    }}
                />

                <div className="relative flex items-center h-12">
                    {/* EMERGENCY badge */}
                    <div className="flex items-center gap-2 px-4 bg-black/30 h-full shrink-0 border-r border-red-500/30">
                        <AlertTriangle size={18} className="text-yellow-300 animate-pulse" />
                        <div className="flex flex-col items-start">
                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-red-200 leading-none">LIVE</span>
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:block leading-none mt-0.5">ALERT</span>
                        </div>
                        <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping absolute left-[52px] top-3 sm:hidden" />
                    </div>

                    {/* Scrolling ticker */}
                    <div className="flex-1 overflow-hidden">
                        <div className="animate-ticker whitespace-nowrap flex items-center h-12">
                            <span className="text-sm sm:text-base font-black tracking-wider px-6 uppercase">
                                {tickerText}
                            </span>
                            <span className="text-sm sm:text-base font-black tracking-wider px-6 uppercase">
                                {tickerText}
                            </span>
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={() => setDismissed(true)}
                        className="px-4 h-full bg-black/20 hover:bg-black/40 transition-colors shrink-0 border-l border-red-500/30 flex items-center"
                    >
                        <X size={18} className="text-red-200 hover:text-white" />
                    </button>
                </div>

                {/* Bottom glowing edge */}
                <div className="h-[3px] bg-gradient-to-r from-yellow-500 via-red-400 to-yellow-500 animate-dangerPulse" />
            </div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes dangerPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-ticker {
                    animation: ticker ${Math.max(alerts.length * 14, 18)}s linear infinite;
                }
                .animate-ticker:hover {
                    animation-play-state: paused;
                }
                .animate-dangerPulse {
                    animation: dangerPulse 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default AlertBanner;
