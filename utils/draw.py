"""
utils/draw.py
=============
Visualizer — all OpenCV drawing in one place.
"""

from __future__ import annotations
import cv2
import time
import numpy as np
from modules.fence import VirtualFence


# ── BGR colour constants ───────────────────────────────────────────────────────
WHITE  = (255, 255, 255)
BLACK  = (  0,   0,   0)
GREEN  = (  0, 220,  90)
RED    = (  0,  50, 255)
CYAN   = (  0, 255, 255)   # bright cyan (BGR)
YELLOW = (  0, 220, 255)
GRAY   = (160, 160, 160)
ORANGE = (  0, 165, 255)


class Visualizer:

    def __init__(self, cfg: dict):
        self.c_safe      = tuple(cfg.get("bbox_color_safe",     [0, 220, 90]))
        self.c_intruder  = tuple(cfg.get("bbox_color_intruder", [0, 50, 255]))
        self.f_safe      = tuple(cfg.get("fence_color_safe",    [0, 220, 90]))
        self.f_unsafe    = tuple(cfg.get("fence_color_unsafe",  [0, 50, 255]))
        self.f_thick     = cfg.get("fence_thickness",  3)
        self.b_thick     = cfg.get("bbox_thickness",   2)
        self.font_scale  = cfg.get("font_scale",       0.58)
        self.show_dot    = cfg.get("show_center_dot",  True)
        self.show_conf   = cfg.get("show_confidence",  True)
        self.show_fps    = cfg.get("show_fps",         True)
        self._font       = cv2.FONT_HERSHEY_SIMPLEX
        self._start_time = time.time()

    def render(
        self,
        frame:        np.ndarray,
        detections:   list,
        intruders:    list,
        safe_persons: list,
        fence:        VirtualFence,
        status:       str,
        fps:          float,
        frame_idx:    int,
        draw_mode:    bool = False,
    ) -> np.ndarray:
        unsafe = status == "UNSAFE"
        self._draw_fence(frame, fence, unsafe)

        for det in safe_persons:
            self._draw_box(frame, det, intruder=False)
        for det in intruders:
            self._draw_box(frame, det, intruder=True)

        self._draw_banner(frame, status)
        self._draw_hud(frame, fps, len(detections), len(intruders), fence, frame_idx, draw_mode)

        if draw_mode and not fence.points:
            self._draw_mode_overlay(frame)

        self._draw_hints(frame)
        return frame

    def _draw_fence(self, frame: np.ndarray, fence: VirtualFence, unsafe: bool):
        if len(fence.points) < 3:
            return
        color = self.f_unsafe if unsafe else self.f_safe
        pts = np.array(fence.points, dtype=np.int32)
        self._draw_mesh(frame, pts, color, alpha=0.15)
        cv2.polylines(frame, [pts], isClosed=True, color=color, thickness=self.f_thick, lineType=cv2.LINE_AA)
        cv2.polylines(frame, [pts], isClosed=True, color=WHITE, thickness=1, lineType=cv2.LINE_AA)

        label = "RESTRICTED ZONE"
        m = np.mean(pts, axis=0).astype(int)
        (tw, th), _ = cv2.getTextSize(label, self._font, 0.50, 2)
        lx, ly = m[0] - tw // 2, m[1] + th // 2
        cv2.putText(frame, label, (lx + 1, ly + 1), self._font, 0.50, BLACK, 2, cv2.LINE_AA)
        cv2.putText(frame, label, (lx, ly),          self._font, 0.50, color, 2, cv2.LINE_AA)

    def _draw_mesh(self, frame: np.ndarray, pts: np.ndarray, color: tuple, alpha: float):
        overlay = frame.copy()
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillPoly(mask, [pts], 255)
        h, w = frame.shape[:2]
        step = 20
        for x in range(0, w, step):
            cv2.line(overlay, (x, 0), (x, h), color, 1)
        for y in range(0, h, step):
            cv2.line(overlay, (0, y), (w, y), color, 1)
        grid_only = cv2.bitwise_and(overlay, overlay, mask=mask)
        cv2.addWeighted(grid_only, alpha, frame, 1.0, 0, frame)
        fill_overlay = frame.copy()
        cv2.fillPoly(fill_overlay, [pts], color)
        cv2.addWeighted(fill_overlay, 0.1, frame, 0.9, 0, frame)

    def draw_fence_preview(self, frame: np.ndarray, fence: VirtualFence):
        """Render instructions, crosshair, and connecting lines while drawing."""
        if not fence.mouse_pos:
            return

        mx, my = fence.mouse_pos
        color  = CYAN
        h, w   = frame.shape[:2]

        # 1. Target Crosshair (Always follow mouse in draw mode)
        cv2.line(frame, (mx, 0), (mx, h), color, 1, cv2.LINE_AA)
        cv2.line(frame, (0, my), (w, my), color, 1, cv2.LINE_AA)
        cv2.circle(frame, (mx, my), 8, color, 1, cv2.LINE_AA)
        cv2.circle(frame, (mx, my), 1, color, -1, cv2.LINE_AA)

        # 2. Existing points and Ghost Lines
        if fence.points:
            pts = np.array(fence.points, dtype=np.int32)
            # Draw glow and points
            for p in fence.points:
                cv2.circle(frame, tuple(p), 6, color, -1, cv2.LINE_AA)
                cv2.circle(frame, tuple(p), 8, WHITE, 1, cv2.LINE_AA)
            
            # Line between established points
            if len(fence.points) > 1:
                cv2.polylines(frame, [pts], False, color, 2, cv2.LINE_AA)

            # Ghost line from last point to mouse
            cv2.line(frame, tuple(fence.points[-1]), (mx, my), color, 2, cv2.LINE_8)
            
            # Highlight first point if near (snap target)
            dist = np.linalg.norm(np.array(fence.points[0]) - np.array([mx, my]))
            if dist < 20:
                cv2.circle(frame, tuple(fence.points[0]), 12, GREEN, 3, cv2.LINE_AA)

        # 3. Dynamic instruction text
        label = "LEFT-CLICK: Add Point | RIGHT-CLICK: Undo | ENTER: Finish"
        if len(fence.points) == 0:
            label = "CLICK ANYWHERE TO START DRAWING"
        elif len(fence.points) < 3:
            label = "PLACE AT LEAST 3 POINTS"
        
        (tw, th), _ = cv2.getTextSize(label, self._font, 0.50, 1)
        lx, ly = (w - tw) // 2, h - 30
        cv2.rectangle(frame, (lx - 10, ly - th - 10), (lx + tw + 10, ly + 10), BLACK, -1)
        cv2.putText(frame, label, (lx, ly), self._font, 0.50, color, 1, cv2.LINE_AA)

    def _draw_mode_overlay(self, frame: np.ndarray):
        h, w = frame.shape[:2]
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.35, frame, 0.65, 0, frame)

        lines = [
            ("POLYGON DRAW MODE", CYAN, 0.80, 2),
            ("Define a custom enclosure by clicking points", WHITE, 0.45, 1),
            ("Use ENTER to finalize the grid", GREEN, 0.55, 2),
        ]
        y = h // 2 - 40
        for text, color, scale, thick in lines:
            (tw, th), _ = cv2.getTextSize(text, self._font, scale, thick)
            x = (w - tw) // 2
            cv2.putText(frame, text, (x, y), self._font, scale, color, thick, cv2.LINE_AA)
            y += th + 25

    def _draw_box(self, frame, det, intruder):
        x1, y1, x2, y2, conf = det
        color = self.c_intruder if intruder else self.c_safe
        tag = "INTRUDER" if intruder else "PERSON"
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, self.b_thick)
        (tw, th), _ = cv2.getTextSize(tag, self._font, self.font_scale, 1)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
        cv2.putText(frame, tag, (x1 + 3, y1 - 4), self._font, self.font_scale, BLACK, 1, cv2.LINE_AA)

    def _draw_banner(self, frame, status):
        unsafe = status == "UNSAFE"
        text = "!! ALERT — INTRUSION !!" if unsafe else "SYSTEM SAFE"
        color = RED if unsafe else GREEN
        (tw, th), _ = cv2.getTextSize(text, self._font, 0.7, 2)
        h, w = frame.shape[:2]
        tx, ty = (w - tw) // 2, th + 20
        cv2.rectangle(frame, (tx - 10, ty - th - 10), (tx + tw + 10, ty + 10), BLACK, -1)
        cv2.rectangle(frame, (tx - 10, ty - th - 10), (tx + tw + 10, ty + 10), color, 2)
        cv2.putText(frame, text, (tx, ty), self._font, 0.7, color, 2, cv2.LINE_AA)

    def _draw_hud(self, frame, fps, total, n_intruders, fence, frame_idx, draw_mode):
        lines = [
            (f"FPS      : {fps:.1f}", WHITE),
            (f"Persons  : {total}", WHITE),
            (f"Intruders: {n_intruders}", RED if n_intruders > 0 else WHITE),
            (f"Fence    : {'[DRAWING]' if draw_mode else 'ACTIVE' if fence.has_fence() else 'Press F'}", CYAN if draw_mode else GREEN if fence.has_fence() else YELLOW),
            (f"Points   : {len(fence.points)}", WHITE),
        ]
        x, y, gap = 10, 30, 20
        for line, color in lines:
            cv2.putText(frame, line, (x, y), self._font, 0.45, color, 1, cv2.LINE_AA)
            y += gap

    def _draw_hints(self, frame):
        hint = "[F] Draw zone   [C] Clear   [Q] Quit"
        h, w = frame.shape[:2]
        cv2.putText(frame, hint, (10, h - 10), self._font, 0.4, GRAY, 1, cv2.LINE_AA)
