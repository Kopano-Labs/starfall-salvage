from __future__ import annotations

import argparse
import hashlib
import json
import re
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / ".data"
STATE_FILE = DATA_DIR / "starfall-state.json"
STATE_LOCK = threading.Lock()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def clean_callsign(value: Any) -> str:
    callsign = re.sub(r"[^a-zA-Z0-9 _-]", "", str(value or "")).strip()
    return callsign[:24] or "Salvage Pilot"


def pilot_id_for(callsign: str, squad_code: str) -> str:
    seed = f"{callsign.lower()}::{squad_code.strip().lower()}".encode("utf-8")
    return "pilot-" + hashlib.sha256(seed).hexdigest()[:16]


def empty_state() -> dict[str, Any]:
    return {"pilots": {}, "scores": []}


def load_state() -> dict[str, Any]:
    if not STATE_FILE.exists():
      return empty_state()
    try:
        with STATE_FILE.open("r", encoding="utf-8") as state_file:
            state = json.load(state_file)
    except (OSError, json.JSONDecodeError):
        return empty_state()
    if not isinstance(state, dict):
        return empty_state()
    state.setdefault("pilots", {})
    state.setdefault("scores", [])
    return state


def save_state(state: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_file = STATE_FILE.with_suffix(".tmp")
    with temp_file.open("w", encoding="utf-8") as state_file:
        json.dump(state, state_file, indent=2, sort_keys=True)
    temp_file.replace(STATE_FILE)


class StarfallHandler(SimpleHTTPRequestHandler):
    server_version = "StarfallSalvage/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        route = urlparse(self.path).path
        if route == "/api/health":
            self.send_json({"ok": True, "service": "starfall-salvage", "time": utc_now()})
            return
        if route == "/api/leaderboard":
            with STATE_LOCK:
                state = load_state()
                scores = list(state.get("scores", []))[:12]
            self.send_json({"ok": True, "scores": scores})
            return
        super().do_GET()

    def do_POST(self) -> None:
        route = urlparse(self.path).path
        if route == "/api/signin":
            self.handle_signin()
            return
        if route == "/api/score":
            self.handle_score()
            return
        self.send_json({"ok": False, "error": "Unknown API route"}, status=404)

    def read_json_body(self) -> dict[str, Any]:
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 65536)
        except ValueError:
            length = 0
        raw_body = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            body = {}
        return body if isinstance(body, dict) else {}

    def handle_signin(self) -> None:
        body = self.read_json_body()
        callsign = clean_callsign(body.get("callsign"))
        squad_code = str(body.get("squadCode") or "")
        pilot_id = pilot_id_for(callsign, squad_code)

        with STATE_LOCK:
            state = load_state()
            pilot = state["pilots"].get(pilot_id, {
                "id": pilot_id,
                "callsign": callsign,
                "bestScore": 0,
                "createdAt": utc_now()
            })
            pilot["callsign"] = callsign
            pilot["lastSeen"] = utc_now()
            state["pilots"][pilot_id] = pilot
            save_state(state)

        self.send_json({"ok": True, "mode": "backend", "pilot": pilot})

    def handle_score(self) -> None:
        body = self.read_json_body()
        callsign = clean_callsign(body.get("callsign"))
        pilot_id = str(body.get("pilotId") or pilot_id_for(callsign, ""))
        score = max(0, int(float(body.get("score") or 0)))
        cores = max(0, int(float(body.get("cores") or 0)))
        mission_time = max(0.0, float(body.get("time") or 0))

        with STATE_LOCK:
            state = load_state()
            pilot = state["pilots"].get(pilot_id, {
                "id": pilot_id,
                "callsign": callsign,
                "bestScore": 0,
                "createdAt": utc_now()
            })
            pilot["callsign"] = callsign
            pilot["bestScore"] = max(int(pilot.get("bestScore") or 0), score)
            pilot["lastSeen"] = utc_now()
            state["pilots"][pilot_id] = pilot

            entry = {
                "pilotId": pilot_id,
                "callsign": callsign,
                "score": score,
                "cores": cores,
                "time": round(mission_time, 2),
                "savedAt": utc_now()
            }
            state["scores"].append(entry)
            state["scores"].sort(key=lambda item: int(item.get("score") or 0), reverse=True)
            state["scores"] = state["scores"][:25]
            save_state(state)

        self.send_json({"ok": True, "pilot": pilot, "leaderboard": state["scores"][:12]})

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def main() -> None:
    parser = argparse.ArgumentParser(description="Starfall Salvage local demo backend")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), StarfallHandler)
    print(f"Starfall Salvage serving http://{args.host}:{args.port}/ from {ROOT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
