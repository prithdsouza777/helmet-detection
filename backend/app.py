from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = "../runs/detect/train/weights/best.pt"
model = YOLO(MODEL_PATH)

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if 'frame' not in request.files:
            return jsonify({'error': 'No frame provided'}), 400
        
        frame_file = request.files['frame']
        confidence_threshold = float(request.form.get('confidence_threshold', 0.75)) / 100
        
        image = Image.open(BytesIO(frame_file.read()))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        results = model(frame, stream=True, conf=confidence_threshold)
        
        detections = []
        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                if conf < confidence_threshold:
                    continue
                
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                label = model.names[cls]
                
                detections.append({
                    'x1': x1,
                    'y1': y1,
                    'x2': x2,
                    'y2': y2,
                    'label': label,
                    'confidence': conf
                })
        
        return jsonify({'detections': detections})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'loaded'})

if __name__ == '__main__':
    print(f"Loading model from: {MODEL_PATH}")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
