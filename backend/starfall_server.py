from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / ".data"
DB_FILE = DATA_DIR / "starfall.db"
LEGACY_STATE_FILE = DATA_DIR / "starfall-state.json"
DB_LOCK = threading.Lock()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def clean_callsign(value: Any) -> str:
    callsign = re.sub(r"[^a-zA-Z0-9 _-]", "", str(value or "")).strip()
    return callsign[:24] or "Salvage Pilot"


def clean_chat_message(value: Any) -> str:
    text = re.sub(r"[\x00-\x1f\x7f]", "", str(value or "")).strip()
    return text[:240]


def hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def pilot_id_for(callsign: str, squad_code: str) -> str:
    seed = f"{callsign.lower()}::{squad_code.strip().lower()}".encode("utf-8")
    return "pilot-" + hashlib.sha256(seed).hexdigest()[:16]


def connect_db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def init_db() -> None:
    with DB_LOCK, connect_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS pilots (
              id TEXT PRIMARY KEY,
              callsign TEXT NOT NULL,
              squad_hash TEXT NOT NULL,
              best_score INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              last_seen TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS scores (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              pilot_id TEXT NOT NULL,
              callsign TEXT NOT NULL,
              score INTEGER NOT NULL,
              cores INTEGER NOT NULL,
              mission_time REAL NOT NULL,
              saved_at TEXT NOT NULL,
              FOREIGN KEY (pilot_id) REFERENCES pilots(id)
            );

            CREATE INDEX IF NOT EXISTS idx_scores_rank
              ON scores(score DESC, saved_at DESC);

            CREATE TABLE IF NOT EXISTS chat_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              pilot_id TEXT,
              callsign TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_chat_recent
              ON chat_messages(id DESC);
            """
        )
        migrate_legacy_json(db)


def chat_rows(db: sqlite3.Connection, limit: int = 20) -> list[dict[str, Any]]:
    rows = db.execute(
        """
        SELECT id, pilot_id, callsign, message, created_at
        FROM chat_messages
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [
        {
            "id": int(row["id"]),
            "pilotId": row["pilot_id"] or "",
            "callsign": row["callsign"],
            "message": row["message"],
            "createdAt": row["created_at"],
        }
        for row in reversed(rows)
    ]


def migrate_legacy_json(db: sqlite3.Connection) -> None:
    if not LEGACY_STATE_FILE.exists():
        return
    if db.execute("SELECT COUNT(*) FROM scores").fetchone()[0] > 0:
        return
    try:
        payload = json.loads(LEGACY_STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    if not isinstance(payload, dict):
        return

    now = utc_now()
    pilots = payload.get("pilots") or {}
    scores = payload.get("scores") or []

    if isinstance(pilots, dict):
        for pilot in pilots.values():
            if not isinstance(pilot, dict):
                continue
            pilot_id = str(pilot.get("id") or pilot_id_for(clean_callsign(pilot.get("callsign")), ""))
            callsign = clean_callsign(pilot.get("callsign"))
            db.execute(
                """
                INSERT OR IGNORE INTO pilots (id, callsign, squad_hash, best_score, created_at, last_seen)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    pilot_id,
                    callsign,
                    hash_text("legacy"),
                    int(pilot.get("bestScore") or 0),
                    str(pilot.get("createdAt") or now),
                    str(pilot.get("lastSeen") or now),
                ),
            )

    if isinstance(scores, list):
        for score in scores:
            if not isinstance(score, dict):
                continue
            callsign = clean_callsign(score.get("callsign"))
            pilot_id = str(score.get("pilotId") or pilot_id_for(callsign, ""))
            ensure_pilot(db, pilot_id, callsign, "legacy")
            db.execute(
                """
                INSERT INTO scores (pilot_id, callsign, score, cores, mission_time, saved_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    pilot_id,
                    callsign,
                    max(0, int(score.get("score") or 0)),
                    max(0, int(score.get("cores") or 0)),
                    max(0.0, float(score.get("time") or 0)),
                    str(score.get("savedAt") or now),
                ),
            )


def ensure_pilot(db: sqlite3.Connection, pilot_id: str, callsign: str, squad_hash: str) -> None:
    now = utc_now()
    db.execute(
        """
        INSERT INTO pilots (id, callsign, squad_hash, best_score, created_at, last_seen)
        VALUES (?, ?, ?, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          callsign = excluded.callsign,
          last_seen = excluded.last_seen
        """,
        (pilot_id, callsign, squad_hash, now, now),
    )


def row_to_pilot(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "callsign": row["callsign"],
        "bestScore": int(row["best_score"]),
        "createdAt": row["created_at"],
        "lastSeen": row["last_seen"],
    }


def leaderboard_rows(db: sqlite3.Connection, limit: int = 12) -> list[dict[str, Any]]:
    rows = db.execute(
        """
        SELECT pilot_id, callsign, score, cores, mission_time, saved_at
        FROM scores
        ORDER BY score DESC, saved_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [
        {
            "pilotId": row["pilot_id"],
            "callsign": row["callsign"],
            "score": int(row["score"]),
            "cores": int(row["cores"]),
            "time": float(row["mission_time"]),
            "savedAt": row["saved_at"],
        }
        for row in rows
    ]


class StarfallHandler(SimpleHTTPRequestHandler):
    server_version = "StarfallSalvage/1.1"

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
        parsed = urlparse(self.path)
        route = parsed.path
        if route == "/api/health":
            self.send_json({
                "ok": True,
                "service": "starfall-salvage",
                "database": "sqlite",
                "dbFile": str(DB_FILE),
                "time": utc_now(),
            })
            return
        if route == "/api/leaderboard":
            with DB_LOCK, connect_db() as db:
                self.send_json({"ok": True, "scores": leaderboard_rows(db)})
            return
        if route == "/api/chat":
            params = parse_qs(parsed.query)
            try:
                requested = int((params.get("limit") or ["20"])[0])
            except ValueError:
                requested = 20
            limit = max(1, min(50, requested))
            with DB_LOCK, connect_db() as db:
                self.send_json({"ok": True, "messages": chat_rows(db, limit)})
            return
        if route == "/api/me":
            params = parse_qs(parsed.query)
            pilot_id = (params.get("pilotId") or [""])[0]
            with DB_LOCK, connect_db() as db:
                row = db.execute("SELECT * FROM pilots WHERE id = ?", (pilot_id,)).fetchone()
            self.send_json({"ok": row is not None, "pilot": None if row is None else row_to_pilot(row)})
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
        if route == "/api/chat":
            self.handle_chat()
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
        squad_hash = hash_text(f"{callsign.lower()}::{squad_code.strip().lower()}")

        with DB_LOCK, connect_db() as db:
            ensure_pilot(db, pilot_id, callsign, squad_hash)
            row = db.execute("SELECT * FROM pilots WHERE id = ?", (pilot_id,)).fetchone()
            leaderboard = leaderboard_rows(db, 5)

        self.send_json({
            "ok": True,
            "mode": "backend",
            "storage": "sqlite",
            "pilot": row_to_pilot(row),
            "leaderboard": leaderboard,
        })

    def handle_score(self) -> None:
        body = self.read_json_body()
        callsign = clean_callsign(body.get("callsign"))
        pilot_id = str(body.get("pilotId") or pilot_id_for(callsign, ""))
        score = max(0, int(float(body.get("score") or 0)))
        cores = max(0, int(float(body.get("cores") or 0)))
        mission_time = max(0.0, float(body.get("time") or 0))
        now = utc_now()

        with DB_LOCK, connect_db() as db:
            ensure_pilot(db, pilot_id, callsign, hash_text("score-submit"))
            db.execute(
                """
                INSERT INTO scores (pilot_id, callsign, score, cores, mission_time, saved_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (pilot_id, callsign, score, cores, round(mission_time, 2), now),
            )
            db.execute(
                """
                UPDATE pilots
                SET best_score = MAX(best_score, ?), callsign = ?, last_seen = ?
                WHERE id = ?
                """,
                (score, callsign, now, pilot_id),
            )
            row = db.execute("SELECT * FROM pilots WHERE id = ?", (pilot_id,)).fetchone()
            leaderboard = leaderboard_rows(db)

        self.send_json({
            "ok": True,
            "storage": "sqlite",
            "pilot": row_to_pilot(row),
            "leaderboard": leaderboard,
        })

    def handle_chat(self) -> None:
        body = self.read_json_body()
        callsign = clean_callsign(body.get("callsign"))
        pilot_id = str(body.get("pilotId") or "").strip()[:64]
        message = clean_chat_message(body.get("message"))
        if not message:
            self.send_json({"ok": False, "error": "Empty message"}, status=400)
            return
        now = utc_now()
        rate_key = pilot_id or f"anon:{self.client_address[0]}"

        with DB_LOCK, connect_db() as db:
            recent = db.execute(
                """
                SELECT created_at FROM chat_messages
                WHERE pilot_id IS ? OR (pilot_id IS NULL AND ? IS NULL)
                ORDER BY id DESC LIMIT 1
                """,
                (pilot_id or None, pilot_id or None),
            ).fetchone()
            if recent is not None:
                try:
                    last_dt = datetime.fromisoformat(recent["created_at"])
                    if (datetime.now(timezone.utc) - last_dt).total_seconds() < 1.5:
                        messages = chat_rows(db)
                        self.send_json(
                            {
                                "ok": False,
                                "error": "Slow down, pilot. One transmission every 1.5s.",
                                "messages": messages,
                                "rateLimitKey": rate_key,
                            },
                            status=429,
                        )
                        return
                except ValueError:
                    pass
            db.execute(
                """
                INSERT INTO chat_messages (pilot_id, callsign, message, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (pilot_id or None, callsign, message, now),
            )
            messages = chat_rows(db)

        self.send_json({"ok": True, "messages": messages})

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
    parser = argparse.ArgumentParser(description="Starfall Salvage local SQLite backend")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    init_db()
    server = ThreadingHTTPServer((args.host, args.port), StarfallHandler)
    print(f"Starfall Salvage serving http://{args.host}:{args.port}/ from {ROOT}")
    print(f"SQLite database: {DB_FILE}")
    server.serve_forever()


if __name__ == "__main__":
    main()
