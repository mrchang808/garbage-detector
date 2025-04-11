export const API_BASE_URL = 'http://localhost:5000';

export const ENDPOINTS = {
  DETECTIONS: `${API_BASE_URL}/detections`,
  STATS: `${API_BASE_URL}/stats`,
  MISSIONS: `${API_BASE_URL}/missions`,
  MISSION_DETAILS: (id: number) => `${API_BASE_URL}/missions/${id}/details`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATION_UPDATE: (id: number) => `${API_BASE_URL}/notifications/${id}`,
  UAV_STATUS: `${API_BASE_URL}/uavstatus`,
  LOGIN: `${API_BASE_URL}/api/login`,
  REGISTER: `${API_BASE_URL}/api/register`,
  STREAM: (index: number) => `${API_BASE_URL}/stream?index=${index}`,
  REPORTS: `${API_BASE_URL}/reports`,
  DETECT: `${API_BASE_URL}/detect`,
  DRONES: `${API_BASE_URL}/api/drones`,
  DRONE_DETAILS: (id: string) => `${API_BASE_URL}/api/drones/${id}/details`,
  DRONE_UPDATE: (id: string) => `${API_BASE_URL}/api/drones/${id}`,
  DRONE_DELETE: (id: string) => `${API_BASE_URL}/api/drones/${id}`,
  USERS: `${API_BASE_URL}/api/users`,
  USER_DETAILS: (id: number) => `${API_BASE_URL}/api/users/${id}`,
  USER_UPDATE: (id: number) => `${API_BASE_URL}/api/users/${id}`,
  USER_DELETE: (id: number) => `${API_BASE_URL}/api/users/${id}`,
} as const;