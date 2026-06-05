# backend/Dockerfile
FROM python:3.11-slim

# Install system dependencies for OpenCV, YOLO and Hardware access
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libatlas3-base \
    libgomp1 \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download YOLO model to save time on the Pi
RUN python -c "from ultralytics import YOLO; YOLO('yolo11n.pt')"

# Copy application code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

