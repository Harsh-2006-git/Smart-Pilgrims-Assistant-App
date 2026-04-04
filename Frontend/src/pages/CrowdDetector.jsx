import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, LayoutDashboard, ShieldCheck, Activity, Upload, Play, XCircle, AlertCircle } from 'lucide-react';
import { API_V1 } from '../config/api';

const CrowdDetector = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('camera'); // 'camera' or 'video'
    const [isStreaming, setIsStreaming] = useState(false);
    const [status, setStatus] = useState({ camera_active: false });
    const [zones, setZones] = useState({ total: 0, zones: [] });
    const [sessionToken, setSessionToken] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [processedImage, setProcessedImage] = useState(null);

    const BACKEND_URL = `${API_V1}/crowd`;

    // Fetch backend status
    const updateStatus = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/status`);
            const data = await res.json();
            console.log('AI Status:', data);
            setStatus(data);
            
            // Only let the server dictate the stream state if we are tracking an uploaded video
            if (mode === 'video') {
                setIsStreaming(data.camera_active);
            }
        } catch (err) {
            console.error('Backend not reachable:', err);
        }
    };

    // Fetch live zone data
    const fetchZoneData = async () => {
        if (!isStreaming) return;
        try {
            const url = mode === 'camera'
                ? `${BACKEND_URL}/api/zones`
                : `${BACKEND_URL}/api/upload_zones/${sessionToken}`;
            const res = await fetch(url);
            const data = await res.json();
            setZones(data);
        } catch (err) {
            console.error('Error fetching zone data:', err);
        }
    };

    useEffect(() => {
        // Initial check
        updateStatus();

        // Poll status and zone data IF video mode (camera zones now come from process_frame)
        const interval = setInterval(() => {
            if (!isStreaming) updateStatus(); // Only poke status if offline
            if (isStreaming && mode === 'video') {
                fetchZoneData();
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isStreaming, mode, sessionToken]);

    // NEW: Client Streaming Loop
    useEffect(() => {
        let frameInterval;
        if (isStreaming && mode === 'camera') {
            frameInterval = setInterval(async () => {
                if (videoRef.current && canvasRef.current) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    if (video.videoWidth > 0) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const base64Image = canvas.toDataURL('image/jpeg', 0.6); // 60% quality

                        try {
                            const res = await fetch(`${BACKEND_URL}/api/process_frame`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image: base64Image })
                            });
                            if (res.ok) {
                                const data = await res.json();
                                if (data.status === 'success') {
                                    setProcessedImage(data.image);
                                    setZones({ total: data.total, zones: data.zones });
                                    setStatus(prev => ({ ...prev, detection_mode: data.detection_mode, status: 'online', camera_active: true }));
                                }
                            }
                        } catch (err) {
                            console.error('Frame processing failed:', err);
                        }
                    }
                }
            }, 300); // Process ~3 frames a second
        }
        return () => clearInterval(frameInterval);
    }, [isStreaming, mode]);

    const handleStartCamera = async () => {
        setIsStarting(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsStreaming(true);
            setStatus(prev => ({ ...prev, camera_active: true, status: 'online' }));
        } catch (err) {
            alert('Failed to access webcam. Please allow camera permissions.');
            console.error(err);
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopCamera = async () => {
        try {
            setIsStreaming(false);
            setProcessedImage(null);
            
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            setStatus(prev => ({ ...prev, camera_active: false }));
            
            // Optionally tell the backend to stop any residual workers
            await fetch(`${BACKEND_URL}/api/stop`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await fetch(`${BACKEND_URL}/api/upload-video`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                setSessionToken(data.session_token);
                setIsStreaming(true);
                setMode('video');
            }
        } catch (err) {
            alert('Upload failed. Ensure backend is running.');
        } finally {
            setIsUploading(false);
        }
    };

    const getLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'low': return 'text-green-500 bg-green-500/10';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10';
            case 'high': return 'text-orange-500 bg-orange-500/10';
            case 'critical': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Header />

            <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
                {/* Mode Selection */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3 md:mb-4">
                            Live Crowd Analytics
                        </h1>
                        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto md:mx-0">
                            Real-time devotee flow monitoring using advanced <strong>Full Body Detection AI (YOLOv8)</strong>.
                            Detects people even when face is covered — by analysing full body silhouette.
                        </p>
                    </div>

                    <div className="flex bg-white p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm w-full md:w-auto">
                        <button
                            onClick={() => { setMode('camera'); setIsStreaming(status.camera_active); }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-bold transition-all text-xs md:text-base ${mode === 'camera' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            <Camera size={18} /> <span className="hidden xs:inline">Live Camera</span><span className="xs:hidden">Live</span>
                        </button>
                        <button
                            onClick={() => { setMode('video'); setIsStreaming(!!sessionToken); }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-bold transition-all text-xs md:text-base ${mode === 'video' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            <Video size={18} /> <span className="hidden xs:inline">Video Upload</span><span className="xs:hidden">Upload</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Stream Area */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        <div className="relative aspect-[4/5] md:aspect-video bg-black rounded-3xl md:rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl group">
                            {/* Hidden elements for client frame streaming */}
                            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {isStreaming ? (
                                <img
                                    src={mode === 'camera' ? (processedImage || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=") : `${BACKEND_URL}/uploaded_feed/${sessionToken}`}
                                    alt="Live Stream"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gray-100">
                                    <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
                                        <Camera className="w-8 h-8 md:w-12 md:h-12 text-orange-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Detection Engine Offline</h3>
                                    {mode === 'camera' ? (
                                        <button
                                            onClick={handleStartCamera}
                                            disabled={isStarting}
                                            className="px-6 md:px-10 py-3 md:py-4 bg-orange-600 hover:bg-orange-500 rounded-full font-black text-[10px] md:text-sm tracking-widest uppercase transition-all transform hover:scale-105 shadow-xl shadow-orange-500/20 disabled:opacity-50 text-white flex items-center gap-2"
                                        >
                                            <Play size={16} /> {isStarting ? 'Activating...' : 'Initialize AI Core'}
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                accept="video/*"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={isUploading}
                                                className="px-6 md:px-10 py-3 md:py-4 bg-orange-600 hover:bg-orange-500 rounded-full font-black text-[10px] md:text-sm tracking-widest uppercase transition-all disabled:opacity-50 text-white flex items-center gap-2"
                                            >
                                                <Upload size={16} /> {isUploading ? 'Processing...' : 'Select Video File'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Live Badge */}
                            {isStreaming && (
                                <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-gray-200 shadow-sm">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                    <span className="text-[10px] font-black tracking-tighter uppercase text-gray-900">AI Active</span>
                                </div>
                            )}
                        </div>

                        {/* Control Deck */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                            <div className="flex gap-4">
                                {mode === 'camera' && isStreaming && (
                                    <button
                                        onClick={handleStopCamera}
                                        className="flex items-center gap-2 px-4 md:px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs md:text-sm hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <XCircle size={16} /> Stop Sensor
                                    </button>
                                )}
                                {mode === 'video' && sessionToken && (
                                    <button
                                        onClick={() => { setSessionToken(''); setIsStreaming(false); }}
                                        className="flex items-center gap-2 px-4 md:px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs md:text-sm hover:bg-gray-200 transition-all font-sans"
                                    >
                                        <XCircle size={16} /> Clear Video
                                    </button>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total People Detected</span>
                                <h4 className="text-3xl font-black text-orange-600">{zones.total || 0}</h4>
                                <span className="text-[10px] text-gray-400 font-bold">{status.detection_mode || 'Initializing...'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl md:rounded-[2rem] p-5 md:p-8 shadow-sm">
                            <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-2 text-gray-900">
                                <LayoutDashboard className="text-orange-500 w-5 h-5 md:w-6 md:h-6" /> Zone Breakdown
                            </h3>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {zones.zones && zones.zones.length > 0 ? zones.zones.map((zone) => (
                                    <div key={zone.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-orange-500/30 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-500">Zone {zone.id}</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${getLevelColor(zone.level)}`}>
                                                {zone.level}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <h5 className="text-2xl font-black text-gray-800">{zone.count}</h5>
                                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${zone.level?.toLowerCase() === 'low' ? 'bg-green-500' :
                                                        zone.level?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                                                            zone.level?.toLowerCase() === 'high' ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, (zone.count / 20) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-gray-400">
                                        No active telemetry data
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Log */}
                        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl md:rounded-[2rem] p-5 md:p-8 shadow-sm">
                            <h3 className="text-base md:text-lg font-black mb-3 md:mb-4 flex items-center gap-2 text-gray-900">
                                <Activity className="text-orange-600 w-4 h-4 md:w-5 md:h-5" /> Neural Status
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Model: YOLOv8s (Full Body)
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    Target: Person Detection (class 0)
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    Detects face-covered individuals ✓
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    Fallback: HOG Body Detector (if YOLO unavailable)
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    Resolution: High-Speed 30fps Stream
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,165,0,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,165,0,0.5); }
            `}</style>
            <Footer />
        </div>
    );
};

export default CrowdDetector;
