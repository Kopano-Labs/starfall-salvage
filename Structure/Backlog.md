# Backlog

## Must Do Before Public Launch

- Bind `starfallsavage.kopanolabs.com` to the selected host and verify HTTPS.
- Decide hosting target: static-only Vercel/GitHub Pages, or a host that can run the Python backend.
- Add production smoke proof for the public URL.
- Replace the current procedural ship with a richer Blender-exported mesh or a more detailed raw mesh.

## Game Upgrades

- Import `.obj` ship path after Blender model is ready.
- Add cockpit glow and engine glow tied to dash state.
- Add leaderboard UI if the backend is part of the demo.
- Add settings panel for graphics quality and reduced motion.

## Engineering Hardening

- Add automated browser smoke test.
- Add stronger WebGL context restore path that rebuilds buffers without page reload.
- Add clean deployment config after hosting target is selected.
- Add asset-size budget and cache policy.

