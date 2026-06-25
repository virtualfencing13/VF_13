from ultralytics import YOLO

print("🚀 Neural Optimizer: Loading yolo11n.pt...")
model = YOLO("yolo11n.pt")

print("⚡ Neural Optimizer: Exporting to ONNX format with 320px optimization...")
# Exporting with a lower imgsz (320px) makes the inference blistering fast on Pi 5 CPU while retaining accurate human bounding shapes!
onnx_path = model.export(format="onnx", imgsz=320, simplify=True)
print(f"✅ SUCCESS: Model optimized and saved to: {onnx_path}")
