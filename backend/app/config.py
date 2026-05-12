from __future__ import annotations

import os
from dataclasses import dataclass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Use system env vars or defaults if dotenv is not installed
    pass


@dataclass(frozen=True)
class Settings:
    camera_source: str = os.getenv("CAMERA_SOURCE", "0")
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))
    alert_cooldown_seconds: int = int(os.getenv("ALERT_COOLDOWN_SECONDS", "10"))
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_from_phone: str = os.getenv("TWILIO_FROM_PHONE", "")
    twilio_to_phone: str = os.getenv("TWILIO_TO_PHONE", "")
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    
    # Free WhatsApp Configuration (CallMeBot)
    callmebot_phone: str = os.getenv("CALLMEBOT_PHONE", "")
    callmebot_api_key: str = os.getenv("CALLMEBOT_API_KEY", "")

    # Email Settings
    email_enabled: bool = os.getenv("EMAIL_ENABLED", "true").lower() == "true"
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    sender_email: str = os.getenv("SENDER_EMAIL", "")
    sender_password: str = os.getenv("SENDER_PASSWORD", "")
    recipient_email: str = os.getenv("RECIPIENT_EMAIL", "")
    email_cooldown_seconds: int = int(os.getenv("EMAIL_COOLDOWN_SECONDS", "10"))


settings = Settings()
