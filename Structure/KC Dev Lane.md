# KC Dev Lane

## Role Upgrade

KC is no longer treated as a passive intern note bucket for Starfall Salvage. KC is assigned as a strict dev QA lane:

- fail incomplete work,
- say exactly what failed,
- give retry instructions,
- rerun until the pass is acceptable,
- log proof in both Starfall Structure and the Main Brain/KC store.

## Boundary

Current KC wiring is local and file-backed. It uses:

- `C:\Users\rkhol\OneDrive\Documents\Anthropic\Introduction to MCP\Schematics\06-Reference\kopano-code-implementation\src\kc_mcp.py`
- `C:\Users\rkhol\OneDrive\Documents\Anthropic\Introduction to MCP\Schematics\06-Reference\kopano-code-implementation\.kc\context_store.json`
- `C:\Users\rkhol\Starfall Salvage\tools\kc_starfall_watch.py`

KC is not a separate autonomous AI process until a real external runtime or endpoint is connected.

## Hard QA Cycle 001

Expected:
KC reviews Starfall as a dev and refuses incomplete sign-in/backend/deployment claims.

Observed failure:
The first KC-style critique found dead sign-in UI, absent backend integration, untracked logo asset, missing modal CSS, no deployment runbook, no browser smoke gate, and no documented account behavior.

Correction issued:
Wire account controls, add a local backend, track the logo asset, style the modal, document deployment, add a KC watchdog, and rerun syntax/API/browser checks.

Retry status:
Passed on retry. `tools\kc_starfall_watch.py --once --seed-kc` created KC context `kc-3` after the watcher import bug was corrected, then final verification created `kc-4`.

Failure inside the KC tooling:
The first watcher seed attempt failed with `'NoneType' object has no attribute '__dict__'` because the dynamic import did not register the KC module in `sys.modules`.

Correction:
`tools/kc_starfall_watch.py` now inserts the loaded KC module into `sys.modules` before executing it.

Proof:
`Structure/KC Review Log.jsonl` contains the failed seed attempt, the passing retry with `kc_context_id: kc-3`, and the final clean rerun with `kc_context_id: kc-4`.

## Production Activation (2026-05-06)

KC graduated from local-only QA lane to **production-aware reviewer**. New scope:

- Audits live URL `https://starfallsalvage.kopanolabs.com` (HTTP 200, Server: Vercel, OG meta resolved).
- Audits public GitHub repo `Kopano-Labs/starfall-salvage` (visibility, latest commit hash matches main).
- Reads end-to-end across the Main Brain Schematics directory via `tools/kc_main_brain_scan.py` to verify cross-references between sub-brain (Starfall Salvage) and main brain (`Schematics/`).

## End-to-End Main Brain Scan

Run a one-shot scan that walks key Schematics folders and reports counts, last-modified dates, and Starfall cross-references:

```powershell
python tools\kc_main_brain_scan.py --once --seed-kc
```

Adds proofs:
- `comms_log_has_starfall_entries` — confirms Main Brain knows about Starfall.
- `protocols_referenced` — counts doctrine docs (Lovable-Primary, Refusal Authority, KC Memory-Renter, Sovereign Tech).
- `kc_context_store_present` — confirms `Schematics/06-Reference/kopano-code-implementation/.kc/context_store.json` exists and has KC records.

## Watchdog Commands

Run one strict pass:

```powershell
python tools\kc_starfall_watch.py --once --seed-kc
```

Run a background-style loop:

```powershell
python tools\kc_starfall_watch.py --interval 60 --seed-kc
```
