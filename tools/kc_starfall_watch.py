from __future__ import annotations

import argparse
import importlib.util
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
STRUCTURE_DIR = ROOT / "Structure"
LOG_PATH = STRUCTURE_DIR / "KC Review Log.jsonl"
DEFAULT_KC_ROOT = Path(
    r"C:\Users\rkhol\OneDrive\Documents\Anthropic\Introduction to MCP"
)
DEFAULT_KC_IMPL = (
    DEFAULT_KC_ROOT
    / "Schematics"
    / "06-Reference"
    / "kopano-code-implementation"
)
DEFAULT_KC_STORE = DEFAULT_KC_IMPL / ".kc" / "context_store.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run_command(command: list[str], timeout: int = 25) -> dict[str, Any]:
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return {
            "command": command,
            "ok": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout.strip()[-1200:],
            "stderr": result.stderr.strip()[-1200:],
        }
    except (OSError, subprocess.TimeoutExpired) as error:
        return {
            "command": command,
            "ok": False,
            "returncode": None,
            "stdout": "",
            "stderr": str(error),
        }


def check_required_files() -> dict[str, Any]:
    required = [
        "index.html",
        "styles.css",
        "src/game.js",
        "assets/kopano-labs-logo.png",
        "backend/starfall_server.py",
        "PROJECT_DOCUMENTATION.md",
        "README.md",
        "DEPLOYMENT.md",
        "Structure/Starfall Salvage - Index.md",
        "Structure/KC Dev Lane.md",
    ]
    missing = [path for path in required if not (ROOT / path).exists()]
    return {
        "name": "required_files",
        "expected": "all branded, backend, docs, and sub-brain files exist",
        "ok": not missing,
        "actual": "all files present" if not missing else f"missing: {', '.join(missing)}",
        "retry": "create or restore the missing files, then rerun the KC watch check",
    }


def check_git_clean_enough() -> dict[str, Any]:
    status = run_command(["git", "status", "--short"])
    dirty_lines = [line for line in status["stdout"].splitlines() if line.strip()]
    return {
        "name": "git_status",
        "expected": "only intentional Starfall changes appear before commit",
        "ok": status["ok"],
        "actual": status["stdout"] or status["stderr"] or "clean",
        "retry": "inspect every dirty path; stage only intentional Starfall files",
        "dirty_count": len(dirty_lines),
    }


def check_syntax() -> list[dict[str, Any]]:
    node = run_command(["node", "--check", "src/game.js"])
    python = run_command(["python", "-m", "py_compile", "backend/starfall_server.py"])
    return [
        {
            "name": "javascript_syntax",
            "expected": "src/game.js parses with node --check",
            "ok": node["ok"],
            "actual": node["stdout"] or node["stderr"] or "ok",
            "retry": "fix the JavaScript parser error before gameplay testing",
        },
        {
            "name": "backend_syntax",
            "expected": "backend/starfall_server.py compiles with py_compile",
            "ok": python["ok"],
            "actual": python["stdout"] or python["stderr"] or "ok",
            "retry": "fix the Python parser error before starting the local backend",
        },
    ]


def check_backend_health(url: str) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(url, timeout=2.5) as response:
            body = response.read().decode("utf-8")
            payload = json.loads(body)
            ok = response.status == 200 and payload.get("ok") is True
            actual = payload
    except (OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        ok = False
        actual = str(error)
    return {
        "name": "backend_health",
        "expected": f"{url} returns JSON with ok=true",
        "ok": ok,
        "actual": actual,
        "retry": "start python backend/starfall_server.py --port 8765 and rerun",
    }


def build_report(health_url: str) -> dict[str, Any]:
    checks: list[dict[str, Any]] = [check_required_files(), check_git_clean_enough()]
    checks.extend(check_syntax())
    checks.append(check_backend_health(health_url))
    failed = [check for check in checks if not check.get("ok")]
    return {
        "timestamp": utc_now(),
        "project": "Starfall Salvage",
        "root": str(ROOT),
        "kc_role": "strict_dev_qa_lane",
        "summary": {
            "ok": not failed,
            "checks": len(checks),
            "failures": len(failed),
        },
        "checks": checks,
    }


def append_report(report: dict[str, Any]) -> None:
    STRUCTURE_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(report, sort_keys=True) + "\n")


def load_kc_module(kc_impl: Path):
    module_path = kc_impl / "src" / "kc_mcp.py"
    spec = importlib.util.spec_from_file_location("kc_mcp", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load KC module from {module_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def seed_kc_context(report: dict[str, Any], kc_impl: Path, kc_store_path: Path) -> str:
    module = load_kc_module(kc_impl)
    store = module.KcStore(kc_store_path)
    failed_checks = [check for check in report["checks"] if not check.get("ok")]
    retry_lines = [
        f"- {check['name']}: {check['retry']} Actual: {check['actual']}"
        for check in failed_checks
    ] or ["- No failures in this pass. Keep rerunning after every code change."]
    record = store.create({
        "title": f"Starfall Salvage KC hard QA pass - {report['timestamp']}",
        "teacher_context": (
            "KC is promoted from intern notes to strict dev QA. "
            "Expected behavior: fail incomplete work, state what broke, issue retry instructions, and log proof."
        ),
        "student_response": json.dumps(report["summary"], sort_keys=True),
    })
    store.update({
        "id": record.id,
        "teacher_review": "\n".join(retry_lines),
        "status": "reviewed",
    })
    return record.id


def main() -> int:
    parser = argparse.ArgumentParser(description="Starfall Salvage KC hard-QA watcher")
    parser.add_argument("--once", action="store_true", help="run one check pass and exit")
    parser.add_argument("--seed-kc", action="store_true", help="write the report to the KC context store")
    parser.add_argument("--interval", type=int, default=60)
    parser.add_argument("--health-url", default="http://127.0.0.1:8765/api/health")
    parser.add_argument("--kc-root", type=Path, default=DEFAULT_KC_ROOT)
    parser.add_argument("--kc-impl", type=Path, default=DEFAULT_KC_IMPL)
    parser.add_argument("--kc-store", type=Path, default=Path(os.environ.get("KC_CONTEXT_STORE", DEFAULT_KC_STORE)))
    args = parser.parse_args()

    while True:
        report = build_report(args.health_url)
        if args.seed_kc:
            try:
                report["kc_context_id"] = seed_kc_context(report, args.kc_impl, args.kc_store)
            except Exception as error:  # noqa: BLE001 - this is a watchdog log path.
                report["kc_seed_error"] = str(error)
        append_report(report)
        print(json.dumps(report["summary"], sort_keys=True), flush=True)
        if args.once:
            break
        time.sleep(max(10, args.interval))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
