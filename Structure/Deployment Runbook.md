# Deployment Runbook

## Target

`https://starfallsavage.kopanolabs.com`

## Current Truth

IONOS shows the subdomain exists, but the game is not yet proven live at that URL.

## Static-Only Deployment

Static hosting can run the game and offline pilot profiles because the frontend falls back to `localStorage`.

Static deploy must include:

- `index.html`
- `styles.css`
- `src/game.js`
- `assets/kopano-labs-logo.png`
- `PROJECT_DOCUMENTATION.md`

Static deploy will not provide shared leaderboard sync unless an API host is added.

## Local Backend Demo

Run:

```powershell
python backend\starfall_server.py --port 8765
```

Open:

```text
http://127.0.0.1:8765/
```

Health check:

```text
http://127.0.0.1:8765/api/health
```

Local data is stored in:

```text
C:\Users\rkhol\Starfall Salvage\.data\starfall.db
```

This is suitable for coursework and local demo proof. Public hosting should use a hosted database/API if the leaderboard must be shared across users.

## DNS Notes

Point `starfallsavage.kopanolabs.com` to the selected host only after the host is ready. Do not mark the public launch complete until HTTPS loads the actual game and the canvas renders.
