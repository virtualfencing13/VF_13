"""
modules/camera.py
=================
ThreadedCamera — captures frames on a background daemon thread so the
inference loop never stalls waiting for the camera driver.

Key design:
  • A Queue(maxsize=2) holds at most 2 buffered frames.
  • If the queue is full the oldest frame is dropped before inserting the new
    one, keeping latency at a constant ~1 frame regardless of inference speed.
  • BufferSize is forced to 1 on the VideoCapture object to minimise OS-level
    buffering on top of our own queue.
  • For video-file sources, frames are throttled to the file's native FPS
    so playback runs at real-time speed (not as fast as the CPU allows).

Supports:
  Integer source  → USB / built-in webcam   (0, 1, 2 …)
  String  source  → video file / RTSP / HTTP stream
"""

import cv2
import sys
import time
import queue
import threading


class ThreadedCamera:
    """
    Non-blocking camera / video-file wrapper.

    Usage:
        cam = ThreadedCamera(source="video.mp4", width=640, height=480)
        cam.open()
        ret, frame = cam.read()   # always fresh, never stale
        cam.release()
    """

    def __init__(
        self,
        source:    int | str = 0,
        width:     int = 640,
        height:    int = 480,
        fps_limit: int = 30,
    ):
        self.source    = source
        self.width     = width
        self.height    = height
        self.fps_limit = fps_limit

        self._cap          = None
        self._queue        = queue.Queue(maxsize=2)
        self._running      = False
        self._thread       = None
        self._is_video_file = False   # True when source is a local file path

        # FPS tracking
        self._fps_counter  = 0
        self._fps_value    = 0.0
        self._fps_ts       = time.time()

        # Video-file throttling
        self._frame_interval = 0.0   # seconds per frame (set in open())

    # ── Public API ────────────────────────────────────────────────────────────

    def open(self) -> bool:
        """Open the capture device / file and start the reader thread."""
        if isinstance(self.source, int):
            backend = cv2.CAP_DSHOW if _windows() else cv2.CAP_V4L2 if _linux() else cv2.CAP_ANY
            self._cap = cv2.VideoCapture(self.source, backend)
        else:
            self._cap = cv2.VideoCapture(self.source)
            # Detect if source is a local file (not an RTSP/HTTP stream)
            self._is_video_file = not str(self.source).lower().startswith(("rtsp://", "http://", "https://"))

        if not self._cap.isOpened():
            print(f"[ThreadedCamera] ERROR: cannot open source → {self.source!r}")
            return False

        # For live cameras set desired resolution/fps; for files read what we get
        if not self._is_video_file:
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  self.width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self._cap.set(cv2.CAP_PROP_FPS,          self.fps_limit)
            self._cap.set(cv2.CAP_PROP_BUFFERSIZE,   1)

        # Read the actual FPS reported by the file/device
        native_fps = self._cap.get(cv2.CAP_PROP_FPS)
        if self._is_video_file and native_fps > 0:
            self._frame_interval = 1.0 / native_fps
            print(f"[ThreadedCamera] Video file FPS = {native_fps:.1f}  "
                  f"(throttled to real-time, interval = {self._frame_interval*1000:.1f} ms)")
        else:
            # Live camera: limit to fps_limit
            cap_fps = native_fps if native_fps > 0 else self.fps_limit
            effective = min(cap_fps, self.fps_limit)
            self._frame_interval = 1.0 / effective if effective > 0 else 1.0 / 30

        w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"[ThreadedCamera] Opened source={self.source!r}  {w}x{h}")

        self._running = True
        self._thread  = threading.Thread(target=self._reader, daemon=True)
        self._thread.start()
        return True

    def read(self) -> tuple[bool, any]:
        """
        Return the most recent frame.
        Blocks up to 2 seconds if no frame is available yet.
        """
        try:
            frame = self._queue.get(timeout=2.0)
            return True, frame
        except queue.Empty:
            return False, None

    def release(self):
        """Stop the reader thread and release the capture object."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=3.0)
        if self._cap:
            self._cap.release()
            self._cap = None
        print("[ThreadedCamera] Released.")

    def current_fps(self) -> float:
        """Return measured capture FPS (updated every second)."""
        return round(self._fps_value, 1)

    def is_open(self) -> bool:
        return self._cap is not None and self._cap.isOpened()

    # ── Internal reader thread ────────────────────────────────────────────────

    def _reader(self):
        """Runs on daemon thread. Continuously reads and queues frames."""
        next_frame_time = time.monotonic()

        while self._running:
            if not self._cap or not self._cap.isOpened():
                break

            # ── Throttle to real-time for video files ─────────────────────
            if self._frame_interval > 0:
                now = time.monotonic()
                sleep_for = next_frame_time - now
                if sleep_for > 0:
                    time.sleep(sleep_for)
                next_frame_time = time.monotonic() + self._frame_interval

            ret, frame = self._cap.read()
            if not ret or frame is None:
                if self._is_video_file:
                    # Loop video back to the start
                    self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    next_frame_time = time.monotonic() + self._frame_interval
                else:
                    time.sleep(0.01)
                continue

            # Enforce resolution
            if frame.shape[1] != self.width or frame.shape[0] != self.height:
                frame = cv2.resize(frame, (self.width, self.height))

            # Drop oldest if queue is full (keep latency constant)
            if self._queue.full():
                try:
                    self._queue.get_nowait()
                except queue.Empty:
                    pass
            self._queue.put(frame)

            # FPS tracking
            self._fps_counter += 1
            now = time.time()
            if now - self._fps_ts >= 1.0:
                self._fps_value   = self._fps_counter / (now - self._fps_ts)
                self._fps_counter = 0
                self._fps_ts      = now

    # ── Context manager ───────────────────────────────────────────────────────

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, *_):
        self.release()


# ── Platform helpers ──────────────────────────────────────────────────────────

def _windows() -> bool:
    return sys.platform.startswith("win")

def _linux() -> bool:
    return sys.platform.startswith("linux")
