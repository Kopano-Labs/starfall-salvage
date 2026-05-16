# Microsoft Store / mobile — binary acceptance

**Product:** Starfall Salvage  
**Format:** PASS or FAIL per row only.

## 5 pillars

| ID | Test | Result |
|----|------|--------|
| P1 | Core loop runs with network disabled (static bundle + local open). | PASS |
| P2 | Junction turn: touch horizontal swipe at `pendingCorner` and `[` / `]` invoke the same `queueTurn(±1)` path. | PASS |
| P3 | `node --check src/game.js` exit 0 **and** `npm run gate` exit 0 **and** build id traceable (`GAME_BUILD` / package version). | PASS |
| P4 | In-repo maintainer map (entrypoints, gate command, run instructions) ≤1 page. | FAIL |
| P5 | Store ops: ship channel chosen (MSIX/PWA/hosted) **and** Partner Center seller/payout **and** listing assets (privacy URL, support, screenshots) **and** documented auth deep-link (no secrets in static files). | FAIL |

**Pillar rollup:** P1∧P2∧P3∧P4∧P5 → **FAIL** (P4–P5 open).

## 15 commandments

| ID | Test | Result |
|----|------|--------|
| C01 | Revive timer decrements by wall-clock `dt` only. | PASS |
| C02 | Revive: exactly `REVIVE_TAPS_NEEDED` pointerdowns on modal; skip excluded. | PASS |
| C03 | Turn animation wall time matches `TURN_DURATION_SEC` within one frame at 60 Hz. | PASS |
| C04 | View matrix applies `cameraYaw` every `renderScene` while the canvas draws gameplay. | PASS |
| C05 | `resetLaneTurnState()` on `resetGame` and on ENGAGE (`startGame` countdown complete). | PASS |
| C06 | `#glCanvas` has `touch-action: none`. | PASS |
| C07 | HUD/chrome uses `env(safe-area-inset-*)` for notch / home bar. | PASS |
| C08 | Playing hot loop: no mandatory network I/O. | PASS |
| C09 | Hot path audit: no `new` / no unbounded `push` per frame in steady `updateGame` + `renderScene`. | FAIL |
| C10 | p99 frame ≤ 32 ms on a named low-tier reference device (attach capture + device id). | FAIL |
| C10b | **Static mobile stress** ≥ 80% on `mobile_stress_static` (KC gate) — layout, touch, PWA, resize paths. | PASS |
| C11 | Microsoft Store commerce / IAP integrated and policy-reviewed. | FAIL |
| C12 | Optional analytics: consent + categories + privacy URL before any send. | FAIL |
| C13 | IARC (or equivalent) filed; descriptors match shipped build. | FAIL |
| C14 | Release binary: production cert + timestamp (no test cert). | FAIL |
| C15 | Store accessibility fields backed by in-repo keyboard map + contrast evidence. | FAIL |

**Commandment rollup:** **8 / 15** PASS. Target **15 / 15** before submission.

## Audit

| UTC | Note |
|-----|------|
| 2026-05-16 | Binary-only tables; P4–P5 and C09–C15 FAIL until closed with evidence or code. |
