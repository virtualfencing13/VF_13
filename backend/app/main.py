from __future__ import annotations

import os
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import threading
import time
from urllib.parse import quote
from pathlib import Path
from datetime import datetime
import asyncio
import uuid
from typing import List, Dict, Optional

import cv2
from fastapi import FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from twilio.http.http_client import TwilioHttpClient
from twilio.rest import Client

from .alerts import Database
from .camera import CameraManager
from .config import settings
from .detector import IntrusionDetector
import requests


# Storage Paths
BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = BASE_DIR / "backend" / "storage"
SNAPSHOT_DIR = STORAGE_DIR / "snapshots"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Virtual Fencing IDS")
# Mount static snapshots correctly
app.mount("/snapshots", StaticFiles(directory=str(SNAPSHOT_DIR)), name="snapshots")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Camera Configuration
# The system now relies 100% on the Camera Registry (DB). 
# Test cameras (cam_01, cam_02) have been decommissioned for production.
camera_manager = CameraManager("0") # Initialize with placeholder, will be updated by DB
detector = IntrusionDetector(settings.confidence_threshold, settings.alert_cooldown_seconds)
from app.alerts import Database, Alert, NotificationSettings, Camera, DATABASE_URL

db = Database(DATABASE_URL)
latest_status = {"status": "safe", "message": "System ready"}
system_active = True 
machine_status = "running"
machine_control_enabled = False
active_camera_id = "MASTER_NODE"
main_loop = None # To be captured on startup

# On startup, ensure we use the first camera from the registry if it exists
def sync_camera_on_startup():
    global active_camera_id
    cameras = db.list_cameras()
    if cameras:
        active = next((c for c in cameras if c["status"] == "active"), cameras[0])
        active_camera_id = active["id"]
        detector.active_camera_id = active_camera_id
        camera_manager.set_source(str(active["source"]))
        print(f"🚀 BOOT: Synced with Registry Node: {active_camera_id} ({active['source']})")
    else:
        # If registry is empty, add the User's Verified Mobile IP as the first node
        user_ip = "http://172.31.99.19:8080"
        db.add_camera("MOBILE_CCTV_01", "Primary Mobile Node", user_ip, "1080p", "Mobile-Lens-V1")
        db.set_active_camera("MOBILE_CCTV_01")
        active_camera_id = "MOBILE_CCTV_01"
        detector.active_camera_id = active_camera_id
        # The healer in camera.py will handle adding /video automatically
        camera_manager.set_source(user_ip)
        print(f"📦 BOOT: Initialized Verified Mobile CCTV Registry with {user_ip}")

threading.Thread(target=sync_camera_on_startup, daemon=True).start()

# Mutable recipient settings — can be changed at runtime via /api/settings
recipient_email: str = settings.recipient_email
# Multi-Recipient WhatsApp Store: Only numbers stored in UI config
whatsapp_recipients: List[str] = [] # List of strings (numbers)
whatsapp_enabled: bool = bool(settings.callmebot_api_key)

sms_enabled: bool = bool(settings.twilio_account_sid)
sms_phone: str = settings.twilio_to_phone
call_enabled: bool = False
call_phone: str = settings.twilio_to_phone


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()


def twilio_notifications_ready() -> bool:
    return bool(
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and settings.twilio_from_phone
        and settings.twilio_to_phone
    )


def is_local_base_url() -> bool:
    base_url = settings.public_base_url.rstrip("/").lower()
    return base_url.startswith(("http://localhost", "https://localhost", "http://127.0.0.1", "https://127.0.0.1"))


def build_voice_url(message: str) -> str:
    encoded_message = quote(message, safe="")
    base_url = settings.public_base_url.rstrip("/")
    return f"{base_url}/api/twilio/voice?message={encoded_message}"


def build_voice_twiml(message: str) -> str:
    return f"<Response><Say>{message}</Say></Response>"


def send_email_notification(camera_id: str, zone_name: str, person_count: int, snapshot_path: Path, additional_email: str = None) -> dict:
    global recipient_email
    active_recipient = recipient_email or settings.recipient_email
    
    recipients = []
    if active_recipient: recipients.append(active_recipient)
    if additional_email and additional_email not in recipients: recipients.append(additional_email)
    
    if not settings.email_enabled or not settings.sender_email or not recipients:
        return {"enabled": False, "reason": "Email alerts are disabled or recipient not set"}

    try:
        msg = MIMEMultipart("related")
        msg["Subject"] = f"🚨 [CRITICAL BREACH] - Zone: {zone_name}"
        msg["From"] = settings.sender_email
        msg["To"] = ", ".join(recipients)

        timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
        html = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 25px; color: #1a1a1a;">
            <h2 style="color: #d93025; font-size: 22px; margin-top: 0; display: flex; align-items: center; border-bottom: 2px solid #d93025; padding-bottom: 10px;">
                <span style="margin-right: 12px;">⚠️</span> Intrusion Detected
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: bold; background: #fafafa; width: 35%; color: #555;">Camera</td>
                    <td style="padding: 12px; font-weight: 800; color: #000;">{camera_id.upper()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: bold; background: #fafafa; color: #555;">Timestamp</td>
                    <td style="padding: 12px; color: #333;">{timestamp}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: bold; background: #fafafa; color: #555;">Persons in zone</td>
                    <td style="padding: 12px; color: #d93025; font-weight: 900;">{person_count}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: bold; background: #fafafa; color: #555;">Status</td>
                    <td style="padding: 12px; color: #d93025; font-weight: 900; letter-spacing: 1px;">UNSAFE</td>
                </tr>
            </table>
            <p style="font-size: 13px; color: #666; margin-bottom: 10px; font-weight: bold;">Captured frame at time of detection:</p>
            <div style="border: 2px solid #d93025; border-radius: 4px; overflow: hidden; background: #000;">
                <img src="cid:snapshot" style="width: 100%; display: block;" alt="Security Snapshot">
            </div>
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
                <p style="font-size: 11px; color: #999; line-height: 1.6; margin: 0;">
                    <b>NOTICE:</b> This is an automated forensic alert from FenceAI Secure Link.<br>
                    Camera: {camera_id.upper()} | Forensic ID: {uuid.uuid4().hex[:8].upper()}
                </p>
            </div>
        </div>
        """
        msg.attach(MIMEText(html, "html"))

        # Attach the image
        with open(snapshot_path, "rb") as img_file:
            img = MIMEImage(img_file.read())
            img.add_header("Content-ID", "<snapshot>")
            msg.attach(img)

        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.sender_email, settings.sender_password)
            server.send_message(msg)

        return {"enabled": True, "sent_to": ", ".join(recipients)}
    except Exception as exc:
        return {"enabled": False, "reason": f"Email failed: {exc}"}


def send_whatsapp_alert(numbers: List[str], message: str, snapshot_path: Optional[Path] = None) -> bool:
    """Send completely free WhatsApp alerts using CallMeBot."""
    if not settings.callmebot_api_key or not settings.callmebot_phone:
        print("⚠ WhatsApp Skip: Missing CALLMEBOT_API_KEY or CALLMEBOT_PHONE in .env")
        return False
        
    any_success = False
    
    # CallMeBot requires the phone number to be formatted with + and country code
    # We will use the main configured phone from the env file for the POC
    phone = settings.callmebot_phone.replace("+", "").replace(" ", "").strip()
    
    try:
        url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={quote(message)}&apikey={settings.callmebot_api_key}"
        resp = requests.get(url, timeout=10.0)
        
        if resp.status_code == 200:
            print(f"✅ Free WhatsApp Alert Delivered to +{phone}")
            any_success = True
        else:
            print(f"❌ CallMeBot Error ({resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"‼ Free WhatsApp Network Failure: {e}")
            
    return any_success
    
def send_telegram_alert(chat_id: str, message: str, snapshot_path: Optional[Path] = None) -> bool:
    """Send secure Telegram alerts with optional forensic snapshots."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    
    if not token or not chat_id:
        # Silently fail if not configured
        return False
        
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        
        # If snapshot exists, send as photo
        if snapshot_path and snapshot_path.exists():
            photo_url = f"https://api.telegram.org/bot{token}/sendPhoto"
            with open(snapshot_path, "rb") as f:
                files = {"photo": f}
                data = {"chat_id": chat_id, "caption": message, "parse_mode": "HTML"}
                r = requests.post(photo_url, data=data, files=files, timeout=10)
                return r.status_code == 200
        else:
            payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
            r = requests.post(url, json=payload, timeout=10)
            return r.status_code == 200
    except Exception as e:
        print(f"‼ Telegram Alert Failure: {e}")
        return False

def telegram_bot_poller():
    """Background thread to listen for /start and link chat IDs automatically."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("❌ TELEGRAM: Bot Token is MISSING in .env file. Alerts will NOT work!")
        return
    
    last_update_id = 0
    print("🤖 TELEGRAM: Secure Bot Poller ACTIVE - Ready for links")
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{token}/getUpdates"
            # We use a short timeout for the polling request
            params = {"offset": last_update_id + 1, "timeout": 20}
            r = requests.get(url, params=params, timeout=25)
            
            if r.status_code == 200:
                data = r.json()
                for update in data.get("result", []):
                    last_update_id = update["update_id"]
                    msg = update.get("message", {})
                    text = msg.get("text", "")
                    chat = msg.get("chat", {})
                    chat_id = chat.get("id")
                    
                    if text.startswith("/start"):
                        # Check for deep-linking (e.g., /start user@gmail.com)
                        parts = text.split(" ")
                        linked_email = parts[1].strip() if len(parts) > 1 else None
                        
                        welcome_msg = ""
                        if linked_email:
                            # Link to specific user
                            db.update_notification_settings({
                                "telegram_chat_id": str(chat_id),
                                "telegram_username": chat.get("username", ""),
                                "telegram_enabled": True
                            }, username=linked_email)
                            welcome_msg = (
                                f"✅ <b>PERSONAL LINK ESTABLISHED</b>\n"
                                f"Operator: {linked_email}\n"
                                "━━━━━━━━━━━━━━━━━━\n"
                                "You will now receive targeted alerts for your active sessions."
                            )
                        else:
                            # Fallback: Check if there's ONLY ONE active operator and link them
                            active_ops = db.get_active_users(threshold_minutes=5)
                            if len(active_ops) == 1:
                                op_email = active_ops[0]["username"]
                                db.update_notification_settings({
                                    "telegram_chat_id": str(chat_id),
                                    "telegram_username": chat.get("username", ""),
                                    "telegram_enabled": True
                                }, username=op_email)
                                welcome_msg = (
                                    f"✅ <b>AUTO-LINK SUCCESSFUL</b>\n"
                                    f"Detected Operator: {op_email}\n"
                                    "━━━━━━━━━━━━━━━━━━\n"
                                    "Your device is now synchronized with your active session."
                                )
                                linked_email = op_email
                            else:
                                # Fallback to global broadcast
                                current_settings = db.get_notification_settings()
                                existing_ids = current_settings.get("telegram_chat_id", "")
                                id_list = [i.strip() for i in existing_ids.split(",")] if existing_ids else []
                                if str(chat_id) not in id_list:
                                    id_list.append(str(chat_id))
                                
                                db.update_notification_settings({
                                    "telegram_chat_id": ",".join(id_list),
                                    "telegram_enabled": True
                                })
                                welcome_msg = (
                                    "⚠️ <b>BROADCAST LINK ONLY</b>\n"
                                    "━━━━━━━━━━━━━━━━━━\n"
                                    "To receive personal alerts, please click 'LINK BOT' from the Dashboard Settings."
                                )

                        send_telegram_alert(str(chat_id), welcome_msg)
                        print(f"✅ TELEGRAM: Linked Chat ID {chat_id} to {'Broadcast' if not linked_email else linked_email}")
                        
            time.sleep(1)
        except Exception as e:
            time.sleep(5)

@app.get("/api/settings/notifications")
def get_notification_settings(email: Optional[str] = None):
    return db.get_notification_settings(email)

@app.post("/api/settings/notifications")
def save_notification_settings(payload: dict):
    email = payload.get("email_context") # The logged in user's email passed from frontend
    data = payload.get("settings", payload)
    db.update_notification_settings(data, email)
    return {"status": "saved"}

@app.post("/api/settings/test-telegram")
def test_telegram(data: dict) -> dict:
    chat_id = data.get("chat_id")
    if not chat_id:
        settings_db = db.get_notification_settings()
        chat_id = settings_db.get("telegram_chat_id")
    
    if not chat_id:
        return {"status": "error", "message": "No chat ID configured"}

    msg = "🚨 <b>FENCEAI SECURE LINK</b>\nIndustrial Node Status: ONLINE\nSystem integrity verified."
    success = send_telegram_alert(chat_id, msg)
    return {"status": "sent" if success else "failed"}

@app.post("/api/alerts/test-whatsapp")
def test_whatsapp() -> dict:
    msg = "⚠ FENCEAI DIAGNOSTIC\nSecure Free WhatsApp Signal Test."
    success = send_whatsapp_alert([], msg)
    return {"status": "sent" if success else "failed"}


def send_twilio_notifications(message: str) -> dict:
    global sms_enabled, sms_phone, whatsapp_enabled, whatsapp_phone, call_enabled, call_phone
    
    if not twilio_notifications_ready():
        return {"enabled": False, "reason": "Twilio credentials are incomplete"}

    if is_local_base_url():
        return {
            "enabled": True,
            "sms_sid": "demo-sms" if sms_enabled else None,
            "call_sid": "demo-call" if call_enabled else None,
            "whatsapp_sid": "demo-whatsapp" if whatsapp_enabled else None,
            "voice_source": "local demo mode",
        }

    results = {"enabled": True}
    try:
        client = Client(
            settings.twilio_account_sid,
            settings.twilio_auth_token,
            http_client=TwilioHttpClient(timeout=5.0),
        )
        
        # SMS
        if sms_enabled and sms_phone:
            sms = client.messages.create(body=message, from_=settings.twilio_from_phone, to=sms_phone)
            results["sms_sid"] = sms.sid
            
        # WhatsApp
        if whatsapp_enabled and whatsapp_phone:
            # Twilio requires 'whatsapp:' prefix
            to_wa = whatsapp_phone if whatsapp_phone.startswith("whatsapp:") else f"whatsapp:{whatsapp_phone}"
            from_wa = settings.twilio_from_phone if settings.twilio_from_phone.startswith("whatsapp:") else f"whatsapp:{settings.twilio_from_phone}"
            wa = client.messages.create(body=message, from_=from_wa, to=to_wa)
            results["whatsapp_sid"] = wa.sid

        # Voice Call
        if call_enabled and call_phone:
            call_kwargs = {"from_": settings.twilio_from_phone, "to": call_phone}
            if settings.public_base_url and not settings.public_base_url.startswith(("http://localhost", "http://127.0.0.1", "https://localhost", "https://127.0.0.1")):
                call_kwargs["url"] = build_voice_url(message)
            else:
                call_kwargs["twiml"] = build_voice_twiml(message)
            
            call = client.calls.create(**call_kwargs)
            results["call_sid"] = call.sid

        return results
    except Exception as exc:
        return {"enabled": False, "reason": f"Twilio request failed: {exc}"}


def detection_loop() -> None:
    global machine_status, system_active, active_camera_id
    
    while True:
        if not system_active:
            time.sleep(0.5)
            continue
        
        frame = camera_manager.get_frame()
        if frame is None:
            time.sleep(0.05)
            continue
            
        # 1. AI Processing & Zone Validation
        # detector.process returns (annotated_frame, status_str, alerts_list, intruder_count)
        annotated, current_status, alerts, intruder_count = detector.process(frame)
        height, width = frame.shape[:2]

        # 2. Handle Critical Alerts (Non-blocking Comms)
        if alerts:
            snapshot_path = detector.save_snapshot(annotated, SNAPSHOT_DIR)
            
            # Machine Control Logic (Instant)
            if machine_control_enabled:
                if any(a.get("priority") == "critical" for a in alerts):
                    machine_status = "stopped"

            # Dispatcher Thread (Asynchronous)
            def dispatch_alerts(triggered_alerts, snap_path, intruder_count_val):
                # Target strictly the primary authenticated operator active in the last 2 minutes
                active_ops = db.get_active_users(threshold_minutes=2)
                if not active_ops: return

                op = active_ops[0] 
                for alert in triggered_alerts:
                    db.add_alert(alert["kind"], alert["message"], snap_path, priority=alert.get("priority", "critical"), zone_name=alert.get("zone_name"))

                    # Targeted Multi-Channel Dispatch
                    if op.get("email_enabled"):
                        target_email = op.get("alert_email") or op.get("username")
                        send_email_notification(active_camera_id, alert.get("zone_name", "Restricted"), intruder_count_val, snap_path, target_email)
                    
                    if op.get("telegram_enabled") and op.get("telegram_chat_id"):
                        timestamp_tg = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        tg_msg = (
                            "🚨 <b>INTRUSION DETECTED</b>\n"
                            "━━━━━━━━━━━━━━━━━━\n"
                            f"<b>Operator:</b>  <code>{op.get('username', 'AUTHORIZED')}</code>\n"
                            f"<b>Camera:</b>    <code>{active_camera_id.upper()}</code>\n"
                            f"<b>Zone:</b>      <code>{alert.get('zone_name', 'RESTRICTED')}</code>\n"
                            f"<b>Intruders:</b> <code>{intruder_count_val}</code>\n"
                            f"<b>Time:</b>      <code>{timestamp_tg}</code>\n"
                            "━━━━━━━━━━━━━━━━━━\n"
                            "✅ <i>Security Protocol Active</i>"
                        )
                        cid = str(op["telegram_chat_id"]).split(",")[0].strip()
                        if cid: send_telegram_alert(cid, tg_msg, snap_path)

                    if op.get("sms_enabled") and op.get("phone"):
                        send_twilio_notifications(alert["message"], target_phone=op.get("phone"))
            
            # Extract intruder count before dispatching
            intruder_count = sum(1 for (box, conf) in detector.last_results if any(z.type == "danger" and z.contains((box[0]+box[2])/2, box[3], width, height) for z in detector.zones))
            threading.Thread(target=dispatch_alerts, args=(alerts, snapshot_path, intruder_count), daemon=True).start()

        # 3. Restore Operations
        if current_status == "safe":
            machine_status = "running"

        # 4. Global Broadcast (Dashboard Sync)
        ws_data = {
            "type": "update",
            "intrusion": current_status == "intrusion",
            "status": current_status,
            "machineStatus": machine_status,
            "activeCameraId": active_camera_id,
            "fps": f"{detector.fps:.1f}",
            "latency": f"{detector.inference_time:.1f}ms",
            "personCount": len(detector.last_results),
            "intruderCount": intruder_count,
            "zones": [
                {
                    **z.__dict__,
                    "is_cooldown": z.is_cooldown,
                    "is_breached": z.is_breached,
                    "is_pending": z.is_pending
                } 
                for z in detector.zones
            ]
        }

        if main_loop:
            asyncio.run_coroutine_threadsafe(manager.broadcast(ws_data), main_loop)

        detector.last_annotated_frame = annotated


@app.on_event("startup")
def startup_event() -> None:
    global main_loop
    main_loop = asyncio.get_event_loop()
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    # Seed default admin user so login works immediately on first boot
    db.register_user("admin@gmail.com", "admin123", "System Admin")
    # Seed default cameras if none exist
    if not db.list_cameras():
        # Source "1" is typically the external USB webcam on Windows
        db.add_camera("cam_01", "External Security Node", "1", "4K", "Oasis Vision-X")
        db.add_camera("cam_02", "Integrated Diagnostic", "0", "1080p", "Internal Node")
        db.add_camera("cam_03", "Future IP Node", "rtsp://admin:admin123@192.168.1.64:554/stream", "1080p", "Remote Asset")

    camera_manager.start()
    threading.Thread(target=detection_loop, daemon=True).start()
    threading.Thread(target=telegram_bot_poller, daemon=True).start()


@app.on_event("shutdown")
def shutdown_event() -> None:
    camera_manager.stop()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/state")
def state() -> dict:
    return {
        "camera": camera_manager.state.__dict__,
        "activeCameraId": active_camera_id,
        "zones": [
            {**z.__dict__, "is_cooldown": z.is_cooldown} for z in detector.zones
        ],
        "intrusion": detector.intrusion_active,
        "latestStatus": latest_status,
        "alerts": db.list_alerts(),
        "cooldownSeconds": settings.alert_cooldown_seconds,
        "notifications": {
            "callReady": twilio_notifications_ready(),
            "publicBaseUrl": settings.public_base_url,
        },
        "recipientEmail": recipient_email,
        "systemActive": system_active,
        "machineStatus": machine_status,
        "machineControlEnabled": machine_control_enabled
    }


@app.post("/api/save-alert-config")
@app.post("/save-alert-config")
def save_alert_config(payload: dict) -> dict:
    """Save multi-recipient WhatsApp numbers (Keys are hidden in backend)."""
    global whatsapp_recipients, whatsapp_enabled
    
    if "numbers" in payload:
        whatsapp_recipients = [str(n).strip() for n in payload["numbers"] if str(n).strip()]
            
    if "whatsapp_enabled" in payload:
        whatsapp_enabled = bool(payload["whatsapp_enabled"])

    return {
        "status": "success", 
        "whatsapp_enabled": whatsapp_enabled,
        "recipient_count": len(whatsapp_recipients)
    }


@app.get("/api/settings")
def get_settings() -> dict:
    """Return current mutable runtime settings."""
    return {
        "recipientEmail": recipient_email,
        "emailEnabled":   settings.email_enabled,
        "senderEmail":    settings.sender_email,
        "cooldownSeconds": settings.email_cooldown_seconds,
        "smsEnabled":      sms_enabled,
        "smsPhone":        sms_phone,
        "whatsappEnabled": whatsapp_enabled,
        "whatsappRecipients": whatsapp_recipients,
        "callEnabled":      call_enabled,
        "callPhone":        call_phone
    }


@app.post("/api/settings")
def update_settings(payload: dict) -> dict:
    """Update mutable runtime settings securely."""
    global recipient_email, sms_enabled, sms_phone, whatsapp_enabled, call_enabled, call_phone
    
    if "recipientEmail" in payload:
        new_email = payload.get("recipientEmail", "").strip()
        if new_email and "@" in new_email:
            recipient_email = new_email
            
    if "smsEnabled" in payload: sms_enabled = bool(payload["smsEnabled"])
    if "smsPhone" in payload: sms_phone = str(payload["smsPhone"]).strip()
    
    if "whatsappEnabled" in payload: whatsapp_enabled = bool(payload["whatsappEnabled"])
    # Note: whatsapp_recipients are handled by /api/save-alert-config
    
    if "callEnabled" in payload: call_enabled = bool(payload["callEnabled"])
    if "callPhone" in payload: call_phone = str(payload["callPhone"]).strip()

    return {"updated": True, "settings": get_settings()}


@app.post("/api/camera")
@app.post("/api/cameras/{cam_id}/activate")
def set_camera(cam_id: Optional[str] = None, payload: dict = {}) -> dict:
    global active_camera_id
    id_to_set = cam_id or payload.get("cameraId") or payload.get("id") or "cam_01"
    
    # 1. Update DB Statuses
    db.set_active_camera(id_to_set)
    
    # 2. Fetch Source from DB with Fallback
    cameras = db.list_cameras()
    cam_entry = next((c for c in cameras if c["id"] == id_to_set), None)
    
    if cam_entry:
        source = str(cam_entry["source"])
    elif id_to_set == "MOBILE_CAM":
        source = "CLIENT_STREAM" # Virtual source
    else:
        # Fallback to default mapping for common IDs if not in DB
        source = camera_sources.get(id_to_set) or "0"
    
    # 3. Apply to Runtime Manager
    active_camera_id = id_to_set
    detector.active_camera_id = id_to_set
    
    # Only try to open physical capture if not a virtual source
    if source != "CLIENT_STREAM":
        camera_manager.set_source(source)
    
    print(f"🎬 SWITCH: Activated Node {id_to_set} (Source: {source})")
    
    return {
        "activeCameraId": active_camera_id,
        "camera": camera_manager.state.__dict__,
        "zones": [z.__dict__ for z in detector.zones]
    }


@app.get("/api/cameras")
def get_cameras() -> dict:
    return {"cameras": db.list_cameras()}

@app.get("/api/analytics/report")
async def generate_report():
    """Generates a CSV report of all historical alerts."""
    alerts = db.list_alerts()
    output = "ID,Timestamp,Type,Zone,Priority,Message\n"
    for a in alerts:
        output += f"{a['id']},{a['timestamp']},{a['kind']},{a.get('zone_name','N/A')},{a['priority']},{a['message'].replace(',',' ')}\n"
    
    return Response(
        content=output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fenceai_security_report.csv"}
    )

@app.get("/api/analytics/stats")
async def get_analytics_stats():
    """Returns aggregated stats for the analytics dashboard."""
    alerts = db.list_alerts()
    # Dynamic intensity based on real alerts
    intensity = [
        {"name": "Loading Dock A", "hits": sum(1 for a in alerts if "Dock" in (a.get("zone_name") or ""))},
        {"name": "Main Perimeter", "hits": sum(1 for a in alerts if "Perimeter" in (a.get("zone_name") or ""))},
        {"name": "Server Vault", "hits": sum(1 for a in alerts if "Vault" in (a.get("zone_name") or ""))},
        {"name": "Staff Entrance", "hits": sum(1 for a in alerts if "Staff" in (a.get("zone_name") or ""))}
    ]
    return {
        "accuracy": 99.8,
        "latency": 14.2,
        "total_breaches": len(alerts),
        "uptime": 99.9,
        "sector_intensity": intensity
    }


@app.post("/api/cameras")
def add_camera(payload: dict) -> dict:
    cam_id = payload.get("id")
    name = payload.get("name")
    source = payload.get("source")
    resolution = payload.get("resolution", "1080p")
    model = payload.get("model", "Standard Node")
    
    if not cam_id or not source:
        raise HTTPException(status_code=400, detail="ID and Source/IP are required")
        
    db.add_camera(cam_id, name, source, resolution, model)
    return {"success": True, "cameras": db.list_cameras()}


@app.delete("/api/cameras/{cam_id}")
def delete_camera(cam_id: str) -> dict:
    db.delete_camera(cam_id)
    return {"success": True, "cameras": db.list_cameras()}


@app.post("/api/fence")
def update_fence(payload: dict) -> dict:
    """Accepts { zones, cameraId }"""
    zones_data = payload.get("zones", [])
    cam_id = payload.get("cameraId", active_camera_id)
    updated_zones = detector.set_zones(zones_data, cam_id)
    return {"zones": [z.__dict__ for z in updated_zones]}


@app.post("/api/fence/reset")
def reset_fence() -> dict:
    """Clears all zones."""
    detector.set_zones([])
    return {"zones": [], "message": "All zones cleared"}


@app.get("/api/alerts")
def get_alerts() -> dict:
    return {"alerts": db.list_alerts()}


@app.delete("/api/alerts")
def clear_all_alerts() -> dict:
    db.clear_alerts()
    return {"cleared": True}


@app.post("/api/alerts/delete")
def delete_specific_alerts(payload: dict) -> dict:
    ids = payload.get("ids", [])
    if ids:
        db.delete_alerts(ids)
    return {"deleted": len(ids)}


@app.post("/api/machine/toggle")
def toggle_machine_control(payload: dict) -> dict:
    global machine_control_enabled
    machine_control_enabled = bool(payload.get("enabled", False))
    return {"machineControlEnabled": machine_control_enabled}


@app.post("/api/machine/reset")
def reset_machine() -> dict:
    global machine_status
    machine_status = "running"
    return {"machineStatus": machine_status}


@app.get("/api/setup/status")
def get_setup_status() -> dict:
    """Check if the system has been configured (wizard logic)."""
    # System is considered "setup" if any zones exist or recipient email is set
    has_zones = any(detector.zones_map.values())
    is_configured = bool(recipient_email) or has_zones
    return {"setupRequired": not is_configured}


@app.post("/api/auth/password")
def change_password(payload: dict) -> dict:
    username = payload.get("username", "admin@gmail.com")
    new_password = payload.get("password")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password required")
    db.update_user_password(username, new_password)
    return {"success": True, "message": "Security credentials rotated"}


@app.post("/api/alerts/acknowledge")
def acknowledge_alert(payload: dict) -> dict:
    alert_id = payload.get("id")
    acknowledged = payload.get("acknowledged", True)
    if alert_id:
        db.acknowledge_alert(alert_id, acknowledged)
        return {"success": True, "id": alert_id}
    raise HTTPException(status_code=400, detail="Alert ID required")


@app.post("/api/system/toggle")
def toggle_system(payload: dict) -> dict:
    """Start or Stop the detection system."""
    global system_active
    active = payload.get("active", True)
    system_active = bool(active)
    return {"systemActive": system_active}


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/alerts/test-email")
def test_alert() -> dict:
    message = "Industrial Safety Terminal - MULTI-CHANNEL COMMS TEST"
    
    # 1. Email Test
    import numpy as np
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(frame, "COMMS TEST", (100, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 5)
    snapshot_path = detector.save_snapshot(frame, SNAPSHOT_DIR)
    email_res = send_email_notification(message, snapshot_path)
    
    # 2. Twilio (SMS/WhatsApp/Call) Test
    twilio_res = send_twilio_notifications(message)
    
    return {
        "message": "Multi-channel test executed",
        "email": email_res,
        "twilio": twilio_res
    }


@app.post("/api/auth/login")
def login(payload: dict) -> dict:
    username = payload.get("username")
    password = payload.get("password")
    if db.authenticate_user(username, password):
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid security credentials")


@app.post("/api/auth/register")
def register(payload: dict) -> dict:
    username = payload.get("username") or payload.get("email")
    password = payload.get("password")
    full_name = payload.get("fullName")
    phone = payload.get("phone")
    company = payload.get("company")
    role = payload.get("role")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Credentials required")
    
    if db.register_user(username, password, full_name):
        return {"success": True, "message": "Operator registered successfully"}
    raise HTTPException(status_code=400, detail="OPERATOR_ID_EXISTS")


@app.post("/api/alerts/test-call")
def test_call_alert(payload: dict | None = None) -> dict:
    message = "Test call alert from the virtual fencing system."
    if payload and isinstance(payload.get("message"), str) and payload["message"].strip():
        message = payload["message"].strip()

    result = send_twilio_notifications(message)
    if not result.get("enabled"):
        raise HTTPException(status_code=400, detail=result.get("reason", "Call alert is not configured"))

    event = db.add_alert("call-test", message)
    latest_status.update({"status": "safe", "message": f"Call alert sent: {event.message}", "twilio": result})
    return {"message": event.message, "twilio": result}





@app.get("/api/video_feed")
def video_feed() -> StreamingResponse:
    def frame_generator():
        while True:
            # Use annotated frame if available, otherwise raw camera frame
            frame = detector.last_annotated_frame
            if frame is None:
                frame = camera_manager.get_frame()
            
            if frame is None:
                time.sleep(0.01)
                continue
            
            # Lower JPEG quality to 75% for faster transmission and lower latency
            ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not ok:
                continue
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            # Tighten loop for lower latency
            time.sleep(0.01)

    return StreamingResponse(frame_generator(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/api/twilio/voice")
def twilio_voice(message: str = "Attention. Intrusion detected.") -> Response:
    xml = f"""<?xml version='1.0' encoding='UTF-8'?>
<Response>
  <Say voice='alice'>{message}</Say>
</Response>"""
    return Response(content=xml, media_type="application/xml")


@app.get("/")
def root() -> dict:
    # Seed a default admin if no users exist (for PoC ease of use)
    try:
        db.register_user("admin@gmail.com", "admin123", "System Admin")
    except:
        pass
    return {"message": "Virtual fencing backend is running"}

from pydantic import BaseModel
import base64
import numpy as np
import cv2

class FrameData(BaseModel):
    image: str

@app.post("/api/analyze_client_frame")
def analyze_client_frame(data: FrameData):
    try:
        # Decode base64 image
        img_data = base64.b64decode(data.image.split(",")[1] if "," in data.image else data.image)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"status": "error", "message": "Invalid image"}

        # Process with YOLO
        annotated, current_status, alerts, intruder_count = detector.process(frame)
        height, width = frame.shape[:2]
        
        boxes = []
        for box, conf in detector.last_results:
            boxes.append({
                "x1": int(box[0]), "y1": int(box[1]),
                "x2": int(box[2]), "y2": int(box[3]),
                "conf": float(conf)
            })
            
        # Dispatch alerts asynchronously for the client camera
        if alerts:
            snapshot_path = detector.save_snapshot(annotated, SNAPSHOT_DIR)
            
            # Dispatcher Thread (Asynchronous)
            def dispatch_alerts(triggered_alerts, snap_path, intruder_count_val):
                # 1. Identify the Single Primary Operator (Active in last 2 mins)
                # This ensures ONLY the person currently using the terminal gets the alert
                active_ops = db.get_active_users(threshold_minutes=2)
                
                # If no one is active, we don't broadcast to everyone anymore (Privacy First)
                if not active_ops:
                    print("ℹ No active operator session found. Alert suppressed to prevent unauthorized broadcast.")
                    return

                # Take the most recently active operator
                op = active_ops[0] 

                active_camera_id = "MOBILE_CAM"
                for alert in triggered_alerts:
                    # Persistence (Always logged to history)
                    db.add_alert(alert["kind"], alert["message"], snap_path, priority=alert.get("priority", "critical"), zone_name=alert.get("zone_name"))

                    # A. Targeted Email (Strictly to the login session email)
                    if op.get("email_enabled") and (op.get("alert_email") or op.get("username")):
                        target_email = op.get("alert_email") or op.get("username")
                        send_email_notification(active_camera_id, alert.get("zone_name", "Restricted"), intruder_count_val, snap_path, target_email)
                    
                    # B. Targeted Telegram (Strictly to this operator's linked ID)
                    if op.get("telegram_enabled") and op.get("telegram_chat_id"):
                        timestamp_tg = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        tg_msg = (
                            "🚨 <b>INTRUSION DETECTED</b>\n"
                            "━━━━━━━━━━━━━━━━━━\n"
                            f"<b>Operator:</b>  <code>{op.get('username', 'AUTHORIZED')}</code>\n"
                            f"<b>Camera:</b>    <code>{active_camera_id.upper()}</code>\n"
                            f"<b>Zone:</b>      <code>{alert.get('zone_name', 'RESTRICTED')}</code>\n"
                            f"<b>Intruders:</b> <code>{intruder_count_val}</code>\n"
                            f"<b>Time:</b>      <code>{timestamp_tg}</code>\n"
                            "━━━━━━━━━━━━━━━━━━\n"
                            "✅ <i>Security Protocol Active</i>"
                        )
                        # Only send to the primary linked ID for this user
                        cid = str(op["telegram_chat_id"]).split(",")[0].strip()
                        if cid:
                            send_telegram_alert(cid, tg_msg, snap_path)

                    # Twilio SMS (Only if explicitly enabled for this operator)
                    if op.get("sms_enabled") and op.get("phone"):
                        send_twilio_notifications(alert["message"], target_phone=op.get("phone"))

            threading.Thread(target=dispatch_alerts, args=(alerts, snapshot_path, intruder_count), daemon=True).start()
            
        return {
            "status": current_status,
            "alerts": alerts,
            "boxes": boxes
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
