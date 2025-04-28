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
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt

app = Flask(__name__)
CORS(app)

bcrypt = Bcrypt(app)

# Configure SQLAlchemy to use PostgreSQL from the environment
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'  # Ensure this folder exists!
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configure JWT
app.config['JWT_SECRET_KEY'] = 'your-super-secret-key'  # Change this to a secure key!
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# Import db from the extensions module
from extensions import db
db.init_app(app)  # Register your app with SQLAlchemy
migrate = Migrate(app, db)

# Import the Detection model after initializing db
from models import Detection, UAVStatus, Notification, Report, User, Mission, Drone

# Load models with custom names
upload_model = YOLO("Rubbish/runs/detect/train/weights/best.pt")
live_model = YOLO("Rubbish/runs/detect/train/weights/best1.pt")

# Define custom class names
class_names = ['plastic', 'paper', 'metal', 'glass', 'bottle', 
               'float', 'plastic', 'rope', 'container', 'foam', 'foam']

# Update models' class names
upload_model.model.names = class_names
live_model.model.names = class_names

# Check CUDA availability
if torch.cuda.is_available():
    upload_model.to('cuda')
    live_model.to('cuda')
    print("Using GPU for inference")
else:
    print("Using CPU for inference")

# Update the detection function to use model.names correctly
def get_class_name(model, cls_id):
    try:
        return model.model.names[cls_id]
    except (IndexError, KeyError):
        return f"class_{cls_id}"

# Update the generate_frames_camera function
def generate_frames_camera(index=0):
    cap = cv2.VideoCapture(index)
    if not cap.isOpened():
        print(f"Error: Could not open video device at index {index}.")
        return

    class_colors = {
        "glass": (0, 255, 255),
        "metal": (255, 0, 0),
        "trash": (0, 128, 128),
        "bottle": (0, 0, 255),
        "float": (180, 105, 255),
        "plastic": (255, 255, 0),
        "rope": (192, 192, 192),
        "container": (0, 255, 0),
        "foam": (255, 0, 255)
    }

    frame_count = 0
    last_detections = None
    detection_interval = 3  # Run detection every N frames
    frame_width = 640  # Reduced frame size for faster processing
    frame_height = 480

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            # Resize frame for faster processing
            frame = cv2.resize(frame, (frame_width, frame_height))
            frame_count += 1

            # Run detection at intervals
            if frame_count % detection_interval == 0:
                try:
                    results = live_model(frame, verbose=False)
                    if len(results) > 0:
                        last_detections = results[0].boxes
                except Exception as e:
                    print(f"Detection error: {e}")
                    continue

            # Draw cached detections
            if last_detections is not None and len(last_detections) > 0:
                try:
                    for det in last_detections:
                        xyxy = det.xyxy[0].cpu().numpy()
                        conf = float(det.conf)
                        cls_id = int(det.cls)
                        class_name = get_class_name(live_model, cls_id)

                        if conf >= 0.7:
                            xmin, ymin, xmax, ymax = map(int, xyxy)
                            color = class_colors.get(class_name.lower(), (0, 255, 0))
                            
                            # Draw detection box
                            cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                            
                            # Draw label with confidence
                            label = f"{class_name}: {conf:.2f}"
                            (label_width, label_height), _ = cv2.getTextSize(
                                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                            
                            # Draw label background
                            cv2.rectangle(frame, 
                                        (xmin, ymin - label_height - 5),
                                        (xmin + label_width, ymin),
                                        color, -1)
                            
                            # Draw label text
                            cv2.putText(frame, label,
                                      (xmin, ymin - 5),
                                      cv2.FONT_HERSHEY_SIMPLEX,
                                      0.5, (255, 255, 255), 2)
                except Exception as e:
                    print(f"Drawing error: {e}")
                    continue

            # Encode frame with lower quality for faster transmission
            ret, buffer = cv2.imencode('.jpg', frame, 
                                     [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not ret:
                continue

            # Yield frame data
            try:
                yield (b'--frame\r\n'
                      b'Content-Type: image/jpeg\r\n\r\n' + 
                      buffer.tobytes() + b'\r\n')
            except Exception as e:
                print(f"Stream error: {e}")
                break

    finally:
        cap.release()

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

    results = upload_model(img)
    detections_data = []
    notifications_to_create = []

    # Process each detection
    for det in results[0].boxes:
        xyxy = det.xyxy.cpu().numpy().squeeze().tolist()
        conf = float(det.conf.item())
        cls_id = int(det.cls.item())
        class_name = get_class_name(upload_model, cls_id)

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
            session_id=session_id,
            latitude=request.form.get('latitude'),
            longitude=request.form.get('longitude')
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
                results = live_model(frame, verbose=False)
                last_detections = results[0].boxes  # cache detections

            if last_detections is not None:
                for det in last_detections:
                    xyxy = det.xyxy.cpu().numpy().squeeze()
                    conf = det.conf.item()
                    cls_id = int(det.cls.item())
                    class_name = live_model.model.names.get(cls_id, f"cls_{cls_id}")
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

@app.route('/detections', methods=['GET'])
def get_detections():
    detections = Detection.query.order_by(Detection.timestamp.desc()).all()
    return jsonify([{
        "id": det.id,
        "class_name": det.class_name,
        "confidence": det.confidence,
        "x_min": det.x_min,
        "y_min": det.y_min,
        "x_max": det.x_max,
        "y_max": det.y_max,
        "image_path": det.image_path,
        "detection_type": det.detection_type,
        "session_id": det.session_id,
        "timestamp": det.timestamp.isoformat(),
        "latitude": det.latitude,
        "longitude": det.longitude
    } for det in detections])

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
    notifications = Notification.query.order_by(Notification.timestamp.desc()).all()
    return jsonify([{
        'id': note.id,
        'message': note.message,
        'severity': note.severity,
        'timestamp': note.timestamp.isoformat(),
        'seen': note.seen
    } for note in notifications])

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

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()

    if not user or not user.check_password(data.get('password')):
        return jsonify({"msg": "Bad credentials"}), 401

    # Create token with user ID as identity and additional claims
    access_token = create_access_token(
        identity=str(user.id),  # Identity is a string (user ID)
        additional_claims={  # Add user data as additional claims
            'email': user.email,
            'role': user.role
        }
    )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Return both token and user data
    response_data = {
        'access_token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role
        }
    }
    
    return jsonify(response_data), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "User already exists"}), 400

    user = User(email=data['email'])
    user.set_password(data['password'])
    user.role = data.get('role', 'user')
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"msg": "User created"}), 201

# Example of a protected route
@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

# Get current user
@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user = get_jwt_identity()
    return jsonify(current_user), 200

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        # Get JWT claims
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403
        
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'created_at': user.created_at.isoformat()
        } for user in users])
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        return jsonify({"msg": "Error fetching users"}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        current_user = get_jwt_identity()
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403
        
        user = User.query.get_or_404(user_id)
        data = request.json
        
        if 'email' in data:
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
            
        db.session.commit()
        return jsonify({"msg": "User updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/drones', methods=['GET'])
@jwt_required()
def get_drones():
    try:
        drones = Drone.query.all()
        return jsonify([{
            'id': drone.id,
            'name': drone.name,
            'status': drone.status,
            'lastMission': Mission.query.get(drone.last_mission_id).start_time.isoformat() if drone.last_mission_id else None
        } for drone in drones])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
    
    user = User.query.get_or_404(user_id)
    if user.id == current_user['id']:
        return jsonify({"msg": "Cannot delete yourself"}), 400
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "User deleted successfully"})

@app.route('/stats', methods=['GET'])
def get_stats():
    detections = Detection.query.all()
    stats = {
        'plastic': 0,
        'metal': 0,
        'glass': 0,
        'paper': 0,
        'bottle': 0,
        'float': 0,
        'rope': 0,
        'container': 0,
        'foam': 0
    }
    
    for detection in detections:
        class_name = detection.class_name.lower()
        if class_name in stats:
            stats[class_name] += 1
    
    return jsonify(stats)

@app.route('/missions', methods=['GET'])
def get_missions():
    missions = Mission.query.order_by(Mission.start_time.desc()).all()
    return jsonify([{
        'id': mission.id,
        'start_time': mission.start_time.isoformat() if mission.start_time else None,
        'end_time': mission.end_time.isoformat() if mission.end_time else None,
        'status': mission.status,
        'detected_objects': mission.detected_objects,
        'drone_id': mission.drone_id
    } for mission in missions])

@app.route('/missions/<int:mission_id>/details', methods=['GET'])
def get_mission_details(mission_id):
    mission = Mission.query.get_or_404(mission_id)
    
    # Get detections during mission timeframe
    detections = Detection.query.filter(
        Detection.timestamp.between(mission.start_time, mission.end_time)
    ).order_by(Detection.timestamp).all()
    
    start_location = None
    end_location = None
    route = []
    
    if detections:
        start = detections[0]
        end = detections[-1]
        start_location = f"{start.latitude}, {start.longitude}"
        end_location = f"{end.latitude}, {end.longitude}"
        route = [f"{d.latitude}, {d.longitude}" for d in detections if d.latitude and d.longitude]
    
    return jsonify({
        'startLocation': start_location,
        'endLocation': end_location,
        'objectTypes': mission.detected_objects,
        'route': route
    })

if __name__ == '__main__':
    app.run(debug=True)
