# FenceAI: Simple & Smart Virtual Fencing

FenceAI is a smart security system that uses Artificial Intelligence (AI) to watch your property. It detects people entering "restricted zones" and sends alerts to your phone or email.

## 🚀 How it Works
1. **Watch**: The system connects to your camera.
2. **Draw**: You draw "Danger Zones" on the screen.
3. **Alert**: If a person stays in a zone for too long, the system sends an alert.

---

## 🛠️ How to Setup (Local Computer)

### 1. Backend (The AI Engine)
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### 2. Frontend (The User Interface)
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 How to Make it "Live" (Online)

To make your website work anywhere in the world, you have two options:

### Option A: The "Quick Link" (Recommended for Testing)
Use a tool like **ngrok** to create a public link to your local computer.
1. Download ngrok.
2. Run: `ngrok http 8000` (for backend) and `ngrok http 5173` (for frontend).
3. Copy the links and share them!

### Option B: Cloud Hosting (Professional)
1. **Frontend**: Upload the `frontend` folder to **Vercel** or **Netlify**.
2. **Backend**: Host the `backend` folder on a **VPS** (like DigitalOcean or AWS) that has Python installed.
3. **Connect**: Update the `PUBLIC_BASE_URL` in your `.env` to point to your backend link.

---

## 🍓 Future Upgrade: Raspberry Pi + Buzzer
You can run this entire system on a Raspberry Pi to create a physical alarm.

### 🔌 Connections:
*   **Buzzer (+)**: Connect to **GPIO 17**.
*   **Buzzer (-)**: Connect to **GND**.

### 💻 Code Logic:
When the AI detects a person, it sends a signal to the Pi's pins:
```python
from gpiozero import Buzzer
alarm = Buzzer(17)

if person_detected:
    alarm.on()
else:
    alarm.off()
```

---
**Created by**: [Your Name/ID] | **Version**: 1.0.0
