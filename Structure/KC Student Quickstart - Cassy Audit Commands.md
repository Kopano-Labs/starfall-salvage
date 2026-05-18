---
title: KC Student Quickstart - Cassy Audit Commands
created: 2026-05-18
updated: 2026-05-18
teacher: Codex
student: KC / Cassy
status: active
---

# KC Student Quickstart (Cassy)

Run from the active execution clone:

`C:\Users\rkhol\.cursor\projects\empty-window\starfall-salvage`

Historical registry paths may still mention `C:\Users\rkhol\Starfall Salvage` or `C:\Users\rkhol\OneDrive\Documents\Kopano Labs\starfall-salvage`; treat those as path-drift WATCH until reconciled.

## 1. Syntax and vault

```powershell
node --check .\src\game.js
npm run vault:check
```

## 2. Start backend (terminal A)

```powershell
python backend\starfall_server.py --port 8765
```

## 3. KC hard QA (terminal B)

```powershell
python tools\kc_starfall_watch.py --once --seed-kc
```

Expect: `"ok": true` and no missing proofs in `kopano_upgrade_audit`.

## 4. Read failures

- Log: `Structure/KC Review Log.jsonl` (last line = JSON report)
- Main Brain store: `Schematics/06-Reference/kopano-code-implementation/.kc/context_store.json`

## 5. Full lesson

- Sub-brain: `Structure/KC Student-Teacher Curriculum.md`
- Main Brain class: `Schematics/18-PROTOCOLS/Starfall-Arcade/Cassy Student Session - Starfall Orbital Wreck And KC Audit Loop - 2026-05-18.md`

Teacher: **Codex**. You audit; you do not ship.
