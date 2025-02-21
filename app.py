from flask import Flask, request, jsonify
import cv2
import numpy as np
# Example: if you use a YOLO model from Ultralytics
from ultralytics import YOLO

app = Flask(__name__)

# Load your trained model from one of the Rubbish runs folders.
# Update the path as needed. For example, if you use YOLO:
model = YOLO("Rubbish/runs/detect/train/weights/best.pt")

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    
    # Run inference on the image
    results = model(img)
    # Process the results (this example extracts bounding boxes)
    boxes = results[0].boxes.xyxy.tolist()  # adjust as needed

    return jsonify({"boxes": boxes})

if __name__ == '__main__':
    app.run(debug=True)
