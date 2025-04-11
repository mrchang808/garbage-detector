export interface Detection {
  id: number;
  class_name: string;
  confidence: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  image_path: string;
  detection_type: string;
  session_id: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Notification {
  id: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  seen: boolean;
}

export interface DetectionStats {
  plastic: number;
  metal: number;
  glass: number;
  paper: number;
  bottle: number;
  float: number;
  rope: number;
  container: number;
  foam: number;
}

export interface UAVStatus {
  id: number;
  battery: number;
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  timestamp: string;
}

export interface Report {
  id: number;
  session_id: string;
  total_detections: number;
  detected_objects: { [key: string]: number };
  generated_at: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
  last_login: string;
}

export interface Mission {
  id: number;
  start_time: string;
  end_time: string | null;
  status: 'idle' | 'in_progress' | 'completed';
  detected_objects: { [key: string]: number };
  drone_id: number;
}

export interface MissionDetails {
  startLocation: string | null;
  endLocation: string | null;
  objectTypes: { [key: string]: number };
  route: string[];
}

export interface Drone {
  id: number;
  name: string;
  status: string;
  last_mission_id: number;
}