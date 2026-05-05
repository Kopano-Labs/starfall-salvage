# Starfall Salvage - Index

## Purpose

Starfall Salvage is a raw-WebGL arcade runner built for the OpenGL/WebGL assignment and Kopano Labs portfolio track.

## Active Paths

- Project root: `C:\Users\rkhol\Starfall Salvage`
- GitHub repo: `https://github.com/Kopano-Labs/starfall-salvage`
- Local game URL: `http://127.0.0.1:8765/`
- Target public subdomain: `https://starfallsavage.kopanolabs.com`
- Main Brain root: `C:\Users\rkhol\OneDrive\Documents\Anthropic\Introduction to MCP\Schematics`
- KC implementation: `C:\Users\rkhol\OneDrive\Documents\Anthropic\Introduction to MCP\Schematics\06-Reference\kopano-code-implementation`

## Current Truth

- The game exists locally and is pushed to the private Kopano Labs GitHub repo.
- The IONOS subdomain exists but is not proven live as a hosted game yet.
- KC is wired as a strict local QA/dev lane through documentation, context-store entries, and `tools/kc_starfall_watch.py`.
- KC is not yet a separate autonomous AI runtime unless a real endpoint/process is connected later.

## Core Files

- `index.html` - canvas, HUD, account modal, Kopano Labs branding.
- `styles.css` - game layout, HUD, account modal styling.
- `src/game.js` - raw WebGL renderer, game loop, controls, profile flow, score submission.
- `backend/starfall_server.py` - local demo backend and static server.
- `PROJECT_DOCUMENTATION.md` - assignment documentation and math map.
- `DEPLOYMENT.md` - hosting and subdomain runbook.
- `tools/kc_starfall_watch.py` - KC hard-QA monitor.

