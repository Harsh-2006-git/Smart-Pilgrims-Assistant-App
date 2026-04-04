# Crowd Detection Service (AI Core)

This folder contains the standalone Python AI engine for Crowd Detection, density estimation, and full-body YOLOv8 inferences. It has been decoupled from the Node.js backend so it can be deployed independently to heavy-duty cloud servers, while your Node server runs on lightweight hosting.

## How to Deploy (Recommended platforms: Render or Railway)

Because this service uses OpenCV and Heavy Deep Learning models (YOLO), it must be deployed somewhere that supports standard Python environments.

### Option 1: Deploying to Render.com (Recommended & Free)
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. **Root Directory**: `Crowd_Detection_Service`
4. **Environment**: `Python 3`
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `python crowd_engine.py`

*(Render will automatically assign a `PORT`, which the script is now designed to pick up natively!)*

### Option 2: Deploying to Railway.app
1. Go to [Railway](https://railway.app/) and create a "New Project" > "Deploy from GitHub".
2. Go to Settings > Service > "**Root Directory**" and set it to `/Crowd_Detection_Service`.
3. Railway will automatically detect the `requirements.txt` and build the Python environment.
4. Set the Start Command to `python crowd_engine.py`.

---

## Connecting the AI back to your Website

Once Render or Railway finishes deploying your service, they will give you a public URL (for example: `https://crowd-detection-xyz.onrender.com`).

All you have to do is take that URL, open your Main Backend's `.env` file (`Backend/.env`), and update the variable:

```env
CROWD_SERVICE_URL=https://crowd-detection-xyz.onrender.com
```

Now, your entire Node/React application will automatically forward all AI requests (like starting the camera, getting zone flow, etc.) to your powerful new external server!
