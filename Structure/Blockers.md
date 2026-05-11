# Blockers

## Active

- **Production chat/leaderboard backends:** Kasi-Comm lobby and SQLite leaderboard APIs are **not deployed** with the static front — see `Project Status.md` (frontend degrades gracefully). Needs hosting decision + deploy path for `starfall_server.py` (or successor).
- **KC cloud runtime:** not connected; local KC / Codex lane only (unchanged).
- **GPU context loss:** full WebGL rebuild after context restore not implemented (reload-only).

## Stale / corrected (2026-05-09)

- ~~`https://starfallsavage.kopanolabs.com`~~ was a **spelling typo** in this file. Live production domain per `Project Status.md` is **`https://starfallsalvage.kopanolabs.com`** — do not use the “savage” hostname in new docs or shares.

## Resolved

- Project root has been moved to `C:\Users\rkhol\Starfall Salvage`.
- GitHub private repo exists.
- Logo asset is available locally.
- Sign-in UI is no longer dead markup after the local profile/backend pass.

