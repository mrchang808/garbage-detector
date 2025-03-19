// UserCameraFeed.tsx
import React, { useState } from 'react';

const UserCameraFeed: React.FC = () => {
  const [url, setUrl] = useState('');
  const [feedUrl, setFeedUrl] = useState('');

  const handleConnect = () => {
    setFeedUrl(url);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Connect Your External Camera</h3>
      <input 
        type="text" 
        placeholder="Enter stream URL (e.g., http://192.168.0.100:8080/video)" 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: '70%', padding: '0.5rem' }}
      />
      <button onClick={handleConnect} className="custom-button" style={{ marginLeft: '10px' }}>
        Connect
      </button>
      {feedUrl && (
        <div style={{ marginTop: '1rem' }}>
          <img src={feedUrl} alt="External Live Feed" style={{ width: '100%', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
};

export default UserCameraFeed;
