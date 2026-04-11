"""
test_camera.py
==============
Quick diagnostic: tests camera indices 0-4 and RTSP URLs.
Run this before main.py to confirm your camera source index.

Usage:
    python test_camera.py           # tests USB cams 0-4
    python test_camera.py rtsp://.. # tests an RTSP URL
"""

import sys
import cv2


def test_usb():
    print("\n── USB / Built-in camera scan ──────────────────────────")
    found = []
    for idx in range(5):
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            print(f"  [FOUND] index={idx}  {w}x{h}")
            found.append(idx)
            cap.release()
        else:
            print(f"  [    ] index={idx}  not available")
    if found:
        print(f"\n  → Use one of: {found} in config.json → camera.source")
    else:
        print("\n  → No USB cameras found. Check connection.")


def test_rtsp(url: str):
    print(f"\n── RTSP test ──────────────────────────────────────────")
    print(f"  URL: {url}")
    cap = cv2.VideoCapture(url)
    if not cap.isOpened():
        print("  [FAIL] Cannot open RTSP stream.")
        print("  Checklist:")
        print("    1. Camera is powered and on the same network")
        print("    2. URL format: rtsp://user:pass@IP:PORT/stream_path")
        print("    3. Test in VLC first: Media → Open Network Stream")
        cap.release()
        return
    ret, frame = cap.read()
    if ret and frame is not None:
        h, w = frame.shape[:2]
        print(f"  [OK]  Stream open  {w}x{h}")
        print(f"  → Use this URL in config.json → camera.source")
    else:
        print("  [FAIL] Stream opened but no frame received.")
    cap.release()


def live_preview(source):
    """Open a live preview window for 10 seconds."""
    print(f"\nOpening live preview for source={source!r}  (press Q to close)…\n")
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("[FAIL] Cannot open source.")
        return
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cv2.namedWindow("Camera Test", cv2.WINDOW_NORMAL)
    import time
    t0 = time.time()
    while time.time() - t0 < 10:
        ret, frame = cap.read()
        if not ret:
            break
        cv2.imshow("Camera Test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        src = sys.argv[1]
        if src.startswith("rtsp://") or src.startswith("http://"):
            test_rtsp(src)
            live_preview(src)
        else:
            live_preview(int(src))
    else:
        test_usb()
        # After scan, open preview for first found camera
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            cap.release()
            ans = input("\nOpen live preview for camera 0? [Y/n]: ").strip().lower()
            if ans != "n":
                live_preview(0)
