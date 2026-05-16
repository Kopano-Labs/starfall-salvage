# Microsoft / Azure / Store readiness ledger

**Project:** Starfall Salvage (Kopano)  
**Scope:** Partner Center, packaging, identity wrapper (future), privacy/consent  
**Protocol:** P13 · 5 pillars · 15 commandments (acceptance)

---

## 5 pillars

- [x] **Alignment:** Core loop runs offline; no cloud dependency for playability.
- [x] **Community:** Mobile-first controls; 90° yaw + swipe/bracket input paths in WebGL build.
- [x] **Infrastructure:** `node --check` / repo gate green; bounded render loop.
- [ ] **Apprenticeship:** In-repo handoff docs for AI-assisted maintenance (module map, build, test). **PENDING**
- [ ] **Service:** Next.js 15 wrapper + Kopano hub nav + unified auth/session (360 loop). **PENDING**

---

## 15 commandments (acceptance)

- [ ] **C1** **Deep link / auth handoff:** `kopanolabs.com` (or chosen root) → game shell with token/session contract documented (no secrets in static HTML).
- [ ] **C2** **Publisher identity:** Partner Center org, seller verification, payout/tax profile complete.
- [x] **C3** **Grounded truth:** Revive countdown uses wall-clock `timer -= dt` (no CSS-only timer spoof).
- [x] **C4** **Minimal DOM (play):** Active play: score + pause + essential HUD only; modals gated.
- [ ] **C5** **Ship channel:** MSIX vs PWA vs hosted path chosen; CI produces reproducible artifact + version stamp.
- [ ] **C6** **Monetization:** Store IAP / additive commerce; policy-compliant copy; no predatory loops. **PENDING**
- [ ] **C7** **Telemetry:** If enabled: consent surface, documented categories, retention, region; privacy URL in listing.
- [x] **C8** **Extraction:** No server identity or PII pipeline in vanilla WebGL; local-only until explicit NextAuth + scoped APIs.
- [ ] **C9** **Content rating:** IARC questionnaire; descriptors match shipped gameplay.
- [x] **C10** **Movement:** `queueTurn(±1)` + `tickTurnAnimation` (smoothstep) = true 90° yaw path.
- [ ] **C11** **Accessibility:** Store questionnaire answers backed by keyboard/touch, contrast, text scaling notes.
- [x] **C12** **Offline-first:** Playable with no live API when run from local/static bundle.
- [x] **C13** **State hygiene:** `resetLaneTurnState()` on run start / reset to avoid turn/revive state collisions.
- [ ] **C14** **Signing:** Release cert / Publisher trust; timestamp; no test cert in Store submission.
- [ ] **C15** **Listing assets:** Required screenshots (per Store size matrix), short + long description, privacy policy URL, support contact.

---

## Active blockers

1. **Identity wrapper:** Next.js 15 + MongoDB Atlas + NextAuth (or chosen IdP) + `WelcomeModal.tsx` + ecosystem survey persistence.
2. **Post-auth UI chrome:** Product-defined deck / accent (Ion/Solar or other); biological XY/XX UI **only** if explicitly re-approved for Store policy—defer until wrapper exists.
