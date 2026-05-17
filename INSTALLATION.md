# 🛠️ Installation & Setup Guide

Welcome to the **Smart Pilgrims Assistant App** setup guide! Follow these steps to get your local environment running.

## 📋 Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.9 or later (for AI_Core)
- **Git**

---

## 🏗️ 1. Database Setup: Aiven for MySQL
We use [Aiven](https://aiven.io/) for high-performance managed MySQL.

### Step 1: Create an Aiven Account
1. Go to [Aiven Console](https://console.aiven.io/) and sign up.
2. Click **Create Service**.
3. Select **MySQL** and choose the free or basic tier.
4. Select a cloud provider and region of your choice.
5. Click **Create Service**. It will take a few minutes to start.

### Step 2: Get Connection Details
Once your service says "Running":
1. Navigate to the **Overview** tab of your MySQL service.
2. Find the **Service URI** (looks like `mysql://user:password@host:port/defaultdb`).
3. Download the **CA Certificate** (required for SSL connection). Save it inside the `Backend/config/` folder or root folder as `ca.pem`.

### Step 3: Configure Environment Variables
Inside the `Backend/` directory, create a `.env` file based on your connection details:

```env
DB_MODE=cloud
DATABASE_URL="your_aiven_service_uri_here"
DB_SSL=true
DB_CA_CERT_PATH="config/ca.pem" # Path to your downloaded Aiven CA cert
PORT=5000
```

---

## ⚙️ 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
*(The backend should now run at `http://localhost:5000`)*

---

## 🎨 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Frontend `.env` variables if required (e.g., matching the backend API).
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🤖 4. AI Core Setup (Optional/Crowd Engine)
If you are contributing to the AI module (YOLO crowd detector, TTS):
1. Navigate to the `AI_Core` folder:
   ```bash
   cd AI_Core
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies (`requirements.txt` should be present or install these basics):
   ```bash
   pip install flask opencv-python ultralytics
   ```
4. Run the AI server:
   ```bash
   python crowd_engine.py
   ```

Need help? Reach out in standard issues or via our community channels!