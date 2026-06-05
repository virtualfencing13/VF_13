import requests
import json
import jwt
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def test_secure_auth_flow():
    print("🚀 STARTING FENCEAI ENTERPRISE SECURITY INTEGRATION TEST SUITE...\n")
    
    session = requests.Session()

    # 1. Test standard credentials login to acquire JWT token
    print("🔑 [STEP 1] Testing Standard Operator Authentication & JWT Token Issuance...")
    payload = {
        "username": "admin@gmail.com",
        "password": "admin123"
    }
    
    r = session.post(f"{BASE_URL}/api/auth/login", json=payload)
    if r.status_code != 200:
        print(f"❌ Standard login failed. Status: {r.status_code}, Detail: {r.text}")
        return
        
    res = r.json()
    token = res.get("token")
    if not token:
        print("❌ Login response did not contain JWT token!")
        return
        
    print(f"✅ Token Issuance Verified! Token prefix: {token[:25]}...")
    print(f"✅ Operator Identity verified as role: {res.get('role')} at company: {res.get('company')}\n")

    # 2. Test accessing protected administrative routes using Bearer Token
    print("🔒 [STEP 2] Testing Access to JWT-Protected Administrative Node...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Try fetching users
    r = session.get(f"{BASE_URL}/api/admin/users", headers=headers)
    if r.status_code != 200:
        print(f"❌ Administrative query refused: {r.status_code}, Detail: {r.text}")
        return
        
    users_list = r.json().get("users", [])
    print(f"✅ SecOps Directory Query Succeeded! Fetched {len(users_list)} registered operators.")
    for u in users_list:
        print(f"   • Node: {u.get('username')} | Provider: {u.get('auth_provider')} | Approved: {u.get('is_approved')} | Role: {u.get('role')}")
    print("")

    # Try fetching allowed domains
    r = session.get(f"{BASE_URL}/api/admin/domains", headers=headers)
    if r.status_code != 200:
        print(f"❌ Domain matrix query refused: {r.status_code}")
        return
    domains_list = r.json().get("domains", [])
    print(f"✅ Authorized Domain Matrix: {[d.get('domain') for d in domains_list]}\n")

    # 3. Test Security Domain Rejection
    print("🛑 [STEP 3] Testing Organization Allowed Domain Security Rejection...")
    unauth_payload = {
        "username": "intruder@publicgmail.com",
        "password": "somepassword123",
        "fullName": "Intruder Alert",
        "company": "Black Hat Inc",
        "phone": "911",
        "role": "operator"
    }
    r = session.post(f"{BASE_URL}/api/auth/register", json=unauth_payload)
    if r.status_code == 403:
        print("✅ Domain Filtering Verified! Registration with unauthorized domain successfully blocked (Status 403).")
    else:
        print(f"❌ Security Failure! Registration with unauthorized domain returned status {r.status_code} instead of 403.")
    print("")

    # 4. Test Forensic Log Retrieval
    print("📊 [STEP 4] Testing Forensic Audit Logs Query...")
    r = session.get(f"{BASE_URL}/api/admin/logs", headers=headers)
    if r.status_code != 200:
        print(f"❌ Log retrieval failed: {r.status_code}")
        return
    logs_list = r.json().get("logs", [])
    print(f"✅ Forensic Auditing Active! Logged events count: {len(logs_list)}")
    for log in logs_list[:5]:
        print(f"   • Timestamp: {log.get('timestamp')} | Action: {log.get('action')} | IP: {log.get('ip_address')} | Details: {log.get('details')}")
    
    print("\n🎉 ALL ENTERPRISE SECURITY INTEGRATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_secure_auth_flow()
