import React, { useEffect, useState, useRef } from "react";
import jsQR from "jsqr";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Map, ScanLine, Shield, Trash2, MapPin } from "lucide-react";
import { API_V1 } from "../config/api";

const Dashboard = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [scanData, setScanData] = useState({ unique_code: "", zone_id: "" });
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "scanner", or "history"
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const [trackingSearch, setTrackingSearch] = useState("");
  const [familyOptions, setFamilyOptions] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [historyType, setHistoryType] = useState("self"); // "self" or "family"
  const [selectedMember, setSelectedMember] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanInterval = useRef(null);

  const handleManualTrack = async () => {
    if (!trackingSearch) return;
    try {
      const response = await fetch(`${API_V1}/family/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: trackingSearch }) // searches by phone/email
      });
      const data = await response.json();
      if (data.members) setFamilyOptions(data.members);
      else setScanResult({ message: "No family found" });
    } catch (e) {
      setScanResult({ message: "Search error" });
    }
  };

  // Fetch zone density data
  const fetchZoneData = async () => {
    try {
      const response = await fetch(`${API_V1}/zone/density`);
      const data = await response.json();
      setZones(data.zones || data || []);
    } catch (error) {
      console.error("Error fetching zone data:", error);
    }
  };

  // Fetch family members for history filtering
  const fetchFamily = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_V1}/family/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setFamilyMembers(data.members || []);
    } catch (err) {
      console.error("Family fetch failed", err);
    }
  };

  const fetchHistory = async (memberId = null) => {
    try {
      const token = localStorage.getItem("token");
      const url = memberId
        ? `${API_V1}/zone/history?member_id=${memberId}`
        : `${API_V1}/zone/history`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setHistoryData(data.history || []);
    } catch (err) {
      console.error("History fetch failed", err);
    }
  };

  // Handle zone scan
  const handleZoneScan = async (e) => {
    if (e) e.preventDefault();
    if (!scanData.unique_code || !scanData.zone_id) {
      setScanResult({ message: "Please enter both unique code and zone ID" });
      return;
    }

    try {
      const response = await fetch(`${API_V1}/zone/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanData),
      });

      const result = await response.json();
      setScanResult(result);

      if (response.ok) {
        fetchZoneData();
        setScanData((prev) => ({ ...prev, unique_code: "" }));
      }
    } catch (error) {
      console.error("Error scanning zone:", error);
      setScanResult({ message: "Error scanning zone" });
    }
  };

  // Handle zone exit
  const handleZoneExit = async (unique_code) => {
    try {
      const response = await fetch(`${API_V1}/zone/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique_code }),
      });

      const result = await response.json();
      setScanResult(result);

      if (response.ok) fetchZoneData();
    } catch (error) {
      console.error("Error exiting zone:", error);
      setScanResult({ message: "Error exiting zone" });
    }
  };

  // QR code detection
  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      try {
        const parsed = JSON.parse(code.data);
        return parsed.unique_code || code.data;
      } catch {
        return code.data;
      }
    }
    return null;
  };

  // Start QR scanner
  const startScanner = async () => {
    setIsScanning(true);
    setScannerError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;

      let lastScannedCode = null;
      let lastScanTime = 0;

      const tick = () => {
        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
          scanInterval.current = requestAnimationFrame(tick);
          return;
        }

        const qrCode = detectQRCode();
        if (qrCode) {
          const now = Date.now();
          // Faster debounce: 1.5 seconds instead of 3
          if (qrCode !== lastScannedCode || (now - lastScanTime > 1500)) {
            lastScannedCode = qrCode;
            lastScanTime = now;

            setScanData((prev) => {
              const newData = { ...prev, unique_code: qrCode };
              if (newData.zone_id) {
                handleAutoScan(newData);
              }
              return newData;
            });
            setScanResult({ message: `✅ QR Code detected: ${qrCode}` });
          }
        }
        scanInterval.current = requestAnimationFrame(tick);
      };

      scanInterval.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setScannerError("Cannot access camera. Check permissions.");
      setIsScanning(false);
    }
  };

  const handleAutoScan = async (data) => {
    try {
      const response = await fetch(`${API_V1}/zone/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setScanResult(result);
      if (response.ok) {
        fetchZoneData();
      }
    } catch (error) {
      setScanResult({ message: "Error scanning zone" });
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    if (scanInterval.current) {
      cancelAnimationFrame(scanInterval.current);
      scanInterval.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const recordLocation = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            await fetch(`${API_V1}/zone/record-location`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            });
            console.log("📍 Location synced");
          } catch (err) {
            console.error("Location sync failed", err);
          }
        });
      }
    };

    // Record immediately then every 5 minutes
    recordLocation();
    const locInterval = setInterval(recordLocation, 5 * 60 * 1000);

    return () => clearInterval(locInterval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchZoneData();
      await fetchFamily();
      await fetchHistory();
      setLoading(false);
    };

    loadData();

    return () => {
      stopScanner();
    };
  }, []);

  const getDensityStatus = (density) => {
    if (density === 0) return { text: "Low", color: "bg-green-500" };
    if (density < 3) return { text: "Moderate", color: "bg-yellow-500" };
    return { text: "High", color: "bg-red-500" };
  };

  // JSX for the scanner (Simplified like previous)
  const ScannerView = () => (
    <div className="w-full pb-24">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center">
            Visitor Scanner
          </h2>
          <p className="text-gray-500 text-center mt-1 text-sm">
            Entry & Exit Management Portal
          </p>
        </div>

        <div className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Camera Section */}
            <div className="w-full lg:w-1/2 flex flex-col items-center space-y-4">
              <div className="w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden relative shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />

                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isScanning ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                    <span className="text-xs text-white font-bold tracking-wide">
                      {isScanning ? "CAMERA ACTIVE" : "CAMERA OFF"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={isScanning ? stopScanner : startScanner}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-md ${isScanning ? "bg-red-50 text-red-600 border border-red-200" : "bg-slate-900 text-white"}`}
              >
                {isScanning ? "Stop Camera" : "Activate Camera"}
              </button>
            </div>

            {/* Manual Entry Section */}
            <div className="w-full lg:w-1/2 flex flex-col space-y-6">
              <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span>Registration</span>
                  <div className="h-px bg-gray-200 flex-grow"></div>
                </h3>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Visitor Unique Code</label>
                    <input
                      type="text"
                      value={scanData.unique_code}
                      onChange={(e) => setScanData((prev) => ({ ...prev, unique_code: e.target.value }))}
                      placeholder="e.g. RFID-2551d30b"
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none transition-all bg-white font-mono text-gray-800 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Select Zone</label>
                    <select
                      value={scanData.zone_id}
                      onChange={(e) => setScanData((prev) => ({ ...prev, zone_id: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none transition-all bg-white text-gray-800 font-medium appearance-none"
                    >
                      <option value="">-- Choose Zone --</option>
                      {zones.map((zone) => (
                        <option key={zone.zone_id} value={zone.zone_id}>
                          {zone.zone_name} (ID: {zone.zone_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleZoneScan}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]"
                  >
                    Verify & Submit Entry
                  </button>
                </div>
              </div>

              {scanResult && (
                <div className={`p-4 rounded-xl text-center text-sm font-bold border animate-fade-in ${scanResult.message.includes("✅") ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                  {scanResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to wipe your history and reset the map?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_V1}/zone/history/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryData([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="pt-24 pb-8 md:pt-28 md:pb-10 px-6 text-center bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 mb-3 animate-fade-in-up">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Zone Status</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight text-gray-900">
            Monitor <span className="text-orange-600">Crowd Density</span>
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
            Real-time tracking of devotee flow at Mahakaleshwar Temple.
          </p>

          <div className="max-w-3xl mx-auto mb-8 animate-fade-in px-4 md:px-0">
            <div
              className={`bg-orange-50 border border-orange-200 rounded-2xl p-4 md:p-6 text-left relative overflow-hidden shadow-sm transition-all duration-500 cursor-pointer ${isAlertExpanded ? 'max-h-[500px]' : 'max-h-[80px] md:max-h-[100px]'}`}
              onClick={() => setIsAlertExpanded(!isAlertExpanded)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="flex gap-3 md:gap-4 relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 transition-transform">
                  <Shield size={isAlertExpanded ? 24 : 20} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <h4 className="text-orange-900 font-bold text-sm md:text-base mb-1">Important Tracking Info</h4>
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-2 py-1 rounded-md">
                      {isAlertExpanded ? "VIEW LESS" : "TAP TO ENLARGE"}
                    </span>
                  </div>

                  <div className={`transition-all duration-500 overflow-hidden ${isAlertExpanded ? 'opacity-100 mt-4' : 'opacity-0 max-h-0'}`}>
                    <div className="text-orange-800/80 text-sm leading-relaxed font-semibold">
                      You are currently being tracked by our smart platform to ensure crowd safety.
                      <br /><br />
                      <span className="text-orange-900 font-bold">Want to track family?</span> If you are with family members, please either:
                      <ul className="list-disc ml-5 mt-2 space-y-2">
                        <li>Login from their individual accounts on their devices.</li>
                        <li>Associate them with your account in the <strong>Profile</strong> section and use their specific QR codes for entry/exit scans.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Tab Navigation */}
        <div className="mb-8 px-4">
          <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 flex w-full max-w-[480px] mx-auto relative z-10">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-300 text-center ${activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-md"
                : "text-gray-500 hover:text-slate-900 hover:bg-gray-50"
                }`}
            >
              Live Map
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-300 text-center ${activeTab === "scanner"
                ? "bg-slate-900 text-white shadow-md"
                : "text-gray-500 hover:text-slate-900 hover:bg-gray-50"
                }`}
            >
              QR Scanner
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-300 text-center ${activeTab === "history"
                ? "bg-slate-900 text-white shadow-md"
                : "text-gray-500 hover:text-slate-900 hover:bg-gray-50"
                }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 pb-16">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Zone Map */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Temple Zone Map</h2>
                    <p className="text-gray-500 font-medium">Interactive vector monitoring & density tracking</p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Live Data</span>
                  </div>
              </div>
                <div className="">
                  <div className="relative">
                    <img
                      src="https://archive.org/download/ujjain_district_madhya_pradesh_election_2018_map/ujjain_district_madhya_pradesh_election_2018_map.jpg"
                      alt="Map of Ujjain District showing various monitoring zones"
                      className="rounded-xl w-full border-2 border-orange-100"
                    />
                    <div className="absolute inset-0">
                      {zones.map((zone) => {
                        // Pre-defined coordinates for better distribution across the Ujjain map image
                        const positions = {
                          1: { top: "25%", left: "12%" }, // Nagada area - Moved Down
                          2: { top: "15%", left: "45%" }, // Mahidpur area - Far Top Center
                          3: { top: "42%", left: "55%" }, // Ghatiya area - Central-Right
                          4: { top: "35%", left: "82%" }, // Tarana area - Far Right
                          5: { top: "75%", left: "28%" }, // Badnagar area - Bottom Left
                          6: { top: "75%", left: "58%" }  // Ujjain South - Moved Up
                        };

                        const pos = positions[zone.zone_id] || {
                          top: `${15 + (zone.zone_id % 5) * 15}%`,
                          left: `${15 + (zone.zone_id % 3) * 25}%`
                        };

                        return (
                          <div
                            key={zone.zone_id}
                            className={`absolute w-12 h-12 rounded-full text-white flex items-center justify-center font-bold cursor-pointer shadow-lg border-2 border-white transition-all duration-300 hover:scale-110 ${getDensityStatus(zone.density).color
                              }`}
                            style={{
                              top: pos.top,
                              left: pos.left,
                              transform: "translate(-50%, -50%)",
                            }}
                            onClick={() => setSelectedZone(zone)}
                          >
                            {zone.zone_id}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-6 bg-orange-50 p-4 rounded-xl">
                    <h3 className="font-bold text-orange-700 mb-3 text-center">
                      Density Legend
                    </h3>
                    <div className="flex justify-center space-x-6">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Low</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Moderate</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">High</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone Overview */}
              <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">Zone Overview</h2>
                <p className="text-slate-400 text-sm mb-6 relative z-10">Real-time density metrics</p>

                <div className="mt-4 md:mt-0 md:p-6">
                  {loading ? (
                    <div className="text-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-orange-600 font-medium">Loading zone data...</p>
                    </div>
                  ) : zones.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-orange-600 font-medium">No zones available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {zones.map((zone) => {
                        const status = getDensityStatus(zone.density);
                        return (
                          <div
                            key={zone.zone_id}
                            className={`p-3 rounded-xl shadow-lg cursor-pointer border-l-4 ${status.color} bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-white transition-all duration-300 transform hover:scale-[1.02]`}
                            onClick={() => setSelectedZone(zone)}
                          >
                            <div className="flex justify-between items-center text-slate-900">
                              <div>
                                <h3 className="font-bold text-base text-gray-800">{zone.zone_name}</h3>
                                <p className="text-xs text-gray-500">Zone ID: <span className="font-bold">{zone.zone_id}</span></p>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.color} text-white shadow-md`}>
                                  {status.text}
                                </span>
                                <p className="text-xl font-bold text-gray-700 mt-1">{zone.density}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Tab Content */}
        {activeTab === "scanner" && <ScannerView />}

        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="pb-24 space-y-8 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Movement History</h2>
                  <p className="text-gray-500 font-medium">Detailed log of zone entries and exits</p>
                </div>
                {historyType === "self" && (
                  <button 
                    onClick={clearHistory}
                    className="flex items-center gap-3 px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm group"
                  >
                    <Trash2 size={12} className="group-hover:animate-bounce" /> Wipe Journey
                  </button>
                )}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => { setHistoryType("self"); setSelectedMember(null); fetchHistory(); }}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${historyType === "self" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
                  >
                    Self Tracking
                  </button>
                  <button
                    onClick={() => setHistoryType("family")}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${historyType === "family" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
                  >
                    Family Tracking
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-8">
                {historyType === "family" && (
                  <div className="mb-8 flex flex-wrap gap-4">
                    {familyMembers.length === 0 ? (
                      <p className="text-gray-500 italic px-4">No family members associated. Add them in Profile.</p>
                    ) : (
                      familyMembers.map(member => (
                        <button
                          key={member.member_id}
                          onClick={() => { setSelectedMember(member); fetchHistory(member.member_id); }}
                          className={`px-5 py-3 rounded-2xl font-bold border-2 transition-all ${selectedMember?.member_id === member.member_id ? "bg-orange-600 border-orange-600 text-white shadow-lg" : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-50"}`}
                        >
                          {member.name}
                        </button>
                      ))
                    )}
                  </div>
                )}

                   {/* Two-part history view */}
                   <div className="space-y-10">
                     {/* GPS Pings Section */}
                     <div className="space-y-4">
                       <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                         Automatic Tracking Log (Last 10 detected)
                       </h3>
                       <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm hide-scrollbar bg-white">
                         <table className="w-full text-left min-w-[700px]">
                           <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                             <tr>
                               <th className="px-6 py-6 rounded-tl-3xl">Participant</th>
                               <th className="px-6 py-6">Status Info</th>
                               <th className="px-6 py-6">Coordinates</th>
                               <th className="px-6 py-6">Detected At</th>
                               <th className="px-6 py-6 rounded-tr-3xl text-center">Status</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                             {historyData.filter(log => log.tracking_type === 'Live GPS Ping').length === 0 ? (
                               <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium italic">No GPS signals detected yet.</td></tr>
                             ) : (
                               historyData
                                 .filter(log => log.tracking_type === 'Live GPS Ping')
                                 .slice(-10)
                                 .reverse()
                                 .map((log, i) => (
                                 <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
                                   <td className="px-6 py-6 border-l-4 border-transparent group-hover:border-indigo-600 transition-all">
                                      <div className="flex flex-col">
                                        <span className="font-black text-slate-800 text-sm">{log.participant}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Device Sync</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-6">
                                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[9px] uppercase tracking-widest border border-indigo-100 italic">Auto-Detected</span>
                                   </td>
                                   <td className="px-6 py-6">
                                      <div className="flex flex-col gap-0.5 text-slate-500 font-bold text-[9px]">
                                        <span>Lat: {log.latitude?.toFixed(5)}</span>
                                        <span>Lng: {log.longitude?.toFixed(5)}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-6 text-xs font-black text-slate-500">{log.enter_time}</td>
                                   <td className="px-6 py-6 text-center">
                                      <div className="flex justify-center"><div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div></div>
                                   </td>
                                 </tr>
                               ))
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>

                     {/* QR Registration Section */}
                     <div className="space-y-4">
                       <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                         Manual Zone History (All QR scans)
                       </h3>
                       <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm hide-scrollbar bg-white">
                         <table className="w-full text-left min-w-[700px]">
                           <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                             <tr>
                               <th className="px-6 py-6 rounded-tl-3xl">Participant</th>
                               <th className="px-6 py-6">Last Zone</th>
                               <th className="px-6 py-6">Current Zone</th>
                               <th className="px-6 py-6">Enter Time</th>
                               <th className="px-6 py-6">Leave Time</th>
                               <th className="px-6 py-6 rounded-tr-3xl text-center">Duration</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                             {historyData.filter(log => log.tracking_type !== 'Live GPS Ping' && log.current_zone !== 'Exit Point').length === 0 ? (
                               <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-medium italic">No QR scan records found.</td></tr>
                             ) : (
                               historyData
                                 .filter(log => log.tracking_type !== 'Live GPS Ping' && log.current_zone !== 'Exit Point')
                                 .reverse()
                                 .map((log, i) => (
                                 <tr key={i} className="hover:bg-orange-50/50 transition-colors group">
                                   <td className="px-6 py-6 border-l-4 border-transparent group-hover:border-orange-500 transition-all">
                                     <div className="flex flex-col">
                                       <span className="font-black text-slate-800 text-sm">{log.participant}</span>
                                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Devotee Tag</span>
                                     </div>
                                   </td>
                                   <td className="px-6 py-6 font-bold text-slate-500 text-xs">{log.last_zone || "Entry Gate"}</td>
                                   <td className="px-6 py-6">
                                     <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-black text-[10px] uppercase shadow-lg shadow-orange-600/20">
                                       <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
                                       {log.current_zone}
                                     </div>
                                   </td>
                                   <td className="px-6 py-6 text-xs font-black text-slate-500">{log.enter_time}</td>
                                   <td className="px-6 py-6">
                                     {log.leave_time ? (
                                       <span className="text-xs font-black text-slate-500">{log.leave_time}</span>
                                     ) : (
                                       <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 font-black text-[9px] uppercase tracking-widest border border-green-200">Live Active</span>
                                     )}
                                   </td>
                                   <td className="px-6 py-6 text-center">
                                     {log.duration_spent ? (
                                       <span className="font-black text-slate-800 text-sm">{Math.floor(log.duration_spent / 60)}m {log.duration_spent % 60}s</span>
                                     ) : (
                                       <div className="flex justify-center"><div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div></div>
                                     )}
                                   </td>
                                 </tr>
                               ))
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>
                   </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone Details Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-2 border-orange-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{selectedZone.zone_name}</h2>
              <button onClick={() => setSelectedZone(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-300">✕</button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <p className="text-sm text-orange-600 font-medium">Zone ID</p>
                  <p className="text-2xl font-bold text-orange-800">{selectedZone.zone_id}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl text-center">
                  <p className="text-sm text-red-600 font-medium">Current Count</p>
                  <p className="text-2xl font-bold text-red-800">{selectedZone.density}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-xl text-center">
                <p className="text-sm text-orange-700 font-medium mb-2">Density Status</p>
                <span className={`px-4 py-2 rounded-full text-white font-bold ${getDensityStatus(selectedZone.density).color}`}>
                  {getDensityStatus(selectedZone.density).text}
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setScanData((prev) => ({ ...prev, zone_id: selectedZone.zone_id }));
                    setSelectedZone(null);
                    setActiveTab("scanner");
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105"
                >
                  Scan This Zone
                </button>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="px-6 py-3 border-2 border-orange-50 text-orange-500 rounded-full font-bold hover:bg-orange-50 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Dashboard;
