// src/types.ts
export interface Detection {
    id: number;
    class_name: string;
    confidence: number;
    bounding_box: {
      xmin: number;
      ymin: number;
      xmax: number;
      ymax: number;
    };
    latitude?: number;
    longitude?: number;
    timestamp: string;
  }

export interface DetectionStats {
  plastic: number;
  metal: number;
  glass: number;
}

export interface Mission {
    id: number;
    start_time: string;
    end_time: string;
    status: 'planned' | 'in_progress' | 'completed';
    detected_objects: Record<string, number>;
    drone_id: number;
  }
  
export interface UAVStatus {
    battery: number;
    latitude: number;
    longitude: number;
    speed: number;
    altitude: number;
    timestamp: string;
  }

export interface Notification {
    id: number;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: string;
    seen: boolean;
}

export interface User {
  id: number;
  email: string;
  role: string;
  last_login: string | null;
}

export interface Drone {
  id: number;
  name: string;
  status: string;
  last_mission_id: number | null;
}