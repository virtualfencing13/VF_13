import cv2

urls = {
    "Raw Double-@ Link": "rtsp://admin:Forge@2000@192.168.55.247:554/Streaming/Channels/102",
    "Percent-Encoded Link": "rtsp://admin:Forge%402000@192.168.55.247:554/Streaming/Channels/102"
}

for name, url in urls.items():
    print(f"Testing [{name}]...")
    try:
        cap = cv2.VideoCapture(url)
        opened = cap.isOpened()
        print(f"  Result: {'✅ SUCCESS' if opened else '❌ FAILED'}")
        if opened:
            cap.release()
    except Exception as e:
        print(f"  Error: {e}")
