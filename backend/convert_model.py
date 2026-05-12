import os
from ultralytics import YOLO

# 1. Load the standard YOLOv11n model
# Assumes the script is run from the backend directory
model_path = "yolo11n.pt"

if not os.path.exists(model_path):
    print(f"❌ Error: {model_path} not found in the current directory.")
    exit(1)

print(f"🔄 Loading {model_path}...")
model = YOLO(model_path)

# 2. Export to OpenVINO format (Optimized for Raspberry Pi / Intel CPU)
# This will create a directory called 'yolo11n_openvino_model/'
print("🚀 Converting to OpenVINO format... This may take a minute.")
export_path = model.export(format="openvino")

print(f"✅ Success! Your optimized model is ready at: {export_path}")
print("Transfer the folder 'yolo11n_openvino_model' to your Raspberry Pi.")
