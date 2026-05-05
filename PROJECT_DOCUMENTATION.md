# Starfall Salvage: WebGL Edition - Project Documentation

## Game Name

Starfall Salvage: WebGL Edition

## Introduction

Starfall Salvage is a 3D arcade runner built with raw WebGL. The player pilots a small salvage drone through a moving space lane, collecting blue energy cores while avoiding red debris. The project demonstrates the browser version of OpenGL ES concepts without using Three.js or another rendering engine.

The upgraded version also includes diffuse fragment lighting, additive particle blending, a live FPS counter, matrix-based camera shake, and dynamic field-of-view changes during dash.

The current build also includes Kopano Labs branding and a demo-safe pilot profile flow. The game works offline with browser storage and can sync pilot scores to the optional local Python/SQLite backend.

## Aim of the Game

The aim is to survive as long as possible, collect energy cores, and build the highest score before the drone hull reaches zero.

## Game Rules

- The player controls the salvage drone near the front of the space lane.
- Blue energy cores increase the score.
- Every seven collected cores restores one hull point, up to a maximum of five.
- Red debris damages the hull on contact.
- A phase dash lets the drone pass through debris for a short time and awards bonus score.
- Dash creates a short field-of-view boost and additive thruster trail.
- Collision creates sparks, a red screen border, and view-matrix camera shake.
- The game ends when hull reaches zero.

## Controls

- `W`, `A`, `S`, `D` or arrow keys move the drone.
- `Space` activates phase dash.
- `P` pauses or resumes the game.
- `R` restarts the game.
- The Sign in, Start, Pause, and Reset buttons can also control the game.
- The HUD displays score, hull, cores, dash cooldown, speed, and FPS.

## How to Run or Compile

No compiled binary is necessary because the game is written in HTML, CSS, JavaScript, and WebGL.

To run directly:

1. Open `index.html` in Google Chrome, Microsoft Edge, or another WebGL-capable browser.

To run from a local server:

```powershell
python -m http.server 8765
```

Then open `http://localhost:8765`.

To run with the local profile and score backend:

```powershell
python backend\starfall_server.py --port 8765
```

Then open `http://127.0.0.1:8765`.

The Python backend is optional for demonstration. If it is running, pilot profiles and scores persist in `.data/starfall.db` through SQLite. If it is not running, the game falls back to browser `localStorage` for pilot profiles and local scores.

## Design Overview

The game separates browser UI from WebGL rendering. HTML and CSS handle the score, hull, core counter, buttons, and mission status. The WebGL canvas handles the playfield, ship, debris, crystals, tunnel segments, stars, and particles.

The main JavaScript file contains:

- Shader setup for vertex and fragment processing.
- Mesh creation using vertex buffer objects and element/index buffer objects.
- A small matrix library for perspective projection and model transforms.
- Procedural texture generation using canvas data uploaded to WebGL textures.
- Keyboard and button event listeners.
- A real-time `requestAnimationFrame` game loop.
- Simulation state for player movement, spawning, collision, score, hull, and difficulty.
- A separate additive glow pass for trail particles, sparks, and energy core glow.
- A local-first pilot profile flow that attempts `/api/signin` and `/api/score`, stores data in SQLite through the backend, then falls back to browser storage if the backend is unavailable.

## Key OpenGL/WebGL Concepts Used

- Vertex shader and fragment shader programming.
- Vertex Buffer Objects for mesh vertex data.
- Element Buffer Objects for indexed drawing.
- Matrix transformations for translate, rotate, and scale.
- Perspective projection using a projection matrix.
- Texture creation and sampling in the fragment shader.
- Depth testing and face culling.
- Directional diffuse lighting in the fragment shader.
- Additive alpha blending using `gl.blendFunc(gl.SRC_ALPHA, gl.ONE)`.
- Dynamic field-of-view changes using the projection matrix.
- Deterministic camera shake using the view matrix.
- FPS telemetry for performance monitoring.
- Real-time rendering through `requestAnimationFrame`.
- Event listening for keyboard and button input.
- Local JSON API integration for demo sign-in and score persistence.

## Math Map for Marking

The core OpenGL/WebGL concepts are intentionally easy to locate in `src/game.js`:

- Vertex shader source starts at line 42.
- Fragment shader source starts at line 65.
- Shader compilation is handled by `compileShader` at line 93.
- Shader program linking is handled by `createProgram` at line 105.
- Attribute and uniform locations are collected at line 121.
- Perspective matrix math is implemented in `Mat4.perspective` at line 162.
- Per-object translate, rotate, and scale are combined in `makeModel` at line 270.
- Profile storage keys are declared at lines 143-144.
- Browser visibility pause logic starts at line 531.
- WebGL context-loss handling starts at line 546.
- Canvas viewport resizing is handled by `resizeCanvas` at line 609.
- Pilot sign-in starts in `signInPilot()` at line 815.
- Score submission starts in `submitScore()` at line 874.
- Game-over profile scoring is handled by `handleGameOver()` at line 912.
- Delta-time gameplay simulation starts in `updateGame(dt)` at line 990.
- FPS, camera shake decay, event timers, and FOV easing are updated in `updatePresentation(dt)` at line 1114.
- The active projection matrix is rebuilt with `state.currentFov` at line 1166.
- The view matrix receives deterministic hit shake at lines 1168-1173.
- Additive blending is isolated in `renderGlowPass` at line 1194, with `gl.blendFunc(gl.SRC_ALPHA, gl.ONE)` at line 1196.
- The `requestAnimationFrame` loop and delta-time calculation start at line 1347.

## Source Code Included

The source code is included in:

- `index.html`
- `styles.css`
- `src/game.js`
- `backend/starfall_server.py`
- `assets/kopano-labs-logo.png`
- `tools/kc_starfall_watch.py`

## Conclusion

Starfall Salvage satisfies the OpenGL project requirements by using raw WebGL rendering, shader programs, buffers, indices, textures, transformations, perspective projection, additive blending, diffuse lighting, matrix-based camera effects, FPS telemetry, and interactive gameplay. It is a fresh game concept while following the educational structure of the supplied Pong blueprint.
