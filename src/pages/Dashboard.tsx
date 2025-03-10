import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import UAVStatusWidget from '../components/UAVStatusWidget'; // Adjust the path as necessary

/** Detection interface from your code **/
interface Detection {
  id: number;
  className: string;
  confidence: number; // 0.0 to 1.0
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
  const [minConfidence, setMinConfidence] = useState<number>(50);
  const [classes, setClasses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // For "recently added" or the "detailed info" on the right
  const [selectedImagePath, setSelectedImagePath] = useState<string>('');

  useEffect(() => {
    fetchDetections();
  }, [startDate, endDate]);

  const fetchDetections = async () => {
    try {
      let query = `http://127.0.0.1:5000/detections`;
      const params = [];

      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);

      if (params.length > 0) {
        query += `?${params.join("&")}`;
      }

      const response = await axios.get<Detection[]>(query);
      const fetched = response.data || [];

      setDetections(fetched);

      // Group detections by image_path
      const imageGroups: { [key: string]: Detection[] } = {};
      fetched.forEach((det) => {
        if (!det.image_path) return;
        if (!imageGroups[det.image_path]) {
          imageGroups[det.image_path] = [];
        }
        imageGroups[det.image_path].push(det);
      });
      setGroupedDetections(imageGroups);

      // Extract unique class names
      const uniqueClasses = Array.from(new Set(fetched.map(d => d.className)));
      setClasses(uniqueClasses);
    } catch (error) {
      console.error("Error fetching detections:", error);
    }
  };

  // Sort all detections by timestamp descending
  const sortedDetections = [...detections].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Show just the 5 most recent
  const recentDetections = sortedDetections.slice(0, 5);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Detection Dashboard</h2>


      <div style={{ marginBottom: '20px' }}>
        <UAVStatusWidget />
      </div>

      {/* Filters */}
      <div className="filters-container">
        {/* Class Filter */}
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

        {/* Confidence Filter */}
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

        {/* Start/End Date */}
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
        <div className="recent-detection-grid">
          {recentDetections.map((det) => (
            <div
              key={det.id}
              className="recent-detection-card"
              onClick={() => {
                // If the user clicks, jump them to that image in the main grid
                setSelectedImagePath(det.image_path || '');
              }}
            >
              <p>{det.className} - {(det.confidence * 100).toFixed(0)}%</p>
              <p>{new Date(det.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The main detection grid, grouped by image_path */}
      <div className="detection-grid">
        {Object.keys(groupedDetections)
          .sort() // optionally sort imagePaths
          .map((imgPath) => {
            // Filter out detections that do not match the class/confidence
            const valid = groupedDetections[imgPath].filter((det) => {
              const passClass = !selectedClass || det.className === selectedClass;
              const passConfidence = det.confidence * 100 >= minConfidence;
              return passClass && passConfidence;
            });
            if (valid.length === 0) return null; // no detections to show

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
                />
              </div>
            );
          })}
      </div>

      {/* If user clicks on an image, show detection details in a side panel or a box */}
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
 * Draw bounding boxes over the wide image + show cropped sub-images below
 */
interface ImageWithDetectionsProps {
  imagePath: string;
  detections: Detection[];
  minConfidence: number;
}

const ImageWithDetections: React.FC<ImageWithDetectionsProps> = ({ imagePath, detections, minConfidence }) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [croppedImages, setCroppedImages] = useState<{ url: string; label: string }[]>([]);

  // Draw bounding boxes on the displayed wide image
  const drawBoxes = () => {
    if (!imgRef.current || !canvasRef.current) return;

    const imgEl = imgRef.current;
    const canvasEl = canvasRef.current;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    // Match canvas to the displayed size
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

      // Box
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Label
      const label = `${det.className} ${(det.confidence * 100).toFixed(1)}%`;
      ctx.font = '14px Arial';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,255,0,0.5)';
      ctx.fillRect(x, y - 18, textWidth + 6, 18);
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 3, y - 5);
    });
  };

  // Crop out each detection region
  const cropDetections = () => {
    if (!imgRef.current) return;

    const imgEl = imgRef.current;
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imgEl;

    const scaleX = clientWidth / (naturalWidth || 1);
    const scaleY = clientHeight / (naturalHeight || 1);

    const newCrops: { url: string; label: string }[] = [];

    detections.forEach((det) => {
      if (det.confidence * 100 < minConfidence) return;

      const { xmin, ymin, xmax, ymax } = det.boundingBox;
      const sx = xmin * scaleX;
      const sy = ymin * scaleY;
      const sw = (xmax - xmin) * scaleX;
      const sh = (ymax - ymin) * scaleY;

      // Offscreen canvas to hold the crop
      const offCanvas = document.createElement('canvas');
      offCanvas.width = sw;
      offCanvas.height = sh;

      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);
      }

      const cropUrl = offCanvas.toDataURL('image/jpeg');
      const label = `${det.className} ${(det.confidence * 100).toFixed(1)}%`;
      newCrops.push({ url: cropUrl, label });
    });

    setCroppedImages(newCrops);
  };

  // Fire both bounding box drawing + cropping once the image is loaded
  const handleImageLoad = () => {
    drawBoxes();
    cropDetections();
  };

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', minHeight: 200 }}>
        <img
          ref={imgRef}
          alt="Detected"
          src={`http://127.0.0.1:5000/static/uploads/${imagePath}`}
          onLoad={handleImageLoad}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
      </div>

      {/* Cropped sub-images below */}
      <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {croppedImages.map((crop, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            <img src={crop.url} alt={`Crop ${idx}`} style={{ maxWidth: '200px', display: 'block' }} />
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{crop.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 
 * COMPONENT: DetailsPanel 
 * Now also uses the same <ImageWithDetections> so that
 * in the details view, you see bounding boxes + cropped images
 */
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
  // Filter again in case user changed slider
  const filtered = detections.filter(
    (d) =>
      (!selectedClass || d.className === selectedClass) &&
      d.confidence * 100 >= minConfidence
  );

  return (
    <div className="details-panel">
      <button className="close-btn" onClick={onClose}>
        X
      </button>
      <h3>Detection Details</h3>

      {/* Show bounding boxes + cropped images here, same as main grid */}
      <div style={{ marginBottom: '1rem' }}>
        <ImageWithDetections
          key={`${imagePath}-${minConfidence}`} 
          imagePath={imagePath} 
          detections={filtered}
          minConfidence={minConfidence}
        />
      </div>

      {/* Optionally, keep the table for textual info */}
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
