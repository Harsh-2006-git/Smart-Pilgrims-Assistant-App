<div align="center">  <h1>🛕 Divya Yatra</h1>  <p>
    <strong>AI-Powered Smart Pilgrimage Assistance System</strong>
  </p>  <p>
    <em>Making pilgrimage safer, smarter, and more accessible.</em>
  </p></div>---

🚀 Overview

<div style="max-width: 900px; margin: 20px auto; line-height: 1.6; font-size: 1.1rem; color: #333;">
  <p>
    <strong>Divya Yatra</strong> is an AI-powered digital platform designed to improve
    the pilgrimage experience during large-scale gatherings such as
    <strong>Simhastha 2028 in Ujjain</strong>.
  </p>  <p>
    The platform brings together <strong>priority-based ticketing</strong>,
    <strong>smart navigation</strong>, <strong>AI-powered crowd monitoring</strong>,
    <strong>pilgrim safety</strong>, <strong>AI Lost & Found</strong>,
    <strong>live darshan</strong>, <strong>smart parking</strong>,
    <strong>travel planning</strong>, and a centralized
    <strong>administration dashboard</strong>.
  </p>  <p>
    Built using the <strong>MERN ecosystem</strong> with real-time communication,
    AI services, mapping technologies, and external APIs, Divya Yatra aims to
    create a connected digital ecosystem for pilgrims, volunteers, and
    administrators.
  </p>
</div>---

🎯 Problem Statement

Large-scale pilgrimage gatherings bring together lakhs of people across multiple
locations, creating major challenges related to:

- 👥 Crowd management
- 🗺️ Navigation and mobility
- 🚨 Emergency and pilgrim safety
- 🎟️ Priority access
- 👨‍👩‍👧 Family tracking
- 🔎 Lost & Found assistance
- 🚗 Parking and transportation
- 📢 Real-time information
- 🛕 Digital pilgrimage services

Divya Yatra addresses these challenges through a unified digital platform focused
on smart mobility, safety, accessibility, and real-time services.

---

🖼️ Project Preview

<!-- Replace this image with your actual project screenshot --><img width="1895" height="904" alt="Divya Yatra Dashboard" src="YOUR_GITHUB_SCREENSHOT_URL" />Repository: "Harsh-2006-git/Smart-Pilgrims-Assistant-App"

---

✨ Key Features

🌟 Feature| 📝 Description
🎟️ Priority-Based Ticketing| Tier-based booking, QR tickets, automated scheduling, and dynamic access control for special events such as Shahi Snan.
🗺️ Smart Navigation| Interactive maps for temples, ghats, parking zones, emergency exits, and alternate crowd-aware routes.
👥 AI Crowd Monitoring| CCTV-based crowd analysis, AI-powered density detection, heatmaps, and safety alerts.
🚨 Pilgrim Safety| Family tracking, live location sharing, SOS support, safety scores, and emergency connectivity.
🔎 AI Lost & Found| Face, image, and text-based matching with multilingual search and admin verification.
📢 Dynamic Notice Board| Real-time ritual timings, VIP movement updates, weather alerts, and emergency notifications.
🛕 Live Darshan| Live streaming of temple rituals and Shahi Snan with digital access for remote pilgrims.
🚗 Smart Parking| Real-time parking availability and temporary parking spaces listed by local residents.
🤖 AI Travel Planner| AI-powered route and trip planning using Gemini API and SERP API.
💬 Multilingual Chatbot| Gemini-powered chatbot for seamless multilingual pilgrim assistance.
🚌 Transport Integration| Support for public transport and pilgrimage mobility planning.
🛡️ Admin Dashboard| Centralized management of routes, notices, emergencies, tickets, and Lost & Found.

The feature set follows the proposed Divya Yatra solution described in the project presentation.

---

🛠️ Dynamic Tech Stack

<div align="center" style="overflow: hidden;"><marquee behavior="scroll" direction="left" scrollamount="10">  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" hspace="10" />  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" hspace="10" />  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" hspace="10" />  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" hspace="10" />  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" hspace="10" />  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" hspace="10" />  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" hspace="10" />  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" hspace="10" />  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" hspace="10" />  <img src="https://img.shields.io/badge/SQL-4479A1?style=for-the-badge&logo=postgresql&logoColor=white" alt="SQL" hspace="10" />  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" hspace="10" />  <img src="https://img.shields.io/badge/YOLO-111111?style=for-the-badge&logo=yolo&logoColor=white" alt="YOLO" hspace="10" />  <img src="https://img.shields.io/badge/REST_API-000000?style=for-the-badge&logo=fastapi&logoColor=white" alt="REST API" hspace="10" />  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git" hspace="10" />  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" hspace="10" /></marquee></div>---

🔄 System Flow

                         👤 PILGRIM
                             │
                             ▼
                  ┌────────────────────┐
                  │    React.js UI     │
                  │                    │
                  │ 🎟️ Ticketing       │
                  │ 🗺️ Navigation      │
                  │ 🚨 Safety          │
                  │ 🛕 Live Darshan    │
                  │ 🤖 AI Chatbot      │
                  └─────────┬──────────┘
                            │
                    REST APIs + Socket.IO
                            │
                            ▼
                  ┌────────────────────┐
                  │ Node.js + Express  │
                  │      Backend       │
                  ├────────────────────┤
                  │ Authentication     │
                  │ Ticket Management  │
                  │ Crowd Management   │
                  │ Emergency Services │
                  │ Notifications      │
                  │ Travel Planner     │
                  └─────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       ┌───────────┐  ┌────────────┐  ┌─────────────┐
       │ SQL DB    │  │  AI Layer  │  │ External    │
       │           │  │            │  │ Services    │
       │ Users     │  │ Gemini     │  │ Firebase    │
       │ Tickets   │  │ OpenCV     │  │ SERP API    │
       │ Events    │  │ YOLO       │  │ Leaflet     │
       │ Routes    │  │ Crowd AI   │  │ CCTV        │
       └───────────┘  └────────────┘  └─────────────┘

The proposed application uses React.js with Leaflet Maps and Socket.IO, while
Node.js + Express handles REST APIs and real-time WebSocket communication.
Firebase Authentication provides Google Sign-In.

---

📂 Project Structure

Smart-Pilgrims-Assistant-App/
│
├── 📂 backend/                         # Server-side application
│   ├── 📂 config/                      # Database & service configuration
│   ├── 📂 controllers/                 # Business logic
│   │   ├── authController.js
│   │   ├── ticketController.js
│   │   ├── crowdController.js
│   │   ├── emergencyController.js
│   │   └── lostFoundController.js
│   │
│   ├── 📂 middleware/                  # Authentication & validation
│   ├── 📂 models/                      # Database models
│   ├── 📂 routes/                      # REST API routes
│   ├── 📂 services/                    # AI & external services
│   ├── 📂 sockets/                     # Socket.IO handlers
│   ├── 📂 utils/                       # Helper utilities
│   ├── 📄 app.js                       # Express application
│   └── 📄 server.js                    # Backend entry point
│
├── 📂 frontend/                        # React application
│   ├── 📂 public/                      # Static assets
│   └── 📂 src/
│       ├── 📂 assets/                  # Images & media
│       ├── 📂 components/              # Reusable components
│       ├── 📂 pages/                   # Application pages
│       │   ├── 📂 admin/               # Admin dashboard
│       │   ├── 📂 pilgrim/             # Pilgrim services
│       │   ├── 📂 navigation/          # Maps & routes
│       │   └── 📂 emergency/           # Safety services
│       ├── 📂 context/                 # Global state
│       ├── 📂 hooks/                   # Custom React hooks
│       ├── 📂 services/                # API services
│       ├── 📂 utils/                   # Frontend utilities
│       ├── 📄 App.jsx                  # Main application
│       └── 📄 main.jsx                 # React entry point
│
├── 📂 ai/                              # AI-related modules
│   ├── 📂 crowd-detection/
│   ├── 📂 lost-found/
│   └── 📂 forecasting/
│
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 package.json
└── 📄 README.md

---

📸 Gallery

«Add your actual project screenshots/GitHub image URLs below.»

<table>
  <tr>
    <td>
      <img src="YOUR_IMAGE_URL_1" width="100%" alt="Divya Yatra Home" />
    </td>
    <td>
      <img src="YOUR_IMAGE_URL_2" width="100%" alt="Divya Yatra Dashboard" />
    </td>
  </tr>  <tr>
    <td>
      <img src="YOUR_IMAGE_URL_3" width="100%" alt="Smart Navigation" />
    </td>
    <td>
      <img src="YOUR_IMAGE_URL_4" width="100%" alt="Ticketing System" />
    </td>
  </tr>  <tr>
    <td>
      <img src="YOUR_IMAGE_URL_5" width="100%" alt="Admin Dashboard" />
    </td>
    <td>
      <img src="YOUR_IMAGE_URL_6" width="100%" alt="AI Assistant" />
    </td>
  </tr>
</table>---

🤖 AI & Real-Time Intelligence

👥 Crowd Monitoring

📹 CCTV
   ↓
🔍 Computer Vision
   ↓
🤖 YOLO / OpenCV
   ↓
👥 Crowd Density
   ↓
🔥 Live Heatmap
   ↓
🗺️ Dynamic Route Suggestions
   ↓
🚨 Safety Alerts

The proposed solution includes AI-powered crowd heatmaps, automated safety alerts,
and dynamic crowd-management support.

🔎 AI Lost & Found

📷 Image / Face / Text
          ↓
      🤖 AI Matching
          ↓
   🔍 Potential Matches
          ↓
    👨‍💼 Admin Review
          ↓
        ✅ Match

🤖 Multilingual AI Assistant

The travel planner uses Gemini API + SERP API for smart route and trip
guidance, while the multilingual chatbot is powered by Gemini.

---

📈 Impact & Feasibility

🎯 Area| 🚀 Expected Impact
🎟️ Smart Access| Reduced queues, waiting time, ticket fraud, and entry congestion
👥 Crowd Safety| Real-time crowd monitoring and safety alerts
🗺️ Smart Mobility| Crowd-aware routes, VIP routing, travel planning, and parking
🚨 Pilgrim Safety| Family tracking, SOS, live location, safety scores, and emergency connectivity
🛕 Digital Pilgrimage| AI chatbot, Lost & Found, live darshan, notices, and multilingual assistance

The proposed impact areas are based on the project's stated impact and feasibility analysis.

---

🛣️ Future Scope

🟢 Phase 1 — Prototype → MVP

- Smart navigation
- QR-based ticketing
- Live notice boards
- Pilot deployment at selected ghats and temples

🟡 Phase 2 — AI Intelligence

- AI crowd detection
- Live heatmaps
- Face-based Lost & Found
- Multilingual chatbot
- Voice support

🔵 Phase 3 — City-Wide Integration

- Public transport integration
- Shuttle services
- Smart digital signage
- Intelligent junction control
- Centralized admin & emergency dashboard

🟣 Phase 4 — Scalability

- AI crowd forecasting
- Cloud-scale deployment
- Peak-footfall optimization
- Expansion to Kumbh and other large-scale gatherings

The four-phase roadmap is defined in the project's future-scope plan.

---

💡 Vision

<div align="center">🛕 One Platform. One Connected Pilgrimage.

Connect. Navigate. Protect. Experience.

</div>Divya Yatra aims to create a safer and more accessible pilgrimage experience by
connecting pilgrims, administrators, volunteers, AI systems, and emergency
services through a unified digital platform.

---

<details>
<summary>🔐 Security & Privacy</summary><br>The platform is designed with:

- 🔒 Encrypted data handling
- 🛡️ Role-based access control
- 🔐 Secure authentication
- 🚨 Fail-safe emergency mechanisms
- 🌐 Multilingual and inclusive interfaces
- 🧩 Modular architecture for future integrations

</details>---

<details>
<summary>🚫 Source Code Notice</summary><br>«The complete production implementation may be maintained separately depending
on deployment and project requirements.»

This repository is intended to provide:

- 📌 Project showcase
- 🏗️ Architecture overview
- ✨ Feature documentation
- 📸 UI previews
- 🤖 AI/technology overview

</details>---

👥 Team SarthiX

👤 Member| 🎯 Role
Harsh Manmode| Team Leader
Arun Bhadouriya| Team Member
Vivek Dahat| Team Member
Amit Manmode| Team Member

Team SarthiX is the project team behind Divya Yatra.

---

📞 Contact

Project Lead — Harsh Manmode

- 📧 Email: "harshmanmode79@gmail.com" (mailto:harshmanmode79@gmail.com)
- 💻 GitHub: "Harsh-2006-git" (https://github.com/Harsh-2006-git)

---

<div align="center">  <br />  <p>
    Made with ❤️ by <strong>Team SarthiX</strong>
  </p>  <p>
    🛕 <strong>Divya Yatra — Smart Pilgrimage Assistance System</strong>
  </p>  <p>
    © 2026 Team SarthiX. All Rights Reserved.
  </p></div>
