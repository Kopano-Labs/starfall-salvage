# Starfall Salvage - WebGL Edition

Starfall Salvage is a fresh raw-WebGL browser game inspired by the supplied Pong project structure. It keeps the same assignment-friendly approach of plain HTML, CSS, JavaScript, shaders, buffers, event listening, and a real-time animation loop, but changes the gameplay into a 3D salvage runner.

## Run

Open `index.html` in a WebGL-capable browser, or serve the folder locally:

```powershell
python -m http.server 8765
```

Then browse to `http://localhost:8765`.

No compilation is required because this project uses browser-native WebGL and JavaScript.

## Controls

- `WASD` or arrow keys: move the salvage drone
- `Space`: phase dash through one dangerous object
- `P`: pause or resume
- `R`: restart
- Buttons on screen: start, pause, reset

## Files

- `index.html`: game canvas and HUD markup
- `styles.css`: responsive full-screen game layout
- `src/game.js`: raw WebGL renderer, matrix transforms, game loop, collision, input, procedural textures
- `PROJECT_DOCUMENTATION.md`: assignment-style documentation
