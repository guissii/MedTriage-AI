import requests
import json
import sys

url = "http://localhost:8000/api/consultation"

payload = {
  "patient": {
    "age": 45,
    "gender": "male",
    "weight": 80,
    "allergies": ["penicillin"],
    "medical_history": ["diabetes"]
  },
  "symptoms": {
    "fever": 39.0,
    "cough": True,
    "dyspnea": False
  },
  "biological_analysis": {
    "crp": 55.0,
    "leukocytes": 14000.0,
    "creatinine": 1.1,
    "asat": 30.0,
    "alat": 35.0
  },
  "imaging": {
    "pulmonary_opacity": True
  }
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, timeout=180)
    response.raise_for_status()
    print("Response status:", response.status_code)
    print("Response body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response') and e.response:
        print("Server response:", e.response.text)
    sys.exit(1)
