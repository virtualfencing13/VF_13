# Raspberry Pi 5 - Hardware Pin Connection Map

This file documents the exact physical pin connections and wiring schematics for your **FENCEAI Edge IDS** hardware setup (Relay, Buzzer, Battery, and DC Motor).

---

## 📌 1. GPIO Header Connections

| Component | Pin Function | Raspberry Pi 5 Physical Pin | Broadcom (BCM) GPIO | Wire Color (Ref) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Relay** | VCC | **Pin 4** | 5V Power | Red | Supplies 5V operating power |
| **Relay** | GND | **Pin 6** | Ground | Black | Common Ground |
| **Relay** | IN (Signal) | **Pin 11** | **GPIO 17** | White | Controls relay switch state |
| | | | | | |
| **Buzzer**| VCC / Signal | **Pin 3** | **GPIO 2** | White | Controls active buzzer state |
| **Buzzer**| GND | **Pin 5** | Ground | Black | Common Ground |

---

## ⚡ 2. Motor & Battery Circuit Wiring

Your hardware setup currently uses the **Normally Closed (NC)** port of the relay module.

```text
[Battery +] ──────────────────────────► [Relay COM]
                                            │
                                            ▼  (Switch Contact)
[Motor +]   ◄────────────────────────── [Relay NC] (Your active configuration)

[Motor -]   ◄────────────────────────── [Battery -]
```

> [!WARNING]
> **Safety Note:** Using the `NC` (Normally Closed) port means that if the Raspberry Pi completely loses power, the circuit will return to its closed resting state and the motor will run. While the software has been adjusted below to ensure correct operation at runtime, moving the connection to `NO` (Normally Open) remains the standard fail-safe design.

---

## 🛠️ 3. Software Logic & Configuration

To accommodate the `NC` hardware wiring, the active-low logic has been inverted:

* **Configuration**: `RELAY_ACTIVE_LOW = False` (defined in `backend/app/main.py`)
* **Debounce Delay**: `DEBOUNCE_DELAY_SECONDS = 2.0`

### State Operations Table (NC Configuration)

| System State | GPIO 18 (Buzzer) | GPIO 17 (Relay) | Relay State | Buzzer | Motor State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SAFE** | **LOW** (0V) | **LOW** (0V) | **DE-ENERGIZED** (COM -> NC Closed) | **OFF** (Silent) | **RUNNING** |
| **DANGER** | **HIGH** (3.3V) | **HIGH** (3.3V) | **ENERGIZED** (COM -> NC Open) | **ON** (Alarm) | **STOPPED** |
| **EXIT / SHUTDOWN** | **LOW** (0V) | **HIGH** (3.3V) | **ENERGIZED** (COM -> NC Open) | **OFF** (Silent) | **STOPPED** (Safe-Stop) |

---

## 🗺️ 4. Raspberry Pi 5 Header Reference

```text
               (OUTER ROW)                 (INNER ROW)
               3.3V Power  [ 1]   [ 2]  5V Power
     [BUZZER IN]   GPIO 2  [ 3]   [ 4]  5V Power      ◄─── [RELAY VCC]
    [BUZZER GND]   Ground  [ 5]   [ 6]  Ground        ◄─── [RELAY GND]
                   GPIO 4  [ 7]   [ 8]  GPIO 14
                   Ground  [ 9]   [10]  GPIO 15
     [RELAY IN]   GPIO 17  [11]   [12]  GPIO 18
```
