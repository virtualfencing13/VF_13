import cv2
import time

print("Trying to open VideoCapture(1)...")
start = time.time()
cap = cv2.VideoCapture(1)
print(f"VideoCapture(1) isOpened: {cap.isOpened()} in {time.time() - start:.2f} seconds")
cap.release()

print("\nTrying to open VideoCapture('/dev/video1')...")
start = time.time()
cap2 = cv2.VideoCapture("/dev/video1")
print(f"VideoCapture('/dev/video1') isOpened: {cap2.isOpened()} in {time.time() - start:.2f} seconds")
cap2.release()
