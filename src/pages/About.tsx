import React from 'react';
import { FaGraduationCap, FaCode, FaBrain } from 'react-icons/fa';
import '../styles/Pages.css';

const About = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">About This Project</h1>

      <div className="feature-grid">
        <div className="feature-card">
          <FaGraduationCap className="feature-icon" />
          <h3 className="card-title">Academic Project</h3>
          <p className="card-text">
            Developed as a diploma project at the International Information Technology University,
            adhering to academic standards and anti-plagiarism requirements.
          </p>
        </div>

        <div className="feature-card">
          <FaBrain className="feature-icon" />
          <h3 className="card-title">Advanced AI</h3>
          <p className="card-text">
            Utilizes state-of-the-art YOLO model trained on custom datasets for precise
            waste material detection including plastic, glass, metal, and paper.
          </p>
        </div>

        <div className="feature-card">
          <FaCode className="feature-icon" />
          <h3 className="card-title">Modern Tech Stack</h3>
          <p className="card-text">
            Built with Flask backend for robust processing and React TypeScript frontend
            for a responsive and intuitive user interface.
          </p>
        </div>
      </div>

      <div className="highlight-box">
        <p className="text-content">
          This integrated solution combines drone technology, machine learning, and modern web development
          to enable real-time detection and monitoring of environmental waste materials.
        </p>
      </div>
    </div>
  );
};

export default About;
