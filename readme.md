�

�
🛕 Divya Yatra

�
AI-Powered Smart Pilgrimage Assistance System 

�
Making pilgrimage safer, smarter, and more accessible. 

�

🚀 Overview
�

�
Divya Yatra is an AI-powered digital platform designed to improve the pilgrimage experience during large-scale gatherings such as Simhastha 2028 in Ujjain. 

�
The platform brings together priority-based ticketing, smart navigation, AI-powered crowd monitoring, pilgrim safety, AI Lost & Found, live darshan, smart parking, travel planning, and a centralized administration dashboard. 

�
Built using the MERN ecosystem with real-time communication, AI services, mapping technologies, and external APIs, Divya Yatra aims to create a connected digital ecosystem for pilgrims, volunteers, and administrators. 

�

🎯 Problem Statement
Large-scale pilgrimage gatherings bring together lakhs of people across multiple locations, creating major challenges related to:
👥 Crowd management
🗺️ Navigation and mobility
🚨 Emergency and pilgrim safety
🎟️ Priority access
👨‍👩‍👧 Family tracking
🔎 Lost & Found assistance
🚗 Parking and transportation
📢 Real-time information
🛕 Digital pilgrimage services
Divya Yatra addresses these challenges through a unified digital platform focused on smart mobility, safety, accessibility, and real-time services.
🖼️ Project Preview
�

�
￼ 

�
Repository: Harsh-2006-git/Smart-Pilgrims-Assistant-App 

✨ Key Features
�
🌟 Feature📝 Description🎟️ Priority-Based TicketingTier-based booking, QR tickets, automated scheduling, and dynamic access control for special events such as Shahi Snan.🗺️ Smart NavigationInteractive maps for temples, ghats, parking zones, emergency exits, and alternate crowd-aware routes.👥 AI Crowd MonitoringCCTV-based crowd analysis, AI-powered density detection, heatmaps, and safety alerts.🚨 Pilgrim SafetyFamily tracking, live location sharing, SOS support, safety scores, and emergency connectivity.🔎 AI Lost & FoundFace, image, and text-based matching with multilingual search and admin verification.📢 Dynamic Notice BoardReal-time ritual timings, VIP movement updates, weather alerts, and emergency notifications.🛕 Live DarshanLive streaming of temple rituals and Shahi Snan with digital access for remote pilgrims.🚗 Smart ParkingReal-time parking availability and temporary parking spaces listed by local residents.🤖 AI Travel PlannerAI-powered route and trip planning using Gemini API and SERP API.💬 Multilingual ChatbotGemini-powered chatbot for seamless multilingual pilgrim assistance.🚌 Transport IntegrationSupport for public transport and pilgrimage mobility planning.🛡️ Admin DashboardCentralized management of routes, notices, emergencies, tickets, and Lost & Found.
🛠️ Dynamic Tech Stack
�

�
￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼ ￼
�

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
       │ SQL DB    │  │  AI Layer  │  │  External   │
       │           │  │            │  │  Services   │
       │ Users     │  │ Gemini     │  │ Firebase    │
       │ Tickets   │  │ OpenCV     │  │ SERP API    │
       │ Events    │  │ YOLO       │  │ Leaflet     │
       │ Routes    │  │ Crowd AI   │  │ CCTV        │
       └───────────┘  └────────────┘  └─────────────┘
The proposed application uses React.js with Leaflet Maps and Socket.IO, while Node.js + Express handles REST APIs and real-time WebSocket communication. Firebase Authentication provides Google Sign-In.
📂 Project Structure
Smart-Pilgrims-Assistant-App/
│
├── 📂 backend/                         # Server-side application
│   │
│   ├── 📂 config/                      # Database & service configuration
│   │
│   ├── 📂 controllers/                 # Business logic
│   │   ├── 📄 authController.js
│   │   ├── 📄 ticketController.js
│   │   ├── 📄 crowdController.js
│   │   ├── 📄 emergencyController.js
│   │   └── 📄 lostFoundController.js
│   │
│   ├── 📂 middleware/                  # Authentication & validation
│   │
│   ├── 📂 models/                      # Database models
│   │
│   ├── 📂 routes/                      # REST API routes
│   │
│   ├── 📂 services/                    # AI & external services
│   │
│   ├── 📂 sockets/                     # Socket.IO handlers
│   │
│   ├── 📂 utils/                       # Helper utilities
│   │
│   ├── 📄 app.js                       # Express application
│   └── 📄 server.js                    # Backend entry point
│
├── 📂 frontend/                        # React application
│   │
│   ├── 📂 public/                      # Static assets
│   │
│   └── 📂 src/
│       │
│       ├── 📂 assets/                  # Images & media
│       │
│       ├── 📂 components/              # Reusable components
│       │
│       ├── 📂 pages/                   # Application pages
│       │   ├── 📂 admin/               # Admin dashboard
│       │   ├── 📂 pilgrim/             # Pilgrim services
│       │   ├── 📂 navigation/          # Maps & routes
│       │   └── 📂 emergency/           # Safety services
│       │
│       ├── 📂 context/                 # Global state
│       │
│       ├── 📂 hooks/                   # Custom React hooks
│       │
│       ├── 📂 services/                # API services
│       │
│       ├── 📂 utils/                   # Frontend utilities
│       │
│       ├── 📄 App.jsx                  # Main application
│       └── 📄 main.jsx                 # React entry point
│
├── 📂 ai/                              # AI-related modules
│   ├── 📂 crowd-detection/
│   ├── 📂 lost-found/
│   └── 📂 forecasting/
│
├── 📄 .env.example                     # Environment variables template
├── 📄 .gitignore
├── 📄 package.json
└── 📄 README.md
📸 Gallery
�

�
￼ ￼ 
�
￼ ￼ 
�
￼ ￼ 
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
The proposed solution includes AI-powered crowd heatmaps, automated safety alerts, and dynamic crowd-management support.
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
The Lost & Found system supports image, face, and text-based matching with multilingual search and administrator verification.
🤖 Multilingual AI Assistant
The travel planner uses Gemini API + SERP API for smart route and trip guidance, while the multilingual chatbot is powered by Gemini.
📈 Impact & Feasibility
�
🎯 Area🚀 Expected Impact🎟️ Smart AccessReduced queues, waiting time, ticket fraud, and entry congestion.👥 Crowd SafetyReal-time crowd monitoring and safety alerts.🗺️ Smart MobilityCrowd-aware routes, VIP routing, travel planning, and parking.🚨 Pilgrim SafetyFamily tracking, SOS, live location, safety scores, and emergency connectivity.🛕 Digital PilgrimageAI chatbot, Lost & Found, live darshan, notices, and multilingual assistance.
🛣️ Future Scope
🟢 Phase 1 — Prototype → MVP
Smart navigation
QR-based ticketing
Live notice boards
Pilot deployment at selected ghats and temples
🟡 Phase 2 — AI Intelligence
AI crowd detection
Live heatmaps
Face-based Lost & Found
Multilingual chatbot
Voice support
🔵 Phase 3 — City-Wide Integration
Public transport integration
Shuttle services
Smart digital signage
Intelligent junction control
Centralized admin & emergency dashboard
🟣 Phase 4 — Scalability
AI crowd forecasting
Cloud-scale deployment
Peak-footfall optimization
Expansion to Kumbh and other large-scale gatherings
💡 Vision
�

�
🛕 One Platform. One Connected Pilgrimage.

�
Connect. Navigate. Protect. Experience. 

�

Divya Yatra aims to create a safer and more accessible pilgrimage experience by connecting pilgrims, administrators, volunteers, AI systems, and emergency services through a unified digital platform.
�
🔐 Security & Privacy
�


The platform is designed with:
🔒 Encrypted data handling
🛡️ Role-based access control
🔐 Secure authentication
🚨 Fail-safe emergency mechanisms
🌐 Multilingual and inclusive interfaces
🧩 Modular architecture for future integrations
�

�
🚫 Source Code Notice
�


The complete production implementation may be maintained separately depending on deployment and project requirements.
This repository is intended to provide:
📌 Project showcase
🏗️ Architecture overview
✨ Feature documentation
📸 UI previews
🤖 AI/technology overview
�

👥 Team SarthiX
�
👤 Member🎯 RoleHarsh ManmodeTeam LeaderArun BhadouriyaTeam MemberVivek DahatTeam MemberAmit ManmodeTeam Member
Team SarthiX is the project team behind Divya Yatra.
📞 Contact
Project Lead — Harsh Manmode
📧 Email: harshmanmode79@gmail.com
💻 GitHub: Harsh-2006-git
�

�


�
Made with ❤️ by Team SarthiX 

�
🛕 Divya Yatra — Smart Pilgrimage Assistance System 

�
© 2026 Team SarthiX. All Rights Reserved. 

�
