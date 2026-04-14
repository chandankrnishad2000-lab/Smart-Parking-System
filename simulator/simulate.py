import argparse
import random
import time
from datetime import datetime

import requests


def now_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def fetch_slots(base_url: str):
    resp = requests.get(f"{base_url}/api/slots", timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return [slot["code"] for slot in data["slots"]]


def post_update(base_url: str, code: str, distance: float):
    payload = {"slot_code": code, "distance_cm": distance, "ts": now_ts()}
    resp = requests.post(f"{base_url}/api/sensor/update", json=payload, timeout=10)
    resp.raise_for_status()


def simulate_tick(base_url: str, slots, occupancy_rate: float, change_rate: float):
    sample_size = max(1, int(len(slots) * change_rate))
    chosen = random.sample(slots, sample_size)
    for code in chosen:
        occupied = random.random() < occupancy_rate
        if occupied:
            distance = random.uniform(5, 25)
        else:
            distance = random.uniform(60, 180)
        post_update(base_url, code, distance)


def main():
    parser = argparse.ArgumentParser(description="Smart Parking Simulator")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--interval", type=float, default=2.0, help="Seconds between ticks")
    parser.add_argument("--occupancy", type=float, default=0.6, help="Target occupancy rate 0-1")
    parser.add_argument("--change-rate", type=float, default=0.35, help="Fraction of slots updated per tick")
    parser.add_argument("--steps", type=int, default=0, help="Number of ticks (0=run forever)")
    args = parser.parse_args()

    slots = fetch_slots(args.base_url)
    if not slots:
        raise SystemExit("No slots found. Start the backend first.")

    step = 0
    while True:
        simulate_tick(args.base_url, slots, args.occupancy, args.change_rate)
        step += 1
        if args.steps and step >= args.steps:
            break
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
