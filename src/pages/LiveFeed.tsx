import React, { useState } from 'react';
import GarbageDetector from '../components/garbagedetector';
import LiveCameraFeed from '../components/LiveCameraFeed';
import { FaUpload, FaVideo, FaCamera } from 'react-icons/fa';
import './LiveFeed.css';

const LiveFeed = () => {
  const [isLive, setIsLive] = useState(false);
  const [cameraIndex, setCameraIndex] = useState(0);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCameraIndex(parseInt(e.target.value));
  };

  return (
    <div className="live-feed-container">
      <h2 className="page-title">Live Detection Feed</h2>
      
      <div className="mode-description">
        <p>Choose between uploading images for detection or using real-time camera feed.</p>
      </div>

      <div className="mode-selector">
        <button 
          className={`mode-button ${!isLive ? 'active' : ''}`}
          onClick={() => setIsLive(false)}
        >
          <FaUpload className="button-icon" />
          Upload Image
        </button>
        <button 
          className={`mode-button ${isLive ? 'active' : ''}`}
          onClick={() => setIsLive(true)}
        >
          <FaVideo className="button-icon" />
          Live Feed
        </button>
      </div>

      {isLive && (
        <div className="camera-controls">
          <div className="camera-selector">
            <FaCamera className="camera-icon" />
            <select 
              onChange={handleCameraChange} 
              value={cameraIndex}
              className="camera-select"
            >
              <option value={0}>Laptop Camera (Index 0)</option>
              <option value={1}>External Camera (Index 1)</option>
              <option value={2}>Camera 2 (Index 2)</option>
            </select>
          </div>
          <div className="camera-feed">
            <LiveCameraFeed cameraIndex={cameraIndex} />
          </div>
        </div>
      )}

      {!isLive && (
        <div className="upload-section">
          <GarbageDetector />
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
