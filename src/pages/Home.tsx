import React from 'react';
import { FaRobot, FaChartLine, FaGlobe } from 'react-icons/fa';
import { GiDeliveryDrone } from "react-icons/gi";
import '../styles/Pages.css';

const Home = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">UAV-Based Object Detection System</h1>
      
      <div className="highlight-box">
        <p className="text-content">
          Advanced machine learning meets drone technology for real-time environmental monitoring
          and waste management solutions.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <GiDeliveryDrone className="feature-icon" />
          <h3 className="card-title">Drone Integration</h3>
          <p className="card-text">
            Real-time aerial surveillance with advanced UAV technology for comprehensive coverage and monitoring.
          </p>
        </div>

        <div className="feature-card">
          <FaRobot className="feature-icon" />
          <h3 className="card-title">AI Detection</h3>
          <p className="card-text">
            Powered by YOLO machine learning model for accurate object detection and classification in real-time.
          </p>
        </div>

        <div className="feature-card">
          <FaChartLine className="feature-icon" />
          <h3 className="card-title">Analytics</h3>
          <p className="card-text">
            Comprehensive data analysis and reporting for informed decision-making and trend tracking.
          </p>
        </div>

        <div className="feature-card">
          <FaGlobe className="feature-icon" />
          <h3 className="card-title">Environmental Impact</h3>
          <p className="card-text">
            Contributing to cleaner environments through automated waste detection and management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
