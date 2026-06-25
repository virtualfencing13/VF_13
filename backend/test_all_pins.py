import time
import sys
from gpiozero import OutputDevice

print("==============================================")
print("PIN IDENTIFICATION DIAGNOSTIC STARTING...")
print("We will toggle GPIO 17 and GPIO 18 to find the relay.")
print("==============================================")

# Test GPIO 17 (Pin 11)
try:
    print("\n1. Testing GPIO 17 (Physical Pin 11) for 5 seconds...")
    relay17 = OutputDevice(17)
    for _ in range(3):
        print("   -> Driving GPIO 17 HIGH")
        relay17.on()
        time.sleep(0.8)
        print("   -> Driving GPIO 17 LOW")
        relay17.off()
        time.sleep(0.8)
    relay17.close()
except Exception as e:
    print(f"Error testing GPIO 17: {e}")

# Test GPIO 18 (Pin 12)
try:
    print("\n2. Testing GPIO 18 (Physical Pin 12) for 5 seconds...")
    relay18 = OutputDevice(18)
    for _ in range(3):
        print("   -> Driving GPIO 18 HIGH")
        relay18.on()
        time.sleep(0.8)
        print("   -> Driving GPIO 18 LOW")
        relay18.off()
        time.sleep(0.8)
    relay18.close()
except Exception as e:
    print(f"Error testing GPIO 18: {e}")

print("\nDiagnostic completed! Which test made the relay click and green LED light up?")
