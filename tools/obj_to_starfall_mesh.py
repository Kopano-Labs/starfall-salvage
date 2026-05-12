#!/usr/bin/env python3
"""Convert a triangulated OBJ into Starfall Salvage raw WebGL mesh JSON."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


DEFAULT_UVS = [(0.5, 1.0), (0.0, 0.0), (1.0, 0.0)]
VERTEX_STRIDE = 8
UINT16_LIMIT = 65535


def parse_index(value: str, count: int) -> int | None:
    if not value:
        return None
    index = int(value)
    if index < 0:
        index = count + index + 1
    if index <= 0 or index > count:
        raise ValueError(f"OBJ index {value} is out of range for {count} values")
    return index - 1


def normal_for(a: tuple[float, float, float], b: tuple[float, float, float], c: tuple[float, float, float]) -> tuple[float, float, float]:
    ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
    return nx / length, ny / length, nz / length


def parse_obj(path: Path) -> tuple[list[float], list[int], dict[str, object]]:
    positions: list[tuple[float, float, float]] = []
    uvs: list[tuple[float, float]] = []
    normals: list[tuple[float, float, float]] = []
    triangles: list[list[tuple[int, int | None, int | None]]] = []

    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        tag = parts[0]
        values = parts[1:]

        if tag == "v":
            if len(values) < 3:
                raise ValueError(f"{path}:{line_number}: v requires 3 floats")
            positions.append(tuple(float(v) for v in values[:3]))
        elif tag == "vt":
            if len(values) < 2:
                raise ValueError(f"{path}:{line_number}: vt requires 2 floats")
            uvs.append((float(values[0]), float(values[1])))
        elif tag == "vn":
            if len(values) < 3:
                raise ValueError(f"{path}:{line_number}: vn requires 3 floats")
            normals.append(tuple(float(v) for v in values[:3]))
        elif tag == "f":
            if len(values) < 3:
                raise ValueError(f"{path}:{line_number}: f requires at least 3 vertices")
            corners = []
            for value in values:
                fields = value.split("/")
                vi = parse_index(fields[0], len(positions))
                ti = parse_index(fields[1], len(uvs)) if len(fields) > 1 else None
                ni = parse_index(fields[2], len(normals)) if len(fields) > 2 else None
                if vi is None:
                    raise ValueError(f"{path}:{line_number}: face is missing vertex index")
                corners.append((vi, ti, ni))
            for i in range(1, len(corners) - 1):
                triangles.append([corners[0], corners[i], corners[i + 1]])

    vertex_map: dict[tuple[int, int | None, int | None, int, float, float, float], int] = {}
    vertices: list[float] = []
    indices: list[int] = []

    for triangle in triangles:
        face_positions = [positions[corner[0]] for corner in triangle]
        face_normal = normal_for(face_positions[0], face_positions[1], face_positions[2])
        for corner_index, corner in enumerate(triangle):
            vi, ti, ni = corner
            normal = normals[ni] if ni is not None else face_normal
            uv = uvs[ti] if ti is not None else DEFAULT_UVS[corner_index % len(DEFAULT_UVS)]
            key = (vi, ti, ni, corner_index if ni is None or ti is None else -1, *normal)
            if key not in vertex_map:
                vertex_map[key] = len(vertices) // VERTEX_STRIDE
                vertices.extend([*positions[vi], *normal, *uv])
            indices.append(vertex_map[key])

    vertex_count = len(vertices) // VERTEX_STRIDE
    if vertex_count > UINT16_LIMIT:
        raise ValueError(f"{vertex_count} vertices exceeds Starfall's Uint16 index limit")
    if not vertices or not indices:
        raise ValueError("OBJ did not produce any mesh data")

    xs = vertices[0::VERTEX_STRIDE]
    ys = vertices[1::VERTEX_STRIDE]
    zs = vertices[2::VERTEX_STRIDE]
    meta = {
        "source": str(path).replace("\\", "/"),
        "vertexStride": VERTEX_STRIDE,
        "vertexCount": vertex_count,
        "triangleCount": len(indices) // 3,
        "bounds": {
            "min": [min(xs), min(ys), min(zs)],
            "max": [max(xs), max(ys), max(zs)],
        },
    }
    return vertices, indices, meta


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert OBJ to Starfall Salvage mesh JSON")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    vertices, indices, meta = parse_obj(args.input)
    data = {
        "schema": "starfall.mesh.v1",
        **meta,
        "vertices": [round(value, 6) for value in vertices],
        "indices": indices,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: data[k] for k in ["schema", "source", "vertexCount", "triangleCount", "bounds"]}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
