import React, { useState } from 'react';
import GarbageDetector from '../components/garbagedetector';
import LiveCameraFeed from '../components/LiveCameraFeed';

const LiveFeed = () => {
  const [isLive, setIsLive] = useState(false);
  const [cameraIndex, setCameraIndex] = useState(0);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCameraIndex(parseInt(e.target.value));
  };

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
        <button onClick={() => setIsLive(false)} className="custom-button">
          Upload Image
        </button>
        <button onClick={() => setIsLive(true)} className="custom-button">
          Live Feed
        </button>
      </div>
      {isLive && (
        <div>
          <label style={{ marginRight: '10px' }}>Select Camera:</label>
          <select onChange={handleCameraChange} value={cameraIndex}>
            <option value={0}>Laptop Camera (Index 0)</option>
            <option value={1}>External Camera (Index 1)</option>
            <option value={2}>Camera 2 (Index 2)</option>
            {/* Add more options if needed */}
          </select>
          <div style={{ marginTop: '20px' }}>
            <LiveCameraFeed cameraIndex={cameraIndex} />
          </div>
        </div>
      )}
      {!isLive && <GarbageDetector />}
    </div>
  );
};

export default LiveFeed;
