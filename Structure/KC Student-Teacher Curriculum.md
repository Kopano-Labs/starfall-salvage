---
title: KC Student-Teacher Curriculum
type: curriculum
project: Starfall Salvage
sub-brain: C:\Users\rkhol\Starfall Salvage
main-brain-link: "[[Schematics/06-Reference/kopano-code-implementation/.kc/context_store.json]]"
activated: 2026-05-05
authority:
  - Lovable-Primary Build Doctrine
  - Refusal Authority Protocol
  - KC Memory-Renter Doctrine
tags:
  - kc
  - curriculum
  - student-teacher
  - starfall-salvage
  - kopano-labs
---

# KC Student-Teacher Curriculum

> Activated 2026-05-05 by Master Robyn during the Kopano Labs Upgrade handoff.
> Authority: [[Lovable-Primary Build Doctrine]] + [[Refusal Authority Protocol]] + [[KC Memory-Renter Doctrine]].

KC is the **strict dev QA student**. Claude (acting as Senior Engineer for this lane) is the **teacher**. This file is the syllabus. KC does not get to skip lessons. KC does not get to mark work complete on vibes. KC reads this file every pass and audits Starfall Salvage against every proof below.

---

## Protocol Overview

1. **Teacher ships features.** Claude or Master Robyn lands code on `main`.
2. **Student audits.** KC runs `tools/kc_starfall_watch.py --once --seed-kc`. The watcher invokes `check_kopano_upgrade_features()` which holds 16+ binary proofs for the most recent upgrade.
3. **Student fails loud.** Any missing proof → KC refuses the pass, logs the failure to `Structure/KC Review Log.jsonl`, and seeds the failure to the Main Brain context store at `Schematics/06-Reference/kopano-code-implementation/.kc/context_store.json`.
4. **Teacher patches.** Claude or Codex re-patches the source. No hand-waving — the proof string must literally appear in the indicated file.
5. **Student retries.** Loop until KC reports `kopano_upgrade_audit: ok`.
6. **Student graduates.** Pass logged with `kc_context_id` referencing the Main Brain record.

KC is not allowed to grade itself "passed" by lowering the bar. KC raises the bar by adding new proofs whenever the teacher ships new features.

---

## Lesson 001: The Kopano Labs Upgrade (2026-05-05)

**Spec:** Add haptic feedback, WhatsApp viral share, in-game Kasi-Comm chat lobby, and the Sovereign Tech CONTRIBUTING.md. Patch existing files only. Pass `node --check` and `py_compile`.

**Files in scope:** `index.html`, `styles.css`, `src/game.js`, `backend/starfall_server.py`, `CONTRIBUTING.md`, `Structure/Project Status.md`.

### Required Proofs (KC must literally find each string in the listed file)

| # | Proof Key | File | Search String |
|---|-----------|------|---------------|
| 1 | `haptic_vibrate_present` | `src/game.js` | `navigator.vibrate` |
| 2 | `haptic_damage_pattern` | `src/game.js` | `[200, 100, 200]` |
| 3 | `haptic_gameover_pattern` | `src/game.js` | `[400, 120, 400, 120, 600]` |
| 4 | `whatsapp_share_url` | `src/game.js` | `api.whatsapp.com/send` |
| 5 | `whatsapp_share_domain_correct` | `src/game.js` | `starfallsalvage.kopanolabs.com` AND no `starfallsavage` |
| 6 | `share_button_markup` | `index.html` | `id="shareWhatsappButton"` |
| 7 | `kasi_comm_markup` | `index.html` | `id="kasiComm"` |
| 8 | `kasi_comm_form_markup` | `index.html` | `id="kasiCommForm"` |
| 9 | `chat_table_schema` | `backend/starfall_server.py` | `chat_messages` |
| 10 | `chat_get_route` | `backend/starfall_server.py` | `/api/chat` AND `handle_chat` |
| 11 | `chat_rate_limit` | `backend/starfall_server.py` | `Slow down, pilot` |
| 12 | `chat_polling_interval` | `src/game.js` | `CHAT_POLL_INTERVAL_MS` |
| 13 | `open_graph_tags` | `index.html` | `property="og:title"` AND `property="og:image"` |
| 14 | `twitter_card_tags` | `index.html` | `name="twitter:card"` |
| 15 | `contributing_bounty_doctrine` | `CONTRIBUTING.md` | `Sovereign Tech` AND `bounty` |
| 16 | `contributing_local_rails` | `CONTRIBUTING.md` | `Yoco` AND `PayFast` AND `EFT` |

If any proof is `false`, the audit FAILS. KC writes the failed proof name to the JSONL log and the Main Brain context store, marks `status=reviewed` with the retry instruction, and waits for the teacher's next patch.

### Validation Gates (still must pass)

- `node --check src/game.js`
- `python -m py_compile backend/starfall_server.py`
- `GET http://127.0.0.1:8765/api/health` → `{"ok": true}`

### Acceptance Criteria

- All 16 proofs `true`.
- Both syntax gates green.
- Backend health responds within 2.5s.
- `Structure/Project Status.md` lists the upgrade in `## Completed`.
- A new `kc_context_id` is seeded to the Main Brain context store.

---

## Lesson 002: The Spelling Sovereignty Rule

**Why:** Master Robyn confirmed via IONOS evidence on 2026-05-05 that the production subdomain is `starfallsalvage.kopanolabs.com`. The earlier directive used `starfallsavage` — a typo. KC must enforce that the brand is **Starfall Salvage**, never **Starfall Savage**, in any user-facing string.

**Audit:** Grep the codebase for `starfallsavage` (no `l`) — must be **zero matches** outside of historical log files. Same rule for the brand name itself: `Starfall Savage` is forbidden in shipped UI copy.

KC adds this as a `spelling_sovereignty` proof in the next curriculum revision. For Lesson 001 it's covered by proof #5.

---

## Lesson 003: Refusal Authority

KC operates under the Refusal Authority Protocol. KC may refuse a pass for any of these:

- Proof missing.
- Spelling drift detected.
- External CDN asset detected (`<script src="https://`, `<link href="https://`).
- Three.js, Babylon, Phaser, or any external game engine import.
- Secret or credential committed (look for `.env`, `key=`, `token=` in dirty files).
- Backend serves files outside the project root.

When KC refuses, it cites the rule and the specific file/line, then logs to both `Structure/KC Review Log.jsonl` and the Main Brain context store.

---

## Lesson 004: How KC Talks Back to the Teacher

KC's `teacher_review` field in the Main Brain record is the channel for the student to push back. Format:

```
- <proof_key>: <retry_instruction>. Actual: <observed_value>
```

Example failure message KC would write:
```
- chat_rate_limit: patch backend handle_chat with the 1.5s window and the "Slow down, pilot" string. Actual: rate-limit branch missing.
```

The teacher reads this, fixes the source, and triggers the next pass. No back-and-forth in chat — the audit log IS the handshake.

---

## Lesson 005: Mobile Sovereignty (PWA Foundation)

**Why:** KasiLink and the Kopano Labs ecosystem target a mobile-first South African audience. A WebGL game that can't be added to an Android home screen is shipping half a product. This lesson is the floor — Lesson 006 will add touch controls.

**Spec:** Add a PWA web manifest so Starfall Salvage is installable from Chrome on Android. No service worker yet (offline play is a future lesson). No external CDN dependencies — manifest sits inside the project.

**Files in scope:** `manifest.webmanifest` (new), `index.html`.

### Required Proofs (Lesson 005)

| # | Proof Key | File | Search String |
|---|-----------|------|---------------|
| 17 | `pwa_manifest_file_present` | `manifest.webmanifest` | `"name": "Starfall Salvage"` |
| 18 | `pwa_manifest_linked` | `index.html` | `rel="manifest"` |
| 19 | `pwa_apple_touch_icon` | `index.html` | `rel="apple-touch-icon"` |
| 20 | `pwa_manifest_theme_color` | `manifest.webmanifest` | `"theme_color": "#07080e"` |
| 21 | `pwa_manifest_display_standalone` | `manifest.webmanifest` | `"display": "standalone"` |
| 22 | `pwa_manifest_lang_za` | `manifest.webmanifest` | `"lang": "en-ZA"` |

### Acceptance Criteria

- All 6 new proofs `true`.
- Lighthouse PWA installability passes when audited (manual owner check, not part of `node --check`).
- Manifest validates as JSON.

---

## Lesson 006: Comms, Social, Data Capture, Bounty Incentive (2026-05-06)

**Why:** Production deploy is live but the chat backend is not — frontend must still capture user value. The Sovereign Tech doctrine says "we pay our engineers"; this lesson makes that visible inside the game and gives anonymous users a low-friction path to submit upgrade ideas with a real bounty incentive.

**Spec:** Add Submit Idea (mailto), multi-platform social share row, localStorage event capture with diagnostic export, and reframe Kasi-Comm offline state as a bounty CTA.

**Files in scope:** `index.html`, `styles.css`, `src/game.js`.

### Required Proofs (Lesson 006)

| # | Proof Key | File | Search String |
|---|-----------|------|---------------|
| 23 | `idea_button_markup` | `index.html` | `id="submitIdeaButton"` |
| 24 | `diagnostics_button_markup` | `index.html` | `id="exportDiagnosticsButton"` |
| 25 | `social_share_row_markup` | `index.html` | `id="shareRow"` AND all 4 `data-share` channels (twitter, facebook, linkedin, copy) |
| 26 | `bounty_email_constant` | `src/game.js` | `rkholofelo@kopanolabs.com` |
| 27 | `event_log_storage` | `src/game.js` | `EVENTS_STORAGE_KEY` AND `logEvent` |
| 28 | `diagnostics_exporter` | `src/game.js` | `exportDiagnostics` |
| 29 | `kasi_comm_offline_bounty_cta` | `src/game.js` | `Sovereign Tech bounty` |
| 30 | `incentive_panel_markup` | `index.html` | `kasi-comm-incentive` |
| 31 | `bounty_email_in_html` | `index.html` | `rkholofelo@kopanolabs.com` |

### Acceptance Criteria

- All 9 new proofs `true` (total: 31 proofs across 3 lessons).
- `node --check src/game.js` and `python -m py_compile backend/starfall_server.py` both green.
- Vercel auto-deploys the new build; production URL serves `?v=20260506-comms` cache-bust.

---

## Lesson 007: Mobile Functionality (Touch Input + Tap Controls)

**Why:** Owner-proof negative — Master reported "the game is frozen on Mobile" on 2026-05-06 against the Lesson 006 build. Diagnosis: keyboard-only input pipeline (`window.keydown`) gives no movement vector on mobile, so the ship sat still while the lane scrolled it into debris. KasiLink users are mobile-first; this lesson is non-negotiable for production fitness.

**Spec:** Add native touch input on the WebGL canvas — virtual joystick from first-touch anchor with deadzone + normalized magnitude, tap-to-start when not playing, tap-to-dash mid-flight. Prevent browser scroll/zoom on canvas. No external libraries.

**Files in scope:** `src/game.js`, `styles.css`, `index.html`.

### Required Proofs (Lesson 007)

| # | Proof Key | File | Search String |
|---|-----------|------|---------------|
| 32 | `touch_axis_state` | `src/game.js` | `touchAxis` AND `activeTouchId` |
| 33 | `touch_capable_detect` | `src/game.js` | `isTouchCapable` |
| 34 | `touch_start_handler` | `src/game.js` | `canvas.addEventListener("touchstart"` |
| 35 | `touch_move_handler` | `src/game.js` | `canvas.addEventListener("touchmove"` |
| 36 | `touch_end_handler` | `src/game.js` | `canvas.addEventListener("touchend"` |
| 37 | `tap_to_start_or_dash` | `src/game.js` | `wasTap` AND `dashRequested = true` |
| 38 | `touch_axis_in_movement` | `src/game.js` | `moveX += touchAxis.x` |
| 39 | `touch_action_none_css` | `styles.css` | `touch-action: none` |
| 40 | `mobile_control_hint_html` | `index.html` | `Mobile:` AND `tap to start` |

### Acceptance Criteria

- All 9 new proofs `true` (running total: 40 proofs across 4 lessons).
- `node --check src/game.js` passes.
- Live URL serves `?v=20260506-mobile` cache-bust.
- **Owner-proof gate:** Master physically loads the game on a mobile device, drags to fly, taps to dash, and confirms the ship responds. Until that happens, this lesson stays in `submitted` state in the KC store, not `reviewed`.

---

## Maintenance

- Every shipped feature spec adds a new lesson and at least one new proof key.
- Old lessons stay in this file as a regression curriculum — KC keeps auditing every proof from every lesson, forever.
- Master Robyn or the Senior Engineer updates this file before the feature merges. Editing this file *after* a merge is allowed only to add new lessons, never to soften existing proofs.

— Teacher: Claude (Senior Engineer, Starfall lane)
— Student: KC (Kopano Context strict dev QA)
— Authority: Master Robyn / Kopano Labs
