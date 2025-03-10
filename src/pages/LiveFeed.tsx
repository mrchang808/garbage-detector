// LiveFeed.tsx
import { useState } from 'react';
import GarbageDetector from '../components/garbagedetector';
import LiveCameraFeed from '../components/LiveCameraFeed';

const LiveFeed = () => {
  const [isLive, setIsLive] = useState(false);

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
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setIsLive(false)} className="custom-button">Upload Image</button>
        <button onClick={() => setIsLive(true)} className="custom-button">Live Camera Feed</button>

      </div>
      {isLive ? <LiveCameraFeed key="live-camera" /> : <GarbageDetector key="detector" />}
    </div>
  );
};

export default LiveFeed;
