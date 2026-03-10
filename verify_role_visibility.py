import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def get_token(email, password):
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            return resp.json()["access_token"]
        else:
            print(f"Login failed for {email}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Connection error: {e}")
    return None

def check_logs(token, role, endpoint):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    print(f"\nChecking logs for role: {role} via {endpoint}")
    if resp.status_code == 200:
        logs = resp.json()
        if not logs:
            print("No logs found.")
            return
        
        log = logs[0]
        has_payload = "payload" in log
        has_features = "extractedFeatures" in log
        
        print(f"Log keys: {list(log.keys())}")
        print(f"Has payload: {has_payload}")
        print(f"Has extractedFeatures: {has_features}")
        
        if role == "engineer":
            if has_payload and has_features:
                print("✅ Engineer can see detailed logs.")
            else:
                print("❌ Engineer MISSING detailed logs.")
        else:
            if not has_payload and not has_features:
                print(f"✅ {role} RESTRICTED from detailed logs.")
            else:
                print(f"❌ {role} HAS ACCESSS to restricted logs.")
    else:
        print(f"Error fetching logs: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    # Credentials from check_db_sync.py
    users = [
        {"email": "hemaeng@gmail.com", "password": "password123", "role": "engineer"},
        {"email": "likhithaadmin@gmail.com", "password": "password123", "role": "admin"},
        {"email": "likhitha@gmail.com", "password": "password123", "role": "owner"},
    ]
    
    for user in users:
        token = get_token(user["email"], user["password"])
        if token:
            if user["role"] == "engineer":
                v_resp = requests.get(f"{BASE_URL}/engineer/assigned-vehicles", headers={"Authorization": f"Bearer {token}"})
                if v_resp.status_code == 200 and v_resp.json():
                    v_id = v_resp.json()[0]["vehicle_id"]
                    check_logs(token, user["role"], f"/engineer/vehicle-logs/{v_id}")
                else:
                    print(f"Could not get vehicle for engineer {user['email']}.")
            elif user["role"] == "admin":
                check_logs(token, user["role"], "/admin/all-logs")
            elif user["role"] == "owner":
                check_logs(token, user["role"], "/owner/my-logs")
        else:
            print(f"Could not login as {user['role']} - {user['email']}")
