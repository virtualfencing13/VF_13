"""
modules/fence.py
================
VirtualFence — interactive polygon zone drawn by the user with the mouse.
"""

from __future__ import annotations
import cv2
import json
import os
import numpy as np


class VirtualFence:
    """Interactive single-zone polygon fence."""

    def __init__(self):
        self.points:     list[list[int]] = []
        self.enabled:    bool  = True
        self.is_drawing: bool  = False
        self.mouse_pos:  tuple[int, int] | None = None

    # ── Mouse callback ────────────────────────────────────────────────────────

    def mouse_callback(self, event: int, x: int, y: int, flags: int, param) -> None:
        """Register with cv2.setMouseCallback(window, fence.mouse_callback)."""
        self.mouse_pos = (x, y)

        if event == cv2.EVENT_LBUTTONDOWN:
            self.is_drawing = True
            self.points.append([x, y])
            print(f"[VirtualFence] Point REGISTERED: ({x}, {y}) | Total: {len(self.points)}")

        elif event == cv2.EVENT_RBUTTONDOWN:
            if self.points:
                p = self.points.pop()
                print(f"[VirtualFence] Point UNDONE: {p}")
                if not self.points:
                    self.is_drawing = False

    # ── Intrusion check ───────────────────────────────────────────────────────

    def check_intrusions(
        self,
        detections: list[tuple[int, int, int, int, float]],
    ) -> tuple[list, list]:
        if not self.enabled or len(self.points) < 3:
            return [], list(detections)

        points_np = np.array(self.points, dtype=np.int32)
        intruders: list = []
        safe:      list = []

        for det in detections:
            x1, y1, x2, y2, _ = det
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            dist = cv2.pointPolygonTest(points_np, (float(cx), float(cy)), False)
            if dist >= 0:
                intruders.append(det)
            else:
                safe.append(det)

        return intruders, safe

    def toggle(self) -> None:
        self.enabled = not self.enabled

    def clear(self) -> None:
        self.points      = []
        self.enabled     = True
        self.is_drawing  = False
        self.mouse_pos   = None

    def finalize(self) -> bool:
        if len(self.points) < 3:
            print("[VirtualFence] Need at least 3 points to form a zone.")
            return False
        self.is_drawing = False
        print(f"[VirtualFence] Finalized with {len(self.points)} points.")
        return True

    def has_fence(self) -> bool:
        return len(self.points) >= 3 and not self.is_drawing

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self, path: str = "fence.json") -> None:
        with open(path, "w") as f:
            json.dump({"points": self.points, "enabled": self.enabled}, f)
        print(f"[VirtualFence] Saved → {path}")

    def load(self, path: str = "fence.json") -> None:
        if not os.path.isfile(path):
            return
        try:
            with open(path, "r") as f:
                data = json.load(f)
            raw_points = data.get("points")
            if raw_points:
                self.points = raw_points
            else:
                rect = data.get("rect")
                if rect:
                    x1, y1, x2, y2 = rect
                    self.points = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
            self.enabled = data.get("enabled", True)
            print(f"[VirtualFence] Loaded {len(self.points)} points.")
        except Exception as e:
            print(f"[VirtualFence] Load failed: {e}")
