# Virtual Fencing System (FENCEAI)

This is an AI-powered safety system. It uses a camera to check if people enter dangerous areas (intrusion zones). If someone enters a zone, it can:
* Stop a motor (safety relay).
* Turn on a buzzer alarm.
* Send warnings via Email, Telegram, WhatsApp, or phone calls (Twilio).

---

## 🛠️ Requirements
* **Python 3.12+** (for the Backend API)
* **Node.js 18+** (for the Web Dashboard)
* **Docker & Docker Compose** (Optional, to run everything easily)

---

## ⚙️ Configuration (.env)

Before running the project, create a file named `.env` inside the `backend/` folder. Copy and paste the text below, and replace the values with your own settings:

```env
# Camera & AI Settings
CAMERA_SOURCE=0               # 0 for webcam, or use RTSP stream link
CONFIDENCE_THRESHOLD=0.45     # AI confidence (between 0.0 and 1.0)
ALERT_COOLDOWN_SECONDS=10     # Seconds to wait before sending another alert

# SMTP Email Settings (To send email alerts)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password
RECIPIENT_EMAIL=operator@facility.com

# Twilio Settings (To send SMS & Voice Call alerts)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_PHONE=your_twilio_number
TWILIO_TO_PHONE=your_mobile_number

# Public URL (Where the backend is hosted)
PUBLIC_BASE_URL=http://localhost:8000
```

---

## 🚀 How to Run the Project

### Method 1: Using Docker (easiest way)
If you have Docker installed, open your terminal in the root folder and run:
```bash
docker-compose up --build
```
* **Web Dashboard**: Open `http://localhost` in your browser.
* **Backend API**: Running at `http://localhost:8000`.

---

### Method 2: Running Manually (without Docker)

#### **1. Start the Backend API**
Open a new terminal window, go to the `backend/` folder, and run:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
The backend will run on `http://localhost:8000`.

#### **2. Start the Frontend Dashboard**
Open a second terminal window, go to the `frontend/` folder, and run:
```bash
cd frontend
npm install
npm run dev
```
The dashboard will run on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔒 Login Credentials
* **Default Username**: `admin@gmail.com`
* **Default Password**: `admin123`
*(Make sure to change the password in the Settings page after logging in).*

---

## 🔌 Hardware Setup (Optional)
If you are using a **Raspberry Pi 5** or **ESP32** microcontroller, please read these files for wiring maps:
* [Pin Connections Guide](file:///home/virtualfencing/Documents/virtual_fencing/pin_connections.md) - For wiring the Pi 5 to the buzzer and motor relay.
* [ESP32 Setup Guide](file:///home/virtualfencing/Documents/virtual_fencing/esp32_distributed_pins.md) - For wireless motor control using ESP32 nodes.
