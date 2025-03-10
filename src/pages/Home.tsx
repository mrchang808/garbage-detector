import React from 'react';

const Home = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '4rem auto 2rem', // adds more space above the div
      padding: '1rem',
      textAlign: 'left',   // or 'center' if you want headings centered
      backgroundColor: 'rgba(255, 255, 255, 0.05)', // optional translucent card
      borderRadius: '8px'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
      Welcome to the UAV-Based Object Detection System
      </h2>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
      This system integrates advanced machine learning (YOLO) with UAV technology to deliver real-time object detection.
      Developed as part of a diploma project at the International Information Technology University, it aims to enhance
      waste management and environmental monitoring through automated aerial analytics.
      </p>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
      Use the navigation links above to explore the live feed, view detailed analytics on the Dashboard, or read more in the About section.
      </p>
    </div>
  );
};

export default Home;
