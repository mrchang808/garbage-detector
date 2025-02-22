from flask import Flask, Response, request, jsonify
from flask_cors import CORS  # <-- import CORS
import cv2
import numpy as np
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)  # <-- Enable CORS for all routes

# Load your trained model
model = YOLO("Rubbish/runs/detect/train/weights/best.pt")

# Open webcam (change index if needed)
cap = cv2.VideoCapture(0)  # 0 for default webcam, 1 for external camera

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    results = model(img)
    detections_data = []

    for det in results[0].boxes:
        xyxy = det.xyxy.cpu().numpy().squeeze().tolist()  # [xmin, ymin, xmax, ymax]
        conf = float(det.conf.item())                     # e.g. 0.97
        cls_id = int(det.cls.item())                      # class index
        class_name = model.names.get(cls_id, f"cls_{cls_id}")  # e.g. "plastic"

        # If you only want high-confidence objects, you can filter here
        # e.g. if conf < 0.5: continue

        # Format bounding box data more descriptively
        detections_data.append({
            "className": class_name,
            "confidence": round(conf, 2),
            "boundingBox": {
                "xmin": round(xyxy[0], 2),
                "ymin": round(xyxy[1], 2),
                "xmax": round(xyxy[2], 2),
                "ymax": round(xyxy[3], 2)
            }
        })

    # Return a top-level object with an array of detections
    return jsonify({
        "numDetections": len(detections_data),
        "detections": detections_data
    })

def generate_frames():
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            results = model(frame, verbose=False)
            detections = results[0].boxes

            for det in detections:
                xyxy = det.xyxy.cpu().numpy().squeeze()
                conf = det.conf.item()
                cls_id = int(det.cls.item())
                class_name = model.names.get(cls_id, f"cls_{cls_id}")

                if conf >= 0.7:  # Confidence threshold
                    xmin, ymin, xmax, ymax = map(int, xyxy)
                    
                    # Map class names to colors (BGR format)
                    if class_name.lower() == "plastic":
                        color = (255, 0, 0)   # Blue
                    elif class_name.lower() == "paper":
                        color = (0, 255, 0)   # Green
                    elif class_name.lower() == "metal":
                        color = (0, 0, 255)   # Red
                    elif class_name.lower() == "glass":
                        color = (0, 255, 255) # Yellow
                    else:
                        color = (0, 255, 0)   # Default to green

                    cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                    cv2.putText(frame, f"{class_name}: {conf:.2f}", (xmin, ymin - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


@app.route('/stream')
def stream():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)
