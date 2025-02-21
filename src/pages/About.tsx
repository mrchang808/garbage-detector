import React from 'react';

const About = () => {
  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>About This Project</h2>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
        This UAV-Based Object Detection System is an integrated solution that combines drone technology, machine learning, and modern web development to enable real-time detection of objects—particularly waste materials such as plastic, glass, metal, and paper.
      </p>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
        The back-end is built with Flask and leverages an Ultralytics YOLO model (trained on a custom dataset) for fast and accurate object detection.
        The front-end is developed using React, TypeScript, and Vite, providing an intuitive interface for live monitoring and analytics.
      </p>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
        This project was developed as part of a diploma at the International Information Technology University and adheres to the academic guidelines
        and anti-plagiarism requirements set forth by the institution.
      </p>
    </div>
  );
};

export default About;
