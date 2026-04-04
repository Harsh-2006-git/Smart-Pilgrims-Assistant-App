import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Camera, Video, LayoutDashboard, Activity, Upload, Play, XCircle } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const CrowdDetector = () => {
    const [mode, setMode] = useState('camera'); // 'camera' or 'video'
    const [isStreaming, setIsStreaming] = useState(false);
    const [modelLoading, setModelLoading] = useState(true);
    const [model, setModel] = useState(null);
    const [zones, setZones] = useState({ total: 0, zones: [] });
    const [isStarting, setIsStarting] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize TensorFlow and Load Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                setModelLoading(false);
            } catch (err) {
                console.error("Failed to load TensorFlow model:", err);
            }
        };
        loadModel();
        
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Draw Overlays and Calculate Zones
    const processDetections = useCallback((predictions, videoWidth, videoHeight) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 3x3 Grid dimensions
        const cols = 3, rows = 3;
        const cellW = canvas.width / cols;
        const cellH = canvas.height / rows;

        // Initialize zone counts
        let totalCount = 0;
        const zoneCounts = Array.from({ length: rows }, () => Array(cols).fill(0));

        // Filter for people and count
        predictions.forEach(prediction => {
            if (prediction.class === 'person') {
                totalCount++;
                const [x, y, width, height] = prediction.bbox;
                
                // Calculate center of bounding box to assign zone
                const cx = x + width / 2;
                const cy = y + height / 2;
                
                const colIdx = Math.min(Math.floor(cx / canvas.width * cols), cols - 1);
                const rowIdx = Math.min(Math.floor(cy / canvas.height * rows), rows - 1);
                zoneCounts[rowIdx][colIdx]++;
                
                // Draw stylish bounding box
                ctx.strokeStyle = '#00a5ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);

                // Draw label
                ctx.fillStyle = '#00a5ff';
                const label = `Person ${(prediction.score * 100).toFixed(0)}%`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillRect(x, y - 20, textWidth + 10, 20);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.fillText(label, x + 5, y - 5);
            }
        });

        // Draw Zone Grid Lines and Colors
        const newZones = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const zCount = zoneCounts[r][c];
                const x1 = c * cellW;
                const y1 = r * cellH;
                
                // Overlay color based on density
                if (zCount > 0) {
                    ctx.fillStyle = zCount < 2 ? 'rgba(0, 160, 0, 0.15)' :
                                   zCount < 5 ? 'rgba(0, 200, 200, 0.15)' :
                                   zCount < 10 ? 'rgba(0, 100, 255, 0.15)' : 
                                   'rgba(220, 0, 0, 0.15)';
                    ctx.fillRect(x1, y1, cellW, cellH);
                }

                // Draw cell count
                ctx.fillStyle = '#00e6ff';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(zCount.toString(), x1 + cellW / 2, y1 + cellH / 2 + 12);
                
                // Draw Zone ID
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`Z${r * cols + c + 1}`, x1 + 10, y1 + 25);

                const level = zCount < 2 ? "Low" : zCount < 5 ? "Medium" : "High";
                newZones.push({
                    id: `Z${r * cols + c + 1}`,
                    count: zCount,
                    level
                });
            }
        }

        // Draw grid boundaries
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let c = 1; c < cols; c++) {
            ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, canvas.height); ctx.stroke();
        }
        for (let r = 1; r < rows; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(canvas.width, r * cellH); ctx.stroke();
        }

        setZones({ total: totalCount, zones: newZones });
    }, []);

    const detectFrame = useCallback(async () => {
        if (!videoRef.current || !model || !isStreaming) return;
        const video = videoRef.current;
        
        if (video.readyState === 4) {
            const predictions = await model.detect(video);
            processDetections(predictions, video.videoWidth, video.videoHeight);
        }
        
        animationRef.current = requestAnimationFrame(detectFrame);
    }, [model, isStreaming, processDetections]);

    // Restart detection loops when video source changes
    useEffect(() => {
        if (isStreaming) {
            detectFrame();
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            // Clear canvas when stopped
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [isStreaming, detectFrame]);


    const handleStartCamera = async () => {
        setIsStarting(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsStreaming(true);
        } catch (err) {
            alert('Failed to access webcam. Please allow camera permissions.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopCamera = async () => {
        setIsStreaming(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = url;
            videoRef.current.load();
            videoRef.current.play();
            setMode('video');
            setIsStreaming(true);
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
                            Real-time devotee flow monitoring using extremely fast <strong>Client-Side AI (TensorFlow.js)</strong>.
                            Completely Serverless and Private local processing.
                        </p>
                    </div>

                    <div className="flex bg-white p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm w-full md:w-auto">
                        <button
                            onClick={() => { setMode('camera'); }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-bold transition-all text-xs md:text-base ${mode === 'camera' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            <Camera size={18} /> <span className="hidden xs:inline">Live Camera</span><span className="xs:hidden">Live</span>
                        </button>
                        <button
                            onClick={() => { setMode('video'); }}
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
                            
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                loop={mode === 'video'}
                                className={`w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`} 
                            />
                            <canvas 
                                ref={canvasRef} 
                                className={`absolute top-0 left-0 w-full h-full object-contain pointer-events-none ${!isStreaming ? 'hidden' : ''}`} 
                            />

                            {!isStreaming && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gray-100">
                                    <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                                        <Camera className="w-8 h-8 md:w-12 md:h-12 text-orange-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-gray-800">
                                        {modelLoading ? 'Downloading AI Model...' : 'Detection Engine Ready'}
                                    </h3>
                                    {modelLoading ? (
                                        <div className="mt-4 px-6 py-2 border-2 border-orange-500 border-t-transparent rounded-full animate-spin w-8 h-8"></div>
                                    ) : (
                                        mode === 'camera' ? (
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
                                                    className="px-6 md:px-10 py-3 md:py-4 bg-orange-600 hover:bg-orange-500 rounded-full font-black text-[10px] md:text-sm tracking-widest uppercase transition-all shadow-xl shadow-orange-500/20 text-white flex items-center gap-2"
                                                >
                                                    <Upload size={16} /> Select Local Video File
                                                </button>
                                            </div>
                                        )
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
                                {isStreaming && (
                                    <button
                                        onClick={handleStopCamera}
                                        className="flex items-center gap-2 px-4 md:px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs md:text-sm hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <XCircle size={16} /> Stop Sensor
                                    </button>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total People Detected</span>
                                <h4 className="text-3xl font-black text-orange-600">{zones.total || 0}</h4>
                                <span className="text-[10px] text-green-500 font-bold">TFJS • 30 FPS • Localhost</span>
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
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    Engine: TensorFlow.js Core
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Model: COCO-SSD (Objects & People)
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Topology: WebGL GPU Acceleration
                                </li>
                                <li className="flex items-center gap-3 text-xs text-green-600 font-bold">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Privacy: 100% Secure (No Cloud Transit)
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
