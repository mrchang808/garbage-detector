import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      let url = 'http://127.0.0.1:5000/reports';
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
      const response = await axios.post<Report>('http://127.0.0.1:5000/reports', {
        session_id: sessionId,
      });
      // Optionally refresh the reports list
      fetchReports();
    } catch (err) {
      console.error("Error generating report:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); // load all reports on mount

  return (
    <div style={{ paddingTop: '40px' }}>
      <h2>Reports</h2>
      <div>
        <label>Session ID:</label>
        <input 
          value={sessionId} 
          onChange={(e) => setSessionId(e.target.value)} 
          style={{ marginRight: '10px' }}
        />
        <button onClick={generateReport} className="custom-button">Generate Report</button>
        <button onClick={fetchReports} className="custom-button">Fetch Reports</button>
      </div>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto', 
        padding: '1rem'
        }}>
        {reports.map((rep) => (
          <div key={rep.id} style={{
            border: '1px solid #ccc', 
            padding: '1rem', 
            marginBottom: '1rem'
          }}>
            <p><strong>Report ID:</strong> {rep.id}</p>
            <p><strong>Session:</strong> {rep.session_id}</p>
            <p><strong>Total Detections:</strong> {rep.total_detections}</p>
            <p><strong>Detected Objects:</strong></p>
            <ul>
              {Object.entries(rep.detected_objects).map(([cls, count]) => (
                <li key={cls}>{cls}: {count}</li>
              ))}
            </ul>
            <small>Generated at: {new Date(rep.generated_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
