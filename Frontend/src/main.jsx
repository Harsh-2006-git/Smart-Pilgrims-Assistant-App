import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialize i18next before app renders
import { SocketProvider } from "./context/SocketContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID";
console.log("VITE_GOOGLE_CLIENT_ID from env:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log("Using GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <SocketProvider>
          <App />
        </SocketProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
