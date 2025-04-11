import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaCalendar, FaChartBar } from 'react-icons/fa';
import './Reports.css';
import { ENDPOINTS } from '../api/endpoints';

interface Report {
  id: number;
  session_id: string;
  total_detections: number;
  detected_objects: { [key: string]: number };
  generated_at: string;
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [sessionId, setSessionId] = useState('');

  const fetchReports = async () => {
    try {
      let url = ENDPOINTS.REPORTS;
      if (sessionId) {
        url += `?session_id=${sessionId}`;
      }
      const response = await axios.get<Report[]>(url);
      setReports(response.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const generateReport = async () => {
    try {
      await axios.post<Report>(ENDPOINTS.REPORTS, {
        session_id: sessionId,
      });
      // Refresh reports list after generating new report
      fetchReports();
    } catch (err) {
      console.error("Error generating report:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); // load all reports on mount

  return (
    <div className="reports-container">
      <h2 className="page-title">Detection Reports</h2>

      <div className="reports-controls">
        <div className="search-section">
          <div className="input-group">
            <FaCalendar className="input-icon" />
            <input 
              value={sessionId} 
              onChange={(e) => setSessionId(e.target.value)} 
              placeholder="Enter Session ID"
            />
          </div>
          
          <button onClick={generateReport} className="generate-btn">
            <FaFileAlt /> Generate Report
          </button>
          
          <button onClick={fetchReports} className="refresh-btn">
            <FaChartBar /> Refresh Reports
          </button>
        </div>
      </div>

      <div className="reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-header">
              <FaFileAlt className="report-icon" />
              <span className="report-id">Report #{report.id}</span>
            </div>
            
            <div className="report-body">
              <div className="report-info">
                <span>Session: {report.session_id}</span>
                <span>Total Detections: {report.total_detections}</span>
              </div>
              
              <div className="detections-breakdown">
                <h4>Detected Objects:</h4>
                <ul>
                  {Object.entries(report.detected_objects).map(([cls, count]) => (
                    <li key={cls}>
                      <span className="object-class">{cls}</span>
                      <span className="object-count">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="report-footer">
              <small>Generated: {new Date(report.generated_at).toLocaleString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
