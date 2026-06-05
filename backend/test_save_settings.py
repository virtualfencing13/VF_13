from app.alerts import Database, DATABASE_URL

db = Database(DATABASE_URL)
email = "test_operator@example.com"

# 1. Fetch current settings
print("Current settings:")
current = db.get_notification_settings(email)
print(current)

# 2. Update settings: set email_enabled to True and alert_email to test_operator@example.com
print("\nUpdating settings to enable email...")
data = {
    "email_enabled": True,
    "email": "test_operator@example.com",
    "emails": "test_operator@example.com"
}
db.update_notification_settings(data, email)

# 3. Re-fetch settings
print("\nRe-fetched settings after update:")
after = db.get_notification_settings(email)
print(after)
