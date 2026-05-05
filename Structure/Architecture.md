# Architecture

## Frontend

The game is dependency-free HTML, CSS, and JavaScript.

- `index.html` owns DOM structure, HUD, controls, and account modal.
- `styles.css` owns responsive layout and modal presentation.
- `src/game.js` owns WebGL setup, shader compilation, mesh buffers, matrix math, game state, input, profile storage, and score submission.

## WebGL Pipeline

- Vertex shader transforms model-space vertices through model, view, and projection matrices.
- Fragment shader samples procedural textures and applies directional diffuse lighting.
- Opaque pass renders stars, tunnel, player ship, debris, and cores.
- Glow pass enables additive blending for core glow, trail particles, and sparks.

## Backend

`backend/starfall_server.py` is a local Python stdlib server.

- Serves the static game from the project root.
- `POST /api/signin` creates or updates a demo pilot profile.
- `POST /api/score` stores a local leaderboard entry.
- `GET /api/leaderboard` returns top scores.
- `GET /api/health` proves the backend is running.
- Data writes to `.data/starfall-state.json`, which is intentionally ignored by git.

## KC Lane

`tools/kc_starfall_watch.py` is the runnable KC hard-QA bridge.

- Checks required files, git state, JavaScript syntax, Python backend syntax, and backend health.
- Appends JSONL reports to `Structure/KC Review Log.jsonl`.
- Can seed a reviewed KC context into the existing KC store with `--seed-kc`.

