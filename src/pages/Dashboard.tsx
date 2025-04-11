import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './Dashboard.css';
import UAVStatusWidget from '../components/UAVStatusWidget';
import MapComponent from '../components/MapComponent';
import { FaBatteryFull, FaTrashAlt, FaChartLine, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { Detection, Notification } from '../types';
import { ENDPOINTS } from '../api/endpoints';

Chart.register(...registerables);

interface DetectionStats {
  plastic: number;
  metal: number;
  glass: number;
}

const Dashboard: React.FC = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<DetectionStats>({ plastic: 0, metal: 0, glass: 0 });
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [detectionsRes, statsRes, notificationsRes] = await Promise.all([
          axios.get<Detection[]>(ENDPOINTS.DETECTIONS),
          axios.get<DetectionStats>(ENDPOINTS.STATS),
          axios.get<Notification[]>(ENDPOINTS.NOTIFICATIONS)
        ]);

        console.log('Detections data:', detectionsRes.data);
        setDetections(detectionsRes.data || []);
        setStats(statsRes.data || { plastic: 0, metal: 0, glass: 0 });
        setRecentNotifications(notificationsRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: Object.keys(stats),
    datasets: [{
      label: 'Objects Detected',
      data: Object.values(stats),
      backgroundColor: ['#E8C74D', '#A3DADC', '#2C003E']
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.87)'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.87)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.87)'
        }
      }
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <FaExclamationCircle className="severity-icon error" />;
      case 'warning':
        return <FaExclamationTriangle className="severity-icon warning" />;
      default:
        return <FaInfoCircle className="severity-icon info" />;
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Detection Dashboard</h2>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card yellow-bg">
          <FaBatteryFull className="metric-icon" />
          <h3>75%</h3>
          <p>Average Battery</p>
        </div>
        <div className="metric-card blue-bg">
          <FaTrashAlt className="metric-icon" />
          <h3>{detections.length}</h3>
          <p>Total Detections</p>
        </div>
        <div className="metric-card blue-bg">
          <FaChartLine className="metric-icon" />
          <h3>24</h3>
          <p>Completed Missions</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <h3 className="section-title">Object Distribution</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Map Section */}
      <div className="map-section">
        <h3 className="section-title">Detection Locations</h3>
        <MapComponent detections={detections} />
      </div>

      {/* Recent Notifications */}
      <div className="recent-detections-section">
        <h3 className="section-title">Recent Notifications</h3>
        <div className="recent-detection-grid">
          {recentNotifications.slice(0, 5).map(note => (
            <div key={note.id} className={`recent-detection-card ${note.severity}`}>
              <div className="notification-header">
                {getSeverityIcon(note.severity)}
                <span className="notification-time">
                  {new Date(note.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="notification-message">
                {note.message}
              </div>
              <div className="notification-status">
                {note.seen ? 'Read' : 'Unread'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error and Loading States */}
      {error && <div className="error-message"><p>{error}</p></div>}
      {isLoading && <div className="loading-message"><p>Loading dashboard data...</p></div>}
    </div>
  );
};

export default Dashboard;
