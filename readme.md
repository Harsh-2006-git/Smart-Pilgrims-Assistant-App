<div align="center">  <h1>🛕 Divya Yatra</h1>  <p>
    <strong>AI-Powered Smart Pilgrimage Assistance System</strong>
  </p>  <p>
    <strong>Navigate Smart. Travel Safe. Experience Divinity.</strong>
  </p></div>🚀 Overview

<div style="max-width: 900px; margin: 20px auto; line-height: 1.6; font-size: 1.1rem; color: #333;">
  <p>
    <strong>Divya Yatra</strong> is an AI-powered digital platform designed to make
    large-scale pilgrimage experiences safer, smarter, and more accessible.
  </p>  <p>
    The platform brings together <strong>smart navigation</strong>,
    <strong>priority-based ticketing</strong>, <strong>AI-powered crowd monitoring</strong>,
    <strong>pilgrim safety</strong>, <strong>AI Lost & Found</strong>,
    <strong>live darshan</strong>, <strong>smart parking</strong>,
    <strong>travel planning</strong>, and a centralized <strong>admin dashboard</strong>
    into a single platform.
  </p>  <p>
    Designed with <strong>Simhastha 2028 in Ujjain</strong> in mind, Divya Yatra
    focuses on smart mobility, real-time information, emergency assistance,
    and a seamless digital pilgrimage experience.
  </p>
</div>---

<!-- Replace this URL with your actual GitHub project screenshot --><img width="1895" height="904" alt="Divya Yatra Dashboard" src="YOUR_PROJECT_SCREENSHOT_URL" />Harsh-2006-git/Smart-Pilgrims-Assistant-App

---

✨ Key Features

🌟 Feature| 📝 Description
🎟️ Priority-Based Ticketing| Tier-based booking, QR tickets, automated scheduling, and dynamic access control for special events such as Shahi Snan.
🗺️ Smart Navigation| Interactive maps for temples, ghats, parking zones, emergency exits, and alternate crowd-aware routes.
👥 AI Crowd Monitoring| CCTV-based crowd analysis, AI-powered density detection, heatmaps, and safety alerts.
🚨 Pilgrim Safety| Family tracking, live location sharing, SOS support, safety scores, and emergency connectivity.
🔎 AI Lost & Found| Face, image, and text-based matching with multilingual search and admin verification.
📢 Dynamic Notice Board| Real-time ritual timings, VIP movement updates, weather alerts, and emergency notifications.
🛕 Live Darshan| Live streaming of temple rituals and Shahi Snan with digital access for pilgrims unable to attend physically.
🚗 Smart Parking| Real-time nearby parking availability and temporary parking spaces listed by local residents.
🤖 AI Travel Planner| AI-powered route and trip planning using Gemini API and SERP API.
💬 Multilingual AI Chatbot| Gemini-powered chatbot for multilingual pilgrim assistance and information.
🚌 Transport Integration| Support for public transport and pilgrimage mobility planning.
🛡️ Admin Dashboard| Centralized management of routes, notices, emergencies, tickets, and Lost & Found.

---

🛠️ Dynamic Tech Stack

<div align="center" style="overflow: hidden;"><marquee behavior="scroll" direction="left" scrollamount="10">  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" hspace="10" />  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" hspace="10" />  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" hspace="10" />  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" hspace="10" />  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" hspace="10" />  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" hspace="10" />  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" hspace="10" />  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" hspace="10" />  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" hspace="10" />  <img src="https://img.shields.io/badge/SQL-4479A1?style=for-the-badge&logo=postgresql&logoColor=white" alt="SQL" hspace="10" />  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" hspace="10" />  <img src="https://img.shields.io/badge/YOLO-111111?style=for-the-badge&logo=yolo&logoColor=white" alt="YOLO" hspace="10" />  <img src="https://img.shields.io/badge/Git-E44C30?style=for-the-badge&logo=git&logoColor=white" alt="Git" hspace="10" />  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" hspace="10" /></marquee></div>---

📂 Project Structure

Smart-Pilgrims-Assistant-App/
│
├── 📂 backend/                  # Server-side application
│   ├── 📂 config/               # Database & service configuration
│   ├── 📂 controllers/          # Business logic
│   ├── 📂 middleware/           # Authentication & validation
│   ├── 📂 models/               # Database models
│   ├── 📂 routes/               # REST API endpoints
│   ├── 📂 services/             # AI & external API services
│   ├── 📂 sockets/              # Socket.IO handlers
│   ├── 📂 utils/                # Helper utilities
│   ├── 📄 app.js                # Express application
│   └── 📄 server.js             # Backend entry point
│
├── 📂 frontend/                 # React application
│   ├── 📂 public/               # Static assets
│   └── 📂 src/
│       ├── 📂 assets/           # Images & media
│       ├── 📂 components/       # Reusable UI components
│       ├── 📂 pages/            # Application pages
│       │   ├── 📂 admin/        # Admin dashboard
│       │   ├── 📂 pilgrim/      # Pilgrim services
│       │   ├── 📂 navigation/   # Maps & navigation
│       │   └── 📂 emergency/    # Emergency services
│       ├── 📂 context/          # Global application state
│       ├── 📂 hooks/            # Custom React hooks
│       ├── 📂 services/         # API services
│       ├── 📂 utils/            # Frontend utilities
│       ├── 📄 App.jsx           # Main application
│       └── 📄 main.jsx          # React entry point
│
├── 📂 ai/                       # AI-related modules
│   ├── 📂 crowd-detection/      # AI crowd analysis
│   ├── 📂 lost-found/           # AI Lost & Found
│   └── 📂 forecasting/          # Crowd forecasting
│
├── 📄 .env.example              # Environment variables template
├── 📄 .gitignore
├── 📄 package.json
└── 📄 README.md

---

📸 Gallery

<!-- Add your actual GitHub image URLs here --><table>
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

The platform is designed to use CCTV, AI-based crowd analysis, and live heatmaps
for real-time crowd monitoring and safety management.

---

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

The Lost & Found system supports face, image, and text matching with
multilingual search and administrator verification.

---

💬 Multilingual AI Assistant

             👤 User
                ↓
          💬 Chatbot
                ↓
          🤖 Gemini AI
                ↓
       ┌────────┴────────┐
       ↓                 ↓
   Trip Planning     Information
       ↓                 ↓
     SERP API        AI Response

The travel planner combines Gemini API and SERP API for smart route and
trip guidance, while the multilingual chatbot is powered by Gemini.

---

📊 Impact & Feasibility

🎯 Area| 🚀 Impact
🎟️ Smart Access| Reduces queues, waiting time, ticket fraud, and entry congestion.
👥 Crowd Safety| Enables real-time crowd monitoring through CCTV, AI analysis, and heatmaps.
🗺️ Smart Mobility| Dynamic routes, crowd-aware navigation, VIP routing, and smart parking improve movement.
🚨 Pilgrim Safety| Family tracking, live location, SOS, safety scores, and emergency connectivity support faster assistance.
🛕 Digital Pilgrimage| AI chatbot, Lost & Found, Live Darshan, dynamic notices, and multilingual assistance improve accessibility.

---

🛣️ Future Scope

Phase 1 — Prototype to MVP

- Smart navigation
- QR-based ticketing
- Live notice boards
- Pilot implementation at selected ghats and temples

Phase 2 — AI & Intelligence Layer

- AI-powered crowd detection
- Live heatmaps
- Face-based Lost & Found
- Multilingual chatbot
- Voice support

Phase 3 — City-Wide Integration

- Public transport integration
- Shuttle integration
- Smart digital signage
- Intelligent junction control
- Centralized admin and emergency dashboard

Phase 4 — Scalability & Expansion

- AI-based crowd forecasting
- Cloud-scale deployment
- Peak-footfall optimization
- Expansion to other mass gatherings such as Kumbh and major festivals

---

💡 Have an Idea?

Divya Yatra is designed as a modular platform that can evolve with new
pilgrimage services, AI capabilities, transportation integrations, and
real-time safety features.

Have an idea, feature request, or improvement?

Feel free to open an Issue or submit a Pull Request.

«Technology should make every pilgrimage safer, simpler, and more meaningful.»

---

<details>
<summary>🔐 Security & Privacy</summary><br>The platform is designed with:

- 🔒 Encrypted data handling
- 🛡️ Role-based access control
- 🔐 Secure authentication
- 🚨 Fail-safe mechanisms for emergency situations
- 🌐 Multilingual and inclusive interfaces
- 🧩 Modular architecture for future integrations

</details>---

<details>
<summary>👥 Team SarthiX</summary><br>👤 Member| 🎯 Role
Harsh Manmode| Team Leader
Arun Bhadouriya| Team Member
Vivek Dahat| Team Member
Amit Manmode| Team Member

</details>---

📞 Contact

Project Lead - Harsh Manmode

* 📧 Email: "harshmanmode79@gmail.com" (mailto:harshmanmode79@gmail.com)
* 💻 GitHub: "Harsh-2006-git" (https://github.com/Harsh-2006-git)

<div align="center">
  <br />  <p>
    Made with ❤️ by <strong>Team SarthiX</strong>
  </p>  <p>
    🛕 <strong>Divya Yatra — Smart Pilgrimage Assistance System</strong>
  </p>  <p>
    © 2026 Team SarthiX. All Rights Reserved.
  </p>
</div>
