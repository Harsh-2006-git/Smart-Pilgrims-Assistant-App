# Smart Pilgrims Assistant App

Smart Pilgrims Assistant App, branded in the UI as **Divya Yatra**, is a full-stack pilgrimage management platform built for high-footfall temple journeys such as **Mahakaleshwar, Ujjain**. It combines pilgrim onboarding, darshan booking, parking, family safety, SOS escalation, crowd monitoring, live tracking, and AI trip planning in one system.

The repository is split into a React + Vite frontend and an Express + Sequelize backend, with an additional Python AI service for crowd detection.

## Highlights

- Secure pilgrim registration and login with JWT-based auth
- Google sign-in support through Google OAuth and Firebase
- Darshan ticket booking with generated QR codes
- Parking listing, booking history, and QR-based entry passes
- Family member management, guardian approval, and live location sharing
- Real-time SOS alerts via Socket.IO and email notifications
- Lost and found posting with image uploads through Cloudinary
- Nearby services lookup using Geoapify
- AI-powered yatra planner, chat assistant, and text-to-speech using Gemini
- Crowd monitoring with a Python/OpenCV service using YOLOv8 with HOG fallback
- Admin dashboard for alerts, SOS management, crowd stats, and platform monitoring

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Leaflet, Socket.IO Client |
| Backend | Node.js, Express 5, Sequelize, MySQL, Socket.IO |
| AI and Maps | Gemini, Genkit, SerpAPI, Geoapify, OpenCV, YOLOv8 |
| Auth and Media | JWT, Google OAuth, Firebase, Cloudinary |
| Notifications | Nodemailer / SMTP |
| Deployment | Vercel configs for frontend and backend |

## Repository Structure

```text
.
|-- Backend
|   |-- AI_Core              # Python crowd detection service
|   |-- config               # DB and Cloudinary configuration
|   |-- controllers          # Business logic
|   |-- middlewares          # Auth, upload, error handling
|   |-- models               # Sequelize models
|   |-- routes               # API routes
|   |-- socket               # Socket.IO event handling
|   `-- index.js             # Express entry point
|-- Frontend
|   |-- public
|   |-- src
|   |   |-- components
|   |   |-- config
|   |   |-- context
|   |   `-- pages
|   `-- vite.config.js
`-- readme.md
```

## Core Modules

### Frontend routes

- `/auth` for login and registration
- `/ticket` for darshan ticket booking
- `/parking` for parking marketplace, host flow, and booking history
- `/family-mode`, `/guardian-panel`, and `/tracking` for live family safety workflows
- `/crowd-detection` and `/density` for crowd visibility features
- `/chatbot` and `/ai-assistant` for AI-assisted yatra planning
- `/live-darshan`, `/map`, and `/nearby` for pilgrim guidance and discovery
- `/admin` for operational controls and emergency monitoring

### Backend API groups

- `/api/v1/auth` for registration, login, profile, and user search
- `/api/v1/ticket` for ticket creation and retrieval
- `/api/v1/parking` for parking listings and host management
- `/api/v1/booking` for parking booking and payment verification flow
- `/api/v1/family` for family member CRUD
- `/api/v1/location` for guardian requests, approvals, and history
- `/api/v1/admin` for dashboard stats, alerts, and SOS handling
- `/api/v1/lost` for lost and found uploads
- `/api/v1/nearby` for nearby place search
- `/api/v1/chatbot` for chat, itinerary generation, and TTS
- `/api/v1/crowd` for the proxied Python crowd AI service
- `/api/v1/zone` for zone-related crowd data

## Prerequisites

Before running locally, make sure you have:

- Node.js 18+ and npm
- MySQL 8+ or a compatible cloud MySQL instance
- Python 3.10+ if you want the crowd detection features
- A Cloudinary account for image uploads
- Google OAuth credentials
- Gemini API key
- Optional keys for SerpAPI, Geoapify, and SMTP mail delivery

## Environment Variables

### Backend

Create `Backend/.env`. The backend also falls back to a root `.env`, but keeping backend secrets in `Backend/.env` is the clearest setup.

```env
PORT=3001
NODE_ENV=development

JWT_SECRET=replace_with_a_secure_secret
ADMIN_SECRET=replace_with_a_secure_admin_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Local MySQL
DB_MODE=local
DB_NAME_LOCAL=smart_pilgrims
DB_USER_LOCAL=root
DB_PASSWORD_LOCAL=your_mysql_password
DB_HOST_LOCAL=127.0.0.1
DB_PORT_LOCAL=3306

# Optional cloud DB alternative
# DATABASE_URL=mysql://user:password@host:3306/db_name
# DB_MODE=cloud
# DB_SSL=false
# DB_CA_CERT_PATH=Backend/ca.pem

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Gemini / AI
GEMINI_API_KEY=your_primary_gemini_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_key
SERP_API_KEY=your_serpapi_key
GEOAPIFY_API_KEY=your_geoapify_key

# Email / SOS
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email_user
SMTP_PASS=your_email_password
ADMIN_EMAIL=ops@example.com
TO_EMAIL=optional_demo_receiver@example.com
```

### Frontend

Create `Frontend/.env`.

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Note: the Firebase web config is currently committed in [`Frontend/src/config/firebase.js`](Frontend/src/config/firebase.js). If you want fully environment-driven frontend secrets, move those values into Vite env variables as a follow-up improvement.

## Installation

Install dependencies separately for the backend and frontend:

```bash
cd Backend
npm install
```

```bash
cd Frontend
npm install
```

## Running the App Locally

### 1. Start MySQL

Create the database referenced by your backend env file. The app uses Sequelize and calls `sequelize.sync()` on startup, so tables are created automatically once the connection succeeds.

### 2. Start the backend

```bash
cd Backend
npm run dev
```

By default the backend runs on `http://localhost:3001`.

Useful backend scripts:

- `npm run dev` starts the API with Nodemon
- `npm start` starts the API with Node
- `npm run seed` seeds zone data

### 3. Start the frontend

```bash
cd Frontend
npm run dev
```

By default the frontend runs on `http://localhost:5173`.

### 4. Crowd AI service

When the backend starts locally, it attempts to spawn `Backend/AI_Core/crowd_engine.py` automatically. The Node proxy expects the Python service at `http://127.0.0.1:5773`.

If you want to run the crowd service manually, install the Python packages used by `crowd_engine.py` and then start it yourself:

```bash
pip install flask opencv-python numpy ultralytics imutils
```

```bash
cd Backend/AI_Core
py crowd_engine.py
```

The repository already includes `yolov8s.pt`. If `ultralytics` is unavailable, the service falls back to HOG-based body detection.

## Real-Time Features

Socket.IO is used for:

- live guardian location streaming
- SOS broadcasts to guardians and admins
- tracking session start and stop notifications

Frontend socket state lives in [`Frontend/src/context/SocketContext.jsx`](Frontend/src/context/SocketContext.jsx), and backend event handling lives in [`Backend/socket/socketHandler.js`](Backend/socket/socketHandler.js).

## Payments

The parking booking flow currently uses a **simulated payment verification process** in [`Backend/controllers/bookingController.js`](Backend/controllers/bookingController.js). The Razorpay package exists in dependencies, but the active controller logic does not yet perform a live Razorpay checkout.

## Deployment Notes

- `Frontend/vercel.json` rewrites all routes to `index.html` for SPA routing.
- `Backend/vercel.json` exposes `Backend/index.js` as a Vercel serverless entry.
- The bundled Python crowd AI does **not** run inside Vercel serverless mode. In production, deploy the Python service separately and update the crowd proxy target if needed.

## Known Implementation Notes

- `Frontend` uses `Frontend/.env` for Vite variables.
- `Backend` can read either `Backend/.env` or the repository root `.env`.
- The crowd service proxy target is `127.0.0.1:5773`, even though `Backend/AI_Core/config.json` contains a different port value in its server settings.
- CORS in the backend already includes local development origins and a few deployed domains.

## Linting

Both apps include lint scripts:

```bash
cd Backend
npm run lint
```

```bash
cd Frontend
npm run lint
```

## Future Improvements

- move Firebase config to frontend environment variables
- add `.env.example` files for both apps
- add automated tests for API and socket flows
- wire the parking payment flow to live Razorpay checkout
- document the Python AI dependencies in a dedicated `requirements.txt`

## License

No license file is currently included in this repository. Add one if you plan to distribute or open-source the project.
