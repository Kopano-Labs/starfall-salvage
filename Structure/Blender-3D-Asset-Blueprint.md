# Blender → Starfall Salvage 3D asset blueprint

This doc is the **authoritative checklist** for making new meshes in Blender and getting them into `src/game.js`, which uses **raw WebGL 1.0** and **no glTF loader** today. Follow the vertex layout exactly or normals and UVs will be wrong in-game.

---

## 1. What the engine expects (read first)

In `game.js`, `createMesh(vertices, indices)` assumes **one interleaved vertex**:

| Offset | Field   | Type   | Notes |
|--------|---------|--------|--------|
| 0      | position | 3× float | Model space; ship/player scale is tuned in code |
| 3      | normal   | 3× float | Unit length preferred; used for lighting |
| 6      | texCoord | 2× float | `u, v` — textures use `UNPACK_FLIP_Y_WEBGL` |

So **8 floats per vertex**, stride `32` bytes (`8 * Float32Array.BYTES_PER_ELEMENT`).

Indices are **`Uint16`** (`gl.UNSIGNED_SHORT`). Stay **under 65 536 vertices** per mesh, or extend the loader to `Uint32`.

Draw mode: **indexed triangles** only (`gl.TRIANGLES`).

---

## 2. Blender scene setup

1. **Units**
   - Use **Metric**, scale **1 unit = 1 metre** in Blender, then **scale the model down** in Blender so the longest axis of the playable ship/debris is roughly **1–2 Blender units** before export. The current `ship` mesh fits roughly inside a ~1.5 unit box; match that order of magnitude so `drawMesh` scale factors in code stay sane.

2. **Orientation (critical)**
   - Blender: **+Z forward**, **+Y up**.
   - Your game: **+Y up**, **−Z “into screen” / forward** for the tunnel (see `player` and object positions in `game.js`).
   - **Rule:** In Blender, treat **−Y as game forward** or rotate the mesh **−90° on X** so that after export, “nose” points down **−Z** in your vertex data. **Always verify** the first export in-game before polishing textures.

3. **Origin**
   - Put the **geometry origin at the logical pivot** (e.g. centre of mass for the ship, centre of debris). The renderer does not subtract a pivot bone.

4. **Modifiers before export**
   - Apply **Mirror**, **Subdivision**, etc.
   - **Triangulate** faces: `Mesh` → `Faces` → **Triangulate** (or Triangulate modifier, Apply). The WebGL path assumes **triangles only**.

5. **Shading**
   - **Smooth** or **flat** in Blender only affects exported normals if you export **vertex normals**. Prefer **Auto Smooth** / split normals only where you need hard edges.

---

## 3. UVs and materials

- The fragment shader uses **one 2D UV** + optional texture + `uTextureMix` + vertex colour tint.
- Unwrap in Blender (**Smart UV Project** is fine for stylised assets). Keep islands in **0–1** unless you intentionally tile (cube/tunnel use repeat).
- **One material slot** per draw call today: multiple materials require either a **texture atlas** or multiple meshes in code.

---

## 4. Export formats (pick one path)

### Path A — **glTF 2.0 binary (.glb)** (recommended)

1. `File` → `Export` → **glTF 2.0 (.glb)**.
2. Options (Blender 4.x style):
   - **Format:** GLB
   - Include **Normals**, **UVs**
   - **Apply Modifiers**
   - **+Y Up** is fine; fix rotation once in a conversion script or re-export with rotation baked.

Then convert **GLB → interleaved `Float32Array` + `Uint16Array`** using a small script (suggested stack: `three` + `GLTFLoader` in Node, or `@gltf-transform/core`). Output can be:

- a **JSON** file of number arrays checked into `src/meshes/`, or
- a **`.bin`** you fetch at runtime (later; today everything is inline in `game.js`).

Until a loader exists, **paste** the generated `vertices` and `indices` arrays into `game.js` or load JSON with `fetch` and `new Float32Array(json.vertices)`.

### Path B — **Wavefront .obj** (quick & manual)

1. Export **OBJ**, **Triangulate**, **UVs**, **Normals**.
2. Parse `v`, `vn`, `vt`, `f` in a throwaway Node/Python script to emit:
   - per-corner **position**, **normal**, **uv** (interpolate per triangle if OBJ gives face-varying data).
3. Emit **CCW** winding when viewed from **outside** the mesh so lighting matches `normalFor()` / cube conventions.

OBJ is error-prone for complex rigs; prefer **GLB** for anything beyond a few dozen triangles.

---

## 5. Integration into `game.js`

1. Add a builder alongside `createShipMesh` / `createOctahedronMesh`:

   ```javascript
   function createBossMesh() {
     // vertices: flat array [px,py,pz, nx,ny,nz, u,v, ...]
     // indices: triangle list
     return createMesh(vertices, indices);
   }
   ```

2. Register in `meshes`:

   ```javascript
   const meshes = { cube: ..., crystal: ..., ship: ..., boss: createBossMesh() };
   ```

3. Use **`drawMesh(meshes.boss, { position, rotation, scale, color, texture, textureMix, pulse, uvScale })`** — same contract as existing props.

4. **Performance:** keep **draw calls low**; merge static geometry into one mesh where possible. Mobile GPUs in the target lane are weak.

---

## 6. QA checklist before merge

- [ ] Triangle count and overdraw acceptable on **mid Android** (test `?diag=1` if enabled).
- [ ] No NaNs in normals (check script).
- [ ] Indices fit in **uint16**.
- [ ] Facing and **UV direction** look correct with `colorTexture` / `crystalTexture`.
- [ ] Collision `radius` in spawn logic still matches visual scale (update `radius` / `size` when changing mesh bounds).

---

## 7. Official Blender references (external)

Use these as the **canonical** Blender UI and export behaviour (bookmarks for the team):

- [Blender Manual — Modeling](https://docs.blender.org/manual/en/latest/modeling/index.html)
- [Blender Manual — UVs](https://docs.blender.org/manual/en/latest/modeling/meshes/uv/index.html)
- [Blender Manual — Export glTF](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)

---

## 8. Ops / telemetry (cannot live in Blender)

Cross-device **“who logged in”** and durable telemetry require **server-side** storage and auth, as in `Structure/Blockers.md`. Blender only produces assets; it does not replace `POST /api/pilot-event` or similar.

---

## 9. Implemented conversion step (code)

The first practical bridge is now `tools/obj_to_starfall_mesh.py`.

```powershell
python tools/obj_to_starfall_mesh.py assets/source/starfall_boss_drone_blockout.obj assets/runtime/starfall_boss_drone_blockout.mesh.json
```

The teacher reference output is:

- source: `assets/source/starfall_boss_drone_blockout.obj`
- runtime: `assets/runtime/starfall_boss_drone_blockout.mesh.json`
- vertex count: `37`
- triangle count: `16`
- bounds: `[-1.18, -0.36, -1.18]` to `[1.18, 0.36, 0.52]`

Next candidate after the student exports a real Blender OBJ: either paste the generated arrays into `game.js` as `createBossMesh()` or add a tiny runtime JSON fetch path.

Until a runtime loader exists, **OBJ → mesh JSON → manual paste** is the fastest loop from Blender to ship.
