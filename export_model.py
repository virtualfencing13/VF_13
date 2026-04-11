"""
export_model.py
===============
One-time script: exports yolo11n.pt to OpenVINO INT8 format.

Run ONCE before your first production use:
    python export_model.py

Output folder: yolo11n_openvino_model/
After export, update config.json:
    "model_path": "yolo11n_openvino_model/"

Speed improvement: ~3-4x faster inference on Intel CPU.
No accuracy change for person detection at normal distances.
"""

from ultralytics import YOLO
import os

MODEL_PT   = "yolo11n.pt"
OUT_FOLDER = "yolo11n_openvino_model"

print("=" * 56)
print("  Virtual Fencing — Model Export to OpenVINO INT8")
print("=" * 56)
print(f"\nSource : {MODEL_PT}")
print(f"Target : {OUT_FOLDER}/\n")

if os.path.isdir(OUT_FOLDER):
    print(f"[INFO] Export folder already exists: {OUT_FOLDER}/")
    print("[INFO] Delete it and rerun if you want to re-export.\n")
else:
    model = YOLO(MODEL_PT)
    model.export(
        format = "openvino",
        imgsz  = 640,
        half   = True,        # FP16 weights
        int8   = True,        # INT8 quantisation for extra CPU speed
    )
    print(f"\n[DONE] OpenVINO model saved → {OUT_FOLDER}/")

print("\nNext step — update config.json:")
print(f'  "model_path": "{OUT_FOLDER}/"')
print("\nThen run:  python main.py\n")
