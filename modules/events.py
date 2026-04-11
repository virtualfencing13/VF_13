"""
modules/events.py
=================
EventManager — creates structured event dicts and dispatches them to all
registered alert handlers.

Event schema
────────────
{
    "camera_id"      : str,
    "status"         : "SAFE" | "UNSAFE",
    "timestamp"      : ISO-8601 string,
    "frame"          : np.ndarray (BGR),
    "intruder_count" : int,
    "intruders"      : list of (x1,y1,x2,y2,conf),
    "safe_count"     : int,
}

Handler pattern
───────────────
Any callable(event: dict) registered via register_handler() will receive
every event. Failing handlers are caught and logged — others continue.

Built-in handlers (enabled by config):
  ConsoleHandler        → prints alert to stdout
  SnapshotHandler       → saves JPEG to snapshots/
  EmailAlertHandler     → sends email with frame attachment (background thread)

Hardware / future stubs (uncomment ONE block when ready):
  HardwareAlertHandler  → GPIO buzzer (RPi) OR serial-port relay / Arduino
  TelegramHandler       → Telegram Bot API
  WebhookHandler        → REST POST to SCADA / ERP
"""

from __future__ import annotations
import os
import time
import threading
import cv2
import numpy as np
from datetime import datetime
from typing   import Callable

from alerts.email_alert import EmailAlertHandler


Event   = dict
Handler = Callable[[Event], None]


# ── Built-in: Console ─────────────────────────────────────────────────────────

class ConsoleHandler:
    """Prints intrusion alerts to stdout with a cooldown."""

    def __init__(self, cooldown: float = 5.0):
        self._cooldown  = cooldown
        self._last_fire = 0.0

    def __call__(self, event: Event) -> None:
        if event["status"] != "UNSAFE":
            return
        now = time.time()
        if now - self._last_fire < self._cooldown:
            return
        self._last_fire = now
        ts  = event["timestamp"]
        cam = event["camera_id"]
        n   = event["intruder_count"]
        print(f"\n[ALERT] {ts}  camera={cam}  {n} person(s) inside fence!\n")


# ── Built-in: Snapshot ────────────────────────────────────────────────────────

class SnapshotHandler:
    """
    Saves a JPEG snapshot whenever an intrusion is detected.
    Filename: snapshots/intrusion_CAM_01_20250610_143201.jpg
    """

    def __init__(self, snap_dir: str = "snapshots", cooldown: float = 5.0):
        self._dir       = snap_dir
        self._cooldown  = cooldown
        self._last_fire = 0.0
        os.makedirs(snap_dir, exist_ok=True)

    def __call__(self, event: Event) -> None:
        if event["status"] != "UNSAFE":
            return
        now = time.time()
        if now - self._last_fire < self._cooldown:
            return
        self._last_fire = now

        ts   = event["timestamp"].replace(":", "-").replace(".", "-")
        cam  = event["camera_id"]
        path = os.path.join(self._dir, f"intrusion_{cam}_{ts}.jpg")
        cv2.imwrite(path, event["frame"])
        print(f"[Snapshot] Saved → {path}")


# ── Hardware alert handler (buzzer / relay) ──────────────────────────────────

class HardwareAlertHandler:
    """
    Triggers a buzzer or relay when an intrusion is detected.
    Supports two backends — uncomment whichever matches your hardware:

    ── Option A: Raspberry Pi GPIO (e.g. piezo buzzer on pin 18) ────────────
        pip install RPi.GPIO

        import RPi.GPIO as GPIO
        BUZZER_PIN = 18
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(BUZZER_PIN, GPIO.OUT)

        In __call__:
            GPIO.output(BUZZER_PIN, GPIO.HIGH if event["status"]=="UNSAFE" else GPIO.LOW)

    ── Option B: Serial-port relay / Arduino ────────────────────────────────
        pip install pyserial

        import serial
        ser = serial.Serial('COM3', 9600)   # change port as needed

        In __call__:
            if event["status"] == "UNSAFE":
                ser.write(b'BUZZ_ON\n')
            else:
                ser.write(b'BUZZ_OFF\n')

    To activate:
        1. Uncomment the relevant import + setup lines above.
        2. Uncomment self._handlers.append(HardwareAlertHandler(cooldown=...)) in EventManager.
        3. Connect your hardware and test with test_email.py pattern.
    """

    def __init__(self, cooldown: float = 2.0):
        self._cooldown  = cooldown
        self._last_fire = 0.0

    def __call__(self, event: Event) -> None:
        # ── Paste your hardware trigger code here ──────────────────────────
        # Remove the 'pass' below and uncomment the relevant lines from above
        pass


# ── Future stub: Telegram ─────────────────────────────────────────────────────

class TelegramHandler:
    """
    STUB — fill in TOKEN and CHAT_ID, then uncomment in EventManager.

    import requests, io
    def __call__(self, event):
        if event["status"] != "UNSAFE": return
        _, jpg = cv2.imencode(".jpg", event["frame"])
        requests.post(
            f"https://api.telegram.org/bot{TOKEN}/sendPhoto",
            data={"chat_id": CHAT_ID, "caption": f"ALERT {event['timestamp']}"},
            files={"photo": ("snap.jpg", io.BytesIO(jpg.tobytes()), "image/jpeg")},
        )
    """
    def __call__(self, event: Event) -> None:
        pass


# ── Future stub: Webhook ──────────────────────────────────────────────────────

class WebhookHandler:
    """
    STUB — POST event JSON to SCADA / ERP / custom server.

    import requests
    def __call__(self, event):
        if event["status"] != "UNSAFE": return
        requests.post(WEBHOOK_URL, json={
            k: v for k, v in event.items() if k != "frame"
        }, headers={"Authorization": "Bearer " + API_KEY})
    """
    def __call__(self, event: Event) -> None:
        pass


# ── EventManager ─────────────────────────────────────────────────────────────

class EventManager:
    """Creates events and dispatches to all registered handlers."""

    def __init__(
        self,
        camera_id:   str,
        alert_cfg:   dict,
        email_cfg:   dict,
        snap_dir:    str  = "snapshots",
    ):
        cooldown = alert_cfg.get("cooldown_seconds", 5.0)

        self.camera_id  = camera_id
        self._handlers: list[Handler] = []

        # Console
        if alert_cfg.get("console", True):
            self._handlers.append(ConsoleHandler(cooldown=cooldown))

        # Snapshot
        if alert_cfg.get("save_snapshot", True):
            self._handlers.append(SnapshotHandler(snap_dir=snap_dir, cooldown=cooldown))

        # Email
        if email_cfg.get("enabled", False):
            self._handlers.append(EmailAlertHandler(email_cfg))
            print("[EventManager] Email alerts ENABLED")
        else:
            print("[EventManager] Email alerts DISABLED (set email.enabled=true in config.json)")

        # ── Hardware buzzer / relay ────────────────────────────────────────
        # Uncomment the line below after wiring your hardware (see HardwareAlertHandler above):
        # self._handlers.append(HardwareAlertHandler(cooldown=2.0))

        # ── Other future handlers ──────────────────────────────────────────
        # self._handlers.append(TelegramHandler())
        # self._handlers.append(WebhookHandler())

    # ── Public API ────────────────────────────────────────────────────────────

    def create_event(
        self,
        status:       str,
        frame:        np.ndarray,
        intruders:    list,
        safe_persons: list,
    ) -> Event:
        return {
            "camera_id"      : self.camera_id,
            "status"         : status,
            "timestamp"      : datetime.now().isoformat(timespec="milliseconds"),
            "frame"          : frame,
            "intruder_count" : len(intruders),
            "intruders"      : intruders,
            "safe_count"     : len(safe_persons),
        }

    def dispatch(self, event: Event) -> None:
        """Send event to all handlers; exceptions are caught per-handler."""
        for handler in self._handlers:
            try:
                handler(event)
            except Exception as exc:
                print(f"[EventManager] Handler {handler.__class__.__name__} error: {exc}")

    def register_handler(self, handler: Handler) -> None:
        """Add a handler at runtime."""
        self._handlers.append(handler)
        print(f"[EventManager] Registered → {handler.__class__.__name__}")
