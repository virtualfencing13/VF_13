import http.client
import json

def test_auth():
    conn = http.client.HTTPConnection("localhost", 8000)
    
    # 1. Register a new user
    user_payload = {
        "username": "test_auth_flow@gmail.com",
        "email": "test_auth_flow@gmail.com",
        "password": "Password123",
        "fullName": "Test Flow Operator",
        "phone": "1234567890",
        "company": "Auth Flow Corp"
    }
    
    print("Step 1: Attempting to register operator...")
    headers = {"Content-Type": "application/json"}
    conn.request("POST", "/api/auth/register", json.dumps(user_payload), headers)
    res = conn.getcall = conn.getresponse()
    status = res.status
    data = res.read().decode()
    print(f"Response Status: {status}")
    print(f"Response Body: {data}\n")
    
    # 2. Login the registered user
    login_payload = {
        "username": "test_auth_flow@gmail.com",
        "password": "Password123"
    }
    print("Step 2: Attempting to authenticate operator...")
    conn.request("POST", "/api/auth/login", json.dumps(login_payload), headers)
    res = conn.getresponse()
    status = res.status
    data = res.read().decode()
    print(f"Response Status: {status}")
    print(f"Response Body: {data}\n")
    
    # 3. Fetch operator profile
    print("Step 3: Fetching operator profile...")
    conn.request("GET", "/api/auth/profile?email=test_auth_flow@gmail.com")
    res = conn.getcall = conn.getresponse()
    status = res.status
    data = res.read().decode()
    print(f"Response Status: {status}")
    print(f"Response Body: {data}\n")

    # 4. Fetch notification settings
    print("Step 4: Fetching notification settings...")
    conn.request("GET", "/api/settings/notifications?email=test_auth_flow@gmail.com")
    res = conn.getresponse()
    status = res.status
    data = res.read().decode()
    print(f"Response Status: {status}")
    print(f"Response Body: {data}\n")

    # 5. Save notification settings
    settings_payload = {
        "email_context": "test_auth_flow@gmail.com",
        "settings": {
            "email_enabled": True,
            "telegram_enabled": False,
            "emails": "test_auth_flow@gmail.com,backup@gmail.com"
        }
    }
    print("Step 5: Saving notification settings...")
    conn.request("POST", "/api/settings/notifications", json.dumps(settings_payload), headers)
    res = conn.getresponse()
    status = res.status
    data = res.read().decode()
    print(f"Response Status: {status}")
    print(f"Response Body: {data}\n")

    conn.close()

if __name__ == "__main__":
    test_auth()
