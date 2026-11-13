# UX blind spots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seven new browser cases in `tools/ux-check.mjs` (`B-*`) that fail while their bug is there, and the game fixes that make them pass.

**Architecture:** Each case is an entry in `CASES` returning `[ok, label]`, run with `npm run build && node tools/ux-check.mjs B-<id>`. Core logic changes get a `node --test` unit test first; UI-only changes are proved by the browser case. A case that passes on the current game is proved by a temporary break (revert after).

**Tech Stack:** Node ES modules, Playwright (pre-installed), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-13-ux-blind-spots-design.md`

## Global Constraints

- The 18 existing ux-check cases keep passing; `npm test` stays green; no balance or save-format change.
- Thai banner text, short; never "บันทึกแล้ว" for a write that did not happen.
- Build before every browser run: `npm run build`.

## Review Focus

1. A save refused as "older than the slot" must not block the heir (new `lifeId`) or a new life in that slot — Task 2 unit test.
2. The settings button missing after a redraw (e.g. on the start screen) — focus falls back without throwing — Task 3.
3. The save-failure banner must still give way after its 3.5 s, not stick forever — Task 1 case reads it after 4 s.

---

### Task 1: Save failures are seen (B-save-fail, B-autosave-fail)

**Files:** Modify `tools/ux-check.mjs`, `src/ui/main.js` (`banner`, `autosave`).

- [ ] Step 1: Add `B-save-fail`: `loaded(b, infant)`; make `Storage.prototype.setItem` throw `QuotaExceededError` in the page; Settings → `save:1`; ok when `#banner` text matches `/ไม่สำเร็จ/` and not `/บันทึกแล้ว/`.
- [ ] Step 2: Add `B-autosave-fail`: load `adult.s` with cfg `{ policy: "skip", speed: 16, fs: 2 }`, make setItem throw, run 16×; record every `#banner` text via a `MutationObserver` installed in the page; ok when the failure text `/บันทึกอัตโนมัติไม่สำเร็จ/` was visible ≥ 1 s (observer timestamps) before another text replaced it.
- [ ] Step 3: Build, run both; Expected: `B-save-fail` PASS (game already right) → prove it by temporarily making the save handler skip the check (expect FAIL), revert. `B-autosave-fail` FAIL (the birthday banner replaces it the same frame).
- [ ] Step 4: In `src/ui/main.js` give banners a priority: `banner(text, urgent = false)`; an urgent banner is not replaced by a non-urgent one while `bannerT > 0`. Save/autosave/import failures pass `urgent = true`.
- [ ] Step 5: Build, run `node tools/ux-check.mjs` (all) → all PASS. Commit `ui: a failed save's banner is not covered by news; checks for failing saves`.

### Task 2: Two tabs cannot write an older life over a newer one (B-two-tabs)

**Files:** Modify `src/core/save.js` (`slots.save`), `src/ui/main.js` (save + autosave callers), `tools/ux-check.mjs`; Test: `test/save.test.mjs` (or the existing saves test file).

- [ ] Step 1: Unit tests: `slot save refuses an older state of the same life` — save a life at ageM 240, then the same life object state at ageM 120 → `slots.save` returns `"newer"` and the stored save still has ageM 240; `an heir or another life still saves over it` — a different `lifeId` saves (`true`).
- [ ] Step 2: Run `node --test test/<file>` → FAIL.
- [ ] Step 3: `slots.save(i, s): true | false | "newer"` — `"newer"` when the stored save deserializes to the same `lifeId` with greater `ageM`. UI: on `"newer"`, banner (urgent) "อีกแท็บเล่นชีวิตนี้ไปไกลกว่าแล้ว เซฟนี้ไม่ได้บันทึกทับ"; autosave stops writing (like `saveFailing`).
- [ ] Step 4: Add `B-two-tabs`: one context, two pages on slot 0 (`adult.s`); page B plays on at 16× ≥ 1 year and saves; page A (paused, older) saves manually; ok when the stored `ageM` is still B's and A shows the banner.
- [ ] Step 5: Unit tests PASS, build, ux-check all PASS. Commit `saves: an older tab cannot write over a newer life`.

### Task 3: Focus comes back to the settings button (B-focus-return)

**Files:** Modify `src/ui/main.js` (`close`), `tools/ux-check.mjs`.

- [ ] Step 1: Add `B-focus-return`: focus `[data-a="settings"]`, Enter, replace the toolbar's markup while the dialog is open (forces a redraw), Escape; ok when `document.activeElement.dataset.a === "settings"`.
- [ ] Step 2: Build, run → FAIL (focus on BODY — confirmed by probe).
- [ ] Step 3: `close`: if `ui.opener` is no longer connected, focus the first `[data-a="settings"]` in the document; nothing if there is none.
- [ ] Step 4: Build, run all → PASS. Commit `ui: closing settings finds the settings button even after a redraw`.

### Task 4: Phone layouts hold (B-log-phone, B-big-font, B-landscape)

**Files:** Modify `tools/ux-check.mjs`; `src/index.html` CSS only if a case fails.

- [ ] Step 1: `B-log-phone`: a life played to age ≥ 60 (core fixture, `ux-old`), 390×844 mobile; ok when the first `[data-a^="choose:"]` or the plan focus buttons are within 1.5 screens of the top and `document.documentElement.scrollWidth <= innerWidth`.
- [ ] Step 2: `B-big-font`: read the largest font option from `src/ui/settings.js`/cfg and load with it at 320×568; ok when no sideways scroll and the last settings button can be scrolled into view inside the dialog.
- [ ] Step 3: `B-landscape`: `infant` at 844×390 mobile; ok when the first choice's bottom ≤ innerHeight after `scrollIntoView` and no sideways scroll.
- [ ] Step 4: Build, run. Each case that FAILs: fix in CSS (`@media (max-width:…)` / `max-height` with own scroll for the log on phones), rerun. Each case that PASSes: prove it with a temporary break (e.g. a wide element / `max-height` removed), revert.
- [ ] Step 5: All ux-check PASS, `npm test` green, `node tools/linelen.mjs` clean. Commit `ui: phone layout checks (long log, biggest text, sideways)`.

### Task 5: Gates and build

- [ ] `npm test`, `node tools/linelen.mjs`, `node tools/lifecheck.mjs 200`, `node tools/playtest.mjs 200`, `node tools/sim.mjs 1000 --policy normal --seeds a,b,c,d,e`, `npm run build`, `node tools/ux-check.mjs` — all into files, read tails. Commit `play.html` + `downloads/`.
