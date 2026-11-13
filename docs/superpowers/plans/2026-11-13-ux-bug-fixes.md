# UX bug fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 12 UX defects from Codex's report that still reproduce on `main` 3a17b3b, plus two deferred minors.

**Architecture:** Pure rules move into small testable modules (`src/ui/cfg.js` for settings, `src/core/save.js` for
import validation); DOM behaviour is proven by a Playwright check script `tools/ux-check.mjs` that prints PASS/FAIL per
report id, adapted from `docs/feedback/ux-2026-11-13/evidence/*.mjs`. RED = the script's FAIL before a fix.

**Tech Stack:** Node ≥ 20, ES modules, `node:test`, Playwright (pre-installed: `require('playwright')`), esbuild.

**Spec:** `docs/feedback/ux-2026-11-13/REPORT.md` (acceptance criteria per UX id). Re-run on 3a17b3b: UX-02, 03, 04,
05, 06, 07, 08, 09, 11, 12, 13, 14 reproduce; UX-01 manual save fixed (background saves still silent); UX-10 and UX-15
are recommendations.

## Global Constraints

- Thai player text, plain; never reveal secrets; lines ≤ 120.
- Never lose a save: no write over a locked slot (P1 rule), every replacement keeps a backup.
- Core has no DOM; UI logic that can be pure goes in a pure module with node tests.
- Gates before merge: `npm test`, linelen, artcheck, lifecheck 200, playtest 200, sim × 3 policies × seeds a–e, build,
  `node tools/ux-check.mjs` all PASS.

## Review Focus

1. A phone player who scrolls the log by starting a swipe on an option: no choice is made. Task 2 (UX-02 check).
2. Settings open, player presses 1–9, Space, +/−, A: nothing happens to the game behind. Task 2 (UX-03 check).
3. A saved config from an older build with `speed: 16` or `speed: 3`: game starts and runs. Task 1 test.
4. Importing a valid save from an older version (sv 2) into an occupied slot after confirming: works, old data kept as
   backup. Task 3 test.
5. Deleting the slot you are playing, then the year turns: nothing is written back. Task 2 (UX-13 check).

---

### Task 1: Settings that always start, and every speed that is offered runs (UX-11, UX-12)

**Files:** Create `src/ui/cfg.js`, `test/cfg.test.mjs`; modify `src/ui/main.js` (lines ~20–30, keyboard speed),
`src/ui/layout.js` (speed buttons read `SPEEDS`).

**Interfaces:** Produces `SPEEDS = [1, 2, 4, 8, 16]`, `STEP_MS: { [speed]: ms }` (16 → half of 8's),
`cleanCfg(raw): { speed, policy, fs }` (defaults `{ speed: 2, policy: "important", fs: 2 }`; unknown values fall back
one by one; null/array/primitive → defaults).

- [ ] Tests: `null, arrays, numbers and strings give defaults`; `an unknown speed or policy falls back alone`;
  `a good config is kept`; `every offered speed has a step time` (`SPEEDS.every((n) => STEP_MS[n] > 0)`).
- [ ] FAIL (module missing) → implement → PASS; `npm test`.
- [ ] `tools/ux-check.mjs` cases `UX-11` (16× ages the life within 8 s) and `UX-12` (null config → start screen, no
  page error): FAIL before wiring, PASS after.
- [ ] Commit `"ui: every offered speed runs, and broken settings fall back safely"`.

### Task 2: Input and dialog behaviour (UX-02, 03, 04, 05, 07, 08, 09, 13, background save failures)

**Files:** Modify `src/ui/main.js`, `src/ui/settings.js`, `src/index.html`; create `tools/ux-check.mjs`.

Rules:
- UX-02: event options act on pointerdown for `pointerType === "mouse"` only; touch and pen act on click.
- UX-03: while the modal is open only Escape and the modal's own controls act; the modal gets `role="dialog"`,
  `aria-modal="true"`, focus moves to its first button, Tab stays inside, focus returns to the opener on close.
- UX-04: skip re-render only while an `input`, `textarea` or `select` inside the view has focus.
- UX-05: delete asks `confirm()` naming slot and life; cancel keeps primary and backup.
- UX-07: Space pauses only when focus is not on a button, link, input, select or textarea.
- UX-08: the import box renders `value="<ui.importText>"` so redraws keep it.
- UX-09: the banner sits above the modal (z-index above `#modal`), `role="status"`, focus not moved.
- UX-13: deleting the slot the life is saving to sets `ui.slot = -1` and says "ชีวิตนี้จะไม่บันทึกจนกว่าจะเลือกช่องใหม่";
  quit and year-end do not write it back.
- Background saves (year-end, quit, death): when `slots.save` returns false, one banner per failure streak.

- [ ] Write `tools/ux-check.mjs` (serve `play.html` from `file://`; cases UX-02, 03, 04, 05, 07, 08, 09, 13 as in the
  Codex scripts; exit 1 on any FAIL). Run → FAIL on those ids.
- [ ] Implement the rules; rerun → PASS; `npm test`.
- [ ] Commit `"ui: touch, keyboard, dialog, delete and save feedback behave"`.

### Task 3: Import that cannot break a slot (UX-14)

**Files:** Modify `src/core/save.js` (`importStr`), `src/ui/main.js` (import action), `src/ui/settings.js` (choose
slot); test `test/save-import.test.mjs`.

**Interfaces:** `slots.importStr(i, str): { ok: boolean, reason: string }` — reasons in Thai: `"ข้อความเซฟไม่ครบ"`,
`"เซฟจากเกมเวอร์ชันใหม่กว่า"`, `"ช่องนี้ถูกล็อก"`, `"บันทึกไม่สำเร็จ"`. A playable check: the migrated state has every
object/array field a fresh `newLife` has, with the same type, and one `advance` on a clone does not throw.
Replacing an occupied slot keeps the old save as `.bak`.

- [ ] Tests: `a save missing c is rejected and the slot is untouched`; `a valid sv 2 save imports`;
  `importing over a life keeps it as backup`; `a newer save is rejected with its reason`; `a failed write reports it`.
- [ ] FAIL → implement → PASS. UI: import asks which slot, confirms before replacing an occupied one, shows the reason.
- [ ] `tools/ux-check.mjs` case UX-14 (bad import → nothing overwritten, no page error) FAIL → PASS.
- [ ] Commit `"save: imports are checked whole, never break a slot, and keep a backup"`.

### Task 4: Phone layout (UX-06, UX-10)

**Files:** Modify `src/index.html` (CSS for ≤ 700 px).

- [ ] `tools/ux-check.mjs` cases: UX-06 the monthly plan's top is within 1,200 px of page top at 390×844 for an adult
  with a long log; UX-10 option, tab and save buttons ≥ 44 px tall at 390 and 320 px. FAIL → change → PASS.
- [ ] Rule: on phones the character card (with the plan) comes right after the event panel, and the log keeps a
  max-height with its own scroll; desktop unchanged (check 1280×800 plan top unchanged).
- [ ] Commit `"ui: on phones the monthly plan sits under the event, and buttons are big enough to tap"`.

### Task 5: Fate never rolls on a stale story scene

**Files:** Modify `src/core/events.js` (`chooseByFate`); test in `test/narrative-harden.test.mjs`.

- [ ] Test `fate on a stale story scene rolls nothing` (r unchanged, ev cleared). FAIL → fix (check `storyStale`
  before drawing) → PASS.
- [ ] Commit `"events: fate does not roll on a stale story scene"`.

### Task 6: Gates and review

- [ ] All merge gates incl. `node tools/ux-check.mjs`; fresh reviewer (most capable model) on the branch; one fix pass.
- [ ] UX-15 (first-play autopilot off by default) is a product decision for the owner: ask, do not change.
