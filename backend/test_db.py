from app.alerts import Database, DATABASE_URL, User

db = Database(DATABASE_URL)
session = db.SessionLocal()
try:
    print("Listing all registered users:")
    users = session.query(User).all()
    for u in users:
        print(f"Username: {u.username}")
        print(f"  Full Name: {u.full_name}")
        print(f"  Alert Email: {u.alert_email}")
        print(f"  Email Enabled: {u.email_enabled}")
        print(f"  Telegram Chat ID: {u.telegram_chat_id}")
        print(f"  Telegram Enabled: {u.telegram_enabled}")
        print(f"  Last Active: {u.last_active}")
        print("-" * 40)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    session.close()
