import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NotificationsPanel.css';
import { FaBell, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { ENDPOINTS } from '../api/endpoints';

interface Notification {
  id: number;
  message: string;
  severity: string;
  timestamp: string;
  seen: boolean;
}

const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get<Notification[]>(ENDPOINTS.NOTIFICATIONS);
        setNotifications(response.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAsSeen = async (id: number) => {
    try {
      await axios.patch(ENDPOINTS.NOTIFICATION_UPDATE(id), { seen: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, seen: true } : n));
    } catch (err) {
      console.error("Error updating notification:", err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <FaExclamationCircle className="severity-icon error" />;
      case 'warning':
        return <FaExclamationCircle className="severity-icon warning" />;
      default:
        return <FaCheck className="severity-icon info" />;
    }
  };

  return (
    <div className="admin-notifications">
      <div className="notifications-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <FaBell />
          <h3>System Notifications</h3>
          <span className="notification-count">{notifications.length}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="notifications-list">
          {notifications.map((note) => (
            <div 
              key={note.id} 
              className={`notification-item ${note.seen ? 'seen' : ''}`}
            >
              <div className="notification-content">
                <div className="notification-header">
                  {getSeverityIcon(note.severity)}
                  <span className="notification-time">
                    {new Date(note.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="notification-message">{note.message}</div>
              </div>
              {!note.seen && (
                <button 
                  onClick={() => markAsSeen(note.id)} 
                  className="mark-seen-btn"
                >
                  <FaCheck /> Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
