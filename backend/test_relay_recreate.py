import time
import sys
from gpiozero import OutputDevice

RELAY_PIN = 17

print("Starting relay recreation test...")
try:
    print("1. Creating OutputDevice...")
    relay = OutputDevice(RELAY_PIN)
    print("Relay created successfully. Driving pin LOW...")
    relay.off() # If RELAY_ACTIVE_LOW is True, driving LOW energizes
    time.sleep(2)

    print("2. Closing OutputDevice...")
    relay.close()
    print("Relay closed successfully. Waiting 1 second...")
    time.sleep(1)

    print("3. Recreating OutputDevice...")
    relay = OutputDevice(RELAY_PIN)
    print("Relay recreated successfully! Driving pin LOW...")
    relay.off()
    time.sleep(2)
    
    print("4. Cleaning up...")
    relay.close()
    print("Test passed successfully!")
except Exception as ex:
    print(f"❌ TEST FAILED: {ex}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
