"""
modules/detector.py
===================
PersonDetector — wraps YOLO11n (Ultralytics) for person-only detection.

Model loading priority:
  1. If model_path points to an OpenVINO folder  → loads optimised IR model
  2. If model_path ends with .pt                 → loads PyTorch weights
     (auto-downloads yolo11n.pt on first run)

To export yolo11n to OpenVINO INT8 once (run separately):
    python export_model.py

COCO class 0 = person. All other classes are suppressed before results leave
this module.
"""

from __future__ import annotations
import os
import numpy as np
from ultralytics import YOLO


PERSON_CLASS_ID = 0   # COCO person class


class PersonDetector:
    """
    Real-time person detector backed by YOLO11n.

    Returns a list of (x1, y1, x2, y2, confidence) tuples.
    """

    def __init__(
        self,
        model_path: str   = "yolo11n.pt",
        confidence: float = 0.45,
        device:     str   = "cpu",
    ):
        """
        Parameters
        ----------
        model_path : Path to .pt file OR OpenVINO model folder.
        confidence : Detection confidence threshold (0–1).
        device     : "cpu", "cuda:0", "mps", etc.
        """
        self.confidence = confidence
        self.device     = device
        self._model     = None

        self._load_model(model_path)

    # ── Model loading ─────────────────────────────────────────────────────────

    def _load_model(self, path: str):
        """Load model from .pt or OpenVINO folder."""
        if os.path.isdir(path):
            # OpenVINO IR directory (created by export_model.py)
            print(f"[PersonDetector] Loading OpenVINO model → {path}")
            self._model = YOLO(path)
            print(f"[PersonDetector] OpenVINO model ready  conf={self.confidence}")
        elif os.path.isfile(path):
            print(f"[PersonDetector] Loading PyTorch model → {path}")
            self._model = YOLO(path)
            print(f"[PersonDetector] PyTorch model ready  conf={self.confidence}")
        else:
            # Auto-download (ultralytics fetches from GitHub releases)
            print(f"[PersonDetector] Downloading {path} …")
            self._model = YOLO(path)
            print(f"[PersonDetector] Model ready  conf={self.confidence}")

    # ── Public API ────────────────────────────────────────────────────────────

    def detect(self, frame: np.ndarray) -> list[tuple[int, int, int, int, float]]:
        """
        Run inference on a single BGR frame.

        Parameters
        ----------
        frame : BGR numpy array (H × W × 3).

        Returns
        -------
        List of (x1, y1, x2, y2, confidence) — persons only, integers.
        """
        if frame is None or frame.size == 0:
            return []

        results = self._model.predict(
            source  = frame,
            conf    = self.confidence,
            classes = [PERSON_CLASS_ID],
            device  = self.device,
            verbose = False,
        )

        detections: list[tuple[int, int, int, int, float]] = []

        for result in results:
            if result.boxes is None:
                continue
            boxes     = result.boxes.xyxy.cpu().numpy()
            confs     = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy()

            for box, conf, cls_id in zip(boxes, confs, class_ids):
                if int(cls_id) != PERSON_CLASS_ID:
                    continue
                x1, y1, x2, y2 = map(int, box)
                detections.append((x1, y1, x2, y2, float(conf)))

        return detections

    # ── Utility ───────────────────────────────────────────────────────────────

    @staticmethod
    def center_of(det: tuple[int, int, int, int, float]) -> tuple[int, int]:
        """Return (cx, cy) center of a detection bounding box."""
        x1, y1, x2, y2, _ = det
        return (x1 + x2) // 2, (y1 + y2) // 2
