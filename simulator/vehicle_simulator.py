"""
Vehicle CAN Log Simulator.
Reads a CSV file and streams rows to the backend API as CAN log entries.
"""
import csv
import json
import random
import sys
import time
from datetime import datetime, timedelta

import requests

# ── Configuration ──────────────────────────────────────────
API_URL = "http://localhost:8000/api/logs/ingest"
VEHICLE_API_KEY = ""          # Set this after creating a vehicle via the admin API
CSV_FILE = "simulator_data/vehicle_VHC-001.csv"
DELAY_MIN = 0.05              # 50 ms
DELAY_MAX = 0.10              # 100 ms


def stream_csv(csv_path: str, api_key: str):
    """Read CSV and POST each row to the ingestion endpoint."""
    headers = {
        "Content-Type": "application/json",
        "X-Vehicle-API-Key": api_key,
    }

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            # Construct data list from data_0...data_7
            can_data = [int(row[f"data_{i}"]) for i in range(8)]
            
            payload = {
                "timestamp": row["timestamp"],
                "can_id": int(row["can_id"]),
                "dlc": int(row["dlc"]),
                "data": can_data
            }
            try:
                resp = requests.post(API_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                count += 1
                pred = data.get("prediction", "—")
                conf = data.get("confidence", "—")
                print(
                    f"[{count}] Sent ID={row['can_id']} DLC={row['dlc']} → "
                    f"prediction={pred} confidence={conf}"
                )
            except Exception as e:
                print(f"❌ Error sending row {count}: {e}")

            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    print(f"\n✅ Done. Sent {count} log entries.")


if __name__ == "__main__":
    api_key = VEHICLE_API_KEY
    csv_path = CSV_FILE

    if len(sys.argv) >= 2:
        api_key = sys.argv[1]
    if len(sys.argv) >= 3:
        csv_path = sys.argv[2]

    if not api_key:
        print("Usage: python vehicle_simulator.py <VEHICLE_API_KEY> [csv_file]")
        sys.exit(1)

    print(f"🚗 Starting CAN log simulation from {csv_path}")
    stream_csv(csv_path, api_key)
