# Choice card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A waiting decision opens as a card over the stage that can be folded, can start folded, marks plan-fitting options, and behaves as a dialog — without breaking the 25 browser checks.

**Architecture:** `eventCard(s, waiting)` stays the one source of the decision markup; `render` puts it in a new `#choice` overlay inside `#game` when the player must choose, and a placeholder in `#event`. Fold state lives in `ui.fold` (per event) and `cfg.fold` (start folded). Plan fit is a pure core helper.

**Tech Stack:** Node ES modules, `node --test`, Playwright via `tools/ux-check.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-14-choice-card-design.md`

## Global Constraints

- Keep every `data-a="choose:i"`, `pin:i`, `fate` hook and the 1–9 keys; UX-02 touch rules and R-space-hold behaviour stay.
- `#choice` inside `#game`; `#ctrl` and `#tabs` above the overlay and clickable.
- Thai labels: "พับไว้ดูก่อน", "เปิดตัวเลือก", "เปิดเรื่องใหม่แบบพับไว้", placeholder "มีเรื่องรอคุณตัดสินใจ".
- The placeholder does not use class `ev`. Colours from our tokens. Reduced motion respected.
- All 25 existing ux-check cases pass; a case's selector may change only if its element moved (ledger it).

## Review Focus

1. An event that opens while settings is open: settings keeps focus; closing settings returns to the card — Task 3 case.
2. The autopilot answering an event (policy important/skip): no card flashes open — Task 2 case checks the overlay stays hidden at 16× with skip.
3. A fight in progress (`s.op`) with choices: the card shows the fight bar and stays usable — Task 2 reads `.opbar` inside `#choice` with an `s.op` fixture if one is cheap, else ledger.
4. Folded card and a new event arriving: the new one obeys `cfg.fold`, not the old fold state — Task 3.

---

### Task 1: `cfg.fold` survives cleaning and saving

**Files:** `src/ui/cfg.js`, `src/ui/main.js` (`saveCfg`, `ui` init); Test: `test/cfg.test.mjs`.
- [ ] Test `cleanCfg keeps a boolean fold, anything else is false`: `cleanCfg({fold:true}).fold === true`; `cleanCfg({fold:"yes"}).fold === false`; `cleanCfg(null).fold === false`. Run → FAIL.
- [ ] `DEFAULT_CFG.fold = false`; `cleanCfg` adds `fold: r.fold === true`; `ui.foldStart = cfg0.fold`; `saveCfg` writes `fold: ui.foldStart`. Run → PASS; commit.

### Task 2: The card opens over the stage

**Files:** `src/index.html` (`<div id="choice" hidden>` inside `#game`, CSS), `src/ui/main.js` (`render`), `src/ui/layout.js` (`eventPanel` placeholder), `tools/ux-check.mjs`.
- [ ] Cases `C-open` (infant, desktop: `#choice` visible, contains `[data-a^="choose:"]`, `#event` has no choose buttons and shows "มีเรื่องรอคุณตัดสินใจ"), `C-phone` (390×844: card bottom ≤ innerHeight+1, first choice reachable by scrolling inside the card, no sideways), `C-auto` (adult, skip, 16×, 3 s: `#choice` never visible while no event waits for the player). Build, run → C-open/C-phone FAIL.
- [ ] `render`: `const ask = !!s.ev && (waiting || ui.policy === "stop" || autoDecide(s, ui.policy) < 0)` (use the same "waiting for the player" test render already has); when `ask`, `put("#choice", '<div class="card" role="dialog" aria-modal="true" aria-label="…tag…">' + eventCard(...) + fold controls + '</div>')`, `#choice.hidden = false`; else hidden. `eventPanel` shows result + mstat + story line + placeholder (button `data-a="unfold"`) when `ask`.
- [ ] CSS: `#choice{position:fixed;inset:0;z-index:20;background:#0008;display:grid;place-items:center}` card max-width 560px, max-height 90vh, own scroll, `overscroll-behavior:contain`; `@media (max-width:700px)` card anchored bottom, full width, max-height 85vh; `#ctrl,#tabs{position:relative;z-index:21}`.
- [ ] Build, run the three + all 25 → PASS (fix selectors only where an element moved; ledger each). Commit.

### Task 3: Fold, unfold, start folded, dialog keys and focus

**Files:** `src/ui/main.js`, `src/ui/layout.js` (fold button, checkbox `data-c="foldStart"`, floating `#unfold`), `tools/ux-check.mjs`.
- [ ] Cases `C-fold` (fold → card hidden, `[data-a="unfold"]` visible, age unchanged after 1.5 s; unfold → card back), `C-start-folded` (cfg `fold:true`: a waiting event opens folded), `C-keys` (card open: focus on first enabled option; Tab ×10 stays inside `#choice .card`; `f` folds, `f` unfolds; `Escape` folds), `C-settings-over` (open settings while card open: Tab stays in `#modal`; Escape closes settings, focus returns inside the card). Build, run → FAIL.
- [ ] `ui.fold` = `{ evRef, folded }`: when `s.ev` changes, `folded = ui.foldStart`; actions `fold`/`unfold`; folded → overlay class `folded` (transparent, `pointer-events:none`, card hidden) and a floating button `data-a="unfold"` "เปิดตัวเลือก · <tag>" (pointer-events auto) above `#tabs`; checkbox toggles `ui.foldStart` + `saveCfg`.
- [ ] Keys (after the settings-modal block): when the card is open and not folded — Tab trap inside the card, `f`/`F`/`Escape` fold; when folded — `f`/`F` unfold; 1–9 work in both. On open (new event, not folded) focus the first enabled `[data-a^="choose:"]` in the card; after a choice closes the card focus `[data-a="pause"]`.
- [ ] Speed buttons get class `dim` while a card waits. Build, run all → PASS. Commit.

### Task 4: Plan borders

**Files:** `src/core/clock.js` (export `planFit(s, opt): "main" | "second" | null`), `src/ui/layout.js` (classes `fit-main` / `fit-second` on `.opt`), CSS; Test: `test/plan-fit.test.mjs`; case `C-plan`.
- [ ] Unit tests: a plan with stats `[a,b]` and an option `{ s: "a" }` → "main"; option raising `y.st.b` → "main"; second plan's stat → "second"; main wins over second; rest plan (no stats) → null; no second plan → never "second". Run → FAIL.
- [ ] Implement from `FOCUS[s.focus].st` and the second plan (`s.focus2`, same table; read clock.js for its field name). Run → PASS.
- [ ] `C-plan`: find a fixture event with an option fitting the current plan (search the infant/adult lives' events in node, set `s.focus` to fit), check `.opt.fit-main` exists. Build, run → PASS; commit.

### Task 5: Key choices show their result; gates

- [ ] Case `C-key-result`: infant, press `1` → the side panel shows a `.result` line. Build, run → FAIL; make the 1–9 path call the same result display as clicks; PASS.
- [ ] Gates: `npm test`, `node tools/linelen.mjs`, `node tools/lifecheck.mjs 200`, `node tools/playtest.mjs 200`, `npm run build`, `node tools/ux-check.mjs` (all) into files; commit `play.html` + `downloads/`.
