from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np


def parse_source(source: str) -> int | str:
    source = source.strip()
    if source.isdigit():
        return int(source)
    
    # Smart Healer: If it looks like an IP Webcam URL but lacks the stream path
    if source.startswith("http") and ":8080" in source:
        if not (source.endswith("/video") or source.endswith("/shot.jpg") or source.endswith("/videofeed")):
            healed = source.rstrip("/") + "/video"
            print(f"🔧 HEALER: Appending stream path -> {healed}")
            return healed
            
    return source


@dataclass
class CameraState:
    source: str
    width: int = 0
    height: int = 0


class CameraManager:
    def __init__(self, source: str) -> None:
        self._lock = threading.Lock()
        self._capture: Optional[cv2.VideoCapture] = None
        self._latest_frame: Optional[np.ndarray] = None
        self._running = False
        self.state = CameraState(source=source)

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._open_capture(self.state.source)
        threading.Thread(target=self._reader_loop, daemon=True).start()

    def stop(self) -> None:
        self._running = False
        with self._lock:
            if self._capture is not None:
                self._capture.release()
                self._capture = None

    def set_source(self, source: str) -> None:
        # Move the opening to a background task so we don't block the API/Main Thread
        def switch_task():
            print(f"🔄 CAMERA: Initiating handshake with {source}...")
            self._open_capture(source)
            with self._lock:
                self.state.source = source
            print(f"✅ CAMERA: Successfully linked to {source}")

        threading.Thread(target=switch_task, daemon=True).start()

    def _open_capture(self, source: str) -> None:
        new_cap = cv2.VideoCapture(parse_source(source))
        if new_cap.isOpened():
            new_cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            with self._lock:
                if self._capture is not None:
                    self._capture.release()
                self._capture = new_cap
        else:
            print(f"❌ CAMERA: Failed to open source {source}")

    def _reader_loop(self) -> None:
        while self._running:
            with self._lock:
                capture = self._capture
            
            if capture is None or not capture.isOpened():
                time.sleep(0.1)
                continue

            # Real-Time Hack: Clear the internal buffer to get the ABSOLUTE LATEST frame
            # This prevents the 'lag' you see when moving the mobile phone
            ok, frame = capture.read()
            
            # If we are on a network stream, we sometimes need to skip a few buffered frames
            # to stay in sync with the live world
            for _ in range(2): # Skip up to 2 stale frames per loop
                capture.grab()

            if not ok or frame is None:
                time.sleep(0.01)
                continue

            with self._lock:
                self._latest_frame = frame.copy()
                self.state.height, self.state.width = frame.shape[:2]

    def get_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            if self._latest_frame is None:
                return None
            return self._latest_frame.copy()
