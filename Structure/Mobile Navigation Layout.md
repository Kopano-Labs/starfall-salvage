---
title: Starfall Salvage — Mobile Navigation Layout
created: 2026-05-11
updated: 2026-05-11
author: KC / Cassy (Sonnet 4.6 Max)
tags:
  - mobile
  - ionic-react
  - navigation
  - architecture
  - kopano-labs
status: draft
build_target: Next.js 15 Turborepo + Ionic React
commandment_anchors:
  - 9  # Offline-First Mandate
  - 4  # Servant-Stewardship
  - 10 # Protocol 13 Save Kill
pillar_anchors:
  - 2  # Community (township mobile-first)
  - 5  # Expansion
---

# Starfall Salvage — Mobile Navigation Layout

> Architecture layer: Ionic React inside Next.js 15 Turborepo monorepo.
> This layout governs the mobile app shell. Desktop = unchanged raw WebGL single page.
> Protocol 13: `MOBILE_LOCKDOWN === true` until the 80% Optimal Threshold gate is cleared.

---

## App Shell

```
IonApp  (root)
└── AppShell
    ├── LockdownGuard          ← checks MOBILE_LOCKDOWN at mount
    │   └── [if true] → MobileLockdownOverlay (full-screen, dismissible)
    └── IonTabs                ← 4-tab layout (hidden under lockdown)
        ├── Tab: game    → GameTab
        ├── Tab: comms   → CommsTab
        ├── Tab: pilot   → PilotTab
        └── Tab: ops     → OpsTab
```

---

## Tab Map

### Tab 1 — Game (`/game`)

Primary surface. Contains the raw WebGL canvas.

```
GameTab
├── SplashPage            (state.mode === 'ready')
│   ├── Logo (Kopano Labs)
│   ├── PLAY button
│   └── HighScore display (from kopano_vault scores.topN(1))
└── GamePage              (state.mode === 'playing' | 'gameover')
    ├── WebGLCanvas       (full-screen, touch-action: none)
    ├── HUD overlay       (score, hull, fps — position: absolute)
    ├── MobileFireButton  (#mobileFireButton — bottom-right, touch-action: manipulation)
    ├── TouchJoystickHint (bottom-left ghost circle, fades after 3s)
    └── GameOverCard      (appears when state.mode === 'gameover')
        ├── Score + cores + time
        ├── CallsignInput  (if pilot not signed in)
        ├── Submit Score   (writes to kopano_vault scores store)
        └── Play Again | View Leaderboard buttons
```

**Router guards:**
- On tab mount: check `MOBILE_LOCKDOWN` — if true, show `MobileLockdownOverlay` instead of canvas.
- On `GameOverCard` submit: write score to `kopano_vault` first (offline CRUD), then enqueue to `sync_queue` only if `!MOBILE_LOCKDOWN`.

---

### Tab 2 — Comms (`/comms`)

Kasi-Comm chat lobby. Offline-first: reads from `kopano_vault` chat_messages.

```
CommsTab
└── KasiCommPage
    ├── LockdownBanner    (if MOBILE_LOCKDOWN — "Backend offline. Logging locally.")
    ├── MessageList       (reads vault.chat.recent(50), polls every 15s when online)
    │   └── MessageBubble[] (callsign + message + ts)
    ├── OfflineBanner     (if navigator.onLine === false — "Offline. Message queued.")
    └── ComposerRow
        ├── TextInput     (message)
        └── SendButton    → vault.chat.add() → vault.syncQueue.enqueue() if !MOBILE_LOCKDOWN
```

**Offline behaviour:**
- Messages written to `chat_messages` store immediately.
- Synced flag starts `false`. Displayed with "queued" indicator.
- Service worker (future Lesson N) drains `sync_queue` when connectivity returns.
- Pillar 2 (Community) anchor: township connectivity is intermittent; data is never lost.

---

### Tab 3 — Pilot (`/pilot`)

Pilot profile and stats. Reads from `kopano_vault` pilot_profiles + scores.

```
PilotTab
└── PilotProfilePage
    ├── [if no profile] → OnboardingCallsignForm
    │   └── Callsign input → vault.pilots.upsert() on submit
    └── [if profile exists]
        ├── PilotCard
        │   ├── Callsign (bold, Savanna Gold #F5A623)
        │   ├── Rank badge (calculated from bestScore)
        │   └── Mode chip (desktop | mobile)
        ├── StatRow
        │   ├── Best Score
        │   ├── Total Cores
        │   └── Sessions Played
        ├── RecentScoresList  (vault.scores.forPilot(id).slice(-5))
        └── SyncStatusRow
            ├── LastSync timestamp (or "Never synced")
            └── Sync Now button → drains sync_queue if !MOBILE_LOCKDOWN
```

---

### Tab 4 — OPS (`/ops`)

Flight ops monitor. Mirrors the desktop `#opsConsole` dialog.

```
OpsTab
└── OpsConsolePage
    ├── EventLogList      (vault.events.unsynced() latest 50 — live scroll)
    │   └── EventRow[] (type chip + ts + score/wave + flushed indicator)
    ├── DiagnosticsCard
    │   ├── Frames analyzed, Max Δt, Avg Δt
    │   └── Export Button → triggers exportDiagnostics() → share sheet
    └── EcosystemLinks
        ├── Five's Arena link
        ├── Kopano-Labs GitHub link
        └── Production URL link
```

---

## Modal Stack (presented over tabs)

Modals are not tabs — they layer above the tab shell:

| Modal | Trigger | Route |
|-------|---------|-------|
| `OnboardingModal` | First run — `ONBOARDING_STORAGE_KEY` not set | Presented at app boot |
| `GameOverModal` | `state.mode === 'gameover'` | Presented in GameTab |
| `LeaderboardModal` | "View Leaderboard" button in GameOverModal or SplashPage | Overlay |
| `EcosystemPanel` | Ecosystem button in GameTab HUD | Overlay |

---

## MOBILE_LOCKDOWN Guard — Component Contract

```typescript
// LockdownGuard.tsx
import { MOBILE_LOCKDOWN } from '@/src/game.js'; // or env const

export function LockdownGuard({ children }: { children: React.ReactNode }) {
  if (MOBILE_LOCKDOWN) {
    return <MobileLockdownOverlay />;
  }
  return <>{children}</>;
}

// MobileLockdownOverlay.tsx
// Full screen, Karoo Night bg (#0D1117), centered card:
// - Kopano Labs logo
// - "Mobile rebuild in progress"
// - "Desktop experience: starfallsalvage.kopanolabs.com"
// - Dismiss button (does NOT disable lockdown — Protocol 13)
```

---

## Kopano Labs Palette (mobile tokens)

| Token | Value | Use |
|-------|-------|-----|
| `--ion-background-color` | `#0D1117` | Karoo Night — app background |
| `--ion-color-primary` | `#F5A623` | Savanna Gold — buttons, active tabs |
| `--ion-color-success` | `#00E676` | Terminal Mint — health/online indicators |
| `--ion-text-color` | `#E2E8F0` | Chalk Dust — body text |
| `--ion-toolbar-background` | `#0D1117` | Tab bar + toolbar |
| `--ion-tab-bar-background` | `#0D1117` | Tab bar |
| `--ion-tab-bar-color` | `#8891A4` | Inactive tab icon |
| `--ion-tab-bar-color-selected` | `#F5A623` | Active tab icon |

---

## Tab Icon Map (Ionicons)

| Tab | Icon | Label |
|-----|------|-------|
| game | `game-controller-outline` / `game-controller` | PLAY |
| comms | `chatbubbles-outline` / `chatbubbles` | COMMS |
| pilot | `person-circle-outline` / `person-circle` | PILOT |
| ops | `radio-outline` / `radio` | OPS |

---

## Implementation Sequence

1. **`kopano-vault.js`** — DONE (offline data layer, 5 stores)
2. **`LockdownGuard.tsx`** + **`MobileLockdownOverlay.tsx`** — NEXT
3. **`AppShell.tsx`** (IonTabs wrapper with palette CSS vars)
4. **`GameTab.tsx`** → WebGL canvas + HUD + MobileFireButton
5. **`CommsTab.tsx`** → KasiCommPage offline-first
6. **`PilotTab.tsx`** → PilotProfilePage + stats
7. **`OpsTab.tsx`** → EventLogList + DiagnosticsCard
8. **Modals** — OnboardingModal, GameOverModal, LeaderboardModal

> Gate: No mobile tab implementation without Protocol 13 gate cleared.
> MOBILE_LOCKDOWN === true until Master physically confirms ≥80% mobile perf on device.

---

## 5 Pillars Alignment

| Pillar | How this layout serves it |
|--------|--------------------------|
| Alignment | LockdownGuard enforces Protocol 13; no premature mobile shipping |
| Community | 4-tab offline-first layout survives intermittent Cape Town connectivity |
| Apprenticeship | Tab → page → modal hierarchy teaches Ionic React patterns to KC |
| Service | CommsTab gives township players an async chat lane that doesn't drop messages |
| Expansion | Full mobile path enables KasiLink integration and Dec 2026 family-pillar goal |
