import os
import requests
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Accept-Profile": "ml_forecasting",
    "Content-Profile": "ml_forecasting",
    "Content-Type": "application/json"
}

url = f"{SUPABASE_URL}/rest/v1/rpc/extract_training_data"
payload = {
    "p_start_date": "2026-01-14",
    "p_end_date": "2026-02-27"
}

print("URL:", url)
res = requests.post(url, headers=headers, json=payload)
print("Status:", res.status_code)
print("Response text length:", len(res.text))
if res.status_code != 200:
    print(res.text)
