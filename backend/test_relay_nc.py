import time
import sys
from gpiozero import OutputDevice

RELAY_PIN = 17
# Set to True if active-low, or False if active-high
RELAY_ACTIVE_LOW = False 

print("==============================================")
print("RELAY NC LOOP TEST STARTING...")
print(f"Relay Pin: GPIO {RELAY_PIN} (Physical Pin 11)")
print(f"Active Low Configuration: {RELAY_ACTIVE_LOW}")
print("==============================================")

relay = None

try:
    for cycle in range(1, 5):
        print(f"\n--- Cycle {cycle} ---")
        
        # 1. State: Danger (Energized) -> Motor should STOP
        print("🚨 ACTION: Stopping motor (Energizing relay)...")
        if relay is None:
            relay = OutputDevice(RELAY_PIN)
        
        if RELAY_ACTIVE_LOW:
            relay.off()  # Drives pin to 0V (LOW)
        else:
            relay.on()   # Drives pin to 3.3V (HIGH)
            
        print("Coil State: ENERGIZED (Check if relay LED is ON and you hear a click)")
        print("Motor State: Should be STOPPED now.")
        time.sleep(3)
        
        # 2. State: Safe (De-energized) -> Motor should RUN
        print("🟢 ACTION: Starting motor (De-energizing relay)...")
        if relay is not None:
            relay.close()
            relay = None
            
        print("Coil State: DE-ENERGIZED (Check if relay LED is OFF and you hear a click)")
        print("Motor State: Should be RUNNING now.")
        time.sleep(3)

    print("\nTest completed successfully!")
except Exception as ex:
    print(f"\n❌ TEST ERROR: {ex}")
    import traceback
    traceback.print_exc()
finally:
    if relay is not None:
        relay.close()
