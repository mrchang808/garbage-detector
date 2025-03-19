# app.py
import os
from dotenv import load_dotenv
load_dotenv()  # Loads variables from .env

import torch
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from ultralytics import YOLO
from datetime import datetime
from sqlalchemy import and_

app = Flask(__name__)
CORS(app)

# Configure SQLAlchemy to use PostgreSQL from the environment
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'  # Ensure this folder exists!
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import db from the extensions module
from extensions import db
db.init_app(app)  # Register your app with SQLAlchemy
migrate = Migrate(app, db)

# Import the Detection model after initializing db
from models import Detection, UAVStatus, Notification, Report

# Load your trained YOLO model and set custom class names
model = YOLO("Rubbish/runs/detect/train/weights/best.pt")
custom_names = {
    0: 'plastic',
    1: 'paper',
    2: 'metal',
    3: 'glass',
    4: 'bottle',
    5: 'float',
    6: 'plastic',
    7: 'rope',
    8: 'container',
    9: 'foam',
    10: 'foam'
}
model.model.names = custom_names

if torch.cuda.is_available():
    model.to('cuda')
    print("Using GPU for inference")
else:
    print("Using CPU for inference")

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    import time
    filename = secure_filename(f"{int(time.time())}_{file.filename}")
    if '..' in filename or filename.startswith('/'):
        return jsonify({"error": "Invalid filename"}), 400
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Read and decode the image
    file_bytes = file.read()
    npimg = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    
    if img is None:
        return jsonify({"error": "Image could not be decoded"}), 400

    file.seek(0)
    file.save(filepath)

    results = model(img)
    detections_data = []
    notifications_to_create = []

    # Process each detection
    for det in results[0].boxes:
        xyxy = det.xyxy.cpu().numpy().squeeze().tolist()
        conf = float(det.conf.item())
        cls_id = int(det.cls.item())
        class_name = model.model.names.get(cls_id, f"cls_{cls_id}")

        if conf < 0.7:
            continue

        session_id = request.form.get('sessionId', 'default')
        detection = Detection(
            class_name=class_name,
            confidence=round(conf, 2),
            x_min=round(xyxy[0], 2),
            y_min=round(xyxy[1], 2),
            x_max=round(xyxy[2], 2),
            y_max=round(xyxy[3], 2),
            image_path=filename,
            session_id=session_id
        )
        db.session.add(detection)

        # Add a notification for any detected object
        notifications_to_create.append(Notification(
            message=f"Object detected: {class_name}",
            severity="info"
        ))

        detections_data.append({
            "className": class_name,
            "confidence": round(conf, 2),
            "boundingBox": {
                "xmin": round(xyxy[0], 2),
                "ymin": round(xyxy[1], 2),
                "xmax": round(xyxy[2], 2),
                "ymax": round(xyxy[3], 2)
            },
            "image_path": filename
        })

    # Add all notifications (if any) to the session
    for note in notifications_to_create:
        db.session.add(note)
    db.session.commit()  # Commit all at once

    return jsonify({
        "numDetections": len(detections_data),
        "detections": detections_data
    })

def generate_frames():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open video device.")
        return

    class_colors = {
        "glass": (0, 255, 255),
        "metal": (255, 0, 0),
        "trash": (0, 128, 128),
        "bottle": (128, 128, 0),
        "bottle": (0, 0, 255),
        "float": (180, 105, 255),
        "plastic": (255, 255, 0),
        "rope": (192, 192, 192),
        "container": (0, 255, 0),
        "foam": (255, 0, 255)
    }
    
    frame_count = 0
    last_detections = None  # Cache detections

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            frame_count += 1

            # Run detection every 5th frame
            if frame_count % 10 == 0:
                results = model(frame, verbose=False)
                last_detections = results[0].boxes  # cache detections

            if last_detections is not None:
                for det in last_detections:
                    xyxy = det.xyxy.cpu().numpy().squeeze()
                    conf = det.conf.item()
                    cls_id = int(det.cls.item())
                    class_name = model.model.names.get(cls_id, f"cls_{cls_id}")
                    if conf >= 0.7:
                        xmin, ymin, xmax, ymax = map(int, xyxy)
                        color = class_colors.get(class_name.lower(), (0, 255, 0))
                        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                        cv2.putText(frame, f"{class_name}: {conf:.2f}",
                                    (xmin, ymin - 5), cv2.FONT_HERSHEY_SIMPLEX,
                                    0.5, color, 2)

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            data = (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            try:
                yield data
            except Exception as e:
                print("Error yielding frame:", e)
                break
    finally:
        cap.release()

def generate_frames_camera(index=0):
    cap = cv2.VideoCapture(index)
    if not cap.isOpened():
        print(f"Error: Could not open video device at index {index}.")
        return

    # Define colors for each class
    class_colors = {
        "glass": (0, 255, 255),
        "metal": (255, 0, 0),
        "trash": (0, 128, 128),
        "bottle": (128, 128, 0),
        "bottle": (0, 0, 255),
        "float": (180, 105, 255),
        "plastic": (255, 255, 0),
        "rope": (192, 192, 192),
        "container": (0, 255, 0),
        "foam": (255, 0, 255)
    }

    while True:
        success, frame = cap.read()
        if not success:
            break

        # Run YOLO detection on the frame
        results = model(frame, verbose=False)
        detections = results[0].boxes

        for det in detections:
            # Get detection data
            xyxy = det.xyxy.cpu().numpy().squeeze()
            conf = det.conf.item()
            cls_id = int(det.cls.item())
            class_name = model.model.names.get(cls_id, f"cls_{cls_id}")

            if conf >= 0.7:
                xmin, ymin, xmax, ymax = map(int, xyxy)
                color = class_colors.get(class_name.lower(), (0, 255, 0))
                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                cv2.putText(frame, f"{class_name}: {conf:.2f}",
                            (xmin, ymin - 5), cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, color, 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        data = (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        try:
            yield data
        except Exception as e:
            print("Error yielding frame:", e)
            break

    cap.release()

@app.route('/detections', methods=['GET'])
def get_detections():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 25, type=int), 100)

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Detection.query

    if start_date:
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(Detection.timestamp >= start_date)

    if end_date:
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
        query = query.filter(Detection.timestamp <= end_date)

    paginated = query.order_by(Detection.timestamp.desc()).paginate(
        page=page, 
        per_page=per_page,
        error_out=False
    )

    # Format data to match frontend expectations
    results = [
        {
            "id": det.id,
            "className": det.class_name,
            "confidence": det.confidence,
            "boundingBox": {
                "xmin": det.x_min,
                "ymin": det.y_min,
                "xmax": det.x_max,
                "ymax": det.y_max
            },
            "image_path": det.image_path,
            "timestamp": det.timestamp.isoformat()
        } for det in paginated.items
    ]

    # Return just the array, not a wrapped object
    return jsonify(results)

@app.route('/detections/<int:detection_id>', methods=['DELETE'])
def delete_detection(detection_id):
    detection = Detection.query.get(detection_id)
    if not detection:
        return jsonify({"error": "Detection not found"}), 404

    # Check if other detections exist for this image
    image_path = detection.image_path
    other_detections = Detection.query.filter(
        Detection.image_path == image_path,
        Detection.id != detection_id
    ).count()

    # Only delete image file if no other detections remain
    if other_detections == 0:
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], image_path)
        if os.path.exists(full_path):
            os.remove(full_path)

    db.session.delete(detection)
    db.session.commit()
    
    return jsonify({"message": "Detection deleted successfully", "id": detection_id}), 200

# Fix delete_all_detections route
@app.route('/detections', methods=['DELETE'])
def delete_all_detections():
    try:
        # Get unique image paths first
        unique_images = db.session.query(Detection.image_path).distinct().all()
        unique_images = [img[0] for img in unique_images if img[0]]

        # Delete all detections
        num_deleted = Detection.query.delete()
        db.session.commit()

        # Delete all unique images
        for img in unique_images:
            full_path = os.path.join(app.config['UPLOAD_FOLDER'], img)
            if os.path.exists(full_path):
                os.remove(full_path)

        return jsonify({"message": f"Deleted {num_deleted} detections and images"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete detections"}), 500
import random

@app.route('/uavstatus', methods=['GET'])
def get_uav_status():
    latest_status = {
        "id": random.randint(1, 999),
        "battery": round(random.uniform(10,100),1),
        "latitude": 43.2565 + random.uniform(-0.001, 0.001),
        "longitude": 76.9285 + random.uniform(-0.001, 0.001),
        "speed": round(random.uniform(1,10),2),
        "altitude": round(random.uniform(50,150),2),
        "timestamp": datetime.utcnow().isoformat()
    }
    return jsonify(latest_status)


@app.route('/uavstatus', methods=['POST'])
def create_uav_status():
    data = request.json

    # Validate the data from the frontend or wherever it comes from
    new_status = UAVStatus(
        battery=data.get("battery", 100),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        speed=data.get("speed"),
        altitude=data.get("altitude"),
    )
    db.session.add(new_status)
    db.session.commit()

    return jsonify({"message": "UAV status created successfully"}), 201

@app.route('/notifications', methods=['GET'])
def get_notifications():
    # Return all notifications or only those unseen, etc.
    notifications = Notification.query.order_by(Notification.timestamp.desc()).all()
    data = []
    for note in notifications:
        data.append({
            "id": note.id,
            "message": note.message,
            "severity": note.severity,
            "timestamp": note.timestamp.isoformat(),
            "seen": note.seen,
        })
    return jsonify(data)

@app.route('/notifications', methods=['POST'])
def create_notification():
    data = request.json
    new_note = Notification(
        message=data['message'],
        severity=data.get('severity', 'info'),
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify({"message": "Notification created"}), 201

@app.route('/notifications/<int:note_id>', methods=['PATCH'])
def update_notification(note_id):
    note = Notification.query.get_or_404(note_id)
    data = request.json
    if 'seen' in data:
        note.seen = data['seen']
    db.session.commit()
    return jsonify({"message": "Notification updated"})

@app.route('/reports', methods=['GET'])
def get_reports():
    session_id = request.args.get('session_id')
    # optionally filter by session, date range, etc.
    
    query = Report.query
    if session_id:
        query = query.filter_by(session_id=session_id)

    reports = query.order_by(Report.generated_at.desc()).all()
    data = []
    for rep in reports:
        data.append({
            "id": rep.id,
            "session_id": rep.session_id,
            "total_detections": rep.total_detections,
            "detected_objects": rep.detected_objects,  # stored as JSON in DB
            "generated_at": rep.generated_at.isoformat(),
        })
    return jsonify(data)

@app.route('/reports', methods=['POST'])
def generate_report():
    data = request.json
    session_id = data.get('session_id', '').strip()  # Get session_id or empty string
    
    # If session_id is provided, filter by it; otherwise use all detections
    if session_id:
        detections = Detection.query.filter_by(session_id=session_id).all()
    else:
        detections = Detection.query.all()

    total = len(detections)
    
    # Tally object classes
    class_counts = {}
    for d in detections:
        class_counts[d.class_name] = class_counts.get(d.class_name, 0) + 1

    # If no session was provided, you can store a default value (e.g., "all")
    new_report = Report(
        session_id = session_id if session_id else "all",
        total_detections = total,
        detected_objects = class_counts,  # store as JSON
    )
    db.session.add(new_report)
    db.session.commit()

    return jsonify({
        "id": new_report.id,
        "session_id": new_report.session_id,
        "total_detections": new_report.total_detections,
        "detected_objects": new_report.detected_objects,
        "generated_at": new_report.generated_at.isoformat(),
    }), 201

@app.route('/stream')
def stream():
    cam_index = request.args.get('index', default=0, type=int)
    return Response(generate_frames_camera(cam_index),
                    mimetype='multipart/x-mixed-replace; boundary=frame')



if __name__ == '__main__':
    app.run(debug=True)
