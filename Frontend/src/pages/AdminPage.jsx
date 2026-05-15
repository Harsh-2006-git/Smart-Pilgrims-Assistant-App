import React, { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    Package,
    Ticket,
    Monitor,
    Settings,
    BarChart3,
    ArrowUpRight,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreVertical,
    ChevronRight,
    ShieldCheck,

    Zap,
    LayoutDashboard,
    Bell,
    Trash2,
    X,
    ShieldAlert,
    Navigation,
    MapPin,
    ExternalLink,
    ChevronDown
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeTickets: 0,
        reportedItems: 0,
        revenue: '₹0L'
    });

    const [users, setUsers] = useState([]);
    const [lostItems, setLostItems] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [zoneData, setZoneData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [sosAlerts, setSosAlerts] = useState([]);
    const [isPushing, setIsPushing] = useState(false);
    const templates = {
        crowd: {
            title: "CROWD ALERT",
            message: "High density reported at Mahakal corridor. Please stay in your designated rows.",
            severity: "warning"
        },
        route: {
            title: "ROUTE GUIDANCE",
            message: "Main Gateway is congested. Please use the North Entry for faster access.",
            severity: "info"
        },
        emergency: {
            title: "EMERGENCY MODE",
            message: "Priority clearance at Outer Gates. Emergency vehicles heading to Sanctum.",
            severity: "critical"
        }
    };

    const [customAlert, setCustomAlert] = useState(templates.crowd);

    const BACKEND_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/admin`;

    useEffect(() => {
        // Support direct tab linking via search params (e.g. /admin?tab=sos)
        const params = new URLSearchParams(window.location.search);
        const requestedTab = params.get('tab');
        if (requestedTab && ['overview', 'users', 'bookings', 'density', 'alerts', 'sos'].includes(requestedTab)) {
            setActiveTab(requestedTab);
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Fetch Stats
            const statsRes = await fetch(`${BACKEND_URL}/stats`, { headers });
            const statsJson = await statsRes.json();
            setStats(statsJson);

            // Fetch Users
            const usersRes = await fetch(`${BACKEND_URL}/users`, { headers });
            setUsers(await usersRes.json());

            // Fetch Lost Items
            const lostRes = await fetch(`${BACKEND_URL}/lostfound`, { headers });
            setLostItems(await lostRes.json());

            // Fetch Tickets/Bookings
            const ticketsRes = await fetch(`${BACKEND_URL}/tickets`, { headers });
            setBookings(await ticketsRes.json());

            // Fetch Density - Using the same source as the public density page
            const publicApiV1 = BACKEND_URL.replace('/admin', '/zone');
            const densityRes = await fetch(`${publicApiV1}/density`, { headers });
            const densityData = await densityRes.json();
            // Handle both formats: { zones: [...] } or just [...]
            setZoneData(densityData.zones || densityData || []);

            // Fetch Alerts
            const alertsRes = await fetch(`${BACKEND_URL}/alerts/active`, { headers });
            setAlerts(await alertsRes.json());

            // Fetch SOS Alerts
            const sosRes = await fetch(`${BACKEND_URL}/sos`, { headers });
            setSosAlerts(await sosRes.json());

        } catch (error) {
            console.error("Master Console Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const pushAlert = async (title, message, severity) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${BACKEND_URL}/alerts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, message, severity })
            });
            if (res.ok) {
                // Refresh dashboard to show the new alert log
                fetchDashboardData();
            }
        } catch (error) {
            console.error("Push Alert Error:", error);
        }
    };

    const deactivateAlert = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/alerts/${id}/deactivate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                // Refresh data to reflect deactivation
                fetchDashboardData();
            }
        } catch (err) {
            console.error("Deactivate Error:", err);
        }
    };

    const resolveSOS = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/sos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Refresh data to reflect deactivation
                fetchDashboardData();
            }
        } catch (err) {
            console.error("Resolve SOS Error:", err);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        // If the path doesn't already contain /uploads/ and isn't a direct filename that should be in uploads
        // Note: lostFoundController stores just filename, while authController stores /uploads/filename
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        if (!normalizedPath.startsWith('/uploads/')) {
            return `${baseUrl}/uploads${normalizedPath}`;
        }
        return `${baseUrl}${normalizedPath}`;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Devotees', icon: Users },
        { id: 'crowd', label: 'Flow & Crowd', icon: Activity },
        { id: 'lostfound', label: 'Lost & Found', icon: Package },
        { id: 'bookings', label: 'Bookings', icon: Ticket },
        { id: 'signage', label: 'Digital Board', icon: Monitor },
        { id: 'emergency', label: 'SOS Control', icon: ShieldAlert }
    ];

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col overflow-x-hidden">
            <Header />

            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden fixed bottom-6 right-6 z-[60] flex items-center gap-2">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                    {isSidebarOpen ? <X size={24} /> : <LayoutDashboard size={24} />}
                </button>
            </div>

            <div className={`flex-1 flex flex-col lg:flex-row transition-all duration-500 max-w-[1800px] mx-auto w-full group ${alerts.length > 0 ? 'pt-32 md:pt-40' : 'pt-20 md:pt-24'}`}>

                {/* Sidebar Navigation */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 p-6 transition-transform duration-300 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}>
                    <div className="flex flex-col h-full">
                        <div className="mb-8 hidden lg:block">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                                    <ShieldCheck size={20} />
                                </div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight italic">
                                    Master <span className="text-orange-600">Console</span>
                                </h1>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Control Center</p>
                        </div>

                        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg translate-x-1'
                                        : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                        }`}
                                >
                                    <tab.icon size={18} className={activeTab === tab.id ? 'text-orange-400' : 'opacity-70'} />
                                    {tab.label}
                                    {activeTab === tab.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                </button>
                            ))}
                        </nav>


                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-2 md:p-6 lg:p-8 min-w-0 w-full overflow-hidden">
                    <div className="max-w-[1400px] mx-auto w-full">

                        {/* Mobile Header Bar */}
                        <div className="lg:hidden flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                            <div>
                                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Terminal Console</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                <span className="text-[8px] font-black text-emerald-600 uppercase">Live</span>
                            </div>
                        </div>

                        {/* Top Bar for Desktop */}
                        <div className="hidden lg:flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-xs font-black text-orange-600 uppercase tracking-[0.3em] mb-1">Ujjain Smart Management</h2>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h3>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> System Stats
                                </button>
                                <button onClick={fetchDashboardData} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
                                    <Zap size={14} className="text-orange-400" /> Force Update
                                </button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40">
                                <div className="w-12 h-12 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing with AI Core...</p>
                            </div>
                        ) : activeTab === 'overview' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
                                    {[
                                        { label: 'Total Devotees', val: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: 'Active Bookings', val: stats.totalCapacity, icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { label: 'Reported Items', val: stats.totalLostItems, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    ].map((s, idx) => (
                                        <div key={idx} className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                                            <div className={`${s.bg} ${s.color} w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform`}>
                                                <s.icon size={14} className="md:w-5 md:h-5" />
                                            </div>
                                            <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">{s.label}</p>
                                            <h3 className="text-base md:text-2xl font-black text-slate-800">{s.val || 0}</h3>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Charts/Tables Placeholder */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-xl font-bold">Flow Distribution</h3>
                                            <button className="text-xs font-bold text-orange-600 hover:underline">Full Map</button>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                            {(() => {
                                                const zoneMapping = {
                                                    1: { name: 'Mahakal', cap: 100 },
                                                    2: { name: 'Ram Ghat', cap: 50 },
                                                    3: { name: 'Kshipra', cap: 40 },
                                                    4: { name: 'Harsiddhi', cap: 80 },
                                                    5: { name: 'Ganesh', cap: 30 },
                                                    6: { name: 'Bhairav', cap: 60 }
                                                };

                                                return Object.entries(zoneMapping).map(([id, meta]) => {
                                                    const zoneID = Number(id);
                                                    // Map 'density' or 'count' field from backend
                                                    const zone = zoneData.find(z => z.zone_id === zoneID) || { count: 0, density: 0 };
                                                    const count = zone.density !== undefined ? zone.density : (zone.count || 0);

                                                    const status = count > (meta.cap * 0.8) ? 'Crit' : count > (meta.cap * 0.5) ? 'Mod' : 'Low';
                                                    const statusColor = status === 'Crit' ? 'bg-rose-100 text-rose-600' : status === 'Mod' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600';

                                                    return (
                                                        <div key={id} className="p-2 md:p-3 bg-slate-50/50 rounded-xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-black text-slate-900 text-[8px] uppercase tracking-tighter truncate max-w-[50px]">{meta.name}</h4>
                                                                <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase ${statusColor}`}>
                                                                    {status}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1 mb-0.5">
                                                                <div className="text-lg font-black text-slate-800">{count}</div>
                                                                <div className="text-slate-400 font-bold text-[8px]">/ {meta.cap}</div>
                                                            </div>
                                                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full ${status === 'Crit' ? 'bg-rose-500' : status === 'Mod' ? 'bg-orange-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${Math.min(100, (count / meta.cap) * 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-xl font-bold">Live Activity Log</h3>
                                            <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase">{lostItems.length} Recent Events</span>
                                        </div>
                                        <div className="space-y-4">
                                            {lostItems.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className={`p-4 ${item.status === 'found' ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'} border rounded-2xl flex gap-4 animate-in fade-in slide-in-from-right duration-500`} style={{ animationDelay: `${idx * 150}ms` }}>
                                                    <div className={`w-10 h-10 ${item.status === 'found' ? 'bg-emerald-500' : 'bg-orange-500'} text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg`}>
                                                        {item.status === 'found' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${item.status === 'found' ? 'text-emerald-900' : 'text-orange-900'} leading-tight capitalize`}>New {item.status} Item: {item.title}</p>
                                                        <p className={`text-xs ${item.status === 'found' ? 'text-emerald-600' : 'text-orange-600'} mt-1 truncate max-w-[200px]`}>{item.description || 'No description provided.'}</p>
                                                    </div>
                                                    <span className="ml-auto text-[10px] font-bold text-slate-400">{new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ))}
                                            {lostItems.length === 0 && (
                                                <div className="py-10 text-center text-slate-400 text-sm">No recent activity logged.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 md:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/30 gap-4">
                                    <h3 className="text-lg md:text-2xl font-black">All Devotees</h3>
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input type="text" placeholder="Search by name or ID..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-orange-500 outline-none w-full shadow-sm" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-[9px] md:text-[10px]">
                                                <th className="px-4 md:px-8 py-5">Devotee</th>
                                                <th className="px-4 md:px-8 py-5">Category</th>
                                                <th className="px-4 md:px-8 py-5">Status</th>
                                                <th className="px-4 md:px-8 py-5">Date</th>
                                                <th className="px-4 md:px-8 py-5">Op</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {users.map(u => (
                                                <tr key={u.client_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-orange-100 shadow-sm">
                                                                {u.profile_image ? (
                                                                    <img
                                                                        src={getImageUrl(u.profile_image)}
                                                                        alt={`${u.name}'s Profile Picture`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                                        {u.name[0]}
                                                                    </div>                                                                 )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-900 text-xs md:text-sm truncate">{u.name}</p>
                                                                <p className="text-[9px] md:text-[10px] text-slate-400 font-mono">ID-{u.client_id.toString().padStart(6, '0')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase ${u.userType === 'Premium' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                                            {u.userType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                                        <div className="flex items-center gap-1.5 md:gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                            <span className="text-[10px] md:text-xs font-bold text-slate-600">Registered</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-xs md:sm font-medium text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>

                                                    <td className="px-8 py-5">
                                                        <button className="p-2 hover:bg-white rounded-lg text-slate-300 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'signage' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                                    <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[2rem] flex items-center justify-center mb-6">
                                        <Monitor size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 tracking-tight">Main Gateway Signage</h3>
                                    <p className="text-slate-500 text-sm mb-8">Current active board: <strong>Safety & Density Alerts</strong></p>

                                    <div className="space-y-6">
                                        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl">
                                            {Object.keys(templates).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setCustomAlert(templates[t])}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${customAlert.title.toLowerCase().includes(t) ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="group">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-1 block">Broadcast Title</label>
                                                <input
                                                    type="text"
                                                    value={customAlert.title}
                                                    onChange={(e) => setCustomAlert({ ...customAlert, title: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-xs font-bold outline-none focus:border-orange-500 transition-colors"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-1 block">Display Message</label>
                                                <textarea
                                                    rows="3"
                                                    value={customAlert.message}
                                                    onChange={(e) => setCustomAlert({ ...customAlert, message: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium outline-none focus:border-orange-500 transition-colors resize-none"
                                                ></textarea>
                                            </div>
                                            <div className="flex gap-4">
                                                {['info', 'warning', 'critical'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setCustomAlert({ ...customAlert, severity: s })}
                                                        className={`flex-1 py-3 px-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${customAlert.severity === s ? (s === 'critical' ? 'border-rose-500 bg-rose-50 text-rose-600' : s === 'warning' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-indigo-500 bg-indigo-50 text-indigo-600') : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => pushAlert(customAlert.title, customAlert.message, customAlert.severity)}
                                            className="w-full py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 shadow-lg shadow-slate-900/10 transition-all">
                                            <Bell size={16} className={customAlert.severity === 'critical' ? 'animate-bounce' : ''} />
                                            BROADCAST TO DIGITAL BOARDS
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-8 text-white relative flex flex-col">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Live Active Alerts
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-black uppercase text-slate-400">Total: {alerts.length}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {alerts.length === 0 ? (
                                            <div className="py-12 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 italic">
                                                <Monitor size={32} className="mb-2 opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No Active Broadcasts</p>
                                            </div>
                                        ) : (
                                            alerts.map(a => (
                                                <div key={a.alert_id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group transition-all hover:border-slate-700">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className={`p-3 rounded-xl shrink-0 ${a.severity === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                            <Bell size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-black uppercase tracking-tighter truncate text-slate-200">{a.title}</h4>
                                                            <p className="text-[10px] text-slate-500 line-clamp-1">{a.message}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deactivateAlert(a.alert_id)}
                                                        className="p-3 bg-red-500/10 hover:bg-red-50 text-red-500 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <p className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] border-t border-slate-800 pt-6">Hardware Status: READY FOR PUSH</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lostfound' && (
                            <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-lg md:text-2xl font-black">Lost & Found Repository</h3>
                                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                                        <Search size={14} /> Filter Reports
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                <th className="px-8 py-5">Item Preview</th>
                                                <th className="px-8 py-5">Title & Desc</th>
                                                <th className="px-8 py-5">Contact Details</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5">Reported At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {lostItems.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        {item.image ? (
                                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                                                                <img
                                                                    src={getImageUrl(item.image)}
                                                                    alt={`Photograph of reported item: ${item.title}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                                                <Package size={24} />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="font-bold text-slate-800">{item.title}</p>
                                                        <p className="text-xs text-slate-400 line-clamp-1 italic">{item.description || 'No description'}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-slate-500">
                                                        <p className="text-sm font-bold">{item.reportedByPhone}</p>
                                                        <p className="text-[10px] opacity-60 italic">{item.reportedByEmail}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${item.status === 'found' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-slate-400 font-medium">
                                                        {new Date(item.uploadedAt).toLocaleDateString()}<br />
                                                        {new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-lg md:text-2xl font-black">Ticket Bookings</h3>
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                <th className="px-4 md:px-8 py-5">Ticket ID</th>
                                                <th className="px-4 md:px-8 py-5">Devotee</th>
                                                <th className="px-4 md:px-8 py-5">Date / Time</th>
                                                <th className="px-4 md:px-8 py-5">Adults</th>
                                                <th className="px-4 md:px-8 py-5">Temple</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {bookings.map(b => (
                                                <tr key={b.ticket_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-5 font-mono font-bold text-orange-600">#{b.ticket_id}</td>
                                                    <td className="px-8 py-5 font-bold text-slate-800">{b.Client?.name || 'Unknown'}</td>
                                                    <td className="px-8 py-5 text-slate-500">{b.date} | {b.time}</td>
                                                    <td className="px-8 py-5 font-black">{b.no_of_tickets}</td>
                                                    <td className="px-8 py-5 text-slate-400">{b.temple}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'crowd' && (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-2xl font-black">Zone Capacity Monitoring</h3>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[1, 2, 3, 4, 5, 6].map((id) => {
                                        const zoneMapping = {
                                            1: { name: 'Mahakaleshwar Mandir', cap: 100 },
                                            2: { name: 'Ram Ghat', cap: 50 },
                                            3: { name: 'Kshipra Bridge', cap: 40 },
                                            4: { name: 'Harsiddhi Mandir', cap: 80 },
                                            5: { name: 'Bada Ganesh Mandir', cap: 30 },
                                            6: { name: 'Kal Bhairav Mandir', cap: 60 }
                                        };
                                        const meta = zoneMapping[id];
                                        const zone = zoneData.find(z => z.zone_id === id) || { count: 0, density: 0 };
                                        const count = zone.density !== undefined ? zone.density : (zone.count || 0);

                                        const status = count > (meta.cap * 0.8) ? 'Critical' : count > (meta.cap * 0.5) ? 'Moderate' : 'Low';
                                        const statusColor = status === 'Critical' ? 'bg-rose-100 text-rose-600' : status === 'Moderate' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600';

                                        return (
                                            <div key={id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase text-[10px] tracking-widest">{meta.name}</h4>
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${statusColor}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <div className="text-4xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">{count}</div>
                                                    <div className="text-slate-400 font-bold text-sm">/ {meta.cap}</div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Live Flow</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                         {activeTab === 'emergency' && (
                            <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-red-600 rounded-3xl md:rounded-[2rem] p-5 md:p-8 text-white shadow-xl shadow-red-600/20 gap-4">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center border border-white/10 animate-pulse shrink-0">
                                            <ShieldAlert size={28} className="md:w-8 md:h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-3xl font-black italic tracking-tighter uppercase leading-none">Emergency Control</h2>
                                            <p className="text-red-100 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Safety Protocol Active</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 md:px-6 md:py-3 bg-black/20 rounded-xl md:rounded-2xl border border-white/10 text-center flex md:block items-center gap-3">
                                        <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-red-200">Active Signals</div>
                                        <div className="text-lg md:text-2xl font-black">{sosAlerts.filter(a => a.status === 'active').length}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                    {sosAlerts.length === 0 ? (
                                        <div className="lg:col-span-2 py-16 md:py-24 bg-white rounded-3xl md:rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                                            <ShieldAlert size={48} className="md:w-16 md:h-16 mb-4 opacity-20" />
                                            <p className="text-xs md:text-sm font-black uppercase tracking-widest">No Emergency Signals</p>
                                        </div>
                                    ) : (
                                        sosAlerts.map(sos => (
                                            <div key={sos.sos_id} className={`bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden border transition-all hover:shadow-2xl ${sos.status === 'active' ? 'border-red-500 shadow-xl shadow-red-600/5' : 'border-slate-100'}`}>
                                                <div className={`p-4 md:p-6 flex justify-between items-center ${sos.status === 'active' ? 'bg-red-50' : 'bg-slate-50'}`}>
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                                                            <Navigation size={18} className="md:w-5 md:h-5" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tracking ID</span>
                                                            <h4 className="text-xs md:text-sm font-black uppercase tracking-tighter text-slate-800">#{sos.sos_id.toString().padStart(4, '0')}</h4>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${sos.status === 'active' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {sos.status}
                                                    </div>
                                                </div>

                                                <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                                                    <div className="flex items-start gap-3 md:gap-4">
                                                        <img
                                                            src={getImageUrl(sos.Client?.profile_image) || "https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg"}
                                                            alt={`${sos.Client?.name}'s Profile Picture`}
                                                            className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.25rem] object-cover border-2 border-slate-50 shadow-sm"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-base md:text-xl font-black text-slate-800 tracking-tight truncate">{sos.Client?.name}</h3>
                                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest">{sos.Client?.userType}</span>
                                                            </div>
                                                            <div className="space-y-0.5 mt-1">
                                                                <div className="flex items-center gap-2 text-slate-500 text-[10px] md:text-xs font-medium truncate">
                                                                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div> {sos.Client?.phone}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-500 text-[10px] md:text-xs font-medium truncate">
                                                                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div> {sos.Client?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-950 p-4 md:p-6 rounded-2xl md:rounded-[2rem] text-blue-400 font-mono text-[9px] md:text-[11px] relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-3 opacity-20 text-blue-200">
                                                            <MapPin size={30} className="md:w-10 md:h-10" />
                                                        </div>
                                                        <div className="relative z-10">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-blue-900 font-black uppercase text-[8px] tracking-widest">Satellite Lock</span>
                                                                <span className="text-blue-900 font-black uppercase text-[8px] tracking-widest">{new Date(sos.created_at).toLocaleTimeString()}</span>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <div className="truncate">LAT: {sos.lat}</div>
                                                                <div className="truncate">LNG: {sos.lng}</div>
                                                                <div className="truncate">ALT: 492m ABOVE MSL</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex gap-3 md:gap-4">
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${sos.lat},${sos.lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 h-12 md:h-16 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:translate-y-[-4px] hover:shadow-xl active:translate-y-0 shadow-lg shadow-slate-900/20 transition-all text-center"
                                                        >
                                                            <Navigation size={14} className="md:w-[18px] md:h-[18px]" /> MAPS
                                                        </a>
                                                        <button
                                                            onClick={() => resolveSOS(sos.sos_id)}
                                                            title="Resolve & Clear Alert"
                                                            className="w-12 h-12 md:w-16 md:h-16 bg-white border border-slate-200 text-slate-400 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 transition-all group shrink-0"
                                                        >
                                                            <CheckCircle2 size={20} className="md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Footer />

            {/* Backdrop for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
                />
            )}
        </div>
    );
};

export default AdminPage;
