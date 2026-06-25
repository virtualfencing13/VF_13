# FENCEAI: Combined Software & Hardware Setup Guide

This document is a comprehensive guide to setting up, understanding, and integrating the FENCEAI Virtual Fencing System. It is divided into three sections:
*   **Section 1: Software Code Architecture and Working:** A detailed breakdown of how the backend, frontend, and database systems work file-by-file.
*   **Section 2: Step-by-Step Software Setup Instructions:** Easy-to-follow guidelines for deploying the software via Docker Compose or manual local installation.
*   **Section 3: Hardware Connections and Integrations:** Comprehensive guides on physical wiring for Raspberry Pi 5 control hubs, relay modules, buzzer alerts, and wireless ESP32 actuator nodes.

---

# SECTION 1: SOFTWARE CODE ARCHITECTURE & WORKING

This section details how the software files are made, what each file does, and how they communicate.

## 1. Core Architecture Overview
FENCEAI operates as an edge computing solution with three main components:
1.  **FastAPI Backend (Python):** Handles incoming camera streams (OpenCV), runs real-time object detection models (YOLOv11), writes incident metadata to the database, and calls local/remote hardware APIs.
2.  **React Frontend (Vite + JavaScript):** Provides a visual dashboard to monitor streams, review security logs, customize safety zones, and toggle machine controls.
3.  **Database (PostgreSQL/SQLite):** Manages user profiles, camera lists, incident metadata, and configurations.

---

## 2. Backend Code Breakdown (File-by-File Working)

### A. backend/app/main.py
This is the starting point and coordinator of the FastAPI backend application.
*   **FastAPI Initialization:** Sets up the HTTP server and mounts static folders (e.g., `/snapshots` maps to `/app/storage/snapshots`) so that captured images are accessible to the browser.
*   **CORS Configuration:** Enables cross-origin resource sharing, allowing the frontend (on port 5173 or port 80) to query the backend endpoints on port 8000 safely.
*   **WebSocket Handler (`/api/ws`):** Connects to the frontend browser client. It listens for active connections and broadcasts real-time security statuses, camera metrics (FPS, status), and active breach flags.
*   **API Routes:**
    *   `/api/auth/login` and `/api/auth/register`: Handle standard JWT-based session token creation and operator registration.
    *   `/api/cameras/create` and `/api/cameras/my`: Add new IP/USB cameras and list active devices.
    *   `/api/fence` and `/api/fence/reset`: Accept custom zone coordinates from the frontend, save them to the database, and apply them immediately to the active camera streams.
    *   `/api/alerts` and `/api/alerts/delete`: Fetch forensic logs or perform purge operations.
*   **Background State Broadcaster (`state_broadcaster`):** Runs a continuous asynchronous loop in the background. Every 5 seconds, it queries the active camera databases, updates camera metrics in memory, and pushes these updates to all connected WebSockets.

### B. backend/app/alerts.py
This file handles database schemas (SQLAlchemy) and alert notification gateways.
*   **Database Engine:** Initializes connections to the DATABASE_URL. If the remote database is unreachable, it logs a warning and initializes a local SQLite fallback engine (`fenceai_local.db`).
*   **SQLAlchemy Models:** Defines database tables:
    *   `User`: Holds account credentials, roles, email configurations, and approval status.
    *   `Alert`: Holds incident logs containing timestamp, zone breached, priority level, and snapshot URL.
    *   `Camera`: Holds camera sources, RTSP credentials, location strings, and safety zone coordinates.
*   **Seeding Logic:** On boot, if no records are found, it seeds standard values (e.g. `admin@gmail.com` with password `admin123` and whitelist domains `company.com` and `kct.ac.in`).
*   **Notification Gateways:**
    *   `send_email_notification`: Uses SMTP (e.g., Gmail) to construct HTML-based security emails with attached forensic snapshots.
    *   `send_telegram_alert`: Uses a bot token to push text summaries and snapshots to a configured Telegram chat ID.
    *   `send_twilio_notifications`: Integrates with Twilio to send standard SMS notifications and place automated voice warning calls.

### C. backend/app/camera.py
This module manages multithreaded camera streams and inference pipelines.
*   **CameraManager:** Acts as a registry. When initialized, it queries the database, reads configured camera sources, and instantiates a `CameraWorker` for each device.
*   **CameraWorker Class:** Runs two internal threads for each camera stream to prevent blocking:
    1.  **Reader Thread (`_read_loop`):** Continuously reads raw video frames from the webcam or RTSP stream using OpenCV (`cv2.VideoCapture`). It stores the latest frame in memory buffer and automatically handles reconnection attempts if the stream is lost.
    2.  **Inference Thread (`_run`):** Runs a continuous processing loop at ~30 FPS. It fetches the latest frame from the reader thread, executes the YOLOv11 model (`IntrusionDetector.process`), checks safety boundaries, updates state logic (safe/danger/warning), saves files to disk, and triggers email or webhook dispatches.
*   **Static Fallbacks:** If a camera stream is offline, the worker generates a simulated black grid frame labeled "CCTV OFFLINE" to display on the dashboard instead of crashing.

### D. backend/app/detector.py
This file contains the computer vision and boundary math logic.
*   **Zone Class:** Represents a custom safety zone. It holds coordinates represented as normalized decimals between 0.0 and 1.0 (relative to frame dimensions).
*   **Contains Algorithm:** Checks if a target's bounding box center (cx, cy) is inside the polygon using the point-polygon test (`cv2.pointPolygonTest`).
*   **IntrusionDetector Class:** Loads the YOLOv11 model weights.
    *   `process`: Runs prediction on the frame. It extracts detected objects, filters for "person" classes, checks if their coordinate points overlap with warning/danger zones, draws bounding boxes on the frame (green for authorized, orange for warning, red for intruder), and triggers alarm flags.
    *   `save_snapshot`: Encodes the annotated frame as a JPEG and writes it to the designated snapshot folder on disk.

### E. backend/app/config.py
*   Uses Pydantic's `BaseSettings` to load environment variables from the `.env` file into a typed Python object (`settings`). It ensures default values are provided if optional keys are missing.

---

## 3. Frontend Code Breakdown (File-by-File Working)

### A. frontend/src/App.jsx
*   **Routing:** Uses React Router to map URLs to specific page views.
*   **State Management:** Holds session credentials (operator email, token, role). If a token exists in `sessionStorage`, it routes the user past the login page.

### B. frontend/src/services/api.js
*   Contains helper functions for making HTTP calls using the browser's native `fetch` API.
*   **Authorization Headers:** Dynamically adds the bearer token (`Authorization: Bearer <token>`) to requests, ensuring the backend allows access to protected API paths.

### C. frontend/src/pages/LoginPage.jsx
*   Contains the user login form. On submission, it calls the `login` api helper, displays success or error messages, saves the response token to storage, and redirects the user to the dashboard.

### D. frontend/src/pages/Dashboard.jsx
*   The primary control panel interface.
*   **WebSocket Integration:** Establishes a persistent WebSocket connection to the backend. It receives live state data (e.g. system active, machine status, camera FPS, and intrusion alarms) and updates the UI widgets instantly.
*   **Video Feed:** Embeds an HTML image tag pointed to the backend video streaming endpoint (`/api/video_feed`), which displays the real-time annotated camera output.

### E. frontend/src/components/ZoneCanvas.jsx
*   Handles canvas drawing. It overlays a transparent canvas layer over the live video stream.
*   **Coordinate Normalization:** As the operator clicks to draw safety zone boundaries, it converts absolute mouse coordinates (in pixels) to normalized decimals (0.0 to 1.0) based on canvas dimensions, then sends this dataset to the backend.

---
---

# SECTION 2: STEP-BY-STEP SOFTWARE SETUP INSTRUCTIONS

Follow these steps to deploy the FENCEAI software.

## 1. Prerequisites Setup
Install the necessary software packages on your system:
*   **Git:** Install via `sudo apt install git` (Linux) or download from the official Git website.
*   **Docker & Docker Compose:** Install Docker Desktop (Windows/macOS) or run `sudo apt install docker-compose` (Linux).
*   **Python:** Install Python 3.11 from python.org if running locally.
*   **Node.js:** Install Node.js from nodejs.org if running locally.

---

## 2. Set Up the Database
FENCEAI requires a PostgreSQL database. Supabase is recommended.
1.  Go to [supabase.com](https://supabase.com) and create a free account.
2.  Create a new project. Define a database password.
3.  Once the project is initialized, navigate to **Project Settings > Database**.
4.  Copy the connection string from the **Connection Pooler** section. Ensure the connection mode is set to **Transaction** (which uses port `6543`).
    *   *Example String:* `postgresql://postgres.yourprojectid:yourpassword@aws-0-pooler.supabase.com:6543/postgres`

---

## 3. Configure the Environment Variables
1.  Navigate to the `backend/` folder.
2.  Create a configuration file named `.env`.
3.  Add the database connection string and your custom credentials:
    ```env
    CAMERA_SOURCE=0               # 0 uses local webcam, RTSP url uses network stream
    CONFIDENCE_THRESHOLD=0.25     # YOLO target confidence score threshold
    ALERT_COOLDOWN_SECONDS=10

    DATABASE_URL=postgresql://postgres.yourprojectid:yourpassword@aws-0-pooler.supabase.com:6543/postgres
    JWT_SECRET=7f5b3a2d9c4e8b010c71a396e5d8f2b4c102a9386d7e01b7a2c5d6e8f9a0b3c4
    PUBLIC_BASE_URL=http://localhost:8000
    ```

---

## 4. Run the Project

### Option A: Deployment via Docker Compose (Recommended)
This option bundles and runs the complete stack with single-command orchestration.

1.  Open your terminal at the root folder of the project (`virtual_fencing/`).
2.  Run the builder command:
    ```bash
    docker compose up -d --build
    ```
3.  Docker will:
    *   Build the backend image, download Python dependencies, and download YOLO weights.
    *   Build the frontend image and bundle it behind Nginx.
    *   Mount the database fallback file (`fenceai_local.db`) and the snapshot directory (`backend/storage/snapshots/`) to persist alerts on the host.
4.  Open your web browser and go to **`http://localhost`** to view the application terminal.

---

### Option B: Local Manual Development Setup
Use this option to run the processes natively on your machine for editing code.

#### 1. Start the Backend:
1.  Open a terminal window and enter the `backend/` folder:
    ```bash
    cd backend
    ```
2.  Initialize the Python virtual environment:
    ```bash
    python -m venv .venv
    ```
3.  Activate the environment:
    *   **Linux/macOS:** `source .venv/bin/activate`
    *   **Windows:** `.venv\Scripts\activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Start the development server:
    ```bash
    python -m uvicorn app.main:app --reload --port 8000
    ```

#### 2. Start the Frontend:
1.  Open a new terminal window and enter the `frontend/` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open **`http://localhost:5173`** in your browser.

---

## 5. System Access
*   When the server is run for the first time, a default administrator profile is seeded into the database:
    *   **Username:** `admin@gmail.com`
    *   **Password:** `admin123`
*   Log in to the landing page with these credentials to open the system control dashboard.

---
---

# SECTION 3: HARDWARE CONNECTIONS & INTEGRATIONS

This section details how to connect the electronic components and wire the physical safety loop.

## 1. Hardware Pin Connection Map (Raspberry Pi 5 Hub)

The Raspberry Pi 5 runs the AI software and controls the alert buzzer and relay switch directly through its physical GPIO pin header.

### GPIO Interface Map

| Component | Pin Function | Raspberry Pi 5 Physical Pin | Broadcom (BCM) GPIO | Wire Color (Ref) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Relay Module** | VCC | **Pin 4** | 5V Power | Red | Supplies 5V operational power to the relay |
| **Relay Module** | GND | **Pin 6** | Ground | Black | Common ground connection |
| **Relay Module** | IN (Signal) | **Pin 11** | **GPIO 17** | White | Signal line to trigger relay state transitions |
| **Buzzer** | VCC / Signal | **Pin 12** | **GPIO 18** | Yellow | Pin to trigger the alarm sound |
| **Buzzer** | GND | **Pin 14** | Ground | Black | Common ground connection |

### Raspberry Pi 5 Header Reference Diagram

```text
               (OUTER ROW)                 (INNER ROW)
               3.3V Power  [ 1]   [ 2]  5V Power
                   GPIO 2  [ 3]   [ 4]  5V Power      <--- Connect Relay VCC
                   Ground  [ 5]   [ 6]  Ground        <--- Connect Relay GND
                   GPIO 4  [ 7]   [ 8]  GPIO 14
                   Ground  [ 9]   [10]  GPIO 15
  Connect Relay IN ---> GPIO 17  [11]   [12]  GPIO 18       <--- Connect Buzzer Signal
                   Ground  [13]   [14]  Ground        <--- Connect Buzzer GND
```

---

## 2. Relay Wiring & Power Control Loop
A relay is a clean mechanical switch. It breaks or connects a separate circuit loop. Place the relay switch inline with the positive (+ve) lead of the battery powering your machine or motor.

### Option A: Fail-Safe Normally Open (NO) Configuration (Recommended)
This configuration closes the switch and runs the motor only when safe conditions are verified. If the controller loses power, the switch opens automatically and the machine shuts down.

```text
       FAIL-SAFE POWER SWITCH LOOP
       
       ┌─────────────────┐
       │   Power Source  │
       │  (Battery/VCC)  │
       └────┬───────┬────┘
            │       │
      (+ve) │       │ (-ve)
            │       │
            ▼       │
      ┌───────────┐ │
      │ Relay COM │ │
      └─────┬─────┘ │
            │       │
            ▼       │
      ┌───────────┐ │
      │ Relay NO  │ │  (Relay energizes to CLOSE this switch under safe conditions)
      └─────┬─────┘ │
            │       │
            ▼       │
      ┌───────────┐ │
      │ LED/Motor │◄┘  (Runs normally; cuts power instantly upon intrusion)
      └───────────┘
```

### Option B: Normally Closed (NC) Configuration
This configuration keeps the switch closed at rest. The software must actively energize the relay to open the contact and stop the motor. If the controller loses power, the motor continues to run.

```text
       NORMALLY CLOSED MOTOR CONTROL LOOP
       
       ┌─────────────────┐
       │   Power Source  │
       │  (Battery/VCC)  │
       └────┬───────┬────┘
            │       │
      (+ve) │       │ (-ve)
            │       │
            ▼       │
      ┌───────────┐ │
      │ Relay COM │ │
      └─────┬─────┘ │
            │       │
            ▼       │
      ┌───────────┐ │
      │ Relay NC  │ │  (Switch opens to CUT power when danger/intrusion is active)
      └─────┬─────┘ │
            │       │
            ▼       │
      ┌───────────┐ │
      │ LED/Motor │◄┘  (Runs normally; de-energizes when safe)
      └───────────┘
```

### Software Settings Configuration
If you choose the **Normally Closed (NC)** configuration, ensure `RELAY_ACTIVE_LOW` is set to `false` in your `.env` or configurations to invert the control logic. For **Normally Open (NO)** setups, set `RELAY_ACTIVE_LOW` to `true`.

---

## 3. Wireless Actuator Node Setup (ESP32)
For remote applications where running wires from the central Raspberry Pi is not practical, you can deploy ESP32 boards to act as wireless relay switches over your local network.

### ESP32 to Relay Wiring
*   **ESP32 Pin 5V / VIN** ──► **Relay VCC** (Red)
*   **ESP32 GND** ──► **Relay GND** (Black)
*   **ESP32 GPIO 2** ──► **Relay IN** (White)

### Flashing the Firmware Code
Use the Arduino IDE to write the following C++ program to the ESP32:

```cpp
#include <WiFi.h>
#include <WebServer.h>

// WiFi Configuration Settings
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Static IP configuration settings for the node
IPAddress nodeIP(10, 158, 30, 12);  // Define target wireless node IP
IPAddress gateway(10, 158, 30, 1);  // Router Gateway IP
IPAddress subnet(255, 255, 255, 0);

const int RELAY_PIN = 2; // Pin connected to relay input (GPIO 2)
WebServer server(80);

void handleSafe() {
  // Safe conditions: Close the switch (pull pin HIGH)
  digitalWrite(RELAY_PIN, HIGH);
  server.send(200, "text/plain", "SAFE - Relay Switch Closed");
}

void handleDanger() {
  // Danger/Intrusion: Open the switch instantly (pull pin LOW)
  digitalWrite(RELAY_PIN, LOW);
  server.send(200, "text/plain", "DANGER - Relay Switch Opened");
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  
  // Safe-by-default on startup: Motor remains OFF until connection is established
  digitalWrite(RELAY_PIN, LOW);

  // Configure IP and connect to Wi-Fi
  WiFi.config(nodeIP, gateway, subnet);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 Node IP: ");
  Serial.println(WiFi.localIP());

  // Register HTTP endpoint routes
  server.on("/safe", handleSafe);
  server.on("/danger", handleDanger);
  
  server.begin();
  Serial.println("Wireless node listening on port 80");
}

void loop() {
  server.handleClient();
}
```

---

## 4. Hardware Integration Control Loop
FENCEAI uses an event-driven loop in the backend to synchronize detections with physical hardware:

1.  **Detection Check:** Every frame processed by `CameraWorker` goes through YOLOv11 inference to check for "person" detections.
2.  **Safety Zone Overlap:** The `IntrusionDetector` checks if the normalized coordinates of the detected person fall inside the custom zones drawn by the user on the frontend canvas.
3.  **Local GPIO Trigger:** If a breach is found:
    *   **Buzzer pin (GPIO 18):** Pulled **HIGH** (3.3V) to trigger the alarm sound.
    *   **Local Relay Pin (GPIO 17):** Pulled **HIGH** or **LOW** (depending on your NO/NC configuration) to open the switch and cut power to the motor.
4.  **Wireless Action Webhook:** At the same time, the backend spawns a background thread that makes an HTTP client request to the remote ESP32 IP address:
    *   On SAFE: `GET http://10.158.30.12/safe`
    *   On DANGER: `GET http://10.158.30.12/danger`
    The ESP32 processes the request and switches the state of its connected relay.
