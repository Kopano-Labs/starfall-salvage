# MAO — Starfall Salvage flight lane (in-repo)

This file is the **local execution pack** for the three MAO lenses applied to **this repository only**. Canonical vault registers live in Obsidian; here we bind **mode → artefact → evidence** so PRs and `npm run gate` stay the source of truth.

| Mode | Question it answers | Primary artefacts (this repo) | Evidence type |
|------|---------------------|------------------------------|----------------|
| **Architect** | Is the structure correct, testable, and shippable? | `src/game.js`, `index.html`, `styles.css`, `tools/kc_starfall_watch.py`, `docs/MAINTAINER-MAP.md` | `npm run gate`, `node --check src/game.js`, KC JSON summary |
| **Business** | What outcome and risk are we trading? | `docs/microsoft-readiness.md`, `DEPLOYMENT.md`, Store checklist rows | PASS/FAIL tables, Partner Center screenshots (external) |
| **Forensic Sociology** | What does the operator feel, and where does friction hide? | Playing HUD, sovereign pause, flight menu, onboarding | Device capture (C10), manual tap-through notes |

## Lane register — multitask + weapons (static)

| Check ID | Assertion | PASS criterion |
|----------|-----------|----------------|
| SF-MT-01 | Flight menu exists in minimal HUD | `index.html` contains `flightMenuToggle`, `flightMenuPanel`, `flightResumeItem`, `flightStepOutItem` |
| SF-MT-02 | Paused multitask: HUD + sovereign coherent | `syncSovereignPresentation`: `paused && !blockMenu` keeps scrim without `backdrop-only` and `playHud.hidden = false` |
| SF-WP-01 | Three weapon modes + persistence | `STARFLIGHT_WEAPON_STORAGE_KEY`, `setWeaponMode`, `spawnPlayerBullet` branches `bolt` / `scatter` / `pierce` |
| SF-GATE-01 | Stress gate | `mobile_stress_static` ≥ 80% and full `kopano_upgrade_audit` via `npm run gate` |

## Anti-patterns (lane hygiene)

| Anti-pattern | Why it fails MAO | Remedy |
|--------------|------------------|--------|
| “Effectively done” without gate output | Business lens: no auditable proof | Attach `npm run gate` exit 0 + timestamp |
| Checkmark drift (UI says shipped, table says FAIL) | Architect + Sociology: dual truth | Align `microsoft-readiness.md` with measured state |
| Hero metrics (“100% GPU stress”) from static checks only | Architect: category error | Separate **C10b** (static) from **C10** (device p99) |

## Evolution hook (next increments)

| # | Lens | Status | Next action |
|---|------|--------|-------------|
| 1 | Architect | **Done (optional)** | `npm run mobile:stress:pw` — 3 viewports; install `playwright` locally; not in `gate` |
| 2 | Business | **P4 done** | `docs/MAINTAINER-MAP.md` — **P5 open** until Partner Center + listing assets attached |
| 3 | Forensic Sociology | **Open** | C10: named device p99 capture; multitask path ☰ → step out → resume on that device |

## MAO routing at the gate

```
Change → Architect: npm run gate
       → Business: update microsoft-readiness.md row only with evidence
       → Forensic Sociology: device note or FAIL until capture exists
```
