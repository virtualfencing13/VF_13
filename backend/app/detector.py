import time
import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
from typing import List, Dict, Tuple, Optional


class Zone:
    def __init__(self, name: str, points: List[Dict[str, float]], zone_type: str = "warning", dwell_time: float = 2.0):
        self.name = name
        self.points = points # List of {x, y} in 0-1 range
        self.type = zone_type # Matched to frontend 'type'
        self.dwell_time = dwell_time # Matched to frontend 'dwell_time'
        self.occupied_since: Optional[float] = None
        self.is_breached = False
        self.is_pending = False # Waiting for dwell time
        self.alert_triggered = False # Only one alert per intrusion event
        self.last_alert_time: float = 0

    def contains(self, x: float, y: float, width: int, height: int) -> bool:
        if not self.points or len(self.points) < 3:
            return False
        poly = np.array([(p['x'] * width, p['y'] * height) for p in self.points], dtype=np.int32)
        return cv2.pointPolygonTest(poly, (int(x), int(y)), False) >= 0

    @property
    def is_cooldown(self) -> bool:
        """Returns True if the zone is in its 15-second alert cooldown window."""
        return (time.time() - self.last_alert_time) < 15


class IntrusionDetector:
    def __init__(self, confidence: float = 0.5, alert_cooldown: int = 5):
        self.model = YOLO("yolo11n.pt")
        self.confidence = confidence
        self.alert_cooldown = alert_cooldown
        self.last_alert_time = 0
        
        # Multi-camera zones: { "cam_01": [Zone, ...], "cam_02": [] }
        self.zones_map: Dict[str, List[Zone]] = {}
        self.active_camera_id = "cam_01"
        
        self.last_results = []
        self.inference_time = 0
        self.fps = 0
        self.last_annotated_frame = None
        self.intrusion_active = False

    @property
    def zones(self) -> List[Zone]:
        return self.zones_map.get(self.active_camera_id, [])

    def set_zones(self, zones_data: List[Dict], camera_id: str = None) -> List[Zone]:
        target_cam = camera_id or self.active_camera_id
        new_zones = []
        for z in zones_data:
            dwell = z.get("dwell_time") or z.get("dwellTime") or 2.0
            z_type = z.get("type") or z.get("zone_type") or "warning"
            
            new_zones.append(Zone(
                name=z.get("name", "Unnamed Zone"),
                points=z.get("points", []),
                zone_type=z_type,
                dwell_time=float(dwell)
            ))
        self.zones_map[target_cam] = new_zones
        return new_zones

    def process(self, frame: np.ndarray) -> Tuple[np.ndarray, str, List[Dict]]:
        start_time = time.time()
        height, width = frame.shape[:2]
        
        # 1. AI Inference
        results_gen = self.model.predict(
            frame, 
            classes=[0], 
            conf=self.confidence, 
            verbose=False,
            imgsz=416, 
            stream=True 
        )
        results = next(results_gen)
        
        self.last_results = []
        for box in results.boxes:
            self.last_results.append((box.xyxy[0].tolist(), box.conf[0].item()))
        
        # 2. Logic Prep
        now = time.time()
        current_zones = self.zones
        alerts_to_trigger = []
        
        # 3. Zone Logic
        any_intrusion = False
        any_warning = False
        
        for zone in current_zones:
            people_in_zone = [r for r in self.last_results if 
                              zone.contains((r[0][0]+r[0][2])/2, (r[0][1]+r[0][3])/2, width, height) or 
                              zone.contains((r[0][0]+r[0][2])/2, r[0][3], width, height)]
            
            if people_in_zone:
                if zone.type == "warning":
                    any_warning = True
                else:
                    if zone.occupied_since is None:
                        zone.occupied_since = now
                    
                    dwell = now - zone.occupied_since
                    if dwell >= zone.dwell_time:
                        zone.is_breached = True
                        any_intrusion = True
                        
                        # Apply per-zone cooldown logic (15s)
                        if not zone.alert_triggered and not zone.is_cooldown:
                            alerts_to_trigger.append({
                                "kind": "intrusion",
                                "priority": "critical",
                                "message": f"SECURITY BREACH in {zone.name}!",
                                "zone_name": zone.name
                            })
                            zone.alert_triggered = True
                            zone.last_alert_time = now
                            self.last_alert_time = now
                    else:
                        zone.is_pending = True
                        any_warning = True
            else:
                zone.occupied_since = None
                zone.is_breached = False
                zone.is_pending = False
                zone.alert_triggered = False

        current_status = "intrusion" if any_intrusion else "warning" if any_warning else "safe"
        intruder_count = 0

        # 4. Draw & Count
        for coords, conf in self.last_results:
            x1, y1, x2, y2 = coords
            cx, cy = (x1+x2)/2, (y1+y2)/2
            
            is_inside_danger = any(z.type == "danger" and (z.contains(cx, cy, width, height) or z.contains(cx, y2, width, height)) for z in current_zones)
            is_inside_warn   = any(z.type == "warning" and (z.contains(cx, cy, width, height) or z.contains(cx, y2, width, height)) for z in current_zones)
            
            if is_inside_danger:
                intruder_count += 1

            color = (0, 0, 255) if is_inside_danger else (0, 165, 255) if is_inside_warn else (30, 214, 112)
            thickness = 4 if is_inside_danger else 2
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)
            
            status_label = "INTRUDER" if is_inside_danger else "WARNING" if is_inside_warn else "AUTHORIZED"
            label_text = f"{status_label} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 2)
            cv2.rectangle(frame, (int(x1), int(y1) - th - 12), (int(x1) + tw + 10, int(y1)), color, -1)
            text_color = (255, 255, 255) if is_inside_danger else (0, 0, 0)
            cv2.putText(frame, label_text, (int(x1) + 5, int(y1) - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, text_color, 2, cv2.LINE_AA)

        self.inference_time = (time.time() - start_time) * 1000
        self.fps = 1.0 / (time.time() - start_time) if (time.time() - start_time) > 0 else 0
        
        return frame, current_status, alerts_to_trigger, intruder_count

    def save_snapshot(self, frame: np.ndarray, storage_dir: Path) -> Path:
        storage_dir.mkdir(parents=True, exist_ok=True)
        filename = f"alert_{int(time.time())}.jpg"
        path = storage_dir / filename
        cv2.imwrite(str(path), frame)
        return path
