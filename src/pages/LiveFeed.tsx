import React from 'react';
import GarbageDetector from '../components/garbagedetector';

const LiveFeed = () => {
  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Live Feed</h2>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Upload an image or connect your drone’s feed to see real-time object detection in action.
      </p>
      <GarbageDetector />
    </div>
  );
};

export default LiveFeed;
