from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Optional, Dict, List, Tuple
import os
from pathlib import Path
import requests
from datetime import datetime

# Suppress ugly OpenCV C++ warnings/errors when a camera cannot be found
os.environ["OPENCV_LOG_LEVEL"] = "FATAL"
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"
os.environ["OPENCV_VIDEOIO_DEBUG"] = "0"
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;0"


import cv2
import numpy as np
from ultralytics import YOLO

from app.detector import IntrusionDetector
from app.alerts import Database, User, Camera

SNAPSHOT_DIR = Path(__file__).resolve().parent.parent / "storage" / "snapshots"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

def parse_source(source: str) -> int | str:
    source = source.strip()
    if source.isdigit():
        return int(source)
    return source

@dataclass
class CameraState:
    source: str
    width: int = 0
    height: int = 0

class CameraWorker:
    def __init__(
        self,
        camera_id: str,
        owner_id: str,
        source: str,
        camera_type: str = "webcam",
        ai_enabled: bool = True,
        zone_type: str = "danger",
        confidence: float = 0.5,
        alert_cooldown: int = 5,
        shared_model = None,
        db_instance: Database = None,
        zones_data: Optional[str] = None
    ) -> None:
        self.camera_id = camera_id or "unknown_node"
        self.owner_id = owner_id or "unknown_owner"
        self.source = source
        self.camera_type = camera_type
        self.ai_enabled = ai_enabled
        self.zone_type = zone_type
        self.confidence = confidence
        self.alert_cooldown = alert_cooldown
        
        self.db = db_instance
        self.detector = IntrusionDetector(
            confidence=confidence,
            alert_cooldown=alert_cooldown,
            model=shared_model
        )
        # Ensure our camera_id is mapped in zones_map
        self.detector.active_camera_id = camera_id
        
        # Load persisted safety fencing zones if present
        if zones_data:
            import json
            try:
                zones_list = json.loads(zones_data)
                self.detector.set_zones(zones_list, camera_id)
            except Exception as e:
                print(f"⚠️ CAMERA WORKER: Failed to parse zones_data for [{camera_id}]: {e}")
                self.detector.set_zones([], camera_id)
        else:
            self.detector.set_zones([], camera_id)

        self._lock = threading.Lock()
        self._capture: Optional[cv2.VideoCapture] = None
        self._latest_raw_frame: Optional[np.ndarray] = None
        self._latest_annotated_frame: Optional[np.ndarray] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._reader_thread: Optional[threading.Thread] = None
        self._latest_captured_frame: Optional[np.ndarray] = None

        self.status = "offline"  # "online", "offline", "error"
        self.fps = 0.0
        self.last_seen = time.time()
        self.intrusion_active = False
        self.person_count = 0
        self.latency = 0.0
        self._logged_connection_error = False

    def verify_connectivity(self) -> bool:
        """Helper to verify network connectivity of RTSP/IP source quickly."""
        parsed = parse_source(self.source)
        try:
            cap = cv2.VideoCapture(parsed)
            if cap.isOpened():
                cap.release()
                return True
            return False
        except Exception:
            return False

    def start(self) -> None:
        with self._lock:
            if self._running:
                return
            self._running = True
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
            self._reader_thread = threading.Thread(target=self._read_loop, daemon=True)
            self._reader_thread.start()

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=1.0)
        if self._reader_thread:
            self._reader_thread.join(timeout=1.0)
        with self._lock:
            if self._capture is not None:
                self._capture.release()
                self._capture = None
            self.status = "offline"
            self._logged_connection_error = False

    def _open_capture(self) -> bool:
        with self._lock:
            if self._capture is not None:
                self._capture.release()
                self._capture = None
            
            parsed = parse_source(self.source)
            self._capture = cv2.VideoCapture(parsed)
            if self._capture.isOpened():
                self._capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                self.status = "online"
                return True
            else:
                self.status = "error"
                return False

    def _read_loop(self) -> None:
        reconnect_delay = 5.0
        last_reconnect_attempt = 0.0
        
        while self._running:
            opened = False
            with self._lock:
                if self._capture is not None and self._capture.isOpened():
                    opened = True
            
            if not opened:
                now = time.time()
                if now - last_reconnect_attempt > reconnect_delay:
                    last_reconnect_attempt = now
                    if self._open_capture():
                        opened = True
                        self._logged_connection_error = False
                    else:
                        if not self._logged_connection_error:
                            print(f"❌ CAMERA WORKER Reader: Failed to connect to [{self.camera_id}] at source: {self.source}")
                            self._logged_connection_error = True
                if not opened:
                    time.sleep(0.5)
                    continue
            
            try:
                with self._lock:
                    cap = self._capture
                if cap is not None:
                    ok, img = cap.read()
                    if ok and img is not None:
                        with self._lock:
                            self._latest_captured_frame = img
                            self._logged_connection_error = False
                    else:
                        with self._lock:
                            if self._capture is not None:
                                self._capture.release()
                                self._capture = None
                            self.status = "error"
            except Exception as ex:
                if not self._logged_connection_error:
                    print(f"⚠️ CAMERA WORKER Reader: Error on [{self.camera_id}]: {ex}")
                    self._logged_connection_error = True
                with self._lock:
                    if self._capture is not None:
                        self._capture.release()
                        self._capture = None
                    self.status = "error"
            time.sleep(0.01)

    def _run(self) -> None:
        placeholder_x, placeholder_y = 50, 50
        dx, dy = 5, 5

        while self._running:
            # Check status and frame
            with self._lock:
                status = self.status
                frame = self._latest_captured_frame
                if frame is not None:
                    frame = frame.copy()

            if status in ["offline", "error"] or frame is None:
                # Generate a beautiful, stable, perfectly centered and non-clipping visual placeholder frame
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                
                # Draw a premium industrial dark grid pattern
                for y in range(0, 480, 40):
                    cv2.line(frame, (0, y), (640, y), (15, 15, 15), 1)
                for x in range(0, 640, 40):
                    cv2.line(frame, (x, 0), (x, 480), (15, 15, 15), 1)
                
                # Draw a red warning border
                cv2.rectangle(frame, (10, 10), (630, 470), (0, 0, 150), 2)
                
                text1 = "CCTV OFFLINE"
                text2 = f"NODE: {str(self.camera_id or 'unknown_node').upper()}"
                text3 = f"SOURCE: {self.source}"
                
                # Center Text 1 (CCTV OFFLINE)
                (t1_w, t1_h), _ = cv2.getTextSize(text1, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
                t1_x = (640 - t1_w) // 2
                t1_y = 220
                cv2.putText(frame, text1, (t1_x, t1_y), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2, cv2.LINE_AA)
                
                # Center Text 2 (NODE DETAILS)
                (t2_w, t2_h), _ = cv2.getTextSize(text2, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                t2_x = (640 - t2_w) // 2
                t2_y = 265
                cv2.putText(frame, text2, (t2_x, t2_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2, cv2.LINE_AA)
                
                # Center Text 3 (RTSP SOURCE URL)
                (t3_w, t3_h), _ = cv2.getTextSize(text3, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
                t3_x = (640 - t3_w) // 2
                t3_y = 445
                cv2.putText(frame, text3, (t3_x, t3_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (80, 80, 80), 1, cv2.LINE_AA)
                
                with self._lock:
                    self._latest_raw_frame = frame.copy()
                    self._latest_annotated_frame = frame.copy()
                    self.fps = 0.0
                    self.person_count = 0
                    self.intrusion_active = False
                time.sleep(0.033)
                continue

            # 4. Perform YOLO detection & zone validation if enabled
            start_t = time.time()
            
            if self.ai_enabled:
                try:
                    # Sync detector parameters
                    self.detector.confidence = self.confidence
                    
                    # Run YOLOv11 inference on every frame for instant, zero-latency real-time response
                    self._frame_index = getattr(self, "_frame_index", 0) + 1
                    skip = False
                    
                    annotated, current_status, alerts, intruder_count = self.detector.process(frame, skip_inference=skip)
                    
                    self.person_count = len(self.detector.last_results)
                    new_intrusion_state = (current_status == "intrusion")
                    if new_intrusion_state != getattr(self, "_last_hardware_state", None):
                        self._last_hardware_state = new_intrusion_state
                        try:
                            from app.main import set_hardware_state
                            set_hardware_state(new_intrusion_state)
                        except Exception:
                            pass
                    
                    self.intrusion_active = new_intrusion_state
                    self.latency = self.detector.inference_time
                    
                    # Calculate smooth FPS
                    self.fps = self.detector.fps if not skip else self.fps
                    self.last_seen = time.time()

                    # Handle triggered alerts
                    if alerts and self.db:
                        # Save forensic snapshot
                        snapshot_path = self.detector.save_snapshot(annotated, SNAPSHOT_DIR)
                        
                        # Store in database mapped directly to owner and camera node
                        for alert in alerts:
                            self.db.add_alert(
                                kind=alert["kind"],
                                message=f"[{self.camera_id.upper()}] - {alert['message']}",
                                snapshot_path=snapshot_path,
                                priority=alert.get("priority", "critical"),
                                zone_name=alert.get("zone_name"),
                                owner_id=self.owner_id,
                                camera_id=self.camera_id
                            )
                            
                        # Dispatch non-blocking user-specific alerts strictly to owner
                        self._dispatch_owner_notification(alerts, snapshot_path, intruder_count)
                        
                except Exception as err:
                    print(f"⚠️ CAMERA WORKER: AI processing crash on [{self.camera_id}]: {err}")
                    annotated = frame.copy()
            else:
                annotated = frame.copy()
                self.person_count = 0
                self.intrusion_active = False
                self.fps = 1.0 / (time.time() - start_t) if (time.time() - start_t) > 0 else 30.0

            # Store frames safely
            with self._lock:
                self._latest_raw_frame = frame.copy()
                self._latest_annotated_frame = annotated.copy()
                if self.status != "online":
                    self.status = "online"

            # Frame rate pacing (~30 FPS max)
            elapsed = time.time() - start_t
            sleep_time = max(0.005, 0.033 - elapsed)
            time.sleep(sleep_time)

    def get_frame(self, annotated: bool = True) -> Optional[np.ndarray]:
        with self._lock:
            frame = self._latest_annotated_frame if annotated else self._latest_raw_frame
            if frame is None:
                return None
            return frame.copy()

    def get_status(self) -> dict:
        with self._lock:
            return {
                "camera_id": self.camera_id,
                "status": self.status,
                "fps": round(self.fps, 1),
                "latency": round(self.latency, 1),
                "person_count": self.person_count,
                "intrusion_active": self.intrusion_active,
                "ai_enabled": self.ai_enabled,
                "camera_type": self.camera_type,
                "location": getattr(self, "location", "Default Location")
            }

    def _dispatch_owner_notification(self, triggered_alerts, snapshot_path: Path, person_count: int):
        """Asynchronously dispatches alerts strictly to the active logged-in operator in parallel."""

        def email_task(alert_email, email_enabled):
            if not email_enabled or not alert_email:
                return
            try:
                from app.main import send_email_notification
                for email_addr in [e.strip() for e in str(alert_email).split(",") if e.strip()]:
                    send_email_notification(
                        camera_id=self.camera_id,
                        zone_name=triggered_alerts[0].get("zone_name", "Danger Zone"),
                        person_count=person_count,
                        snapshot_path=snapshot_path,
                        additional_email=email_addr
                    )
            except Exception as e:
                print(f"⚠️ Email alert failure: {e}")

        def telegram_task(telegram_chat_id, telegram_enabled):
            if not telegram_enabled or not telegram_chat_id:
                return
            try:
                from app.main import send_telegram_alert
                msg_text = (
                    f"🚨 <b>FENCEAI SECURITY BREACH</b> 🚨\n\n"
                    f"<b>Node:</b> {self.camera_id.upper()}\n"
                    f"<b>Zone:</b> {triggered_alerts[0].get('zone_name', 'Danger Zone')}\n"
                    f"<b>Intruders:</b> {person_count}\n"
                    f"<b>Forensic Snapshot Attached</b>"
                )
                send_telegram_alert(chat_id=telegram_chat_id, message=msg_text, snapshot_path=snapshot_path)
            except Exception as e:
                print(f"⚠️ Telegram alert failure: {e}")

        def twilio_task(target_phone, sms_enabled, call_enabled, call_allowed):
            try:
                from app.main import send_twilio_notifications
                msg_text = f"🚨 FENCEAI SECURITY ALERT: Intrusion detected in {triggered_alerts[0].get('zone_name', 'restricted sector')} on camera node {self.camera_id.upper()}!"
                
                send_twilio_notifications(
                    message=msg_text,
                    target_phone=target_phone,
                    sms_enabled_override=sms_enabled,
                    call_enabled_override=call_enabled,
                    call_allowed_override=call_allowed
                )
            except Exception as e:
                print(f"⚠️ Twilio voice/SMS alert failure: {e}")

        def main_dispatch():
            try:
                # Query owner's notification settings
                session = self.db.SessionLocal()
                try:
                    # Query camera owner first to route notifications to the specified operator
                    owner = None
                    if self.owner_id:
                        owner = session.query(User).filter(User.username == self.owner_id).first()
                    
                    # Fallback to active operator if camera owner not found
                    if not owner:
                        owner = session.query(User).filter(User.is_approved == True).order_by(User.last_active.desc()).first()
                        
                    if not owner:
                        return
                    
                    alert_email = owner.alert_email or owner.username or owner.google_email
                    email_enabled = owner.email_enabled
                    telegram_chat_id = owner.telegram_chat_id
                    telegram_enabled = owner.telegram_enabled
                    
                    target_phone = owner.phone
                    sms_enabled = owner.sms_enabled
                    call_enabled = owner.call_enabled
                    
                    # Call Alert cooldown state check (10s cooldown per operator)
                    call_allowed = False
                    if call_enabled and target_phone:
                        now = datetime.utcnow()
                        last_call = owner.last_call_time
                        if last_call is not None:
                            last_call = last_call.replace(tzinfo=None)
                        if last_call is None or (now - last_call).total_seconds() > 10:
                            owner.last_call_time = now
                            session.commit()
                            call_allowed = True
                finally:
                    session.close()

                # Dispatch email, telegram, and twilio alerts strictly in parallel so slow network calls do not block each other
                threading.Thread(target=email_task, args=(alert_email, email_enabled), daemon=True).start()
                threading.Thread(target=telegram_task, args=(telegram_chat_id, telegram_enabled), daemon=True).start()
                threading.Thread(target=twilio_task, args=(target_phone, sms_enabled, call_enabled, call_allowed), daemon=True).start()
            except Exception as e:
                print(f"‼ CAMERA WORKER: Parallel Alert Dispatcher Failure for [{self.camera_id}]: {e}")

        threading.Thread(target=main_dispatch, daemon=True).start()

class CameraManager:
    def __init__(self, source: str = "0") -> None:
        self._lock = threading.Lock()
        self.workers: Dict[str, CameraWorker] = {}
        self.shared_model = YOLO("yolo11n.onnx", task="detect")
        self.default_source = source
        self.db: Optional[Database] = None
        self.state = CameraState(source)

    def initialize_db(self, db_instance: Database) -> None:
        """Inject the database service instance."""
        self.db = db_instance
        # Start all active camera nodes saved in the database
        session = db_instance.SessionLocal()
        try:
            cameras = session.query(Camera).all()
            for cam in cameras:
                if cam.status in ["online", "active", "offline"]:
                    self.start_stream(cam)
        except Exception as e:
            print(f"⚠️ CAMERA MANAGER: Failed to auto-start saved camera nodes: {e}")
        finally:
            session.close()

    def start_stream(self, cam_db: Camera) -> CameraWorker:
        """Adds and starts a dedicated CameraWorker for a database node."""
        cam_key = cam_db.id or cam_db.node_id or "cam_01"
        with self._lock:
            # Stop existing worker if already running to prevent overlap
            if cam_key in self.workers:
                self.workers[cam_key].stop()
            
            # Dynamically construct authenticated RTSP source if credentials exist
            source = cam_db.rtsp_url or cam_db.source or "0"
            if str(source).startswith("rtsp://"):
                import urllib.parse
                pure_url = str(source)[7:]
                
                # Check if credentials are embedded in the URL (e.g. rtsp://user:pass@host)
                if "@" in pure_url:
                    try:
                        cred_part, host_part = pure_url.rsplit("@", 1)
                        if ":" in cred_part:
                            user_val, pass_val = cred_part.split(":", 1)
                            # Get raw unquoted credentials
                            unquoted_user = urllib.parse.unquote(user_val)
                            unquoted_pass = urllib.parse.unquote(pass_val)
                            # URL-encode to safely support special characters like '@' in password
                            quoted_user = urllib.parse.quote(unquoted_user)
                            quoted_pass = urllib.parse.quote(unquoted_pass)
                            source = f"rtsp://{quoted_user}:{quoted_pass}@{host_part}"
                    except Exception as e:
                        print(f"⚠️ Failed to parse embedded credentials from RTSP source: {e}")
                else:
                    # Credentials are in separate fields
                    username = getattr(cam_db, 'username', None)
                    password = getattr(cam_db, 'password', None)
                    if username and password:
                        unquoted_user = urllib.parse.unquote(username)
                        unquoted_pass = urllib.parse.unquote(password)
                        quoted_user = urllib.parse.quote(unquoted_user)
                        quoted_pass = urllib.parse.quote(unquoted_pass)
                        source = f"rtsp://{quoted_user}:{quoted_pass}@{pure_url}"
                
            confidence_val = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
            worker = CameraWorker(
                camera_id=cam_key,
                owner_id=cam_db.owner_id,
                source=source,
                camera_type=cam_db.camera_type,
                ai_enabled=cam_db.ai_enabled,
                zone_type=cam_db.zone_type,
                confidence=confidence_val,
                shared_model=self.shared_model,
                db_instance=self.db,
                zones_data=getattr(cam_db, 'zones_data', None)
            )
            # Carry location parameter
            worker.location = cam_db.location or "CCTV Node"
            
            self.workers[cam_key] = worker
            worker.start()
            return worker

    def stop_stream(self, node_id: str) -> None:
        """Stops and deletes the CameraWorker thread for a given node."""
        with self._lock:
            if node_id in self.workers:
                self.workers[node_id].stop()
                del self.workers[node_id]

    def get_frame(self, node_id: Optional[str] = None, annotated: bool = True) -> Optional[np.ndarray]:
        """Fetches the latest frame. Backwards compatible for single-camera code."""
        with self._lock:
            if not node_id:
                # Return frame from first active worker if no node_id passed
                if self.workers:
                    first_worker = list(self.workers.values())[0]
                    return first_worker.get_frame(annotated)
                
                # Absolute fallback placeholder if no workers active
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(frame, "NO CAMERAS CONFIGURED", (80, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                return frame
            
            if node_id in self.workers:
                return self.workers[node_id].get_frame(annotated)
            return None

    def get_worker(self, node_id: str) -> Optional[CameraWorker]:
        with self._lock:
            if not node_id:
                return None
            # 1. Check by direct node_id key
            if node_id in self.workers:
                return self.workers[node_id]
            # 2. Check if any worker has a matching camera_id (stored internally)
            for w in self.workers.values():
                if w.camera_id == node_id:
                    return w
            # 3. If node_id contains an owner prefix (e.g., admin_gmail_com_cam_01), extract suffix (e.g., cam_01)
            if "_" in node_id:
                parts = node_id.split("_")
                suffix = "_".join(parts[-2:]) if len(parts) >= 2 else node_id
                if suffix in self.workers:
                    return self.workers[suffix]
            # 4. Reverse lookup: if node_id is a suffix (e.g., cam_01), find a worker key ending with it
            for k, w in self.workers.items():
                if k.endswith(f"_{node_id}") or k == node_id:
                    return w
            return None

    # --- Backward compatibility methods ---
    def start(self) -> None:
        pass

    def stop(self) -> None:
        with self._lock:
            for worker in list(self.workers.values()):
                worker.stop()
            self.workers.clear()

    def set_source(self, source: str) -> None:
        """Compatibility fallback to recreate a default standard worker."""
        self.state.source = source
        class TempCam:
            node_id = "cam_01"
            owner_id = "admin@gmail.com"
            source = source
            rtsp_url = source
            camera_type = "webcam"
            ai_enabled = True
            zone_type = "danger"
            status = "online"
            location = "Default Terminal Source"
        self.start_stream(TempCam())
