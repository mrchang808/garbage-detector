from datetime import datetime
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
class Detection(db.Model):
    __table_args__ = (
        db.Index('idx_image_path', 'image_path'),
        db.Index('idx_timestamp', 'timestamp'),
        db.Index('idx_session', 'session_id'),
    )
    id = db.Column(db.Integer, primary_key=True)
    class_name = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    x_min = db.Column(db.Float, nullable=False)
    y_min = db.Column(db.Float, nullable=False)
    x_max = db.Column(db.Float, nullable=False)
    y_max = db.Column(db.Float, nullable=False)
    image_path = db.Column(db.String(255), nullable=True)  # Store file path
    detection_type = db.Column(db.String(20), nullable=False, default="uploaded")  # 'live' or 'uploaded'
    session_id = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)


class UAVStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    battery = db.Column(db.Float, nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    speed = db.Column(db.Float, nullable=True)
    altitude = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(50), nullable=False)  # 'info', 'warning', 'error'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    seen = db.Column(db.Boolean, default=False)

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(50), nullable=False)
    total_detections = db.Column(db.Integer, nullable=False)
    detected_objects = db.Column(db.JSON, nullable=False)  # Store objects and counts
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Drone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20))
    last_mission_id = db.Column(db.Integer, db.ForeignKey('mission.id'), nullable=True)

class Mission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    drone_id = db.Column(db.Integer, db.ForeignKey('drone.id'), nullable=False)
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.String(20))
