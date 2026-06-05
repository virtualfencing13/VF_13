from app.alerts import Database, Alert, DATABASE_URL

db = Database(DATABASE_URL)
session = db.SessionLocal()
try:
    alerts = session.query(Alert).order_by(Alert.id.desc()).limit(5).all()
    print("DUMPING RECENT ALERTS:")
    print("=" * 60)
    for a in alerts:
        print(f"ID: {a.id}")
        print(f"Kind: {a.kind}")
        print(f"Message: {a.message}")
        print(f"Owner: {a.owner_id}")
        print(f"Camera: {a.camera_id}")
        print(f"Snapshot URL: {a.snapshot_url}")
        print("-" * 60)
except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
