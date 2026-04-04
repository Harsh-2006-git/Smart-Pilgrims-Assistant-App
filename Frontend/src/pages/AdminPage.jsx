import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Activity, Package, Ticket, Monitor, BarChart3, Search,
    CheckCircle2, AlertCircle, MoreVertical, ChevronRight, ShieldCheck,
    Zap, LayoutDashboard, Bell, BellRing, Send, Trash2, ToggleLeft, ToggleRight,
    TrendingUp, PieChart, RefreshCw, Eye, EyeOff, X, AlertTriangle, Info,
    Calendar, Clock, UserCheck, Crown, Shield
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/admin`;

// ==================== MINI BAR CHART COMPONENT ====================
const MiniBarChart = ({ data, label, color = '#f97316' }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className="flex items-end gap-1.5 h-32">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[8px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.value}
                        </span>
                        <div
                            className="w-full rounded-t-lg transition-all duration-700 hover:opacity-80 cursor-pointer relative"
                            style={{
                                height: `${Math.max((d.value / max) * 100, 4)}%`,
                                background: `linear-gradient(to top, ${color}, ${color}99)`,
                                animationDelay: `${i * 100}ms`
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 rounded-t-lg opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[7px] font-bold text-slate-400 truncate w-full text-center">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== DONUT CHART COMPONENT ====================
const DonutChart = ({ segments, size = 120 }) => {
    const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
    let cumulative = 0;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="flex items-center gap-6">
            <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                {segments.map((seg, i) => {
                    const pct = seg.value / total;
                    const dashArray = `${pct * circumference} ${circumference}`;
                    const dashOffset = -cumulative * circumference;
                    cumulative += pct;
                    return (
                        <circle key={i} cx="50" cy="50" r={radius} fill="none"
                            stroke={seg.color} strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                            className="transition-all duration-1000"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                    );
                })}
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                    className="fill-slate-800 text-lg font-black" transform="rotate(90 50 50)">
                    {total}
                </text>
            </svg>
            <div className="space-y-2">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-[10px] font-bold text-slate-600 capitalize">{seg.label}</span>
                        <span className="text-[10px] font-black text-slate-800 ml-auto">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== ALERT COMPOSER MODAL ====================
const AlertComposer = ({ onClose, onSend }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');
    const [sending, setSending] = useState(false);

    const handleSubmit = async () => {
        if (!title || !message) return;
        setSending(true);
        await onSend({ title, message, severity });
        setSending(false);
        onClose();
    };

    const severityOptions = [
        { value: 'info', label: 'Information', icon: Info, color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600 border-amber-200' },
        { value: 'critical', label: 'Critical', icon: AlertCircle, color: 'bg-rose-50 text-rose-600 border-rose-200' }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                            <BellRing size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg">Broadcast Alert</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">All users will see this message</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Severity Select */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Alert Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {severityOptions.map(opt => (
                                <button key={opt.value} onClick={() => setSeverity(opt.value)}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${severity === opt.value
                                        ? opt.color + ' border-current shadow-sm'
                                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}>
                                    <opt.icon size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-wider">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Alert Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Heavy Crowd Expected Tomorrow"
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-sm" />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Body</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                            placeholder="Detailed alert message for all devotees..."
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-sm resize-none" />
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={!title || !message || sending}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20">
                        {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                        {sending ? 'Broadcasting...' : 'Send to All'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ==================== MAIN ADMIN PAGE ====================
const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0, activeTickets: 0, reportedItems: 0,
        activeAlerts: 0, recentUsers: 0, todayBookings: 0,
        userTypeBreakdown: [], ticketsPerDay: [], categoryBreakdown: []
    });
    const [users, setUsers] = useState([]);
    const [lostItems, setLostItems] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [zoneData, setZoneData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [showAlertComposer, setShowAlertComposer] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [signageData, setSignageData] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        const headers = getHeaders();

        try {
            const [statsRes, usersRes, lostRes, ticketsRes, densityRes, alertsRes, signageRes] = await Promise.allSettled([
                fetch(`${BACKEND_URL}/stats`, { headers }),
                fetch(`${BACKEND_URL}/users`, { headers }),
                fetch(`${BACKEND_URL}/lostfound`, { headers }),
                fetch(`${BACKEND_URL}/tickets`, { headers }),
                fetch(`${BACKEND_URL}/density`, { headers }),
                fetch(`${BACKEND_URL}/alerts`, { headers }),
                fetch(`${BACKEND_URL}/signage`, { headers })
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                const s = await statsRes.value.json();
                setStats({
                    totalUsers: s.totalUsers || 0,
                    activeTickets: s.totalTickets || 0,
                    reportedItems: s.totalLostItems || 0,
                    activeAlerts: s.activeAlerts || 0,
                    recentUsers: s.recentUsers || 0,
                    todayBookings: s.todayBookings || 0,
                    userTypeBreakdown: s.userTypeBreakdown || [],
                    ticketsPerDay: s.ticketsPerDay || [],
                    categoryBreakdown: s.categoryBreakdown || []
                });
            }

            if (usersRes.status === 'fulfilled' && usersRes.value.ok) setUsers(await usersRes.value.json());
            if (lostRes.status === 'fulfilled' && lostRes.value.ok) setLostItems(await lostRes.value.json());
            if (ticketsRes.status === 'fulfilled' && ticketsRes.value.ok) setBookings(await ticketsRes.value.json());
            if (densityRes.status === 'fulfilled' && densityRes.value.ok) setZoneData(await densityRes.value.json());
            if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) setAlerts(await alertsRes.value.json());
            if (signageRes.status === 'fulfilled' && signageRes.value.ok) setSignageData(await signageRes.value.json());

        } catch (error) {
            console.error("Admin fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setTimeout(() => setRefreshing(false), 600);
    };

    const handleSendAlert = async (alertData) => {
        try {
            const res = await fetch(`${BACKEND_URL}/alerts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(alertData)
            });
            if (res.ok) {
                await fetchDashboardData();
            }
        } catch (err) {
            console.error("Send alert error:", err);
        }
    };

    const handleToggleAlert = async (id) => {
        try {
            await fetch(`${BACKEND_URL}/alerts/${id}/toggle`, {
                method: 'PUT',
                headers: getHeaders()
            });
            await fetchDashboardData();
        } catch (err) {
            console.error("Toggle alert error:", err);
        }
    };

    const handleDeleteAlert = async (id) => {
        if (!confirm('Delete this alert permanently?')) return;
        try {
            await fetch(`${BACKEND_URL}/alerts/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            await fetchDashboardData();
        } catch (err) {
            console.error("Delete alert error:", err);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const normalized = path.startsWith('/') ? path : `/${path}`;
        if (!normalized.startsWith('/uploads/')) return `${base}/uploads${normalized}`;
        return `${base}${normalized}`;
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
    );

    const userTypeColors = {
        Civilian: '#3b82f6', VIP: '#a855f7', Sadhu: '#f43f5e',
        Admin: '#f97316', Aged: '#eab308', Divyang: '#10b981', ParkingOwner: '#6366f1'
    };

    const ticketChartData = stats.ticketsPerDay.map(d => ({
        label: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        value: parseInt(d.count) || 0
    }));

    const userTypeChartSegments = stats.userTypeBreakdown.map(u => ({
        label: u.userType || 'Unknown',
        value: parseInt(u.count) || 0,
        color: userTypeColors[u.userType] || '#94a3b8'
    }));

    const categoryChartSegments = stats.categoryBreakdown.map(c => ({
        label: c.category || 'normal',
        value: parseInt(c.count) || 0,
        color: { normal: '#3b82f6', vip: '#a855f7', elderly: '#eab308', divyang: '#10b981', priest: '#f43f5e' }[c.category] || '#94a3b8'
    }));

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Devotees', icon: Users },
        { id: 'lostfound', label: 'Lost & Found', icon: Package },
        { id: 'bookings', label: 'Bookings', icon: Ticket },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'crowd', label: 'Crowd Flow', icon: Activity },
        { id: 'signage', label: 'Digital Board', icon: Monitor }
    ];

    const getSeverityStyle = (sev) => {
        switch (sev) {
            case 'critical': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', icon: AlertCircle };
            case 'warning': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: AlertTriangle };
            default: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Info };
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800">
            <Header />

            <div className="pt-24 pb-20 px-4 md:px-8 max-w-[1500px] mx-auto">
                {/* Admin Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-2.5 rounded-2xl shadow-xl">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
                                    Admin <span className="text-orange-600">Console</span>
                                </h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Divya Yatra Control Center</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <button onClick={handleRefresh}
                            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                            <RefreshCw size={16} className={`text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Syncing...' : 'Refresh'}
                        </button>
                        <button onClick={() => setShowAlertComposer(true)}
                            className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center gap-2">
                            <BellRing size={16} />
                            Broadcast Alert
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-3 space-y-2">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-xl translate-x-1'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 shadow-sm'
                                    }`}>
                                <tab.icon size={18} className={activeTab === tab.id ? 'text-orange-400' : ''} />
                                {tab.label}
                                {tab.id === 'alerts' && stats.activeAlerts > 0 && (
                                    <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{stats.activeAlerts}</span>
                                )}
                                {activeTab === tab.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        ))}

                        {/* Quick Stats Card */}
                        <div className="mt-6 p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown size={16} className="text-orange-400" />
                                    <h4 className="text-sm font-black uppercase tracking-wider">Quick Intel</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New Users</p>
                                        <p className="text-xl font-black text-orange-400">{stats.recentUsers}</p>
                                        <p className="text-[8px] text-slate-500 font-bold">Last 7 days</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Today</p>
                                        <p className="text-xl font-black text-emerald-400">{stats.todayBookings}</p>
                                        <p className="text-[8px] text-slate-500 font-bold">Bookings today</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-orange-600/10 rounded-full blur-2xl" />
                        </div>
                    </div>

                    {/* ==================== CONTENT AREA ==================== */}
                    <div className="lg:col-span-9 space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40">
                                <div className="w-14 h-14 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading dashboard...</p>
                            </div>
                        ) : (
                            <>
                                {/* ========== OVERVIEW TAB ========== */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Total Devotees', val: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: `+${stats.recentUsers} this week` },
                                                { label: 'Active Bookings', val: stats.activeTickets, icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'All time' },
                                                { label: 'Lost & Found', val: stats.reportedItems, icon: Package, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Total reports' },
                                                { label: 'Active Alerts', val: stats.activeAlerts, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Broadcasting now' }
                                            ].map((s, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                                                    <div className={`${s.bg} ${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                                        <s.icon size={20} />
                                                    </div>
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                                                    <h3 className="text-2xl font-black text-slate-800">{s.val}</h3>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                                        <TrendingUp size={10} className="text-emerald-500" /> {s.trend}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Charts Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Booking Trend */}
                                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-lg font-black text-slate-900">Booking Trend</h3>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last 7 Days</span>
                                                </div>
                                                {ticketChartData.length > 0 ? (
                                                    <MiniBarChart data={ticketChartData} label="Tickets per Day" color="#f97316" />
                                                ) : (
                                                    <div className="h-32 flex items-center justify-center text-slate-300 text-sm font-bold">No booking data yet</div>
                                                )}
                                            </div>

                                            {/* User Type Distribution */}
                                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-lg font-black text-slate-900">User Distribution</h3>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">By Category</span>
                                                </div>
                                                {userTypeChartSegments.length > 0 ? (
                                                    <DonutChart segments={userTypeChartSegments} />
                                                ) : (
                                                    <div className="h-32 flex items-center justify-center text-slate-300 text-sm font-bold">No user data</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Second Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Category Breakdown */}
                                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                                <h3 className="text-lg font-black text-slate-900 mb-6">Ticket Categories</h3>
                                                {categoryChartSegments.length > 0 ? (
                                                    <DonutChart segments={categoryChartSegments} />
                                                ) : (
                                                    <div className="h-32 flex items-center justify-center text-slate-300 text-sm font-bold">No category data</div>
                                                )}
                                            </div>

                                            {/* Recent Activity */}
                                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
                                                    <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase">{lostItems.length} Reports</span>
                                                </div>
                                                <div className="space-y-3 max-h-[180px] overflow-y-auto">
                                                    {lostItems.slice(0, 5).map((item, idx) => (
                                                        <div key={idx} className={`p-3 ${item.status === 'found' ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'} border rounded-xl flex gap-3 items-center`}>
                                                            <div className={`w-8 h-8 ${item.status === 'found' ? 'bg-emerald-500' : 'bg-orange-500'} text-white rounded-lg flex items-center justify-center shrink-0`}>
                                                                {item.status === 'found' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-800 truncate capitalize">{item.title}</p>
                                                                <p className="text-[10px] text-slate-400">{new Date(item.uploadedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {lostItems.length === 0 && (
                                                        <div className="py-8 text-center text-slate-300 text-sm font-bold">No recent activity</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Zone Flow */}
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                                <Activity size={20} className="text-orange-500" /> Zone Capacity Overview
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {(zoneData && zoneData.length > 0 ? zoneData : [
                                                    { name: 'Loading Zones...', count: 0, capacity: 100, color: 'bg-slate-300' }
                                                ]).map((z, idx) => (
                                                    <div key={z.zone_id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{z.name}</p>
                                                        <div className="flex items-end justify-between mb-2">
                                                            <span className="text-2xl font-black text-slate-800">{z.count}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">/ {z.capacity}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full ${['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500'][idx % 5]} rounded-full transition-all duration-1000`} 
                                                                style={{ width: `${Math.min((z.count / z.capacity) * 100, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ========== USERS TAB ========== */}
                                {activeTab === 'users' && (
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">All Devotees</h3>
                                                <p className="text-xs text-slate-400 font-bold">{users.length} registered users</p>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search name, email, phone..."
                                                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-orange-500 outline-none w-72 shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                        <th className="px-6 py-4">Devotee</th>
                                                        <th className="px-6 py-4">Contact</th>
                                                        <th className="px-6 py-4">Category</th>
                                                        <th className="px-6 py-4">Joined</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {filteredUsers.map(u => (
                                                        <tr key={u.client_id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-100 shadow-sm shrink-0">
                                                                        {u.profile_image ? (
                                                                            <img src={getImageUrl(u.profile_image)} alt={u.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                                                                {u.name?.[0]?.toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono">ID-{String(u.client_id).padStart(6, '0')}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-xs font-bold text-slate-600">{u.phone}</p>
                                                                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{u.email || '-'}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase"
                                                                    style={{
                                                                        backgroundColor: (userTypeColors[u.userType] || '#94a3b8') + '15',
                                                                        color: userTypeColors[u.userType] || '#94a3b8'
                                                                    }}>
                                                                    {u.userType}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                                                {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {filteredUsers.length === 0 && (
                                                <div className="py-16 text-center text-slate-300 font-bold">No users found</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ========== LOST & FOUND TAB ========== */}
                                {activeTab === 'lostfound' && (
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                            <div>
                                                <h3 className="text-xl font-black">Lost & Found Repository</h3>
                                                <p className="text-xs text-slate-400 font-bold">{lostItems.length} total reports</p>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                        <th className="px-6 py-4">Image</th>
                                                        <th className="px-6 py-4">Details</th>
                                                        <th className="px-6 py-4">Contact</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Reported</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-sm">
                                                    {lostItems.map(item => (
                                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                {item.image ? (
                                                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200">
                                                                        <img src={getImageUrl(item.image)} alt="Item" className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                                                        <Package size={20} />
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-bold text-slate-800">{item.title}</p>
                                                                <p className="text-[10px] text-slate-400 line-clamp-1">{item.description || 'No description'}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-500">
                                                                <p className="text-xs font-bold">{item.reportedByPhone}</p>
                                                                <p className="text-[10px] opacity-60">{item.reportedByEmail}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${item.status === 'found' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                                                                {new Date(item.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {lostItems.length === 0 && (
                                                <div className="py-16 text-center text-slate-300 font-bold">No reports yet</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ========== BOOKINGS TAB ========== */}
                                {activeTab === 'bookings' && (
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                            <div>
                                                <h3 className="text-xl font-black">Ticket Bookings</h3>
                                                <p className="text-xs text-slate-400 font-bold">{bookings.length} total bookings</p>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                        <th className="px-6 py-4">Ticket ID</th>
                                                        <th className="px-6 py-4">Devotee</th>
                                                        <th className="px-6 py-4">Date / Time</th>
                                                        <th className="px-6 py-4">Category</th>
                                                        <th className="px-6 py-4">Tickets</th>
                                                        <th className="px-6 py-4">Temple</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-sm">
                                                    {bookings.map(b => (
                                                        <tr key={b.ticket_id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-mono font-bold text-orange-600">#{b.ticket_id}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-800">{b.Client?.name || 'Unknown'}</td>
                                                            <td className="px-6 py-4 text-slate-500">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar size={12} className="text-slate-400" />
                                                                    <span>{b.date}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <Clock size={12} className="text-slate-400" />
                                                                    <span className="text-[10px]">{b.time}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-blue-50 text-blue-600">
                                                                    {b.category || 'normal'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 font-black text-slate-800">{b.no_of_tickets}</td>
                                                            <td className="px-6 py-4 text-slate-400 text-xs">{b.temple}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {bookings.length === 0 && (
                                                <div className="py-16 text-center text-slate-300 font-bold">No bookings yet</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ========== ALERTS TAB ========== */}
                                {activeTab === 'alerts' && (
                                    <div className="space-y-6">
                                        {/* Alert Composer Button */}
                                        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-orange-600/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                                    <BellRing size={28} className="text-white" />
                                                </div>
                                                <div className="text-white">
                                                    <h3 className="text-xl font-black">Alert Broadcast System</h3>
                                                    <p className="text-white/70 text-xs font-bold">Send real-time alerts to all devotees instantly</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowAlertComposer(true)}
                                                className="px-8 py-3 bg-white text-orange-600 rounded-xl font-black text-sm hover:bg-orange-50 transition-all shadow-lg whitespace-nowrap">
                                                + New Alert
                                            </button>
                                        </div>

                                        {/* Alert List */}
                                        <div className="space-y-3">
                                            {alerts.map(alert => {
                                                const style = getSeverityStyle(alert.severity);
                                                const Icon = style.icon;
                                                return (
                                                    <div key={alert.alert_id}
                                                        className={`${style.bg} border ${style.border} rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${!alert.is_active ? 'opacity-50' : ''}`}>
                                                        <div className={`w-10 h-10 rounded-xl ${style.text} ${style.bg} flex items-center justify-center shrink-0 border ${style.border}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-black text-slate-900 text-sm">{alert.title}</h4>
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${style.text} ${style.bg} border ${style.border}`}>
                                                                    {alert.severity}
                                                                </span>
                                                                {alert.is_active ? (
                                                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-600">LIVE</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-slate-100 text-slate-400">OFF</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">
                                                                By {alert.Client?.name || 'System'} • {new Date(alert.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => handleToggleAlert(alert.alert_id)}
                                                                className="p-2 rounded-lg hover:bg-white/50 transition-all" title={alert.is_active ? 'Deactivate' : 'Activate'}>
                                                                {alert.is_active ? <ToggleRight size={22} className="text-emerald-600" /> : <ToggleLeft size={22} className="text-slate-400" />}
                                                            </button>
                                                            <button onClick={() => handleDeleteAlert(alert.alert_id)}
                                                                className="p-2 rounded-lg hover:bg-rose-100 transition-all text-rose-400 hover:text-rose-600" title="Delete">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {alerts.length === 0 && (
                                                <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Bell size={32} className="text-slate-300" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-800 mb-2">No Alerts Sent</h3>
                                                    <p className="text-sm text-slate-400 mb-6">Create your first broadcast to notify all devotees</p>
                                                    <button onClick={() => setShowAlertComposer(true)}
                                                        className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-600/20">
                                                        Create First Alert
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ========== CROWD TAB ========== */}
                                {activeTab === 'crowd' && (
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                            <h3 className="text-xl font-black">Zone Capacity Monitoring</h3>
                                            <p className="text-xs text-slate-400 font-bold">Real-time crowd density across zones</p>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {zoneData.length > 0 ? zoneData.map((zone, idx) => (
                                                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-black text-slate-900">Zone #{zone.zone_id}</h4>
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${zone.count > 10 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                            {zone.count > 10 ? 'High Density' : 'Optimal'}
                                                        </span>
                                                    </div>
                                                    <div className="text-4xl font-black text-orange-600 mb-1">{zone.count}</div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Devotees</p>
                                                </div>
                                            )) : (
                                                <div className="col-span-2 py-16 text-center text-slate-300 font-bold">No zone tracking data available</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ========== SIGNAGE TAB ========== */}
                                {activeTab === 'signage' && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                                                    <Monitor size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black tracking-tight">Digital Signage</h3>
                                                    <p className="text-slate-400 text-xs font-bold">Live data • Updated: {signageData ? new Date(signageData.lastUpdated).toLocaleTimeString('en-IN') : '—'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <button onClick={() => setShowAlertComposer(true)} className="py-4 px-6 bg-orange-50 text-orange-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-orange-100 transition-all">
                                                    <Bell size={16} /> Push Crowd Alert
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative flex flex-col overflow-hidden">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Preview
                                                    </h3>
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Real-Time</span>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-slate-800 rounded-[2rem] p-6 bg-slate-950/50">
                                                    <h2 className="text-3xl font-black text-center mb-4 leading-tight">
                                                        SANCTUM <span className={signageData?.darshanStatus === 'OPEN' ? 'text-emerald-400' : signageData?.darshanStatus === 'PAUSED' ? 'text-amber-400' : 'text-rose-400'}>DARSHAN</span> {signageData?.darshanStatus || '—'}
                                                    </h2>
                                                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Queue Time</p>
                                                            <p className="text-xl font-bold text-orange-400">{signageData?.queueMinutes ?? '—'} MINS</p>
                                                        </div>
                                                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Density</p>
                                                            <p className={`text-xl font-bold ${signageData?.densityLevel === 'LIGHT' ? 'text-emerald-400' : signageData?.densityLevel === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}`}>{signageData?.densityLevel || '—'}</p>
                                                        </div>
                                                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Crowd</p>
                                                            <p className="text-xl font-bold text-blue-400">{signageData?.totalCrowd ?? 0}</p>
                                                        </div>
                                                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Today Tickets</p>
                                                            <p className="text-xl font-bold text-purple-400">{signageData?.todayTickets ?? 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl" />
                                            </div>
                                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                                    <Activity size={18} className="text-orange-500" /> Zone Status
                                                </h3>
                                                <div className="space-y-3">
                                                    {(signageData?.zones || []).map((z, idx) => (
                                                        <div key={z.zone_id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-bold text-sm text-slate-800">{z.name}</span>
                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${z.status === 'Critical' ? 'bg-rose-100 text-rose-600' : z.status === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{z.status}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full transition-all duration-700 ${z.percent > 80 ? 'bg-rose-500' : z.percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(z.percent, 100)}%` }} />
                                                                </div>
                                                                <span className="text-xs font-black text-slate-500 w-16 text-right">{z.count}/{z.capacity}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!signageData?.zones || signageData.zones.length === 0) && (
                                                        <div className="py-8 text-center text-slate-300 font-bold">No zone data available</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert Composer Modal */}
            {showAlertComposer && (
                <AlertComposer onClose={() => setShowAlertComposer(false)} onSend={handleSendAlert} />
            )}

            <Footer />
        </div>
    );
};

export default AdminPage;
