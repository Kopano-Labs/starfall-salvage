# Starfall Salvage Deployment

## Target Domain

`https://starfallsavage.kopanolabs.com`

## Current Status

The domain exists in IONOS, but a live hosted game has not been verified yet. Treat the public launch as incomplete until HTTPS loads the actual WebGL game.

## Local Demo Server

Use the Python backend when demoing sign-in and score sync. It persists local data in `.data/starfall.db` with SQLite:

```powershell
python backend\starfall_server.py --port 8765
```

Open:

```text
http://127.0.0.1:8765/
```

Health endpoint:

```text
http://127.0.0.1:8765/api/health
```

## Static Hosting

The game can be hosted as a static site. Pilot profiles and scores still work locally through browser `localStorage`, but shared leaderboard sync will not exist unless the Python API or another hosted database-backed API is deployed separately.

Files that must deploy:

- `index.html`
- `styles.css`
- `src/game.js`
- `assets/kopano-labs-logo.png`
- `PROJECT_DOCUMENTATION.md`

## Production Checklist

- Select a host for the static game.
- Decide whether the Python SQLite backend is local-demo only or whether production should use a hosted database such as Supabase/Postgres.
- Point `starfallsavage.kopanolabs.com` at the selected host.
- Verify HTTPS, WebGL canvas rendering, Kopano Labs logo, sign-in fallback, dash controls, FPS HUD, and no console errors.
- Run `python tools\kc_starfall_watch.py --once --seed-kc` after deployment evidence is captured.
