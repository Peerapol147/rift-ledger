# UX research and actionable feedback for Claude — 2026-11-13 (Asia/Bangkok)

## บรีฟจากเจ้าของ / Claude: start here

เจ้าของขอให้ค้นหาปัญหา Interface, การกด, UX/UI และค่าเริ่มต้น แล้วฝาก Feedback ให้ Claude แก้ รายงานนี้ส่งมอบงานวิเคราะห์ ไม่ได้แก้ production code

**พบ 13 ปัญหาที่ทำซ้ำใน Chromium ได้ และ 2 ข้อเสนอด้าน UX** (UX-10 และ UX-15) ไม่ใช่คำรับรองว่าพบทุกบั๊กของเกมแล้ว

ลำดับแนะนำ: ป้องกันเซฟสูญหาย/นำเข้าพัง (01,14) → การกดเลือกโดยไม่ตั้งใจ (02,03,07) → ความเร็วและเริ่มเกมไม่ได้ (11,12) → การลบและข้อความตอบสนอง (04,05,08,09,13) → มือถือและค่าเริ่มต้น (06,10,15)

- P1: data loss, unintended decisions, or a core flow blocked. P2: usability/recovery problems. IDs are stable, not severity order.
- Audit baseline: `origin/main` at `65e56213ab031ac9e1a73dda79ffc84327da4b5a`. Initial browser evidence used `53a8369` on the art branch; `git diff origin/main codex/art-brief-completion -- src/ui src/core src/index.html` was empty. The extra four cases were run after switching to the feedback branch from main against the same isolated build.
- Skills applied: project `game-ui-ux`, Superpowers `systematic-debugging` and `verification-before-completion`.
- Real core-generated infant/adult fixtures, isolated browser profiles, desktop 1440×900 and emulated phones 390×844 / 320×568. Failure injection is explicitly identified below.
- Preserve seeded game rules, English class/item/skill names and secret-reveal restrictions. Fix input/render/persistence behavior without silently changing balance.

## Findings and acceptance criteria

### UX-01 · P1 · Save reports success when storage writes fail

- Reproduce: use the audit profile which makes `Storage.setItem` throw QuotaExceededError; load the fixture; Settings → Save into empty slot 2.
- Observed: banner says `บันทึกแล้ว`; `riftledger.slot.v2.1` remains null. The same profile can still read its fixture, isolating writes as the cause.
- Cause: `src/ui/dom.js:13` returns false on failed writes, but `src/core/save.js:98` discards the result and `src/ui/main.js:236` reports unconditional success. `slots.importStr` similarly reports success after ignoring a failed write.
- Acceptance: propagate storage outcomes, preserve the prior save where possible, display a visible failure with export/retry options; never report successful persistence unless the write succeeded. Test both normal and failed save/import.

### UX-02 · P1 · Cancelling a touch still commits an event choice

- Reproduce: load the real `ux-click-audit` life at age 3 months with event `infNight`; pause; touch an enabled event choice, then cancel the gesture without lifting normally.
- Observed: the event is chosen on touchStart, before touchEnd; after touchCancel its saved `ev` is null. This makes a drag/scroll beginning on an option unsafe.
- Cause: `src/ui/main.js:287` executes choose on pointerdown for touch as well as mouse, with no movement threshold or cancellation path.
- Acceptance: touch scrolling, dragging out, and pointercancel must make no choice. A completed intentional tap should choose exactly once. Retain the existing protection against event panels changing mid-press without committing on touchStart.

### UX-03 · P1 · Settings does not isolate keyboard input from gameplay

- Reproduce: with `infNight` waiting, open Settings, focus its Close button, press `1` without closing the modal, then save the life.
- Observed: the hidden event is resolved (`infNight` → null) while Settings stays open. Merely pressing Tab after opening the modal focuses the event choice behind it.
- Cause: `src/ui/main.js:309` handles game shortcuts without a settings guard. The modal has no initial focus, focus trap, inert background, role=dialog or aria-modal (`main.js:172`, `src/index.html:82`).
- Acceptance: only the active dialog receives input; game shortcuts are ignored while open; focus begins inside, Tab/Shift+Tab remain inside, Escape closes, and focus returns to the opener.

### UX-04 · P2 · Inventory buttons act, but the view stays stale

- Reproduce: use the adult fixture with a Rusty Knife; Items → Equip.
- Observed: the Equip button stays visible and there is no equipped label. Saving shows `equip.weapon === "i1"`, proving the action succeeded. Clicking outside the inventory updates it correctly.
- Cause: `src/ui/main.js:166` skips the entire view while any descendant has focus, including action buttons. It protects text entry too broadly.
- Acceptance: equip, lock, sell, use, storage and team actions update the affected view immediately while preserving focus and text-edit state. Do not disable all rendering merely because a button is focused.

### UX-05 · P2 · Delete save has no confirmation or UI recovery

- Reproduce: Settings → Delete on an occupied slot.
- Observed: zero confirmation dialogs; the slot is deleted immediately. Core deletion also removes the backup.
- Cause: `src/ui/main.js:237` directly calls `slots.del`; `src/core/save.js:103` removes both primary and backup.
- Acceptance: confirmation that names the save/slot or a recoverable undo flow; cancelling preserves both primary and backup. Check overwriting another occupied slot/importing into slot 3 as related destructive flows.

### UX-06 · P2 · Monthly plan is buried below the full life log on phones

- Reproduce: load the real adult fixture (`ux-adult-audit`, age 20), leave Log selected on mobile.
- Observed: at 390×844, monthly-plan controls begin at y=5312; at 320×568 they begin at y=6233. Desktop plan begins at y=400. This makes the main monthly decision require several screens of scrolling.
- Cause: `src/index.html:90` puts the character card after the center column while `:92` removes the log's height limit. The plan is inside that card.
- Acceptance: keep monthly plans near the current event or behind an always-reachable shortcut; avoid requiring traversal of the entire history. Verify with long existing saves, not only newborns.

### UX-07 · P2 · Space does not activate a focused button

- Reproduce: pause the game; focus Settings using keyboard; press Space.
- Observed: Settings remains closed; gameplay pause toggles instead. Enter and mouse activation are separate paths.
- Cause: `src/ui/main.js:312` prevents default for Space on buttons, not just the gameplay background.
- Acceptance: native Space/Enter activation works on focused controls. The global pause shortcut applies only where it does not consume control activation.

### UX-08 · P2 · Settings actions erase visible import text

- Reproduce: Settings → type a save code → change font size.
- Observed: the import field becomes empty. The stored `ui.importText` is not reset, so hidden text can still be used by Import despite the empty field.
- Cause: `src/ui/main.js:172` recreates the modal; `src/ui/settings.js:30` does not bind the input value to its state.
- Acceptance: preserve the visible text, selection and focus across setting changes; the text that will be imported must match what is displayed.

### UX-09 · P2 · Save/import feedback is behind the settings overlay

- Observed at all three sizes: banner z-index=7 versus modal z-index=20. Hit-testing the visible banner bounds returns the modal above it. Save/import notifications are not shown above the interface where those actions occur.
- Cause: `src/index.html:82-83` layering.
- Acceptance: put feedback inside the active dialog or in an accessible notification layer above it, without stealing focus.

### UX-10 · P2 recommendation · Many phone touch targets are cramped

- Observed: settings buttons are 28px tall; normal controls about 37px and mobile tabs about 34px. The close control reaches about 40px at the largest in-game font setting.
- Cause: `src/index.html:18`, `:21`, `:92`.
- Acceptance: enlarge common phone hit areas to roughly 44×44 CSS px (or provide equivalent spacing), including save/delete and bottom tabs. Recheck 320px width and the largest text option.

### UX-11 · P1 · Selecting 16× freezes progression

- Reproduce: start/load a newborn with policy Stop and speed 16×; allow 1.3 seconds, save and inspect age. Select 8× and allow another 0.5 seconds.
- Observed: age stays at 0 months at 16×, then advances to 3 months at 8×. No JavaScript exception warns the player.
- Cause: `src/ui/layout.js` offers 16×, but `src/ui/main.js:20` only defines timings for 1/2/4/8. The loop compares its accumulator to `undefined`.
- Acceptance: every offered speed advances, persisted speeds are validated, and keyboard speed changes use the same supported list. Decide whether 16× is supported or remove it consistently.
- Evidence: `research-results.json`, test `speed16`.

### UX-12 · P1 · A null settings record prevents startup

- Fault injection: set localStorage `riftledger.cfg.v2` to the valid JSON string `null`, then reload.
- Observed: empty start screen; uncaught `Cannot read properties of null (reading 'speed')`.
- Cause: `src/ui/main.js:24-27` catches JSON syntax errors but does not validate the parsed object's shape.
- Acceptance: null, primitive, array, unknown policy/speed and invalid font values fall back to safe supported settings; preserve life saves and show a usable start screen. Test normal persisted settings too.
- Evidence: `research-results.json`, test `null_config`. This is corrupt-data resilience, not a claim that normal settings controls produce null.

### UX-13 · P2 · Deleting the active slot is undone by quitting

- Reproduce: load slot 1 → Settings → Delete slot 1 → return to title using the modal's Quit action.
- Observed: slot is absent immediately after Delete, then returns on Quit.
- Cause: `src/ui/main.js:237-240` deletes storage without clearing `ui.slot`; Quit saves the still-active life into that slot. Annual autosave uses the same association.
- Acceptance: define deletion explicitly: either detach the active life from that slot or explain/confirm the lifecycle. A deleted save must not silently reappear. Test Quit and the next autosave checkpoint.
- Evidence: `research-results.json`, test `deleted_active_save_returns` (Quit path reproduced; annual path source reviewed).

### UX-14 · P1 · Incomplete imported saves overwrite good data and then crash

- Fault injection: save a normal life in slot 3; paste `{"v":2,"seed":"x","name":"x","ageM":0,"st":{},"log":[],"world":{},"r":{}}` and Import; load slot 3.
- Observed: success message `นำเข้าลงช่อง 3 แล้ว`; the existing slot is overwritten, no backup is created, and load throws `Cannot read properties of undefined (reading 'seenTab:log')`.
- Cause: `src/core/save.js` validates a few top-level keys but accepts a state missing fields consumed by gameplay. `importStr` writes directly, bypassing the backup used by normal Save. The UI always targets slot 3.
- Acceptance: validate/migrate the entire required state before writing; reject unsupported saves with a visible reason; preserve original data on rejection/write failure; require confirmation before replacing an occupied slot and maintain a recoverable backup. Test valid old-version imports as well as malformed data.
- Evidence: `research-results.json`, test `invalid_import_overwrites`. This is a deliberate invalid-data test, not a claim that normal exports produce this JSON.

### UX-15 · P2 recommendation · First-play auto-choice is too implicit

- Owner specifically questioned why initial settings skip decisions for the player.
- Source-confirmed: `src/ui/main.js:27` defaults to speed 2×, policy `important`, paused false. This is **not** the policy named Skip. `src/core/auto.js` actually chooses some options automatically; it does not merely hide text. Stop/noAuto, milestones and other protected choices have guards.
- Current tutorial mentions automatic minor choices, so the issue is consent, discoverability and pace rather than completely absent documentation. A returning player's previously selected policy is restored.
- Recommendation: first profile starts at 1× and Stop, or asks for an explicit first-play auto-choice selection before progression. Explain in Thai that auto mode selects outcomes on the player's behalf. Let returning players retain their deliberate choice and provide an obvious reset.
- Acceptance: fresh profile has no automatic event resolution before opt-in; the active policy is visible; onboarding text matches actual behavior; returning preferences persist. Treat this as a product decision requested by the owner, not a proven violation of the approved spec.

## Research benchmarks

These sources support interaction recommendations; this is not a full accessibility certification:

- [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): move focus inside, contain Tab navigation, inert background and return focus on close (UX-03). ARIA attributes alone do not implement this behavior.
- [WAI-ARIA button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/): Space and Enter activate a focused button (UX-07).
- [WCAG 2.2 target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): 24×24 CSS px with exceptions. The measured 28px height is **not by itself a WCAG failure**. Approximately 44×44 is a stronger touch-usability recommendation / enhanced criterion (UX-10).
- Official W3C repository documents were retrieved during this audit. No contrast failure or screen-reader compliance claim is made without testing it.

## What worked in this run

- Mouse navigation through Log, Me, World and Collection; selecting a monthly focus; saving/exporting/reloading a life with storage available.
- Settings font changed to 17px after its render frame; Escape closes settings; its lower buttons can be reached by scrolling inside the dialog.
- No document-level horizontal overflow at 1440×900, 390×844 or 320×568. On small adult screens the bottom tab bar intentionally scrolls internally (478px content inside 390px/320px).
- Build completed. Current core suite: 198 tests passed, zero failures/skips. These passing tests do not cover the confirmed browser interaction defects.
- No uncaught page errors in the main browser scenario run.

## Evidence and rerun

Evidence is tracked alongside this report in `evidence/` so Claude does not need the original cloud workspace:

- `audit.mjs`, `results.json`: initial interaction and fault-injection scenarios.
- `followup.mjs`, `followup.json`: inventory state versus rendered UI and font checks.
- `metrics.mjs`, `metrics.json`: mobile plan positions and overlay hit-testing.
- `research.mjs`, `research-results.json`: 16×, corrupt settings, deleted-slot resurrection and invalid import.
- Four selected viewport screenshots plus `core-tests.log` (198 passing tests).

### Rerun

From the repository root: install dependencies, run `npm run build`, and serve the root with `python3 -m http.server 5182 --bind 127.0.0.1`. Run scripts with Node. Install Playwright separately if needed; set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` and `CHROMIUM_PATH` to the browser executable. Defaults match the audit cloud environment. Stop any existing server using 5182 first.

Scripts write only ignored `.tools/ux-audit/` / `.tools/ux-research/` outputs and isolated browser storage. They import core source directly for fixtures. Inspect the result JSON against each acceptance criterion after fixing; these diagnostic scripts record observations and are not a comprehensive assertion-based regression suite.

### Limits and follow-up

Not covered: physical iOS/Safari/Android devices, actual gamepad input, every hunter combat/end-of-life flow, screen-reader output, contrast matrix, performance on low-end phones or a complete WCAG audit. Device sizes and touch were emulated in Chromium. No production fixes were made.

Before closing the mobile work, check long hunter inventories, team/storage actions, combat and inheritance screens, zoom/large text, and reduced-motion settings on real devices. These are remaining test areas, not established bugs.

Art integration is tracked separately on `codex/art-brief-completion`; avoid treating missing renderer registrations as new artwork requests. When validating new assets, verify both DOM icons and stage sprites; unknown stage art can fall back to a generic sprite.

### Claude implementation checklist

- [ ] Fix P1 persistence/import and preserve existing valid/legacy saves.
- [ ] Fix accidental touch/keyboard decisions and dialog focus management.
- [ ] Fix speed list/config validation and add focused regression checks.
- [ ] Resolve save lifecycle, stale UI and visible feedback issues.
- [ ] Bring mobile decisions into reach and apply the owner's first-play preference.
- [ ] Rerun the reproduced cases plus repository-required checks; record fixed commit and evidence per ID.
