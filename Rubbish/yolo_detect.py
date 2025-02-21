import cv2
import os
import time
import glob
import numpy as np
from ultralytics import YOLO

def main():
    # =====================================
    # PARAMETERS
    # =====================================
    # 1) Path to the trained YOLO model (best.pt)
    model_path = r"Rubbish\runs\detect\train10\weights\best.pt"
    
    # 2) Camera index (Iriun) - usually 1 if 0 is occupied by the built-in camera
    camera_index = 0
    
    # Confidence threshold above which bounding boxes are displayed
    conf_threshold = 0.65

    # Colors for drawing bounding boxes (Tableau 10)
    bbox_colors = [
        (164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106),
        (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)
    ]

    # =====================================
    # 1. Model check and loading
    # =====================================
    if not os.path.exists(model_path):
        print(f"Error: model file {model_path} not found")
        return
    model = YOLO(model_path)
    labels = model.names  # Dictionary or list {class_idx: class_name}

    # =====================================
    # 2. Camera initialization (Iriun)
    # =====================================
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"Failed to open Iriun camera with index {camera_index}.")
        print("Try another index (0, 1, 2...) or make sure Iriun is running.")
        return

    # Variables for FPS calculation
    frame_rate_buffer = []
    fps_avg_len = 30

    print("Press 'q' to exit, 's' to pause, 'p' to save the frame.")
    
    while True:
        t_start = time.perf_counter()
        
        # Read frame
        ret, frame = cap.read()
        if not ret or frame is None:
            print("Failed to get frame. Camera is unavailable or disconnected.")
            break
        
        # Run detection (YOLOv8)
        results = model(frame, verbose=False)
        detections = results[0].boxes  # All objects in the current frame
        
        object_count = 0
        
        # Draw each detection
        for det in detections:
            # Coordinates (xmin, ymin, xmax, ymax)
            xyxy = det.xyxy.cpu().numpy().squeeze()
            conf = det.conf.item()           # Confidence
            cls_id = int(det.cls.item())     # Class index (0, 1, 2...)
            
            if conf >= conf_threshold:
                # Round coordinates to int
                xmin, ymin, xmax, ymax = xyxy.astype(int)
                
                # Choose color
                color = bbox_colors[cls_id % len(bbox_colors)]
                
                # Draw bounding box
                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                
                # Prepare label
                class_name = labels[cls_id] if cls_id in labels else f"cls {cls_id}"
                label = f"{class_name}: {conf:.2f}"
                
                # Draw rectangle for label
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(
                    frame,
                    (xmin, ymin - label_size[1] - 5),
                    (xmin + label_size[0], ymin),
                    color, -1
                )
                cv2.putText(frame, label, (xmin, ymin - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
                
                object_count += 1
        
        # =====================================
        # 3. FPS
        # =====================================
        t_stop = time.perf_counter()
        frame_time = t_stop - t_start
        fps = 1 / frame_time if frame_time > 0 else 0
        frame_rate_buffer.append(fps)
        if len(frame_rate_buffer) > fps_avg_len:
            frame_rate_buffer.pop(0)
        avg_frame_rate = np.mean(frame_rate_buffer)
        
        # Display FPS and object count
        cv2.putText(frame, f"FPS: {avg_frame_rate:.2f}", (10, 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(frame, f"Objects: {object_count}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        # =====================================
        # 4. Show frame
        # =====================================
        cv2.imshow("Iriun YOLO detection", frame)
        
        # Key handling
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            # Pause, wait for any key to continue
            cv2.waitKey()
        elif key == ord('p'):
            # Save frame
            cv2.imwrite("capture.png", frame)
            print("Frame saved as capture.png")

    cap.release()
    cv2.destroyAllWindows()
    print("Program terminated.")

if __name__ == "__main__":
    main()
