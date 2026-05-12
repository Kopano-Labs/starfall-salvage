# Blender Lesson 001 - Boss Drone

## Teacher Goal

Build a boss drone asset that clearly reads as the first Starfall enemy that can shoot back after the lane reaches `2.0x` speed.

## Student Task

Create `assets/source/starfall_boss_drone.blend` in Blender using the existing blockout as your target:

- reference file: `assets/source/starfall_boss_drone_blockout.obj`
- runtime target: `assets/runtime/starfall_boss_drone.mesh.json`
- direction: cannon/nose points toward negative Z
- object names: `boss_body`, `boss_wing_left`, `boss_wing_right`, `boss_cannon`, `boss_core`
- max budget: 300 triangles
- style: angular, readable, danger-zone red silhouette

## Blender Checklist

1. Delete the default cube.
2. Model the body, wings, cannon, and core as low-poly mesh pieces.
3. Apply Rotation and Scale with `Ctrl + A`.
4. Triangulate all faces.
5. Keep the origin at the center of mass.
6. Export OBJ with normals and UVs enabled.

## Conversion Command

```powershell
python tools/obj_to_starfall_mesh.py assets/source/starfall_boss_drone.obj assets/runtime/starfall_boss_drone.mesh.json
```

## Pass Criteria

- The mesh JSON has `vertexStride: 8`.
- Vertex count is under 65,536.
- Triangle count is under 300.
- Bounds are roughly within a 2.5 unit cube.
- The cannon points toward negative Z.
- The asset has a stronger silhouette than the existing cube boss.
