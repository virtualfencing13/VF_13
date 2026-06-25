from fastapi.testclient import TestClient
from app.main import app
from app.main import get_current_user

# Mock authentication dependency
app.dependency_overrides[get_current_user] = lambda: {"username": "dharshiniv126@gmail.com", "role": "operator"}

client = TestClient(app)

print("🚀 Triggering local GET /api/cameras/my...")
try:
    response = client.get("/api/cameras/my")
    print("✅ STATUS CODE:", response.status_code)
    print("📝 JSON RESPONSE:", response.json())
except Exception as e:
    import traceback
    print("❌ EXCEPTION CAUGHT:")
    traceback.print_exc()
