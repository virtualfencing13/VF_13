from __future__ import annotations
import os
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session as SQLAlchemySession
from pathlib import Path
from dotenv import load_dotenv

# Resolve absolute path to the backend directory where .env is stored
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=backend_dir / ".env")

# Load env for database URL with an absolute SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{backend_dir}/fenceai.db")

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
    owner_id = Column(String, nullable=True)
    camera_id = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=True)
    company = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)
    telegram_username = Column(String, nullable=True)
    telegram_enabled = Column(Boolean, default=False)
    alert_email = Column(String, nullable=True)
    email_enabled = Column(Boolean, default=False)
    whatsapp_number = Column(String, nullable=True)
    whatsapp_enabled = Column(Boolean, default=False)
    sms_enabled = Column(Boolean, default=False)
    call_enabled = Column(Boolean, default=False)
    last_call_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Google Auth Fields
    google_email = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    google_picture = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    auth_provider = Column(String, default="local")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, ForeignKey("users.username"), nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)


class AllowedDomain(Base):
    __tablename__ = "allowed_domains"
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SecurityLog(Base):
    __tablename__ = "security_logs"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, nullable=True)
    action = Column(String, nullable=False)  # "login_attempt", "login_success", "login_failed", "register", etc.
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    details = Column(String, nullable=True)

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, nullable=False)
    node_id = Column(String, unique=True, index=True, nullable=False)
    node_name = Column(String, nullable=False)
    camera_type = Column(String, nullable=False, default="webcam") # "webcam", "rtsp", "ip", "usb"
    rtsp_url = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)
    location = Column(String, nullable=True)
    zone_type = Column(String, nullable=True, default="danger") # "danger", "warning"
    ai_enabled = Column(Boolean, default=True)
    status = Column(String, default="offline") # "online", "offline", "error"
    fps = Column(Integer, default=0)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    zones_data = Column(Text, nullable=True)  # Persisted dynamic safety zones JSON list
    
    # Backward compatibility properties
    name = Column(String, nullable=True)
    source = Column(String, nullable=True)
    resolution = Column(String, default='1080p')
    model = Column(String, default='Standard Node')

class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    id = Column(Integer, primary_key=True, index=True)
    telegram_chat_id = Column(String, nullable=True)
    telegram_username = Column(String, nullable=True)
    telegram_enabled = Column(Boolean, default=False)
    email = Column(String, nullable=True)  # Primary email (backward compatibility)
    emails = Column(String, nullable=True)  # Multiple emails comma-separated
    email_enabled = Column(Boolean, default=False)
    whatsapp_number = Column(String, nullable=True)
    whatsapp_enabled = Column(Boolean, default=False)
    sms_number = Column(String, nullable=True)
    sms_enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SafeSession(SQLAlchemySession):
    def close(self):
        try:
            super().close()
        except Exception:
            pass

class Database:
    def __init__(self, db_url: str) -> None:
        # Standardize URL for SQLAlchemy + pg8000
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
        
        try:
            if "sqlite" in db_url:
                self.engine = create_engine(db_url, connect_args={"check_same_thread": False})
            elif "pg8000" in db_url:
                # pg8000 uses 'timeout' in seconds
                self.engine = create_engine(db_url, connect_args={'timeout': 20}, pool_pre_ping=True, pool_recycle=300)
            else:
                self.engine = create_engine(db_url, connect_args={'connect_timeout': 20}, pool_pre_ping=True, pool_recycle=300)

            
            # Explicitly test the connection
            with self.engine.connect() as conn:
                db_name = db_url.split('/')[-1].split('?')[0]
                print(f"✅ DATABASE: Connected to [{db_name}] Cloud Storage")
        except Exception as e:
            print("\n" + "!"*60)
            print("⚠️ WARNING: Cloud Database Connection Failed")
            print(f"Error: {e}")
            print("🔄 FALLBACK: Switching to Local Offline Mode (SQLite)")
            print("!"*60 + "\n")
            
            # Fallback to Local SQLite using absolute path
            local_url = f"sqlite:///{backend_dir}/fenceai_local.db"
            self.engine = create_engine(local_url, connect_args={"check_same_thread": False})
            
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine, class_=SafeSession)

        self._init_db()

    def _init_db(self):
        try:
            Base.metadata.create_all(bind=self.engine)
        except Exception as e:
            print(f"⚠️ Warning: Could not run create_all on DB: {e}")
            
        # Add missing columns if they don't exist (Migration)
        from sqlalchemy import text, inspect
        
        is_sqlite = "sqlite" in str(self.engine.url)
        
        if not is_sqlite:
            print("ℹ️ DATABASE: Remote database detected. Skipping startup raw ALTER TABLE migrations to prevent lock contention.")
        else:
            try:
                inspector = inspect(self.engine)
                existing_cols = {}
                for t_name in ["notification_settings", "users", "cameras", "alerts"]:
                    t_names = inspector.get_table_names()
                    matched_t = next((t for t in t_names if t.lower() == t_name.lower()), None)
                    if matched_t:
                        existing_cols[t_name] = [col["name"].lower() for col in inspector.get_columns(matched_t)]
                    else:
                        existing_cols[t_name] = []
            except Exception as inspect_err:
                print(f"⚠️ Warning during DB inspection (skipping alterations): {inspect_err}")
                existing_cols = None

            if existing_cols is not None:
                # 1. notification_settings Alterations
                for col_name, col_type in [
                    ("telegram_username", "VARCHAR"),
                    ("emails", "VARCHAR")
                ]:
                    if col_name.lower() not in existing_cols.get("notification_settings", []):
                        try:
                            with self.engine.begin() as conn:
                                conn.execute(text(f"ALTER TABLE notification_settings ADD COLUMN {col_name} {col_type};"))
                        except Exception:
                            pass

                # 2. users Alterations
                for col_name, col_type in [
                    ("role", "VARCHAR"),
                    ("company", "VARCHAR"),
                    ("phone", "VARCHAR"),
                    ("sms_enabled", "BOOLEAN DEFAULT FALSE"),
                    ("call_enabled", "BOOLEAN DEFAULT FALSE"),
                    ("last_call_time", "TIMESTAMP")
                ]:
                    if col_name.lower() not in existing_cols.get("users", []):
                        try:
                            with self.engine.begin() as conn:
                                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                        except Exception:
                            pass

                # 3. users Google Auth Alterations
                for col_name, col_type in [
                    ("google_email", "VARCHAR"),
                    ("is_approved", "BOOLEAN DEFAULT FALSE"),
                    ("google_picture", "VARCHAR"),
                    ("last_login", "TIMESTAMP"),
                    ("auth_provider", "VARCHAR DEFAULT 'local'")
                ]:
                    if col_name.lower() not in existing_cols.get("users", []):
                        try:
                            with self.engine.begin() as conn:
                                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                        except Exception:
                            pass

                # 4. cameras Dynamic CCTV/IP Node Alterations
                for col_name, col_type in [
                    ("owner_id", "VARCHAR"),
                    ("node_id", "VARCHAR"),
                    ("node_name", "VARCHAR"),
                    ("camera_type", "VARCHAR DEFAULT 'webcam'"),
                    ("rtsp_url", "VARCHAR"),
                    ("ip_address", "VARCHAR"),
                    ("username", "VARCHAR"),
                    ("password", "VARCHAR"),
                    ("location", "VARCHAR"),
                    ("zone_type", "VARCHAR DEFAULT 'danger'"),
                    ("ai_enabled", "BOOLEAN DEFAULT TRUE"),
                    ("fps", "INTEGER DEFAULT 0"),
                    ("last_seen", "TIMESTAMP"),
                    ("created_at", "TIMESTAMP"),
                    ("zones_data", "TEXT")
                ]:
                    if col_name.lower() not in existing_cols.get("cameras", []):
                        try:
                            with self.engine.begin() as conn:
                                conn.execute(text(f"ALTER TABLE cameras ADD COLUMN {col_name} {col_type};"))
                        except Exception:
                            pass

                # 5. alerts Alterations
                for col_name, col_type in [
                    ("owner_id", "VARCHAR"),
                    ("camera_id", "VARCHAR")
                ]:
                    if col_name.lower() not in existing_cols.get("alerts", []):
                        try:
                            with self.engine.begin() as conn:
                                conn.execute(text(f"ALTER TABLE alerts ADD COLUMN {col_name} {col_type};"))
                        except Exception:
                            pass

        try:
            db = self.SessionLocal()
            try:
                # Seed default notification settings if empty
                count = 0
                try:
                    count = db.query(NotificationSettings).count()
                except Exception:
                    pass
                
                if count == 0:
                    settings = NotificationSettings(updated_at=datetime.now(timezone.utc))
                    db.add(settings)
                    db.commit()

                # Seed default allowed domains if empty
                domain_count = 0
                try:
                    domain_count = db.query(AllowedDomain).count()
                except Exception:
                    pass
                
                if domain_count == 0:
                    for d in ["company.com", "kct.ac.in"]:
                        db.add(AllowedDomain(domain=d))
                    db.commit()

                # Seed / Update admin@gmail.com is_approved status
                admin = db.query(User).filter(User.username == "admin@gmail.com").first()
                if admin:
                    admin.is_approved = True
                    admin.auth_provider = "local"
                    db.commit()
            except Exception as seed_err:
                print(f"⚠️ Warning during seeding: {seed_err}")
            finally:
                db.close()
        except Exception as session_err:
            print(f"⚠️ Warning: Could not create DB session for seeding: {session_err}")

    def get_db(self):
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    # Alert Methods
    def add_alert(self, kind: str, message: str, snapshot_path: Optional[Path] = None, priority: str = "critical", zone_name: Optional[str] = None, owner_id: Optional[str] = None, camera_id: Optional[str] = None):
        snapshot_url = f"/snapshots/{snapshot_path.name}" if snapshot_path else None
        db = self.SessionLocal()
        try:
            alert = Alert(
                kind=kind,
                message=message,
                priority=priority,
                zone_name=zone_name,
                snapshot_url=snapshot_url,
                owner_id=owner_id,
                camera_id=camera_id
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

    def list_alerts(self, limit: int = 50, offset: int = 0, owner_id: Optional[str] = None) -> List[dict]:
        try:
            db = self.SessionLocal()
            query = db.query(Alert)
            if owner_id:
                query = query.filter(Alert.owner_id == owner_id)
            else:
                return []
            alerts = query.order_by(desc(Alert.id)).offset(offset).limit(limit).all()
            return [self._to_dict(a) for a in alerts]
        except Exception as e:
            print(f"⚠️ DB Error (list_alerts): {e}")
            return []
        finally:
            db.close()

    def clear_alerts(self, owner_id: Optional[str] = None):
        db = self.SessionLocal()
        try:
            query = db.query(Alert)
            if owner_id:
                query = query.filter(Alert.owner_id == owner_id)
            else:
                return
            query.delete(synchronize_session=False)
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

    def register_user(self, username: str, password: str, full_name: Optional[str] = None, role: Optional[str] = None, company: Optional[str] = None, phone: Optional[str] = None) -> bool:
        db = self.SessionLocal()
        try:
            if db.query(User).filter(User.username == username).first():
                return False
            user = User(
                username=username,
                password_hash=self._hash_password(password),
                full_name=full_name,
                role=role or "operator",
                company=company or "default",
                phone=phone,
                alert_email=username,
                email_enabled=True,
                is_approved=True
            )
            db.add(user)
            db.commit()
            
            # Auto-seed default cameras for dynamic onboarding
            try:
                owner_prefix = username.replace('@', '_').replace('.', '_')
                c1 = Camera(
                    id=f"{owner_prefix}_cam_01",
                    owner_id=username,
                    node_id="cam_01",
                    node_name="Primary IP Security Camera",
                    camera_type="rtsp",
                    rtsp_url="rtsp://admin:Forge@2000@192.168.55.247:554/Streaming/Channels/102",
                    location="Local Sector 01",
                    zone_type="danger",
                    ai_enabled=True,
                    status="offline",
                    name="Primary IP Security Camera",
                    source="rtsp://admin:Forge@2000@192.168.55.247:554/Streaming/Channels/102"
                )
                c2 = Camera(
                    id=f"{owner_prefix}_cam_02",
                    owner_id=username,
                    node_id="cam_02",
                    node_name="System Webcam 02",
                    camera_type="webcam",
                    rtsp_url="1",
                    location="Local Sector 02",
                    zone_type="danger",
                    ai_enabled=True,
                    status="offline",
                    name="System Webcam 02",
                    source="1"
                )
                db.add(c1)
                db.add(c2)
                db.commit()
            except Exception as seed_err:
                print(f"⚠️ Failed to seed default cameras for local registration: {seed_err}")
                db.rollback()
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

    def get_all_users(self) -> List[Dict]:
        db = self.SessionLocal()
        try:
            users = db.query(User).all()
            return [self._to_dict(u) for u in users]
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
            # Make window offset-naive for safe comparison against local or offset-naive DB datetimes
            from datetime import timedelta
            window = (datetime.now(timezone.utc) - timedelta(minutes=threshold_minutes)).replace(tzinfo=None)
            users = db.query(User).filter(User.last_active >= window).all()
            return [self._to_dict(u) for u in users]
        finally:
            db.close()

    # Camera Methods
    def add_camera(self, id: str, name: str, source: str, resolution: str = "1080p", model: str = "Standard Node", owner_id: Optional[str] = None, camera_type: Optional[str] = None, rtsp_url: Optional[str] = None, location: Optional[str] = None, zone_type: Optional[str] = None, ai_enabled: Optional[bool] = None):
        db = self.SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == id).first()
            
            effective_owner = owner_id or "admin@gmail.com"
            effective_node_name = name or "Default Node"
            effective_type = camera_type or ("rtsp" if str(source).startswith("rtsp://") else "webcam")
            effective_url = rtsp_url or source
            effective_ai = ai_enabled if ai_enabled is not None else True
            effective_zone = zone_type or "danger"

            if not camera:
                camera = Camera(
                    id=id,
                    owner_id=effective_owner,
                    node_id=id,
                    node_name=effective_node_name,
                    camera_type=effective_type,
                    rtsp_url=effective_url,
                    ip_address=None,
                    username=None,
                    password=None,
                    location=location,
                    zone_type=effective_zone,
                    ai_enabled=effective_ai,
                    status="offline",
                    fps=0,
                    
                    # Backward compatibility fields
                    name=name,
                    source=source,
                    resolution=resolution,
                    model=model
                )
                db.add(camera)
            else:
                camera.owner_id = effective_owner
                camera.node_name = effective_node_name
                camera.camera_type = effective_type
                camera.rtsp_url = effective_url
                if location:
                    camera.location = location
                camera.zone_type = effective_zone
                camera.ai_enabled = effective_ai
                
                # Backward compatibility fields
                camera.name = name
                camera.source = source
                camera.resolution = resolution
                camera.model = model
            db.commit()
        finally:
            db.close()

    def list_cameras(self) -> List[Dict]:
        try:
            db = self.SessionLocal()
            cameras = db.query(Camera).all()
            return [self._to_dict(c) for c in cameras]
        except Exception as e:
            print(f"⚠️ DB Error (list_cameras): {e}")
            return []
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
                        "emails": user.alert_email or user.username,
                        "email_enabled": user.email_enabled,
                        "whatsapp_number": user.whatsapp_number,
                        "whatsapp_enabled": user.whatsapp_enabled,
                        "phone": user.phone,
                        "sms_enabled": user.sms_enabled,
                        "call_enabled": user.call_enabled
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
                    
                    if "emails" in data:
                        user.alert_email = data["emails"]
                    elif "email" in data:
                        user.alert_email = data["email"]
                        
                    if "email_enabled" in data: user.email_enabled = bool(data["email_enabled"])
                    if "whatsapp_number" in data: user.whatsapp_number = data["whatsapp_number"]
                    if "whatsapp_enabled" in data: user.whatsapp_enabled = bool(data["whatsapp_enabled"])
                    if "phone" in data: user.phone = data["phone"]
                    if "sms_enabled" in data: user.sms_enabled = bool(data["sms_enabled"])
                    if "call_enabled" in data: user.call_enabled = bool(data["call_enabled"])
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

    def get_active_operator(self) -> Optional[Dict]:
        db = self.SessionLocal()
        try:
            # Query approved users only
            user = db.query(User).filter(User.is_approved == True).order_by(desc(User.last_active)).first()
            return self._to_dict(user) if user else None
        except Exception as e:
            print(f"⚠️ DB Error (get_active_operator): {e}")
            return None
        finally:
            db.close()

    # --- ADMIN / USER MANAGEMENT METHODS ---
    def list_users(self) -> List[Dict]:
        db = self.SessionLocal()
        try:
            users = db.query(User).order_by(desc(User.created_at)).all()
            return [self._to_dict(u) for u in users]
        except Exception as e:
            print(f"⚠️ DB Error (list_users): {e}")
            return []
        finally:
            db.close()

    def update_user_approval(self, username: str, is_approved: bool) -> bool:
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.is_approved = is_approved
                db.commit()
                return True
            return False
        except Exception as e:
            print(f"⚠️ DB Error (update_user_approval): {e}")
            return False
        finally:
            db.close()

    def update_user_role(self, username: str, role: str) -> bool:
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.role = role
                db.commit()
                return True
            return False
        except Exception as e:
            print(f"⚠️ DB Error (update_user_role): {e}")
            return False
        finally:
            db.close()

    def delete_user(self, username: str) -> bool:
        db = self.SessionLocal()
        try:
            db.query(User).filter(User.username == username).delete()
            db.commit()
            return True
        except Exception as e:
            print(f"⚠️ DB Error (delete_user): {e}")
            return False
        finally:
            db.close()

    # --- ALLOWED DOMAINS METHODS ---
    def list_allowed_domains(self) -> List[Dict]:
        db = self.SessionLocal()
        try:
            domains = db.query(AllowedDomain).all()
            return [self._to_dict(d) for d in domains]
        except Exception as e:
            print(f"⚠️ DB Error (list_allowed_domains): {e}")
            return []
        finally:
            db.close()

    def add_allowed_domain(self, domain: str) -> bool:
        db = self.SessionLocal()
        try:
            domain = domain.strip().lower()
            if db.query(AllowedDomain).filter(AllowedDomain.domain == domain).first():
                return False
            ad = AllowedDomain(domain=domain)
            db.add(ad)
            db.commit()
            return True
        except Exception as e:
            print(f"⚠️ DB Error (add_allowed_domain): {e}")
            return False
        finally:
            db.close()

    def delete_allowed_domain(self, domain_id: int) -> bool:
        db = self.SessionLocal()
        try:
            db.query(AllowedDomain).filter(AllowedDomain.id == domain_id).delete()
            db.commit()
            return True
        except Exception as e:
            print(f"⚠️ DB Error (delete_allowed_domain): {e}")
            return False
        finally:
            db.close()

    def is_domain_allowed(self, email: str) -> bool:
        db = self.SessionLocal()
        try:
            if "@" not in email:
                return False
            domain = email.split("@")[1].strip().lower()
            allowed = db.query(AllowedDomain).filter(AllowedDomain.domain == domain).first()
            return allowed is not None
        except Exception:
            return False
        finally:
            db.close()

    # --- SECURITY LOGGING ---
    def list_security_logs(self, limit: int = 100) -> List[Dict]:
        db = self.SessionLocal()
        try:
            logs = db.query(SecurityLog).order_by(desc(SecurityLog.timestamp)).limit(limit).all()
            return [self._to_dict(l) for l in logs]
        except Exception as e:
            print(f"⚠️ DB Error (list_security_logs): {e}")
            return []
        finally:
            db.close()

    def log_security_event(self, username: Optional[str], action: str, ip_address: Optional[str], user_agent: Optional[str], details: Optional[str] = None):
        db = self.SessionLocal()
        try:
            log = SecurityLog(
                username=username,
                action=action,
                ip_address=ip_address,
                user_agent=user_agent,
                details=details
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"⚠️ DB Error (log_security_event): {e}")
        finally:
            db.close()

    # --- GOOGLE OAUTH LOGIN UPSERT ---
    def upsert_google_user(self, email: str, name: str, picture: Optional[str]) -> Optional[User]:
        db = self.SessionLocal()
        try:
            user = db.query(User).filter(User.username == email).first()
            if not user:
                # Dynamically auto-approve all Google Authenticated operators instantly for general access
                is_approved = True

                user = User(
                    username=email,
                    google_email=email,
                    password_hash=self._hash_password(f"google_oauth_{email}"),
                    full_name=name,
                    google_picture=picture,
                    role="operator",
                    is_approved=is_approved,
                    auth_provider="google",
                    alert_email=email,
                    email_enabled=True,
                    last_login=datetime.now(timezone.utc),
                    last_active=datetime.now(timezone.utc)
                )
                db.add(user)
                db.commit()
                
                # Auto-seed default cameras for dynamic onboarding
                try:
                    owner_prefix = email.replace('@', '_').replace('.', '_')
                    c1 = Camera(
                        id=f"{owner_prefix}_cam_01",
                        owner_id=email,
                        node_id="cam_01",
                        node_name="Primary IP Security Camera",
                        camera_type="rtsp",
                        rtsp_url="rtsp://admin:Forge@2000@192.168.55.247:554/Streaming/Channels/102",
                        location="Local Sector 01",
                        zone_type="danger",
                        ai_enabled=True,
                        status="offline",
                        name="Primary IP Security Camera",
                        source="rtsp://admin:Forge@2000@192.168.55.247:554/Streaming/Channels/102"
                    )
                    c2 = Camera(
                        id=f"{owner_prefix}_cam_02",
                        owner_id=email,
                        node_id="cam_02",
                        node_name="System Webcam 02",
                        camera_type="webcam",
                        rtsp_url="1",
                        location="Local Sector 02",
                        zone_type="danger",
                        ai_enabled=True,
                        status="offline",
                        name="System Webcam 02",
                        source="1"
                    )
                    db.add(c1)
                    db.add(c2)
                    db.commit()
                except Exception as seed_err:
                    print(f"⚠️ Failed to seed default cameras for Google registration: {seed_err}")
                    db.rollback()
                # Update existing user profile fields
                user.google_email = email
                user.is_approved = True
                if picture:
                    user.google_picture = picture
                if not user.alert_email:
                    user.alert_email = email
                user.last_login = datetime.now(timezone.utc)
                user.last_active = datetime.now(timezone.utc)
                user.auth_provider = "google"
                
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"⚠️ DB Error (upsert_google_user): {e}")
            return None
        finally:
            db.close()
