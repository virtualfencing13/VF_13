"""
test_email.py
=============
Sends a test email using the credentials in config.json.
Run this BEFORE starting main.py to verify email works.

Usage:
    python test_email.py
"""

import json
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText


def load_cfg():
    with open("config.json") as f:
        return json.load(f)["email"]


def test_email():
    cfg = load_cfg()

    if not cfg.get("enabled", False):
        print("[WARN] Email is disabled in config.json  (email.enabled = false)")
        print("       Set it to true, then rerun this test.\n")

    host     = cfg["smtp_host"]
    port     = int(cfg.get("smtp_port", 587))
    sender   = cfg["sender_email"]
    password = cfg["sender_password"]
    to_list  = cfg["recipients"]

    print("=" * 52)
    print("  Virtual Fencing — Email Configuration Test")
    print("=" * 52)
    print(f"  SMTP host  : {host}:{port}")
    print(f"  Sender     : {sender}")
    print(f"  Recipients : {to_list}")
    print()

    msg            = MIMEMultipart()
    msg["Subject"] = "[TEST] Virtual Fencing email — configuration check"
    msg["From"]    = sender
    msg["To"]      = ", ".join(to_list)

    body = (
        "This is a test email from the Virtual Fencing system.\n\n"
        "If you receive this, your email configuration is correct.\n"
        "Intrusion alerts will be delivered to this address.\n\n"
        "-- Virtual Fencing System"
    )
    msg.attach(MIMEText(body, "plain"))

    print("Connecting to SMTP server…")
    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            print("Logging in…")
            server.login(sender, password)
            print("Sending…")
            server.sendmail(sender, to_list, msg.as_string())
        print(f"\n[SUCCESS] Test email sent to {to_list}")
        print("Check your inbox (and spam folder).\n")
    except smtplib.SMTPAuthenticationError:
        print("\n[FAIL] Authentication error.")
        print("  → Gmail: ensure 2-Step Verification is ON")
        print("  → Gmail: use an App Password, NOT your real password")
        print("  → Google Account → Security → App Passwords\n")
        sys.exit(1)
    except smtplib.SMTPException as e:
        print(f"\n[FAIL] SMTP error: {e}\n")
        sys.exit(1)
    except OSError as e:
        print(f"\n[FAIL] Network error: {e}")
        print("  → Check your internet connection and firewall.\n")
        sys.exit(1)


if __name__ == "__main__":
    test_email()
