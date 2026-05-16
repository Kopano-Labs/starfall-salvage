# Project Status

## Status

**Live on production** at `https://starfallsalvage.kopanolabs.com`. Active development continues.

## Last Updated

2026-05-16

- **Sovereign Identity (2026-05-16):** Implemented biologically-adaptive flight deck (XY/XX theme switching), device-bound cryptographic Sovereign ID generation, and premium 'Neural Scan' onboarding. 
- **Kinetic Gameplay (Turing Standard):** Added 'Temple Run' fluid lane shifting, 90° Yaw transitions, banking animations, and 'Neural Gate' procedural obstacles.
- **Microsoft Store Readiness:** Generated `AppxManifest.xml` and `msix_package_guide.md` in `Store/` directory. PWA manifest search-optimized and categorized for Arcade/Action.
- **Visual Rendering Upgrade:** Replaced flat cubes with procedural 'Salvage Debris' shard geometry for increased high-fidelity immersion.
- **Checklist Codification:** Created `docs/microsoft-readiness.md` as the binary compliance gate for the ecosystem.

## Production State (2026-05-06)

- **Live URL:** `https://starfallsalvage.kopanolabs.com` (Vercel Hobby + IONOS CNAME, served from `cpt1` Cape Town edge).
- **GitHub repo:** `https://github.com/Kopano-Labs/starfall-salvage` (public — Sovereign Tech CONTRIBUTING.md visible to CPUT community).
- **Vercel project:** `robynawesomes-projects/starfall-salvage`, Hobby plan, auto-deploy on push to main.
- **DNS:** `CNAME starfallsalvage  3600  IN  CNAME  4af9f515c8f66fb7.vercel-dns-017.com.`
- **OG/Twitter Card meta tags** resolving against absolute URLs — WhatsApp link previews work.
- **PWA installable** via `manifest.webmanifest` (Android Add-to-Home-Screen).

## Not Yet Proven

- Kasi-Comm chat backend is **not deployed** on production — frontend gracefully shows "Lobby offline." Phase C of 2026-05-06 session adds mailto-based idea capture with bounty incentive.
- SQLite leaderboard backend not deployed on production — frontend gracefully degrades to local browser scores.
- Production backend hosting (the Python `starfall_server.py`) is not configured. Current backend is local-demo only.
- Full WebGL context rebuild after GPU context loss is not implemented; current behavior reloads on context restore.
- Kasi-Comm has no WebSocket/realtime layer; polling cadence is 3s and may show send-receive lag during heavy traffic.
- Bounty payout rails (Yoco/PayFast/EFT) are documented in CONTRIBUTING.md but not yet wired to a payout automation.
- Kopano-Labs org has "Payment unsuccessful" banners on GitHub + IONOS billing — non-blocking for the deploy, but card on file needs clearing for future renewals.

## Verification

- `npm run gate` (`node --check` + `kc_starfall_watch.py --once --skip-backend`) passes on dev lane.
- `node --check src\game.js` passed.
- `python -m py_compile backend\starfall_server.py tools\kc_starfall_watch.py` passed.
- Backend `/api/health`, `/api/signin`, `/api/score`, and `/api/leaderboard` passed locally against SQLite.
- Headless Edge smoke passed: sign-in, start, dash, pause, FPS, HUD, and screenshot.
- Headless Edge login smoke passed: pressing Enter in the login modal signs in without launching the game.
- KC hard-QA watcher passed and seeded `kc-3`, then final rerun seeded `kc-4`.
- GitHub push complete: profile/backend/KC lane, HUD logo fix, and KC verification log are pushed to `origin/main`.
