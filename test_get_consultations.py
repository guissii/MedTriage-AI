import requests
import json
import sys

url = "http://localhost:8000/api/consultation"

try:
    print(f"Sending GET request to {url}...")
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    print("Response status:", response.status_code)
    data = response.json()
    print(f"Found {len(data)} consultations.")
    if data:
        print("First consultation:")
        print(json.dumps(data[0], indent=2))
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
