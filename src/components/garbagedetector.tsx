import React, { useState } from 'react';

interface Detection {
  className: string;
  confidence: number;
  boundingBox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

interface ImageResult {
  id: string;        // A unique key for React
  imageURL: string;  // The local URL for preview
  detections: Detection[];
}

function GarbageDetector() {
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newResults: ImageResult[] = [];

    for (const file of Array.from(files)) {
      const resultId = crypto.randomUUID();
      const localURL = URL.createObjectURL(file);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://127.0.0.1:5000/detect', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        newResults.push({
          id: resultId,
          imageURL: localURL,
          detections: data.detections || [],
        });
      } catch (error) {
        console.error(error);
        newResults.push({
          id: resultId,
          imageURL: localURL,
          detections: [],
        });
      }
    }

    setImageResults((prev) => [...prev, ...newResults]);
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
  };

  const tableStyle: React.CSSProperties = {
    marginTop: '20px',
    width: '100%',
    color: 'white',
    borderCollapse: 'collapse',
  };

  const thTdStyle: React.CSSProperties = {
    border: '1px solid gray',
    padding: '5px',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: 'white' }}>Garbage Detector</h2>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange} 
          style={{ padding: '10px', borderRadius: '4px' }} 
        />
      </div>

      {imageResults.map((result) => (
        <div key={result.id} style={{ marginTop: '30px', textAlign: 'center' }}>
          <img 
            src={result.imageURL} 
            alt="Uploaded" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)' 
            }} 
          />

          {result.detections.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Class</th>
                  <th style={thTdStyle}>Confidence</th>
                  <th style={thTdStyle}>xmin</th>
                  <th style={thTdStyle}>ymin</th>
                  <th style={thTdStyle}>xmax</th>
                  <th style={thTdStyle}>ymax</th>
                </tr>
              </thead>
              <tbody>
                {result.detections.map((det, idx) => (
                  <tr key={idx}>
                    <td style={thTdStyle}>{det.className}</td>
                    <td style={thTdStyle}>{(det.confidence * 100).toFixed(2)}%</td>
                    <td style={thTdStyle}>{det.boundingBox.xmin}</td>
                    <td style={thTdStyle}>{det.boundingBox.ymin}</td>
                    <td style={thTdStyle}>{det.boundingBox.xmax}</td>
                    <td style={thTdStyle}>{det.boundingBox.ymax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'lightgray', marginTop: '10px' }}>No detections found.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default GarbageDetector;
