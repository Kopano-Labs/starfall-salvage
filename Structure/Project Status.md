# Project Status

## Status

**Live on production** at `https://starfallsalvage.kopanolabs.com`. Active development continues.

## Last Updated

2026-05-14

## Current Branch Proof

- Active execution clone: `C:\Users\rkhol\OneDrive\Documents\Kopano Labs\starfall-salvage`.
- Branch: `codex/starfall-mobile-weapon-ecosystem`.
- Code commit: `5467bb4 fix(starfall): unify device fire control and speed chrome`.
- Branch proof docs: committed after the code patch on the same branch; use `git log -1` for the current branch tip.
- Remote push: complete to `origin/codex/starfall-mobile-weapon-ecosystem`.
- Manual PR URL: `https://github.com/Kopano-Labs/starfall-salvage/pull/new/codex/starfall-mobile-weapon-ecosystem`.
- Production redeploy: pending merge to `main`.

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

## Production State (2026-05-06)

- **Live URL:** `https://starfallsalvage.kopanolabs.com` (Vercel Hobby + IONOS CNAME, served from `cpt1` Cape Town edge).
- **GitHub repo:** `https://github.com/Kopano-Labs/starfall-salvage` (public — Sovereign Tech CONTRIBUTING.md visible to CPUT community).
- **Vercel project:** `robynawesomes-projects/starfall-salvage`, Hobby plan, auto-deploy on push to main.
- **DNS:** `CNAME starfallsalvage  3600  IN  CNAME  4af9f515c8f66fb7.vercel-dns-017.com.`
- **OG/Twitter Card meta tags** resolving against absolute URLs — WhatsApp link previews work.
- **PWA installable** via `manifest.webmanifest` (Android Add-to-Home-Screen).

## Unified Device Ecosystem State (2026-05-14)

- PC, Android, Xiaomi-class Chrome, and Apple-class browser gameplay use one simulation model.
- Device differences are CSS/presentation only: safe-area, density, scroll containment, and touch target sizing.
- FIRE is visible on PC and mobile, and its label follows active weapon state: `FIRE`, `RAPID`, `TRIAD`, or `PRISM`.
- Existing buff system remains canonical: `overcharge`, `triad`, `aegis`, `prism`, plus legacy `powerOrb` bridge.
- Speed-responsive chrome uses CSS variables (`--speed-strength`, `--speed-accent`) and brightens as speed rises.

## Not Yet Proven

- Physical Redmi 13 recapture after this branch merges and Vercel redeploys production.
- GitHub PR creation from this agent lane is blocked by invalid `gh` token / connector 403; branch push succeeded.
- MAIN-BRAIN path drift remains on WATCH: older registry path is `C:\Users\rkhol\Starfall Salvage`, current execution clone is `C:\Users\rkhol\OneDrive\Documents\Kopano Labs\starfall-salvage`.
- Kasi-Comm chat backend is **not deployed** on production — frontend gracefully shows "Lobby offline." Phase C of 2026-05-06 session adds mailto-based idea capture with bounty incentive.
- SQLite leaderboard backend not deployed on production — frontend gracefully degrades to local browser scores.
- Production backend hosting (the Python `starfall_server.py`) is not configured. Current backend is local-demo only.
- Full WebGL context rebuild after GPU context loss is not implemented; current behavior reloads on context restore.
- Kasi-Comm has no WebSocket/realtime layer; polling cadence is 3s and may show send-receive lag during heavy traffic.
- Bounty payout rails (Yoco/PayFast/EFT) are documented in CONTRIBUTING.md but not yet wired to a payout automation.
- Kopano-Labs org has "Payment unsuccessful" banners on GitHub + IONOS billing — non-blocking for the deploy, but card on file needs clearing for future renewals.

## Verification

- `node --check .\src\game.js` passed on 2026-05-14 resume audit.
- `npm run vault:check` passed on 2026-05-14 resume audit.
- `git diff --check` passed on 2026-05-14 resume audit.
- Browser layout proof passed across Redmi 393x873, narrow 360x800, and desktop 1280x720: `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-resume-r1\report.json`.
- Speed-color proof passed in deterministic browser run: `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-resume-speed-r5\report.json`.
- `node --check src\game.js` passed.
- `python -m py_compile backend\starfall_server.py tools\kc_starfall_watch.py` passed.
- Backend `/api/health`, `/api/signin`, `/api/score`, and `/api/leaderboard` passed locally against SQLite.
- Headless Edge smoke passed: sign-in, start, dash, pause, FPS, HUD, and screenshot.
- Headless Edge login smoke passed: pressing Enter in the login modal signs in without launching the game.
- KC hard-QA watcher passed and seeded `kc-3`, then final rerun seeded `kc-4`.
- GitHub push complete: profile/backend/KC lane, HUD logo fix, and KC verification log are pushed to `origin/main`.
