# Contributing to Starfall Salvage

> **Sovereign Tech: We pay our engineers. We out-build the monopolies.**

Starfall Salvage is a Kopano Labs project. This file is the law for outside contributors. Read it before you open a Pull Request, and read it again before you ask about a bounty.

We are not Takealot. We are not a greedy corporate platform that profits off your labour and gives you a "thanks for the exposure." Kopano Labs pays for value. If your code ships, you get paid. Full stop.

---

## The Righteous Wage Protocol

Every approved contribution that lands on `main` is paid.

- **Bounty tickets** are tagged `bounty:` on the issue tracker, with a tier and a fixed ZAR amount visible up front.
- **Local SA rails only** — Yoco, PayFast, EFT (Capitec, FNB, Standard Bank, ABSA, Nedbank, TymeBank). No PayPal middlemen taxing your wage. No "store credit." Real money in your real account, in your real currency.
- **Payouts ship within 7 days** of the merge, after a brief identity check (your name on the EFT must match the GitHub identity that opened the PR).
- **No exposure deals. No "future equity for now-work."** If we cannot pay, we do not assign.

### Bounty Tiers

| Tier | Scope | ZAR Range |
|------|-------|-----------|
| `bounty:patch` | Bug fix, small polish, doc correction | R150 – R400 |
| `bounty:feature` | New gameplay mechanic, UI module, backend endpoint | R500 – R1,500 |
| `bounty:system` | Multi-file system (auth, networking, persistence layer) | R1,500 – R5,000 |
| `bounty:flagship` | Strategic build that moves the launch needle | Negotiated, R5,000+ |

Every ticket states the tier, the acceptance criteria, and the exact rand amount before you start. No moving goalposts.

---

## How to Earn a Bounty

1. **Pick a ticket.** Comment on the issue claiming it. Maintainers reserve tickets within 24h of the claim.
2. **Fork → branch → build.** Use a descriptive branch name like `bounty/feature/in-game-chat`.
3. **Honour the constraints.**
   - Raw WebGL only. **No Three.js, no external game engines.**
   - **No external CDN assets.** Vendor everything inside the repo.
   - Keep `node --check src/game.js` and `python -m py_compile backend/starfall_server.py` green.
   - Patch existing files. Do not rewrite from scratch.
4. **Open the PR.** Target `main`. Reference the bounty ticket (`Closes #123`).
5. **Pass review.** A Kopano Labs maintainer reviews for correctness, performance, and brand fit. Expect notes — respond, iterate, push.
6. **Merge → invoice → paid.** Once merged, raise a one-line invoice in the PR thread (`Bounty: R750 — banking: <bank>, <account>, <branch code>, <name>`). Funds clear within 7 days.

---

## Pull Request Standards

A PR will be **rejected on sight** if it:

- Adds an external CDN script, font, or texture.
- Pulls in Three.js, Babylon, Phaser, or any other engine framework.
- Rewrites a working file when a patch would do.
- Breaks the `node --check` or `py_compile` validation gates.
- Ships secrets, `.env`, or local SQLite dumps.
- Uses AI-generated copy without disclosure (we are not against AI assistance — we are against unattributed slop).

A PR will be **prioritised** if it:

- Lands inside the bounty ticket's scope, no scope creep.
- Includes a short test plan in the PR description.
- Uses real device QA — desktop browser **and** mobile browser, screenshots welcome.
- Matches the existing voice in the codebase (Kopano Labs / WebGL Edition tone).

---

## Code of Conduct

- Build like the township is watching, because it is.
- No racism. No sexism. No homophobia. No bigotry. We are serving Mzansi and the diaspora — every contributor and every player is welcome at this lane.
- Disagree on technique, not on dignity.
- Maintainers reserve the right to close any PR that violates this floor, no bounty paid.

---

## Why We Pay

Open-source has spent twenty years pretending unpaid labour is "community." It is not. It is extraction with extra steps. Kopano Labs is a South African shop building South African tech for a South African audience, and we will not replicate the model where the global north harvests free work from the global south and calls it "the gig economy."

If you ship value to Starfall Salvage, you get paid in rand, on local rails, within a week. If we ever break that promise, call us out publicly — we will fix it or we will fold the project. That is the standard.

**Ngiyabonga. Re a leboga. Thank you. Now go ship.**

— Kopano Labs Maintainers
