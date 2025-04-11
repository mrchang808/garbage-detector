import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Detection } from '../types';

// Add type definition for waste types
type WasteType = 'plastic' | 'metal' | 'glass' | 'paper' | 'bottle';

const wasteIcons: Record<WasteType, string> = {
  plastic: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="%23E8C74D"><path d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/></svg>',
  metal: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="%23A3DADC"><path d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/></svg>',
  glass: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="%232C003E"><path d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/></svg>',
  paper: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="%234CAF50"><path d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/></svg>',
  bottle: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="%23FF9800"><path d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/></svg>'
};

// Add this utility function in MapComponent.tsx
const isValidWasteType = (type: string): type is WasteType => {
  return Object.keys(wasteIcons).includes(type.toLowerCase());
};

const createMarkerIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  return new L.Icon({
    iconUrl: isValidWasteType(lowerType) ? wasteIcons[lowerType] : wasteIcons.plastic,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const MapComponent = ({ detections }: { detections: Detection[] }) => {
  return (
    <div className="map-container" style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer 
        center={[43.2565, 76.9285]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {detections.map((detection, index) => (
          detection.latitude && detection.longitude ? (
            <Marker
              key={index}
              position={[detection.latitude, detection.longitude]}
              icon={createMarkerIcon(detection.class_name)}
            >
              <Popup>
                <div style={{ 
                  color: '#1a1a1a',
                  padding: '10px',
                  maxWidth: '200px'
                }}>
                  <strong style={{ 
                    color: '#E8C74D',
                    display: 'block',
                    marginBottom: '5px'
                  }}>
                    {detection.class_name.toUpperCase()}
                  </strong>
                  <div style={{ marginBottom: '10px' }}>
                    Confidence: {(detection.confidence * 100).toFixed(1)}%
                  </div>
                  {detection.image_path && (
                    <img 
                      src={`http://localhost:5000/${detection.image_path}`}
                      alt={detection.class_name}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}
                    />
                  )}
                  <div style={{ 
                    fontSize: '0.8em',
                    color: '#666'
                  }}>
                    Detected: {new Date(detection.timestamp).toLocaleString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;