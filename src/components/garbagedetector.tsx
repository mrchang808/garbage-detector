import React, { useState, useRef, useEffect } from 'react';

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
  id: string;
  file: File;         // keep the file so we can re-measure if needed
  detections: Detection[];
}

function GarbageDetector() {
  // Generate a session ID only once per session.
  const [sessionId] = useState(() => crypto.randomUUID());

  const [imageResults, setImageResults] = useState<ImageResult[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const newResults: ImageResult[] = [];

    for (const file of Array.from(event.target.files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId); // send the sessionId with the file

      // Send file to the backend
      const response = await fetch('http://127.0.0.1:5000/detect', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      // Store the results plus the original file
      newResults.push({
        id: crypto.randomUUID(),
        file,
        detections: data.detections || [],
      });
    }

    setImageResults((prev) => [...prev, ...newResults]);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h2>Garbage Detector</h2>
      <p style={{ fontSize: '16px', marginBottom: '10px', color: '#ccc' }}>
        Your session ID: <strong>{sessionId}</strong>
      </p>
      <input type="file" multiple onChange={handleFileChange} />

      {imageResults.map((result) => (
        <ImageWithDetections key={result.id} result={result} />
      ))}
    </div>
  );
}

// Separate component to handle drawing on canvas
function ImageWithDetections({ result }: { result: ImageResult }) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [objectURL, setObjectURL] = useState('');
  
  // Create an object URL for the file so we can display it
  useEffect(() => {
    const url = URL.createObjectURL(result.file);
    setObjectURL(url);
    return () => URL.revokeObjectURL(url);
  }, [result.file]);

  // Once the image has loaded, draw bounding boxes on the canvas
  const handleImageLoad = () => {
    if (!imgRef.current || !canvasRef.current) return;

    const imgEl = imgRef.current;
    const canvasEl = canvasRef.current;

    // Match canvas size to displayed image size
    canvasEl.width = imgEl.width;
    canvasEl.height = imgEl.height;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // Calculate scaling factors if the image is displayed at a different size
    // than its natural (original) size.
    const scaleX = imgEl.width / imgEl.naturalWidth;
    const scaleY = imgEl.height / imgEl.naturalHeight;

    // Draw each detection
    result.detections.forEach((det) => {
      const { xmin, ymin, xmax, ymax } = det.boundingBox;
      // Scale bounding box if necessary
      const x = xmin * scaleX;
      const y = ymin * scaleY;
      const w = (xmax - xmin) * scaleX;
      const h = (ymax - ymin) * scaleY;

      // Draw the rectangle
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      const label = `${det.className}: ${(det.confidence * 100).toFixed(1)}%`;
      ctx.font = '16px Arial';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 16; // approximate
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fillRect(x, y - textHeight, textWidth + 6, textHeight);

      // Draw label text
      ctx.fillStyle = 'black';
      ctx.fillText(label, x + 3, y - 3);
    });
  };

  return (
    <div style={{ position: 'relative', marginTop: 20 }}>
      <img
        ref={imgRef}
        src={objectURL}
        alt="uploaded"
        style={{ maxWidth: '100%', display: 'block' }}
        onLoad={handleImageLoad}
      />
      {/* Canvas is positioned over the image */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          maxWidth: '100%',    // match the img's style
        }}
      />
    </div>
  );
}

export default GarbageDetector;
