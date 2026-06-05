from sqlalchemy import text
from app.alerts import Database, DATABASE_URL

print("🛡️  ENABLING ROW LEVEL SECURITY (RLS) FOR SAFE MODE")
print("=" * 60)

db = Database(DATABASE_URL)
session = db.SessionLocal()

try:
    # Enable RLS on core tables
    for table in ["users", "cameras", "alerts"]:
        print(f"🔒 Enabling Row Level Security on table '{table}'...")
        session.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
        print(f"✅ Table '{table}' successfully moved to SAFE MODE.")
    
    session.commit()
    print("\n" + "=" * 60)
    print("🎉 Cloud database has been successfully secured and transitioned to SAFE MODE!")

except Exception as e:
    session.rollback()
    print(f"\n❌ Failed to enable Row Level Security: {e}")
finally:
    session.close()
