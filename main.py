"""
Virtual Fencing — Real-Time Personnel Detection System v2
=========================================================
Entry point: integrates all modules.

Controls:
  F          → Enter draw mode: click individual points on the video to form a polygon.
  ENTER      → Finalize the fence (must have at least 3 points).
  C          → Clear / remove the fence entirely.
  Q / ESC    → Quit.

Alerts fire automatically when a person enters the fence zone:
  • Console log
  • Snapshot saved to snapshots/
  • Email with attached image (config.json → email.enabled = true)
  • Hardware buzzer hook (see events.py → HardwareAlertHandler)
"""

import cv2
import json
import sys
import os
import time

from modules.camera    import ThreadedCamera
from modules.detector  import PersonDetector
from modules.fence     import VirtualFence
from modules.decision  import DecisionEngine
from modules.events    import EventManager
from utils.draw        import Visualizer

FENCE_SAVE_PATH = "fence.json"


def load_config(path: str = "config.json") -> dict:
    with open(path, "r") as f:
        return json.load(f)


def main():
    cfg = load_config()

    cam_cfg   = cfg["camera"]
    det_cfg   = cfg["detector"]
    disp_cfg  = cfg["display"]
    alert_cfg = cfg["alerts"]
    email_cfg = cfg["email"]

    snap_dir = alert_cfg.get("snapshot_dir", "snapshots")
    os.makedirs(snap_dir, exist_ok=True)
    os.makedirs("logs", exist_ok=True)

    # ── modules ───────────────────────────────────────────────────────────────
    camera   = ThreadedCamera(
        source = cam_cfg["source"],
        width  = cam_cfg["width"],
        height = cam_cfg["height"],
    )
    detector = PersonDetector(
        model_path = det_cfg["model_path"],
        confidence = det_cfg["confidence"],
        device     = det_cfg.get("device", "cpu"),
    )
    fence    = VirtualFence()
    decision = DecisionEngine()
    events   = EventManager(
        camera_id = cam_cfg.get("camera_id", "CAM_01"),
        alert_cfg = alert_cfg,
        email_cfg = email_cfg,
        snap_dir  = snap_dir,
    )
    viz = Visualizer(disp_cfg)

    # ── restore saved fence ───────────────────────────────────────────────────
    fence.load(FENCE_SAVE_PATH)

    if not camera.open():
        print("[FATAL] Cannot open video source.")
        sys.exit(1)

    # ── window ────────────────────────────────────────────────────────────────
    WIN = "Virtual Fencing — Industrial Safety System"
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WIN, cam_cfg["width"], cam_cfg["height"])

    # draw_mode flag — mouse only draws when this is True
    draw_mode = [False]

    def _mouse(event, x, y, flags, param):
        if not draw_mode[0]:
            return
        fence.mouse_callback(event, x, y, flags, param)

    cv2.setMouseCallback(WIN, _mouse)

    print("\n╔══════════════════════════════════════════════════════╗")
    print("║   Virtual Fencing — Automated Detection System v2   ║")
    print("╠══════════════════════════════════════════════════════╣")
    print("║  [F]  Draw fence  (Click corner points)             ║")
    print("║  [Enter] Finish drawing                             ║")
    print("║  [C]  Clear fence                                   ║")
    print("║  [Q / ESC]  Quit                                    ║")
    print("╚══════════════════════════════════════════════════════╝\n")

    if fence.has_fence():
        print(f"[INFO] Restored fence from disk with {len(fence.points)} points.")
    else:
        print("[INFO] No fence yet. Press F then click on the video window to set points.")

    frame_idx   = 0
    last_dets   = []
    INFER_EVERY = 2

    while True:
        ret, frame = camera.read()
        if not ret or frame is None:
            continue

        frame_idx += 1

        if frame_idx % INFER_EVERY == 0:
            last_dets = detector.detect(frame)

        detections = last_dets

        intruders, safe_persons = fence.check_intrusions(detections)
        status = decision.evaluate(intruders)

        event = events.create_event(status, frame, intruders, safe_persons)
        events.dispatch(event)

        display_frame = viz.render(
            frame        = frame.copy(),
            detections   = detections,
            intruders    = intruders,
            safe_persons = safe_persons,
            fence        = fence,
            status       = status,
            fps          = camera.current_fps(),
            frame_idx    = frame_idx,
            draw_mode    = draw_mode[0],
        )

        # Show point drawing preview
        if draw_mode[0] and fence.is_drawing:
            viz.draw_fence_preview(display_frame, fence)

        cv2.imshow(WIN, display_frame)

        key = cv2.waitKey(1) & 0xFF

        if key in (ord("q"), 27):
            print("\n[INFO] Quit requested.")
            break

        elif key == ord("f"):
            if draw_mode[0]:
                draw_mode[0] = False
                fence.clear()
                print("[INFO] Draw mode CANCELLED.")
            else:
                draw_mode[0] = True
                fence.clear()
                print("[INFO] Draw mode ON — click points then press ENTER to finish.")

        elif key in (13, ord("\r")):  # Enter key
            if draw_mode[0] and fence.is_drawing:
                if fence.finalize():
                    fence.save(FENCE_SAVE_PATH)
                    draw_mode[0] = False
                    print("[INFO] Fence finalized and saved.")

        elif key == ord("c"):
            fence.clear()
            draw_mode[0] = False
            if os.path.isfile(FENCE_SAVE_PATH):
                os.remove(FENCE_SAVE_PATH)
            print("[INFO] Fence cleared.")

    camera.release()
    cv2.destroyAllWindows()
    print("[INFO] System stopped.")


if __name__ == "__main__":
    main()
