# Session Log

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

## 2026-05-14

- Current public `origin/main` audited at `6a27bc1` before patching; older mobile-only branch was not pushed over newer main.
- Working branch created: `codex/starfall-mobile-weapon-ecosystem`.
- Unified-device ecosystem patch applied on top of current main: desktop FIRE visibility, active weapon labels, speed-responsive chrome, compact mobile HUD/share behavior, and ecosystem copy aligned to one ruleset across PC, Android, Xiaomi, and Apple browsers.
- Existing `origin/main` buff model preserved: overcharge, triad, aegis, prism, revive modal, guest CTA, schema spawns, PWA boot, and modal history traps.
- Browser proof passed across Redmi 393x873, narrow 360x800, and desktop 1280x720.
- Speed-color proof passed with deterministic survival run: `speedStrength=0.125`, `speedAccent=hsl(170 47% 40%)`, `speedValue=1.4x`.
- Case study added: `Structure/2026-05-14 - Unified Device Ecosystem Case Study.md`.
