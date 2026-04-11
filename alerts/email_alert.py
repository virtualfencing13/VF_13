"""
alerts/email_alert.py
=====================
EmailAlertHandler — sends an HTML email with the captured frame attached
as a JPEG image whenever an intrusion is detected.

Threading model
───────────────
__call__() is invoked on the main detection thread.
The actual SMTP send runs on a *daemon background thread* so the
detection loop is never blocked waiting for network / SMTP handshake.

Cooldown
────────
A per-instance cooldown timer (default 30 s) prevents email floods when
a person stays inside the fence for an extended period.

Gmail setup (one-time)
──────────────────────
1. Enable 2-Step Verification on your Google account.
2. Go to: Google Account → Security → App Passwords.
3. Create an App Password for "Mail / Other".
4. Paste the 16-character code (with spaces) into config.json → email.sender_password.
   Do NOT use your real Gmail password.

SMTP settings for common providers
───────────────────────────────────
Gmail       : smtp.gmail.com      port 587  (STARTTLS)
Outlook/365 : smtp.office365.com  port 587  (STARTTLS)
Yahoo       : smtp.mail.yahoo.com port 587  (STARTTLS)
Custom      : your mail server    port 587 or 465
"""

from __future__ import annotations
import smtplib
import threading
import time
import cv2
import io
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText
from email.mime.image     import MIMEImage
from datetime             import datetime


class EmailAlertHandler:
    """
    Sends intrusion alert emails with captured frame on a background thread.

    Parameters (from config.json → "email" section):
        smtp_host       : SMTP server hostname
        smtp_port       : SMTP port (typically 587 for STARTTLS)
        sender_email    : Sending address
        sender_password : App password (NOT your login password)
        recipients      : List of recipient email addresses
        cooldown_seconds: Minimum seconds between emails (default 30)
        subject_prefix  : Email subject prefix (default "[INTRUSION ALERT]")
    """

    def __init__(self, cfg: dict):
        self._host     = cfg["smtp_host"]
        self._port     = int(cfg.get("smtp_port", 587))
        self._sender   = cfg["sender_email"]
        self._password = cfg["sender_password"]
        self._to       = cfg["recipients"]
        self._cooldown = float(cfg.get("cooldown_seconds", 30))
        self._prefix   = cfg.get("subject_prefix", "[INTRUSION ALERT]")

        self._last_sent = 0.0
        self._lock      = threading.Lock()

    # ── Handler entry point ───────────────────────────────────────────────────

    def __call__(self, event: dict) -> None:
        """
        Called by EventManager.dispatch() on the main thread.
        Quickly checks cooldown, then fires a background send thread.
        """
        if event["status"] != "UNSAFE":
            return

        with self._lock:
            if time.time() - self._last_sent < self._cooldown:
                return
            self._last_sent = time.time()

        # Fire-and-forget on a daemon thread
        threading.Thread(
            target=self._send,
            args=(dict(event),),    # shallow copy — frame array is shared safely
            daemon=True,
        ).start()

    # ── Background send ───────────────────────────────────────────────────────

    def _send(self, event: dict) -> None:
        """Compose and transmit the email. Runs on background thread."""
        ts          = event["timestamp"]
        camera_id   = event["camera_id"]
        n_intruders = event["intruder_count"]
        frame       = event["frame"]                 # BGR numpy array

        # ── Build MIME message ─────────────────────────────────────────────
        msg            = MIMEMultipart("related")
        msg["Subject"] = f"{self._prefix} {camera_id} — {n_intruders} person(s) in zone"
        msg["From"]    = self._sender
        msg["To"]      = ", ".join(self._to)

        # Alternative container for HTML + plain text fallback
        alt = MIMEMultipart("alternative")
        msg.attach(alt)

        # Plain-text fallback
        plain = (
            f"INTRUSION ALERT\n"
            f"Camera    : {camera_id}\n"
            f"Timestamp : {ts}\n"
            f"Persons   : {n_intruders} inside fence\n"
            f"Status    : UNSAFE\n\n"
            f"-- Virtual Fencing System"
        )
        alt.attach(MIMEText(plain, "plain"))

        # HTML body (references inline image via CID)
        html = f"""
        <html>
        <body style="font-family:Arial,sans-serif;padding:20px;background:#f5f5f5">
          <div style="background:#fff;border-radius:8px;padding:24px;max-width:660px;
                      margin:auto;border-top:4px solid #cc0000">

            <h2 style="color:#cc0000;margin-top:0">
              &#9888;&nbsp; Intrusion Detected
            </h2>

            <table style="border-collapse:collapse;font-size:14px;width:100%;
                          margin-bottom:18px">
              <tr style="background:#fafafa">
                <td style="padding:8px 14px;color:#555;width:140px;
                           border:1px solid #eee">Camera</td>
                <td style="padding:8px 14px;font-weight:bold;
                           border:1px solid #eee">{camera_id}</td>
              </tr>
              <tr>
                <td style="padding:8px 14px;color:#555;
                           border:1px solid #eee">Timestamp</td>
                <td style="padding:8px 14px;
                           border:1px solid #eee">{ts}</td>
              </tr>
              <tr style="background:#fafafa">
                <td style="padding:8px 14px;color:#555;
                           border:1px solid #eee">Persons in zone</td>
                <td style="padding:8px 14px;font-weight:bold;color:#cc0000;
                           border:1px solid #eee">{n_intruders}</td>
              </tr>
              <tr>
                <td style="padding:8px 14px;color:#555;
                           border:1px solid #eee">Status</td>
                <td style="padding:8px 14px;font-weight:bold;color:#cc0000;
                           border:1px solid #eee">UNSAFE</td>
              </tr>
            </table>

            <p style="color:#333;margin-bottom:10px;font-size:14px">
              Captured frame at time of detection:
            </p>
            <img src="cid:snapshot"
                 style="max-width:100%;border-radius:4px;
                        border:1px solid #ddd;display:block">

            <p style="color:#999;font-size:12px;margin-top:20px;
                      border-top:1px solid #eee;padding-top:12px">
              This is an automated alert from the Virtual Fencing System.<br>
              Camera: {camera_id} &nbsp;|&nbsp; System time: {ts}
            </p>
          </div>
        </body>
        </html>"""
        alt.attach(MIMEText(html, "html"))

        # ── Encode frame as JPEG and attach inline ─────────────────────────
        ok, jpg_buf = cv2.imencode(
            ".jpg", frame,
            [cv2.IMWRITE_JPEG_QUALITY, 88],
        )
        if ok:
            img_mime = MIMEImage(jpg_buf.tobytes(), _subtype="jpeg")
            img_mime.add_header("Content-ID", "<snapshot>")
            img_mime.add_header(
                "Content-Disposition", "inline",
                filename=f"intrusion_{ts.replace(':', '-')}.jpg",
            )
            msg.attach(img_mime)

        # ── SMTP send ──────────────────────────────────────────────────────
        try:
            with smtplib.SMTP(self._host, self._port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self._sender, self._password)
                server.sendmail(self._sender, self._to, msg.as_string())
            print(f"[EmailAlert] Sent to {self._to}  @ {ts}")
        except smtplib.SMTPAuthenticationError:
            print("[EmailAlert] AUTH ERROR — check sender_email and sender_password in config.json")
        except smtplib.SMTPException as e:
            print(f"[EmailAlert] SMTP error: {e}")
        except OSError as e:
            print(f"[EmailAlert] Network error: {e}")
