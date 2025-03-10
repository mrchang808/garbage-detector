import React, { useEffect, useState, CSSProperties } from 'react';
import axios from 'axios';

interface Notification {
  id: number;
  message: string;
  severity: string;   // 'info', 'warning', 'error'
  timestamp: string;
  seen: boolean;
}

interface NotificationsPanelProps {
  style?: CSSProperties;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ style }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get<Notification[]>('http://127.0.0.1:5000/notifications');
                setNotifications(response.data);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // poll every 10s
        return () => clearInterval(interval);
    }, []);

    const markAsSeen = async (id: number) => {
        try {
            await axios.patch(`http://127.0.0.1:5000/notifications/${id}`, { seen: true });
            setNotifications(notifications.map(n => n.id === id ? { ...n, seen: true } : n));
        } catch (err) {
            console.error("Error updating notification:", err);
        }
    };

    return (
        <div
        style={{
            position: 'fixed',
            top: '60px',       // below navbar
            right: 0,
            width: '300px',
            bottom: '75px',    // leaves 75px for footer
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid #fff',
            
            // Optional bottom border if you want a visible line at the bottom:
            // borderBottom: '1px solid #ccc',
            padding: '1rem',
            zIndex: 2000,
            ...style
        }}
        >
            <h3 style={{ color: 'white' }}>Notifications</h3>
            {notifications.map((note) => (
                <div 
                    key={note.id} 
                    style={{ 
                        padding: '0.5rem', 
                        marginBottom: '0.5rem', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        backgroundColor: note.seen ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                        color: 'white'
                    }}
                >
                    <strong>{note.severity.toUpperCase()}: </strong>{note.message}
                    <div>
                        <small>{new Date(note.timestamp).toLocaleString()}</small>
                    </div>
                    {!note.seen && (
                        <button onClick={() => markAsSeen(note.id)} className="custom-button" style={{ padding: '4px 8px', fontSize: '0.8rem', marginTop: '4px' }}>Mark as Seen</button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default NotificationsPanel;
