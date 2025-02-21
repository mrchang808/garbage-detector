from flask import Flask, Response, request, jsonify
from flask_cors import CORS  # <-- import CORS
import cv2
import numpy as np
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)  # <-- Enable CORS for all routes

# Load your trained model
model = YOLO("Rubbish/runs/detect/train/weights/best.pt")

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




if __name__ == '__main__':
    app.run(debug=True)
