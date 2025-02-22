import { useState } from 'react';
import GarbageDetector from '../components/garbagedetector';

const LiveFeed = () => {
  const [isLive, setIsLive] = useState(false); // Toggle state for live stream

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
    }}>
      <h2>Live Feed</h2>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Upload an image or enable real-time detection from the camera.
      </p>

      {/* Toggle Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setIsLive(false)} 
          style={{ marginRight: '10px', padding: '10px', cursor: 'pointer', color: 'white' }}
        >
          Upload Image
        </button>
        <button 
          onClick={() => setIsLive(true)} 
          style={{ padding: '10px', cursor: 'pointer', color: 'white' }}
        >
          Live Camera Feed
        </button>
      </div>

      {/* Render the appropriate component based on the toggle */}
      {!isLive ? (
        <GarbageDetector />
      ) : (
        <img 
          src="http://127.0.0.1:5000/stream" 
          alt="Live Detection Feed" 
          style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} 
        />
      )}
    </div>
  );
};

export default LiveFeed;
