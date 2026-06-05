# FENCEAI - Hardware Connection Map & Wiring Guide (Pi 5 & ESP32)

This document provides the exact **physical wiring maps** and **relay terminal connections** to control your safety interlock buzzer, active status LED, and motor loop safely and reliably.

---

## 🚨 1. Central Controller Wiring (Raspberry Pi 5 Hub)

The Raspberry Pi 5 runs the AI detection engine, triggers the high-decibel alarm buzzer, and switches the status LED and motor loop via a physical relay module.

### 📌 Pi 5 to Buzzer Wiring
Connect the physical alarm buzzer directly to the Pi 5's dedicated PWM pins:
* **Buzzer Positive (+ve / VCC)** ──► **Physical Pin 12** (BCM GPIO 18)
* **Buzzer Negative (-ve / GND)** ──► **Physical Pin 14** (GND)

---

### 📌 Pi 5 to Relay Module Wiring
Connect your single or multi-channel active-high relay board to the Pi 5 control outputs:
* **Relay VCC** ──► **Physical Pin 2** (5V Power)
* **Relay GND** ──► **Physical Pin 6** (Ground)
* **Relay IN (Signal)** ──► **Physical Pin 11** (BCM GPIO 17)

---

## ⚡ 2. Relay Terminal Wiring (LED & Motor Control Loop)

> [!WARNING]
> **CRITICAL WIRING RULE:** Do NOT connect a short bridge wire directly between `COM` and `NO` externally! Bridging them together bypasses the internal switch completely, keeping the motor and LED permanently ON and preventing the system from ever stopping them during an intrusion.

The relay acts as an **inline switch** in series with the positive side of your battery/power source. It breaks the circuit automatically when danger is detected.

### 🔌 Series Loop Wiring Layout
Use the **Normally Open (NO)** configuration to build a fail-safe circuit (if the system loses power, the motor automatically shuts down):

1. **Power Source Positive (+ve)** ──► Connected to the Relay **COM** (Common) terminal.
2. **Relay NO** (Normally Open) terminal ──► Connected to the **LED Positive (+ve) / Resistor** or **Motor Positive (+ve)**.
3. **LED/Motor Negative (-ve)** ──► Connected directly to the **Power Source Negative (-ve)**.

```text
       FAIL-SAFE POWER SWITCH LOOP
       
       ┌─────────────────┐
       │   Power Source  │
       │  (Battery/VCC)  │
       └────┬───────┬────┘
            │       │
      (+ve) │       │ (-ve)
            │       │
            ▼       ▼
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

### 🔄 State Behavior Table

| System State | GPIO 17 Output | Relay Coil | Internal Contacts | LED & Motor State | Buzzer (GPIO 18) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SAFE** (Default) | **HIGH** (1) | Energized | **COM connected to NO** | **ON** (Circuit Closed) | **OFF** (Silent) |
| **DANGER** (Intrusion) | **LOW** (0) | De-energized | **COM disconnected** | **OFF** (Circuit Open) | **ON** (Alarm active) |

---

## 🌐 3. Distributed Wireless Actuators (Optional Dual ESP32 Setup)

If you are expanding the system to control multiple remote machines wirelessly over Wi-Fi without running long physical wires from the Pi 5, use the following **ESP32 Node configuration**.

### 📌 ESP32 Pin Mapping (Node #1 & #2)
* **ESP32 VIN (5V)** ──► **Relay VCC** (Red)
* **ESP32 GND** ──► **Relay GND** (Black)
* **ESP32 GPIO 2 (D2)** ──► **Relay IN** (White)

### 💻 Complete Arduino Sketch (Copy-Paste)
Flash this firmware to your ESP32 nodes using the Arduino IDE. 

```cpp
#include <WiFi.h>
#include <WebServer.h>

// --- WiFi Credentials ---
const char* ssid     = "YOUR_WIFI_SSID";      // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";  // Replace with your WiFi Password

// --- Static IP Configuration ---
IPAddress nodeIP(192.168.55.101); // Set to 101 for Node 1, 102 for Node 2
IPAddress gateway(192.168.55.100); // Pi 5 LAN gateway IP
IPAddress subnet(255.255.255.0);

const int RELAY_PIN = 2; // GPIO 2 (Active-High: Blue onboard LED mirrors state)
WebServer server(80);

void handleSafe() {
  // SAFE Mode: Energize Relay to close the circuit (Active-High: pull HIGH)
  digitalWrite(RELAY_PIN, HIGH);
  server.send(200, "text/plain", "MOTOR ACTIVE - SAFE CONDITIONS");
}

void handleDanger() {
  // DANGER Mode: De-energize Relay to cut power instantly (Active-High: pull LOW)
  digitalWrite(RELAY_PIN, LOW);
  server.send(200, "text/plain", "MOTOR INACTIVE - BREACH DETECTED");
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  
  // Safe-by-default on boot: Motor is OFF untilPi establishes connection
  digitalWrite(RELAY_PIN, LOW);

  // Configure Static IP
  if (!WiFi.config(nodeIP, gateway, subnet)) {
    Serial.println("❌ Static IP Configuration Failed");
  }

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi Connected!");
  Serial.print("Node IP: ");
  Serial.println(WiFi.localIP());

  server.on("/safe", handleSafe);
  server.on("/danger", handleDanger);
  
  server.begin();
  Serial.println("🚀 Wireless Actuator Active!");
}

void loop() {
  server.handleClient();
}
```
