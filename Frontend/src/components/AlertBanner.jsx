import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, X, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_V1 } from '../config/api';

const AlertBanner = () => {
    const [alerts, setAlerts] = useState([]);
    const [dismissed, setDismissed] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 20000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await fetch(`${API_V1}/admin/alerts/active`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
                if (data.length > 0 && !dismissed.includes(data[0].alert_id)) {
                    document.documentElement.style.setProperty('--alert-banner-height', 'auto');
                } else {
                    document.documentElement.style.setProperty('--alert-banner-height', '0px');
                }
            }
        } catch (err) { }
    };

    const dismiss = (id) => {
        setDismissed(prev => [...prev, id]);
    };

    const visibleAlerts = alerts.filter(a => !dismissed.includes(a.alert_id));

    if (visibleAlerts.length === 0) {
        document.documentElement.style.setProperty('--alert-banner-height', '0px');
        return null;
    }

    const firstAlert = visibleAlerts[0];
    const getStyle = (severity) => {
        switch (severity) {
            case 'emergency':
            case 'critical':
                return { bg: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600', icon: AlertCircle, shadow: 'shadow-[0_4px_30px_rgba(225,29,72,0.3)]', animate: 'animate-pulse' };
            case 'warning':
                return { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', icon: AlertTriangle, shadow: 'shadow-[0_4px_25px_rgba(245,158,11,0.2)]', animate: '' };
            default:
                return { bg: 'bg-gradient-to-r from-indigo-600 to-slate-900', icon: Info, shadow: 'shadow-[0_4px_20px_rgba(79,70,229,0.1)]', animate: '' };
        }
    };

    const style = getStyle(firstAlert.severity);
    const Icon = style.icon;

    return (
        <div className={`fixed top-[70px] left-0 w-full z-40 ${style.bg} ${style.shadow} border-b border-white/10 transition-all duration-500 animate-in slide-in-from-top fill-mode-both`}>
            <div className="max-w-[1500px] mx-auto px-4 sm:px-12 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 ${style.animate}`}>
                        <Icon className="text-white" size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 text-white/90 px-1.5 py-0.5 rounded ring-1 ring-white/20 whitespace-nowrap">
                                {firstAlert.severity} {t("alert.alert")}
                            </span>
                            <h4 className="font-black text-white text-sm truncate uppercase tracking-tighter">{firstAlert.title}</h4>
                        </div>
                        <p className="text-xs text-white/90 font-medium line-clamp-1 mt-1.5">{firstAlert.message}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex flex-col items-end opacity-60 text-white">
                        <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">{t("alert.reportedTime")}</span>
                        <span className="text-[10px] font-bold">{new Date(firstAlert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <button
                        onClick={() => dismiss(firstAlert.alert_id)}
                        className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10 hover:rotate-90"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {firstAlert.severity === 'critical' && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-white w-full animate-marquee opacity-30"></div>
            )}
        </div>
    );
};

export default AlertBanner;
