import React, { useState } from "react";
import { X, Globe } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { API_V1 } from "../config/api";

const AuthModal = ({ isOpen, onClose, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState("initial");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    userType: "Civilian",
    age: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage("");
    try {
      const idToken = credentialResponse.credential;
      const decodedUser = jwtDecode(idToken);

      const response = await fetch(`${API_V1}/auth/profile`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
        onClose();
        navigate("/");
      } else if (response.status === 404 || response.status === 401) {
        setFormData({
          name: decodedUser.name || "",
          email: decodedUser.email || "",
          phone: "",
          userType: "Civilian",
          age: "",
        });
        setStep("registering");
      }
    } catch (error) {
      console.error(error);
      setMessage("Service temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_V1}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
        onClose();
        navigate("/");
      } else {
        setMessage("Registration failed. Please try again.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-slate-600" />
        </button>

        <div className="p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-xs font-black tracking-widest text-orange-600 uppercase shadow-sm mb-4">
              <Globe size={12} /> DIVINE ACCESS
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {step === "initial" ? "Welcome Back" : "Complete Profile"}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {step === "initial"
                ? "Sign in to access your pilgrimage dashboard"
                : "Help us personalize your experience"}
            </p>
          </div>

          {/* Initial Step: Google Login */}
          {step === "initial" && (
            <div className="space-y-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage("Google login failed")}
                text="signin_with"
                width="100%"
              />

              {message && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">
                  {message}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-500 font-medium">or continue as</span>
                </div>
              </div>

              <button className="w-full py-3 px-4 rounded-lg border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                Guest User
              </button>
            </div>
          )}

          {/* Registration Step */}
          {step === "registering" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">User Type</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400"
                >
                  <option>Civilian</option>
                  <option>Family</option>
                  <option>Senior Citizen</option>
                </select>
              </div>

              {message && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? "Completing..." : "Complete Registration"}
              </button>

              <button
                type="button"
                onClick={() => setStep("initial")}
                className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
