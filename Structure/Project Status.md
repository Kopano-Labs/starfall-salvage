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

## Not Yet Proven

- `https://starfallsavage.kopanolabs.com` is not proven live as a production game URL.
- Production backend hosting is not configured. Current backend is local-demo only.
- Full WebGL context rebuild after GPU context loss is not implemented; current behavior reloads on context restore.

## Verification

- `node --check src\game.js` passed.
- `python -m py_compile backend\starfall_server.py tools\kc_starfall_watch.py` passed.
- Backend `/api/health`, `/api/signin`, `/api/score`, and `/api/leaderboard` passed locally against SQLite.
- Headless Edge smoke passed: sign-in, start, dash, pause, FPS, HUD, and screenshot.
- Headless Edge login smoke passed: pressing Enter in the login modal signs in without launching the game.
- KC hard-QA watcher passed and seeded `kc-3`, then final rerun seeded `kc-4`.
- GitHub push complete: profile/backend/KC lane, HUD logo fix, and KC verification log are pushed to `origin/main`.
