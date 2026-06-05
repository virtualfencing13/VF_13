import cv2

backends = [
    ("Default Backend (Index 0)", 0, None),
    ("V4L2 Backend (Index 0)", 0, cv2.CAP_V4L2),
    ("Default Backend (Index 1)", 1, None),
    ("V4L2 Backend (Index 1)", 1, cv2.CAP_V4L2),
    ("Default Backend (Index 2)", 2, None),
    ("V4L2 Backend (Index 2)", 2, cv2.CAP_V4L2),
]

for name, index, api in backends:
    print(f"Testing [{name}]...")
    try:
        if api is not None:
            cap = cv2.VideoCapture(index, api)
        else:
            cap = cv2.VideoCapture(index)
            
        opened = cap.isOpened()
        print(f"  Opened: {opened}")
        if opened:
            ok, frame = cap.read()
            print(f"  Frame Read: {ok} (Shape: {frame.shape if ok else 'None'})")
            cap.release()
    except Exception as e:
        print(f"  Error: {e}")
