import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import UAVStatusWidget from '../components/UAVStatusWidget'; // Adjust path as necessary

/** Detection interface **/
interface Detection {
  id: number;
  className: string;
  confidence: number; // from 0.0 to 1.0
  boundingBox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  timestamp: string;  // e.g. "2025-03-09T21:24:42"
  image_path?: string;
}

const Dashboard: React.FC = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [groupedDetections, setGroupedDetections] = useState<{ [key: string]: Detection[] }>({});
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number>(60); // 60%
  const [classes, setClasses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedImagePath, setSelectedImagePath] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchDetections = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      let query = `http://127.0.0.1:5000/detections`;
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) {
        query += `?${params.join("&")}`;
      }

      const response = await axios.get(query);
      let fetchedData = response.data;
      
      // Ensure we have an array of detections
      if (!Array.isArray(fetchedData)) {
        // If the API is returning an object with a data property that contains the array
        if (fetchedData && typeof fetchedData === 'object' && Array.isArray((fetchedData as { data: any }).data)) {
          fetchedData = (fetchedData as { data: any }).data;
        } else {
          // If we can't find an array, initialize with empty array
          console.error("API response is not in expected format:", fetchedData);
          fetchedData = [];
        }
      }
      
      setDetections(fetchedData as Detection[]);

      // Group detections by image_path
      const imageGroups: { [key: string]: Detection[] } = {};
      if (Array.isArray(fetchedData)) {
        fetchedData.forEach((det) => {
          if (!det.image_path) return;
          if (!imageGroups[det.image_path]) {
            imageGroups[det.image_path] = [];
          }
          imageGroups[det.image_path].push(det);
        });
      }
      setGroupedDetections(imageGroups);

      // Extract unique class names
      const uniqueClasses = Array.from(new Set(fetchedData.map(d => d.className)));
      setClasses(uniqueClasses);
    } catch (error) {
      console.error("Error fetching detections:", error);
      setError('Failed to fetch detections. Please check your API endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, [startDate, endDate]);

  // Safety check for detections before operations
  const sortedDetections = Array.isArray(detections) ? 
    [...detections].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ) : [];
    
  const recentDetections = sortedDetections.slice(0, 5);

  // Delete a single detection
  const deleteDetection = async (id: number) => {
    try {
      const detectionToDelete = detections.find(d => d.id === id);
      await axios.delete(`http://127.0.0.1:5000/detections/${id}`);

      // Update UI in real-time
      setDetections((prev) => prev.filter(d => d.id !== id));
      setGroupedDetections((prev) => {
        const updated = { ...prev };
        const imagePath = detectionToDelete?.image_path;
        
        if (imagePath) {
          updated[imagePath] = updated[imagePath].filter(d => d.id !== id);
          
          // If last detection in image, delete the image group
          if (updated[imagePath].length === 0) {
            delete updated[imagePath];
            // Add API call here to delete actual image file if needed
          }
        }
        return updated;
      });

    } catch (error) {
      console.error("Error deleting detection:", error);
      alert("Failed to delete detection. Please try again.");
    }
  };

  // Delete all detections
  const deleteAllDetections = async () => {
    if (!window.confirm("This will permanently delete ALL detections. Continue?")) return;
    
    try {
      await axios.delete(`http://127.0.0.1:5000/detections`);
      setDetections([]); // Clear all detections from UI immediately
      setGroupedDetections({});
    } catch (error) {
      console.error("Error deleting all detections:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Detection Dashboard</h2>
      <div style={{ marginBottom: '20px' }}>
        <UAVStatusWidget />
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={fetchDetections} className="custom-button">Refresh Detections</button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          textAlign: 'center', 
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#ffdddd',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-message" style={{ 
          textAlign: 'center', 
          padding: '20px',
          marginBottom: '15px'
        }}>
          Loading detections...
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-box class-filter-container">
          <label htmlFor="classFilter">Select Class</label>
          <select
            id="classFilter"
            className="select-dropdown"
            onChange={(e) => setSelectedClass(e.target.value)}
            value={selectedClass}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-box">
          <label htmlFor="confidenceRange">Confidence ({minConfidence}%)</label>
          <input
            id="confidenceRange"
            type="range"
            min="0"
            max="100"
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
          />
        </div>
        <div className="filter-box">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-picker"
          />
        </div>
        <div className="filter-box">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-picker"
          />
        </div>
      </div>

      {/* Recently Added Section */}
      <div className="recent-detections">
        <h3>Recently Added</h3>
        {recentDetections.length > 0 ? (
          <div className="recent-detection-grid">
            {recentDetections.map((det) => (
              <div
                key={det.id}
                className="recent-detection-card"
                onClick={() => setSelectedImagePath(det.image_path || '')}
              >
                <p>{det.className} - {(det.confidence * 100).toFixed(0)}%</p>
                <p>{new Date(det.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>No recent detections found</p>
        )}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={deleteAllDetections} 
          className="custom-button" 
          style={{ backgroundColor: 'red', color: 'white' }}
          disabled={!detections.length}
        >
          Delete All Detections
        </button>
      </div>

      {/* Empty State for No Detections */}
      {!isLoading && Object.keys(groupedDetections).length === 0 && (
        <div className="empty-state">
          <p>No detections found matching current filters</p>
        </div>
      )}

      {/* Main Detection Grid */}
      <div className="detection-grid">
        {Object.keys(groupedDetections)
          .sort()
          .map((imgPath) => {
            const valid = groupedDetections[imgPath].filter((det) => {
              const passClass = !selectedClass || det.className === selectedClass;
              const passConfidence = det.confidence * 100 >= minConfidence;
              return passClass && passConfidence;
            });
            if (valid.length === 0) return null;

            return (
                <div
                key={imgPath}
                className="detection-card"
                onClick={() => setSelectedImagePath(imgPath)}
                style={{ cursor: 'pointer' }}
                >
                <ImageWithDetections
                  key={`${imgPath}-${minConfidence}`}
                  imagePath={imgPath}
                  detections={valid}
                  minConfidence={minConfidence}
                  deleteDetection={deleteDetection}  // Add this line
                />
                </div>
            );
          })}
      </div>

      {selectedImagePath && (
        <DetailsPanel
          imagePath={selectedImagePath}
          detections={groupedDetections[selectedImagePath] || []}
          selectedClass={selectedClass}
          minConfidence={minConfidence}
          onClose={() => setSelectedImagePath('')}
        />
      )}
    </div>
  );
};

/** 
 * COMPONENT: ImageWithDetections 
 * Draw bounding boxes on the image and display cropped sub-images below
 */
interface ImageWithDetectionsProps {
  imagePath: string;
  detections: Detection[];
  minConfidence: number;
  deleteDetection: (id: number) => void;
}

const ImageWithDetections: React.FC<ImageWithDetectionsProps> = ({ 
  imagePath, 
  detections, 
  minConfidence,
  deleteDetection 
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [croppedImages, setCroppedImages] = useState<{ url: string; label: string; id: number }[]>([]);
  
  const drawBoxes = () => {
    if (!imgRef.current || !canvasRef.current) return;
    const imgEl = imgRef.current;
    const canvasEl = canvasRef.current;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    // Set canvas dimensions
    canvasEl.width = imgEl.clientWidth;
    canvasEl.height = imgEl.clientHeight;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const scaleX = imgEl.clientWidth / (imgEl.naturalWidth || 1);
    const scaleY = imgEl.clientHeight / (imgEl.naturalHeight || 1);

    detections.forEach((det) => {
      if (det.confidence * 100 < minConfidence) return;
      const { xmin, ymin, xmax, ymax } = det.boundingBox;
      const x = xmin * scaleX;
      const y = ymin * scaleY;
      const w = (xmax - xmin) * scaleX;
      const h = (ymax - ymin) * scaleY;
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      const label = `${det.className} ${(det.confidence * 100).toFixed(1)}%`;
      ctx.font = '14px Arial';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,255,0,0.5)';
      ctx.fillRect(x, y - 18, textWidth + 6, 18);
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 3, y - 5);
    });
  };

  useEffect(() => {
    cropDetections();
  }, [detections, minConfidence]); // Add dependencies

  const handleImageLoad = () => {
    drawBoxes();
    cropDetections();
  };
  
  // If your bounding boxes are in the original dimension:
const cropDetections = () => {
  if (!imgRef.current) return;
  const imgEl = imgRef.current;
  const newCrops: { url: string; label: string; id: number }[] = [];
  
  detections.forEach((det) => {
    if (det.confidence * 100 < minConfidence) return;
    const natX = Math.round(det.boundingBox.xmin);
    const natY = Math.round(det.boundingBox.ymin);
    const natW = Math.round(det.boundingBox.xmax - det.boundingBox.xmin);
    const natH = Math.round(det.boundingBox.ymax - det.boundingBox.ymin);
    if (natW <= 0 || natH <= 0) return;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = natW;
    offCanvas.height = natH;
    const offCtx = offCanvas.getContext('2d');
    if (offCtx) {
      offCtx.drawImage(imgEl, natX, natY, natW, natH, 0, 0, natW, natH);
    }
    const label = `${det.className} ${(det.confidence * 100).toFixed(1)}%`;
    try {
      const cropUrl = offCanvas.toDataURL('image/jpeg');
      newCrops.push({ url: cropUrl, label, id: det.id }); // include detection id
    } catch (e) {
      console.error("Canvas tainted or invalid subimage", e);
    }
  });
  setCroppedImages(newCrops);

};

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', minHeight: 200 }}>
        <img
          ref={imgRef}
          crossOrigin="anonymous"
          alt="Detected"
          src={`http://127.0.0.1:5000/static/uploads/${imagePath}`}
          onLoad={handleImageLoad}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
        {/* Detection count overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          Detections: {detections.length}
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {croppedImages.length > 0 && (
          <div className="cropped-detections-container">
            {croppedImages.map((crop) => (
              <div key={crop.id} className="cropped-detection-item">
                <img src={crop.url} className="cropped-image" alt={crop.label} />
                <div className="cropped-details">
                  <span>{crop.label}</span>
                  <button 
                    className="delete-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${crop.label} detection?`)) {
                        deleteDetection(crop.id);
                      }
                    }}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DetailsPanelProps {
  imagePath: string;
  detections: Detection[];
  selectedClass: string;
  minConfidence: number;
  onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({
  imagePath,
  detections,
  selectedClass,
  minConfidence,
  onClose
}) => {
  const filtered = detections.filter(
    (d) =>
      (!selectedClass || d.className === selectedClass) &&
      d.confidence * 100 >= minConfidence
  );

  return (
    <div className="details-panel">
      <button className="close-btn" onClick={onClose}>X</button>
      <h3>Detection Details</h3>
      <div style={{ marginBottom: '1rem' }}>
      <ImageWithDetections
        key={`${imagePath}-${minConfidence}`}
        imagePath={imagePath}
        detections={filtered}
        minConfidence={minConfidence}
        deleteDetection={() => {}}
      />
      </div>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Confidence</th>
            <th>Detected Time</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((det) => (
            <tr key={det.id}>
              <td>{det.className}</td>
              <td>{(det.confidence * 100).toFixed(1)}%</td>
              <td>{new Date(det.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
