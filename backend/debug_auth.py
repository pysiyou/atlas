
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(username, password):
    url = f"{BASE_URL}/auth/login"
    data = json.dumps({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                return json.loads(response.read().decode())
            else:
                print(f"Login failed: {response.status}")
                return None
    except urllib.error.HTTPError as e:
        print(f"Login error: {e.code} - {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Login exception: {e}")
        return None

def get_orders(token, quote_token=False, origin=None):
    token_val = f'"{token}"' if quote_token else token
    headers = {"Authorization": f"Bearer {token_val}"}
    if origin:
        headers["Origin"] = origin
        
    url = f"{BASE_URL}/orders"
    req = urllib.request.Request(url, headers=headers)
    
    print(f"\nTesting with origin={origin}, quoted={quote_token}")
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"Error: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    print("Attempting login...")
    token_data = login("admin", "admin123")
    if token_data:
        token = token_data["access_token"]
        
        # Test 1: Normal
        get_orders(token)
        
        # Test 2: With Origin
        get_orders(token, origin="http://localhost:5173")
        
        # Test 3: With Quoted Token (simulating double stringify)
        get_orders(token, quote_token=True)
