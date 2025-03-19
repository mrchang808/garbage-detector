import React, { useRef, useEffect } from 'react';

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
      src={`http://127.0.0.1:5000/stream?index=${cameraIndex}`}
      alt="Live Camera Feed"
      style={{ width: '100%', borderRadius: '8px' }}
    />
  );
};

export default LiveCameraFeed;
