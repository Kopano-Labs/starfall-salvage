# 2026-05-14 - Unified Device Ecosystem Case Study

## Verdict

Starfall Salvage now has one gameplay ecosystem across PC, Android, Xiaomi-class mobile Chrome, and Apple-class browser surfaces. Device-specific differences are limited to CSS density, safe-area behavior, and touch affordances. The gameplay rules stay unified: move, dash, shoot, collect cores, and chain buffs.

## Repo Truth

| Field | Value |
|---|---|
| Remote | `https://github.com/Kopano-Labs/starfall-salvage.git` |
| Base | `origin/main` at `6a27bc1` |
| Working branch | `codex/starfall-mobile-weapon-ecosystem` |
| Local execution clone | `C:\Users\rkhol\OneDrive\Documents\Kopano Labs\starfall-salvage` |
| Registry canonical clone | `C:\Users\rkhol\Starfall Salvage` |
| Path risk | MAIN-BRAIN still points to the older canonical clone; this session executed in the fresh Kopano Labs clone. |

## Changes

- Kept the current `origin/main` unified-flight work: PWA boot, guest CTA, modal history traps, schema-driven spawns, `Buff` HUD stat, revive mini-game, and prism buff system.
- Made the `FIRE` control visible on desktop as well as touch devices.
- Bound the `FIRE` control to active weapon state: `RAPID`, `TRIAD`, `PRISM`, or default `FIRE`.
- Brightened speed-responsive visual chrome without adding a library.
- Preserved the existing motion model where all `ui-chrome` drops out during play while the Kopano Labs brand stays anchored.
- Compact mobile HUD, share row, and docked ecosystem/leaderboard layout for Redmi-class widths.
- Updated public copy to explain one ruleset across PC, Android, Xiaomi, and Apple browsers.

## Gameplay Ecosystem

| Buff | Gameplay effect |
|---|---|
| `overcharge` | Rapid fire through `fireBoostTimer` |
| `triad` | Three-lane spread shot |
| `aegis` | Shield hit absorption |
| `prism` | Piercing shot |
| `powerOrb` | Legacy rapid/overcharge path |

## Proof Matrix

| Check | Command / artifact | Result |
|---|---|---|
| JS syntax | `node --check .\src\game.js` | PASS |
| Vault hook | `npm run vault:check` | PASS |
| Diff whitespace | `git diff --check` | PASS |
| Redmi layout | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-current-main-r5\redmi-393x873-ready.png` | PASS |
| Narrow mobile layout | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-current-main-r5\narrow-360x800-ready.png` | PASS |
| Desktop layout | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-current-main-r5\desktop-1280x720-ready.png` | PASS |
| Playing chrome drop-out | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-current-main-r5\*-playing.png` | PASS |
| Speed color shift | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260514-speed-current-r1\report.json` | PASS: `speedStrength=0.125`, `speedAccent=hsl(170 47% 40%)`, `speedValue=1.4x` |

## Device Policy

The ecosystem problem was not solved by forking rules per device. The fix is:

- One simulation.
- One spawn/buff model.
- One shooting model.
- Responsive CSS for screen density and safe-area.
- Same `FIRE` affordance everywhere, with touch sizing on mobile and visible fallback on desktop.

## Remaining Watch Items

- Physical Redmi 13 recapture on production after Vercel deploy.
- MAIN-BRAIN registry path drift: decide whether `C:\Users\rkhol\Starfall Salvage` or `C:\Users\rkhol\OneDrive\Documents\Kopano Labs\starfall-salvage` is canonical going forward.
- Production backend is still optional for leaderboard; static local server returns 404 for backend endpoints during browser proof, which is expected for this static test.

## Cassy Student Note

KC/Cassy should learn this as a unification rule: device ecosystems should not drift into separate gameplay truths. The correct split is simulation invariants in JavaScript and device comfort in CSS.
