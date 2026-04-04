from flask import Flask, jsonify, Response, request
import cv2
import numpy as np
import threading
import time
import os
import json
import uuid

# Use relative paths from Backend/AI_Core
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

import logging
from flask import cli
cli.show_server_banner = lambda *args: None
logging.getLogger('werkzeug').setLevel(logging.ERROR)

app = Flask(__name__)

# ── Load YOLO Model ────────────────────────────────────────────────────────────
YOLO_MODEL = None
YOLO_AVAILABLE = False

def load_yolo():
    global YOLO_MODEL, YOLO_AVAILABLE
    try:
        from ultralytics import YOLO
        model_path = os.path.join(BASE_DIR, 'yolov8s.pt')
        if os.path.exists(model_path):
            YOLO_MODEL = YOLO(model_path)
            YOLO_AVAILABLE = True
            print("✅ YOLOv8 Model loaded — Full Body Detection ACTIVE")
        else:
            # Auto-download if not found locally
            YOLO_MODEL = YOLO('yolov8s.pt')
            YOLO_AVAILABLE = True
            print("✅ YOLOv8 Model downloaded and loaded")
    except ImportError:
        print("⚠️ ultralytics not installed. Falling back to HOG body detector.")
        YOLO_AVAILABLE = False
    except Exception as e:
        print(f"⚠️ YOLO load error: {e}. Falling back to HOG.")
        YOLO_AVAILABLE = False

# ── Config ─────────────────────────────────────────────────────────────────────
def load_config():
    cfg_path = os.path.join(BASE_DIR, 'config.json')
    if os.path.exists(cfg_path):
        with open(cfg_path, 'r') as f:
            return json.load(f)
    return {
        "camera_settings": {"camera_index": 0, "width": 640, "height": 480},
        "zone_thresholds": {"low": 3, "medium": 6, "high": 10}
    }

config = load_config()

# ── HOG Fallback Setup ─────────────────────────────────────────────────────────
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

# ── Global State ────────────────────────────────────────────────────────────────
cap = None
current_zone_data = {"total": 0, "zones": [], "detection_mode": "initializing"}
latest_frame = None
is_running = False
camera_thread = None
lock = threading.Lock()

# ── Detection Helper ────────────────────────────────────────────────────────────
def detect_people(frame):
    """
    Detects full bodies using YOLOv8 (preferred) or HOG fallback.
    Returns (processed_frame, count, list_of_bounding_boxes)
    """
    boxes = []
    count = 0
    mode_label = "YOLO"

    if YOLO_AVAILABLE and YOLO_MODEL is not None:
        # YOLOv8 — detect class 0 = "person", full body detection
        results = YOLO_MODEL(frame, classes=[0], conf=0.35, verbose=False)
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                boxes.append((x1, y1, x2 - x1, y2 - y1, conf))
                count += 1
                # Draw stylish bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
                label = f"Person {conf:.0%}"
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(frame, (x1, y1 - 18), (x1 + label_size[0] + 6, y1), (0, 165, 255), -1)
                cv2.putText(frame, label, (x1 + 3, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    else:
        # HOG fallback — detects full body silhouette without needing face
        mode_label = "HOG"
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rects, weights = hog.detectMultiScale(
            gray, winStride=(8, 8), padding=(4, 4), scale=1.05,
            useMeanshiftGrouping=False
        )
        # Non-max suppression to remove duplicate boxes
        if len(rects) > 0:
            from imutils.object_detection import non_max_suppression
            rects_copy = np.array([[x, y, x + w, y + h] for (x, y, w, h) in rects])
            try:
                pick = non_max_suppression(rects_copy, probs=None, overlapThresh=0.65)
                for (xa, ya, xb, yb) in pick:
                    cv2.rectangle(frame, (xa, ya), (xb, yb), (0, 200, 100), 2)
                    boxes.append((xa, ya, xb - xa, yb - ya, 1.0))
                    count += 1
            except Exception:
                for (x, y, w, h) in rects:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 200, 100), 2)
                    boxes.append((x, y, w, h, 1.0))
                    count = len(rects)

    # ── Draw Zone Grid Lines ──────────────────────────────────────────────────
    h, w = frame.shape[:2]
    rows, cols = 3, 3
    cell_w = w // cols
    cell_h = h // rows

    # Compute per-zone count from bounding box centers
    zone_counts = [[0] * cols for _ in range(rows)]
    for (bx, by, bw, bh, _conf) in boxes:
        cx = bx + bw // 2
        cy = by + bh // 2
        col_idx = min(int(cx / w * cols), cols - 1)
        row_idx = min(int(cy / h * rows), rows - 1)
        zone_counts[row_idx][col_idx] += 1

    # Draw zone fill with density color per cell
    grid_overlay = frame.copy()
    for r in range(rows):
        for c in range(cols):
            z_count = zone_counts[r][c]
            x1_z = c * cell_w
            y1_z = r * cell_h
            x2_z = x1_z + cell_w
            y2_z = y1_z + cell_h
            if z_count == 0:
                fill = (30, 30, 30)
            elif z_count < 3:
                fill = (0, 160, 0)
            elif z_count < 6:
                fill = (0, 200, 200)
            elif z_count < 10:
                fill = (0, 100, 255)
            else:
                fill = (0, 0, 220)
            cv2.rectangle(grid_overlay, (x1_z, y1_z), (x2_z, y2_z), fill, -1)
    cv2.addWeighted(grid_overlay, 0.15, frame, 0.85, 0, frame)

    # Draw grid border lines
    for c in range(1, cols):
        cv2.line(frame, (c * cell_w, 0), (c * cell_w, h), (255, 255, 255), 1, cv2.LINE_AA)
    for r in range(1, rows):
        cv2.line(frame, (0, r * cell_h), (w, r * cell_h), (255, 255, 255), 1, cv2.LINE_AA)

    # Draw zone ID + count inside each cell
    for r in range(rows):
        for c in range(cols):
            z_count = zone_counts[r][c]
            z_id = r * cols + c + 1
            x1_z = c * cell_w
            y1_z = r * cell_h
            cv2.putText(frame, f"Z{z_id}", (x1_z + 6, y1_z + 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            count_lbl = str(z_count)
            ts, _ = cv2.getTextSize(count_lbl, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)
            cx_lbl = x1_z + (cell_w - ts[0]) // 2
            cy_lbl = y1_z + (cell_h + ts[1]) // 2
            cv2.putText(frame, count_lbl, (cx_lbl, cy_lbl),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 230, 255), 2, cv2.LINE_AA)

    # ── HUD bar at top ────────────────────────────────────────────────────────
    density_label = "LOW" if count < 3 else "MEDIUM" if count < 7 else "HIGH" if count < 12 else "CRITICAL"
    density_color = (0, 200, 0) if count < 3 else (0, 200, 200) if count < 7 else (0, 120, 255) if count < 12 else (0, 0, 255)
    hud = frame.copy()
    cv2.rectangle(hud, (0, 0), (w, 42), (20, 20, 20), -1)
    cv2.addWeighted(hud, 0.65, frame, 0.35, 0, frame)
    cv2.putText(frame, f"People: {count}  |  Density: {density_label}  |  Engine: {mode_label}",
                (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, density_color, 2)

    return frame, count, boxes

# ── Camera Worker Thread ────────────────────────────────────────────────────────
def camera_worker():
    global cap, latest_frame, current_zone_data, is_running
    print("🎥 Camera Worker Started (Full Body Detection Mode)")

    while is_running:
        if cap is None or not cap.isOpened():
            time.sleep(0.5)
            continue

        success, frame = cap.read()
        if not success or frame is None:
            time.sleep(0.01)
            continue

        small_frame = cv2.resize(frame, (640, 480))

        try:
            processed, count, boxes = detect_people(small_frame)

            with lock:
                current_zone_data["total"] = count
                current_zone_data["detection_mode"] = "YOLOv8 Full Body" if YOLO_AVAILABLE else "HOG Body"

                # Build zone data from actual bounding box positions
                rows, cols = 3, 3
                frame_h, frame_w = processed.shape[:2]
                zone_counts = [[0] * cols for _ in range(rows)]

                for (x, y, w, h, _conf) in boxes:
                    center_x = x + w // 2
                    center_y = y + h // 2
                    col_idx = min(int(center_x / frame_w * cols), cols - 1)
                    row_idx = min(int(center_y / frame_h * rows), rows - 1)
                    zone_counts[row_idx][col_idx] += 1

                new_zones = []
                for r in range(rows):
                    for c in range(cols):
                        z_count = zone_counts[r][c]
                        level = "Low" if z_count < 2 else "Medium" if z_count < 5 else "High"
                        new_zones.append({
                            "id": f"Z{r * cols + c + 1}",
                            "count": z_count,
                            "level": level,
                            "row": r,
                            "col": c
                        })

                current_zone_data["zones"] = new_zones

                _, buffer = cv2.imencode('.jpg', processed, [cv2.IMWRITE_JPEG_QUALITY, 85])
                latest_frame = buffer.tobytes()

        except Exception as e:
            print(f"AI Worker Error: {e}")

        time.sleep(0.033)  # ~30 FPS


# ── Frame Generator ─────────────────────────────────────────────────────────────
def generate_frames():
    global latest_frame, is_running
    while is_running:
        if latest_frame is None:
            time.sleep(0.05)
            continue
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + latest_frame + b'\r\n')
        time.sleep(0.033)


# ── API Routes ──────────────────────────────────────────────────────────────────
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def get_status():
    return jsonify({
        "camera_active": is_running,
        "total": current_zone_data["total"],
        "detection_mode": current_zone_data.get("detection_mode", "initializing"),
        "status": "online"
    })

@app.route('/api/start')
def start_camera():
    global cap, is_running, camera_thread
    if not is_running:
        print("🚀 AI CORE: Manual activation signal received.")
        for idx in range(5):
            try:
                print(f"📡 Probing Camera Index {idx}...")
                test_cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                if test_cap.isOpened():
                    ret, frame = test_cap.read()
                    if ret and frame is not None:
                        print(f"✅ FOUND: Camera sensor verified at index {idx}")
                        cap = test_cap
                        is_running = True
                        camera_thread = threading.Thread(target=camera_worker, daemon=True)
                        camera_thread.start()
                        return jsonify({"status": "started", "index": idx,
                                        "engine": "YOLOv8 Full Body" if YOLO_AVAILABLE else "HOG Body"})
                    test_cap.release()
            except Exception as e:
                print(f"⚠️ Error probing index {idx}: {e}")

        return jsonify({"status": "error", "message": "No functional camera sensor detected."}), 500
    return jsonify({"status": "already_running"})

@app.route('/api/stop')
def stop_camera():
    global cap, is_running
    is_running = False
    if cap:
        cap.release()
    return jsonify({"status": "stopped"})

@app.route('/api/zones')
def get_zones():
    return jsonify(current_zone_data)

# ── Video Upload ────────────────────────────────────────────────────────────────
upload_sessions = {}

@app.route('/api/upload-video', methods=['POST'])
def api_upload_video():
    file = request.files.get('video')
    if not file:
        return jsonify({"error": "No file"}), 400
    token = uuid.uuid4().hex
    save_path = os.path.join(UPLOADS_DIR, f"{token}_{file.filename}")
    file.save(save_path)
    upload_sessions[token] = {"path": save_path, "total": 0, "zones": []}
    return jsonify({"status": "success", "session_token": token})

@app.route('/uploaded_feed/<token>')
def uploaded_feed(token):
    def process_upload(t):
        sess = upload_sessions.get(t)
        if not sess:
            return
        vcap = cv2.VideoCapture(sess['path'])
        while vcap.isOpened():
            ret, frame = vcap.read()
            if not ret:
                break
            frame = cv2.resize(frame, (640, 480))
            processed, count, _ = detect_people(frame)
            sess['total'] = count
            _, buf = cv2.imencode('.jpg', processed, [cv2.IMWRITE_JPEG_QUALITY, 85])
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n')
            time.sleep(0.033)
        vcap.release()

    return Response(process_upload(token), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/upload_zones/<token>')
def get_upload_zones(token):
    sess = upload_sessions.get(token)
    return jsonify({"total": sess['total'], "zones": []}) if sess else jsonify({"total": 0})

if __name__ == '__main__':
    load_yolo()
    app.run(host='127.0.0.1', port=5773, threaded=True)
