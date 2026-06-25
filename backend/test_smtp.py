import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
smtp_port = int(os.getenv("SMTP_PORT", "587"))
sender_email = os.getenv("SENDER_EMAIL", "")
sender_password = os.getenv("SENDER_PASSWORD", "")
recipient_email = os.getenv("RECIPIENT_EMAIL", "")

print(f"SMTP Host: {smtp_host}")
print(f"SMTP Port: {smtp_port}")
print(f"Sender: {sender_email}")
print(f"Recipient: {recipient_email}")

msg = MIMEMultipart()
msg["Subject"] = "Test SMTP Connection"
msg["From"] = sender_email
msg["To"] = recipient_email
msg.attach(MIMEText("This is a test email to verify SMTP credentials.", "plain"))

try:
    print("Connecting to SMTP server...")
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        print("Starting TLS...")
        server.starttls()
        print("Logging in...")
        server.login(sender_email, sender_password)
        print("Sending message...")
        server.send_message(msg)
    print("✅ SMTP test succeeded! Email sent.")
except Exception as e:
    print(f"❌ SMTP test failed: {e}")
