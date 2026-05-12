from __future__ import annotations
import os
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Load env for database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fenceai:fenceai123@localhost:5444/fenceai")

Base = declarative_base()

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    priority = Column(String, default="critical")
    zone_name = Column(String, nullable=True)
    snapshot_url = Column(String, nullable=True)
    acknowledged = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)
    telegram_username = Column(String, nullable=True)
    telegram_enabled = Column(Boolean, default=False)
    alert_email = Column(String, nullable=True)
    email_enabled = Column(Boolean, default=False)
    whatsapp_number = Column(String, nullable=True)
    whatsapp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source = Column(String, nullable=False)
    status = Column(String, default='active')
    resolution = Column(String, default='1080p')
    model = Column(String, default='Standard Node')

class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    id = Column(Integer, primary_key=True, index=True)
    telegram_chat_id = Column(String, nullable=True)
    telegram_username = Column(String, nullable=True)
    telegram_enabled = Column(Boolean, default=False)
    email = Column(String, nullable=True)
    email_enabled = Column(Boolean, default=False)
    whatsapp_number = Column(String, nullable=True)
    whatsapp_enabled = Column(Boolean, default=False)
    sms_number = Column(String, nullable=True)
    sms_enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Database:
    def __init__(self, db_url: str) -> None:
        # Enforce PostgreSQL Connection (Strict Industrial Mode)
        self.engine = create_engine(db_url, connect_args={'connect_timeout': 5})
        try:
            self.engine.connect()
            print("✅ DATABASE: Successfully Connected to PostgreSQL Cluster")
        except Exception as e:
            print("❌ CRITICAL: PostgreSQL Cluster unreachable. System halting to prevent data fragmentation.")
            raise RuntimeError(f"Database connection failed: {e}")
            
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self._init_db()

    def _init_db(self):
        Base.metadata.create_all(bind=self.engine)
        
        # Add column if it doesn't exist (Migration)
        try:
            with self.engine.begin() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE notification_settings ADD COLUMN telegram_username VARCHAR;"))
        except Exception:
            pass

        # Seed default notification settings if empty
        db = self.SessionLocal()
        try:
            if db.query(NotificationSettings).count() == 0:
                settings = NotificationSettings(updated_at=datetime.now(timezone.utc))
                db.add(settings)
                db.commit()
        finally:
            db.close()

    def get_db(self):
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    # Alert Methods
    def add_alert(self, kind: str, message: str, snapshot_path: Optional[Path] = None, priority: str = "critical", zone_name: Optional[str] = None):
        snapshot_url = f"/snapshots/{snapshot_path.name}" if snapshot_path else None
        db = self.SessionLocal()
        try:
            alert = Alert(
                kind=kind,
                message=message,
                priority=priority,
                zone_name=zone_name,
                snapshot_url=snapshot_url
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            return alert
        finally:
            db.close()

    def acknowledge_alert(self, alert_id: int, acknowledged: bool = True):
        db = self.SessionLocal()
        try:
            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.acknowledged = acknowledged
                db.commit()
        finally:
            db.close()

    def list_alerts(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        db = self.SessionLocal()
        try:
            alerts = db.query(Alert).order_by(desc(Alert.id)).offset(offset).limit(limit).all()
            return [self._to_dict(a) for a in alerts]
        finally:
            db.close()

    def clear_alerts(self):
        db = self.SessionLocal()
        try:
            db.query(Alert).delete()
            db.commit()
        finally:
            db.close()

    def delete_alerts(self, alert_ids: List[int]):
        db = self.SessionLocal()
        try:
            db.query(Alert).filter(Alert.id.in_(alert_ids)).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()

    def _to_dict(self, obj):
        d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        # Format datetime for JSON
        for k, v in d.items():
            if isinstance(v, datetime):
                d[k] = v.isoformat()
        return d

    # Auth Methods
    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def register_user(self, username: str, password: str, full_name: Optional[str] = None) -> bool:
        db = self.SessionLocal()
        try:
            if db.query(User).filter(User.username == username).first():
                return False
            user = User(
                username=username,
                password_hash=self._hash_password(password),
                full_name=full_name
            )
            db.add(user)
            db.commit()
            return True
        except Exception:
            return False
        finally:
            db.close()

    def update_user_password(self, username: str, new_password: str) -> bool:
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.password_hash = self._hash_password(new_password)
                db.commit()
                return True
            return False
        finally:
            db.close()

    def authenticate_user(self, username: str, password: str) -> bool:
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            if user and user.password_hash == self._hash_password(password):
                user.last_active = datetime.now(timezone.utc)
                db.commit()
                return True
            return False
        finally:
            db.close()

    def get_user(self, username: str) -> Optional[Dict]:
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            return self._to_dict(user) if user else None
        finally:
            db.close()

    def update_user_last_active(self, username: str):
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.last_active = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    def get_active_users(self, threshold_minutes: int = 30) -> List[Dict]:
        """Fetch users who have been active recently."""
        db = self.SessionLocal()
        try:
            threshold = datetime.now(timezone.utc).replace(tzinfo=None) # naive for compare if needed, or stick to utc
            # Actually, let's just use a simple time window
            from datetime import timedelta
            window = datetime.now(timezone.utc) - timedelta(minutes=threshold_minutes)
            users = db.query(User).filter(User.last_active >= window).all()
            return [self._to_dict(u) for u in users]
        finally:
            db.close()

    # Camera Methods
    def add_camera(self, id: str, name: str, source: str, resolution: str = "1080p", model: str = "Standard Node"):
        db = self.SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == id).first()
            if not camera:
                camera = Camera(id=id, name=name, source=source, resolution=resolution, model=model)
                db.add(camera)
            else:
                camera.name = name
                camera.source = source
                camera.resolution = resolution
                camera.model = model
            db.commit()
        finally:
            db.close()

    def list_cameras(self) -> List[Dict]:
        db = self.SessionLocal()
        try:
            cameras = db.query(Camera).all()
            return [self._to_dict(c) for c in cameras]
        finally:
            db.close()

    def delete_camera(self, cam_id: str):
        db = self.SessionLocal()
        try:
            db.query(Camera).filter(Camera.id == cam_id).delete()
            db.commit()
        finally:
            db.close()

    def update_camera_status(self, cam_id: str, status: str):
        db = self.SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == cam_id).first()
            if camera:
                camera.status = status
                db.commit()
        finally:
            db.close()

    def set_active_camera(self, cam_id: str):
        """Set one camera as active and all others as inactive."""
        db = self.SessionLocal()
        try:
            # Set all to inactive
            db.query(Camera).update({Camera.status: "inactive"})
            # Set specific to active
            camera = db.query(Camera).filter(Camera.id == cam_id).first()
            if camera:
                camera.status = "active"
            db.commit()
        finally:
            db.close()

    # Notification Settings Methods
    def get_notification_settings(self, username: Optional[str] = None) -> Dict:
        db = self.SessionLocal()
        try:
            if username:
                user = db.query(User).filter(User.username == username).first()
                if user:
                    return {
                        "telegram_chat_id": user.telegram_chat_id,
                        "telegram_username": user.telegram_username,
                        "telegram_enabled": user.telegram_enabled,
                        "email": user.alert_email or user.username,
                        "email_enabled": user.email_enabled,
                        "whatsapp_number": user.whatsapp_number,
                        "whatsapp_enabled": user.whatsapp_enabled
                    }
            
            # Fallback to global settings
            settings = db.query(NotificationSettings).first()
            return self._to_dict(settings) if settings else {}
        finally:
            db.close()

    def update_notification_settings(self, data: Dict, username: Optional[str] = None):
        db = self.SessionLocal()
        try:
            if username:
                user = db.query(User).filter(User.username == username).first()
                if user:
                    if "telegram_chat_id" in data: user.telegram_chat_id = data["telegram_chat_id"]
                    if "telegram_username" in data: user.telegram_username = data["telegram_username"]
                    if "telegram_enabled" in data: user.telegram_enabled = bool(data["telegram_enabled"])
                    if "email" in data: user.alert_email = data["email"]
                    if "email_enabled" in data: user.email_enabled = bool(data["email_enabled"])
                    if "whatsapp_number" in data: user.whatsapp_number = data["whatsapp_number"]
                    if "whatsapp_enabled" in data: user.whatsapp_enabled = bool(data["whatsapp_enabled"])
                    db.commit()
                    return

            settings = db.query(NotificationSettings).first()
            if settings:
                for k, v in data.items():
                    if hasattr(settings, k) and k != 'id':
                        setattr(settings, k, v)
                settings.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()
