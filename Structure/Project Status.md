# Project Status

## Status

Active development.

## Last Updated

2026-05-05

## Completed

- Raw WebGL game created with shaders, buffers, indexed meshes, matrix transforms, procedural textures, and gameplay loop.
- Tactical WebGL upgrade added: diffuse lighting, additive particle pass, FPS HUD, dash FOV, view-matrix shake, delta-time audit.
- Project moved to `C:\Users\rkhol\Starfall Salvage`.
- Private GitHub repository created and seeded at `https://github.com/Kopano-Labs/starfall-salvage`.
- Kopano Labs logo asset added locally.
- Pilot profile UI added with offline fallback and optional local backend.
- Local Python backend added for demo sign-in, score storage, leaderboard, and static file serving.
- KC strict QA lane added.
- Kopano Labs Upgrade (2026-05-05): native HTML5 Vibration API on hull damage and game over, WhatsApp share button on leaderboard, in-game Kasi-Comm chat lobby with SQLite persistence and 3s polling, Sovereign Tech CONTRIBUTING.md bounty doctrine.
- Open Graph + Twitter Card meta tags added for WhatsApp/social link previews.
- Chat backend rate-limited to one transmission per pilot every 1.5s.

## Not Yet Proven

- `https://starfallsalvage.kopanolabs.com` is registered on IONOS but not yet pointed at a deployed origin (subdomain in "not currently in use" state as of 2026-05-05).
- Production backend hosting is not configured. Current backend is local-demo only.
- Full WebGL context rebuild after GPU context loss is not implemented; current behavior reloads on context restore.
- Kasi-Comm has no WebSocket/realtime layer; polling cadence is 3s and may show send-receive lag during heavy traffic.
- Bounty payout rails (Yoco/PayFast/EFT) are documented in CONTRIBUTING.md but not yet wired to a payout automation.

## Verification

- `node --check src\game.js` passed.
- `python -m py_compile backend\starfall_server.py tools\kc_starfall_watch.py` passed.
- Backend `/api/health`, `/api/signin`, `/api/score`, and `/api/leaderboard` passed locally against SQLite.
- Headless Edge smoke passed: sign-in, start, dash, pause, FPS, HUD, and screenshot.
- Headless Edge login smoke passed: pressing Enter in the login modal signs in without launching the game.
- KC hard-QA watcher passed and seeded `kc-3`, then final rerun seeded `kc-4`.
- GitHub push complete: profile/backend/KC lane, HUD logo fix, and KC verification log are pushed to `origin/main`.
