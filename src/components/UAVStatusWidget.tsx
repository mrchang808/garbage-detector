import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface UAVStatus {
  id: number;
  battery: number;
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  timestamp: string;
}

const UAVStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<UAVStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get<UAVStatus>('http://127.0.0.1:5000/uavstatus');
        setStatus(response.data);
      } catch (error) {
        console.error("Failed to fetch UAV status:", error);
      }
    };

    fetchStatus(); // Initial fetch

    const intervalId = setInterval(fetchStatus, 5000); 
    // Poll every 5 seconds, or however often you want

    return () => clearInterval(intervalId);
  }, []);

  if (!status) {
    return <div>Loading UAV status...</div>;
  }

  return (
    <div className='.dashboard-container'>
      <h3>UAV Status</h3>
      <p>Battery: {status.battery}%</p>
      <p>Coordinates: {status.latitude}, {status.longitude}</p>
      <p>Speed: {status.speed} m/s</p>
      <p>Altitude: {status.altitude} m</p>
      <small>Last updated: {new Date(status.timestamp).toLocaleString()}</small>
    </div>
  );
};

export default UAVStatusWidget;
