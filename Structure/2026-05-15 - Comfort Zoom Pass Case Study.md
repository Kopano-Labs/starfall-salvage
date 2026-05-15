# 2026-05-15 - Comfort Zoom Pass Case Study

## Trigger

Field feedback from WhatsApp review said: "Zoom out" and "The first one was fine the problem is it's too much." This was treated as a mobile comfort failure, not a request to fork gameplay per device.

## Decision

Keep the unified Starfall ecosystem from the previous branch, but reduce presentation pressure:

- One gameplay model remains active across PC, Android, Xiaomi, and Apple browsers.
- Mobile tall view gets a wider WebGL FOV.
- Touch camera follow is softened so the scene moves less aggressively under the pilot.
- First mobile ready screen suppresses non-essential leaderboard and ecosystem panels.
- Game-over can still show leaderboard/share because the shell now marks `is-gameover`.
- Speed color still changes, but glow and saturation are reduced.
- FIRE stays visible and touch-safe, but its pulse is slower and smaller.

## Changes

| Area | Change |
|---|---|
| `src/game.js` | Added `is-gameover` shell class for ready-vs-gameover CSS control. |
| `src/game.js` | Reduced speed color hue/saturation/lightness swing. |
| `src/game.js` | Changed touch camera follow from `1` to `0.72`. |
| `src/game.js` | Changed tall-touch FOV multiplier from `1.14` to `1.22`. |
| `styles.css` | Softened background speed gradients, panel glow, and FIRE button glow. |
| `styles.css` | Suppressed mobile ready-state leaderboard/ecosystem panels unless game over. |
| `styles.css` | Reduced mobile FIRE size from `72px` to `68px` while preserving 44px+ touch target. |
| `styles.css` | Slowed FIRE pulse from `1450ms` to `1900ms` and lowered pulse scale/saturation. |

## Proof

| Check | Result |
|---|---|
| JS syntax | `node --check .\src\game.js` PASS |
| Vault boot | `npm run vault:check` PASS |
| Whitespace | `git diff --check` PASS |
| Comfort layout proof | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\report.json`, failures `[]` |
| Comfort speed proof | `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-speed-r1\report.json`, failures `[]` |

## Screenshot Artifacts

- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\redmi-393x873-ready.png`
- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\redmi-393x873-playing.png`
- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\narrow-360x800-ready.png`
- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\narrow-360x800-playing.png`
- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\desktop-1280x720-ready.png`
- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-r1\desktop-1280x720-playing.png`
- `C:\Users\rkhol\AppData\Local\Temp\starfall-audit-20260515-comfort-speed-r1\desktop-speed.png`

## Cassy Lesson

When trusted field feedback says "too much," do not add another system. Remove pressure from the presentation layer first. The invariant is still one simulation; the correction is disclosure, FOV, motion, and color restraint.
