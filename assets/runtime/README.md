# Starfall Runtime Assets

This folder is for game-ready data loaded by Starfall Salvage.

Current runtime mesh contract:

- JSON object
- `vertexStride: 8`
- `vertices`: flat array of `[px, py, pz, nx, ny, nz, u, v]`
- `indices`: `Uint16`-safe triangle indices
- one mesh per file

Generate these files from OBJ with:

```powershell
python tools/obj_to_starfall_mesh.py assets/source/starfall_boss_drone_blockout.obj assets/runtime/starfall_boss_drone_blockout.mesh.json
```
