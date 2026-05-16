# Session Log

## 2026-05-16

- **Kinetic:** Danger-scaled `uFogMix` fog; tunnel **parallax rib** pass (secondary Z drift vs primary shell) for Temple-style sightline breakup; treadmill contract unchanged (scrap still streams +Z).
- **KC / apprenticeship:** `Structure/KC Student-Teacher Curriculum.md` **Lesson 013** added; `tools/kc_starfall_watch.py` extended with six proofs (`treadmill_architecture_note`, `danger_scaled_fog_uniform`, `sovereign_pause_history_trap`, `minimal_playing_hud_dom`, `touch_lerp_constant`, `tunnel_parallax_ribs`). Run `python tools/kc_starfall_watch.py --once --skip-backend` after every ship; append-only log at `Structure/KC Review Log.jsonl`. Optional Main Brain sync: same command with `--seed-kc` when the KC store path is available.

## 2026-05-05

- Starfall project moved to `C:\Users\rkhol\Starfall Salvage`.
- Private GitHub repo created under Kopano Labs.
- Tactical WebGL upgrades completed.
- Kopano Labs logo added to the HUD and account modal.
- Local profile/account modal implementation started and wired.
- Local Python backend added for demo sign-in and score persistence.
- KC promoted to strict dev QA lane for this project.
- `tools/kc_starfall_watch.py` added to record methodical pass/fail/retry logs.
- KC watcher initially failed to seed the KC store because of a dynamic import/dataclass issue; the watcher was patched and passed on retry.
- KC contexts `kc-3` and `kc-4` created for passing Starfall hard-QA passes.
- Profile/backend/KC lane, HUD logo fix, and KC verification log pushed to `origin/main`.
- Login modal input isolation fixed so Enter submits the pilot profile without launching the game.
- Backend storage upgraded from JSON to SQLite at `.data/starfall.db`.
