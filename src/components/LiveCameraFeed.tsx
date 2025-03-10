// LiveCameraFeed.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const LiveCameraFeed: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState(`http://127.0.0.1:5000/stream?time=${Date.now()}`);
  const imgRef = useRef<HTMLImageElement>(null);
  const location = useLocation();

  // Clear the stream when the route changes
  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current.src = "";
      }
    };
  }, [location]);

  // Listen for page visibility changes (e.g. if user minimizes or navigates away)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && imgRef.current) {
        imgRef.current.src = "";
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Update feed URL periodically to bypass caching
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedUrl(`http://127.0.0.1:5000/stream?time=${Date.now()}`);
    }, 5000);
    return () => {
      clearInterval(interval);
      if (imgRef.current) {
        imgRef.current.src = "";
      }
    };
  }, []);

  return (
    <img
      ref={imgRef}
      src={feedUrl}
      alt="Live Detection Feed"
      style={{ width: '100%', borderRadius: '8px' }}
    />
  );
};

export default LiveCameraFeed;
