from sqlalchemy import text
from app.alerts import Database, DATABASE_URL

print("🔓  DISABLING ROW LEVEL SECURITY (RLS) TO RESTORE FULL CAMERA VISIBILITY")
print("=" * 60)

db = Database(DATABASE_URL)
session = db.SessionLocal()

try:
    for table in ["users", "cameras", "alerts"]:
        print(f"🔓 Disabling Row Level Security on table '{table}'...")
        session.execute(text(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;"))
        print(f"✅ Table '{table}' successfully restored to NORMAL mode.")
    
    session.commit()
    print("\n" + "=" * 60)
    print("🎉 Row Level Security successfully disabled! Camera fleet is now fully visible.")

except Exception as e:
    session.rollback()
    print(f"\n❌ Failed to disable Row Level Security: {e}")
finally:
    session.close()
