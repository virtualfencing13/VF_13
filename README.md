# FENCEAI: Virtual Fencing System

FENCEAI is an industrial virtual fencing system powered by real-time AI computer vision. It uses YOLOv11 for low-latency intrusion detection and manages forensic logs and alerts.

## Key Features

* Real-Time AI Detection: YOLOv11 pipeline optimized for low-latency object detection on CPU.
* Active Perimeter Control: Drawing dynamic safety zones (Danger/Warning) on a live canvas stream.
* Multi-Channel Alert Gateway:
  * WhatsApp API: Official Meta Graph API to deliver forensic snapshot images.
  * SMTP Email: High-priority incident notification emails with attached screenshots.
  * SMS & Voice Call: Twilio fallback gateways.
* Monitoring Terminal:
  * Neural Dashboard: Real-time visual tracking of active zones, breach counts, and camera FPS.
  * Forensic Incident Archive: Logged alert history with options to acknowledge, export to CSV, or delete records.
  * Cyber Security Design: Industrial dark mode interface.

## Project Directory Structure

```text
virtual_fencing/
├── backend/
│   ├── app/
│   │   ├── alerts.py                  # Database operations, notification gateways, and schema models
│   │   ├── camera.py                  # Multi-camera thread manager using OpenCV
│   │   ├── config.py                  # Pydantic settings schema to load environment variables
│   │   ├── detector.py                # YOLOv11 detection engine and safety zone overlap verification
│   │   └── main.py                    # FastAPI routes, websockets, and background state broadcaster
│   ├── Dockerfile                     # Docker configuration for backend environment
│   ├── requirements.txt               # Backend Python library dependencies
│   ├── test_auth_flow.py              # Verification script for local registration and login
│   ├── test_db.py                     # Database connection testing script
│   └── test_jwt_and_google_auth.py    # Integration test suite for standard credentials login
├── frontend/
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── components/                # Reusable UI elements (AlertsPanel, SetupWizard)
│   │   ├── pages/                     # Frontend views (Dashboard, LoginPage, AlertsPage, AdminConsolePage)
│   │   ├── services/
│   │   │   └── api.js                 # API service functions connecting to the backend endpoints
│   │   ├── App.jsx                    # Routing configuration and global state provider
│   │   ├── index.css                  # UI styling using Tailwind CSS
│   │   └── main.jsx                   # React application entry point
│   ├── Dockerfile                     # Docker configuration for building frontend static pages
│   ├── nginx.conf                     # Nginx server configuration for routing and reverse proxy
│   ├── package.json                   # Frontend npm build scripts and dependency configurations
│   ├── tailwind.config.js             # Tailwind CSS customized styling configuration
│   └── vite.config.js                 # Vite bundler configuration including proxy server settings
├── docker-compose.yml                 # Orchestrates backend and frontend containers
├── esp32_distributed_pins.md          # Reference sheet for connecting wireless ESP32 safety nodes
└── pin_connections.md                 # Wiring documentation for Raspberry Pi physical buzzer and relays
```

## System Requirements

* Docker and Docker Compose (recommended for deployment)
* Python 3.11+ (if running backend locally without Docker)
* Node.js 18+ (if running frontend locally without Docker)

## Configuration (.env)

The backend expects a .env file inside the backend/ directory with the following variables:

```env
# AI and Video Source
CAMERA_SOURCE=0
CONFIDENCE_THRESHOLD=0.25
ALERT_COOLDOWN_SECONDS=10

# Database Configuration (Supabase PostgreSQL URL)
DATABASE_URL=postgresql://user:password@host:port/dbname

# WhatsApp Configuration (Meta Cloud API)
WHATSAPP_TOKEN=your_meta_token
PHONE_NUMBER_ID=your_phone_id
RECIPIENT_PHONE=your_mobile_number

# Email Configuration (SMTP)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password
RECIPIENT_EMAIL=operator@facility.com

# Twilio Configuration (SMS and Call Gateway)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_PHONE=your_twilio_number
TWILIO_TO_PHONE=your_recipient_number

# Public URL (For Forensic Image Hosting)
PUBLIC_BASE_URL=http://localhost:8000

# JSON Web Token Secret
JWT_SECRET=your_jwt_256bit_secret_key

# Hardware Configurations
RELAY_ACTIVE_LOW=true
```

## Running the Project

### Option 1: Multi-Container Docker Deployment (Recommended)

1. Make sure you configure backend/.env with your secrets and Supabase connection string.
2. Build and start the containers using Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Open your browser and navigate to http://localhost to access the terminal interface.

### Option 2: Local Development Setup

#### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

#### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the development server URL (defaults to http://localhost:5173).

## Access Credentials

When the system is started, a default administrator account is automatically seeded inside the database:
* Username: admin@gmail.com
* Password: admin123
