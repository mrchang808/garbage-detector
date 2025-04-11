import React, { useRef, useEffect } from 'react';
import { ENDPOINTS } from '../api/endpoints';

interface LiveCameraFeedProps {
  cameraIndex: number;
}

const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({ cameraIndex }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current.src = "";
      }
    };
  }, []);

  return (
    <img
      ref={imgRef}
      src={ENDPOINTS.STREAM(cameraIndex)}
      alt="Live Camera Feed"
      style={{ width: '100%', borderRadius: '8px' }}
    />
  );
};

export default LiveCameraFeed;
