# Life Plans and Choices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plans explain themselves and pull their kind of event, a secondary plan, an effect tag on every option, and a third option on every two-option random event.

**Architecture:** A pure `kindsOf(ev)` infers an event's kinds; plans in `src/data/stats.js` carry `kinds` and `desc`; `randomEvent` multiplies each pool event's weight by `planWeight(s, ev)` and marks the opened event with the plan that pulled it. `optionView` gains `fx` chips. Content tasks add events for thin kinds and a third option everywhere.

**Tech Stack:** Node 20+ ES modules, `node:test`, Playwright for the phone screenshot.

**Spec:** `docs/superpowers/specs/2026-11-13-life-plans-and-choices-design.md` (including "คำตอบจากการตรวจของผู้ลงมือ")

## Global Constraints

- Narrative Thai, original; never the reference game's text, names or characters.
- Lines in `src/core`, `src/data` ≤ 120 chars (`node tools/linelen.mjs`; `python3 tools/wrapdata.py FILE` wraps data).
- Same seed → same life. Old saves without `focus2` or `grab` play on.
- Main plan ×2.5, secondary ×1.5 on event weight; event chance per month unchanged.
- Secondary plan: half monthly `st` gains, ×1.5 weight, nothing else; `hunt` and `work` cannot be secondary; only from age 13.
- Effect chips come from the success outcome `y` only: `st` keys, `gold`, `hp`, `mind`, `fame`. Never `c`, `fac`, `act`, or `n`.
- `npm test`, `node tools/lifecheck.mjs 200` clean, `node tools/playtest.mjs 200` median silence ≤ 2 years, `node tools/sim.mjs 1000 --policy normal` exit 0.

## Review Focus

- A teen whose main plan equals the saved secondary (switched main onto it): secondary must clear, not double count. (Task 2 test.)
- Stage change (17→18) where the secondary id does not exist in the adult table: secondary clears. (Task 2 test.)
- An event with no options' `st` and an unmapped tag (e.g. `ข่าวโลก`): `kindsOf` returns `[]` and weight stays 1. (Task 1 test.)
- A third option that spends money must carry `need: { gold }` (life2 rule extended to all files). (Task 7 test.)
- Fate/auto play (`C.autoDecide`) must still pick validly with 3 options. (Task 7: playtest no bugs.)

---

### Task 1: Event kinds

**Files:** Create `src/core/kinds.js`; export from `src/core/index.js`; test `test/kinds.test.mjs`.

**Interfaces:** Produces `KINDS: string[]` = `["study","body","social","money","mind","luck","hunt"]`, `kindsOf(ev) => string[]` (memoised per event object).

- [ ] Test: `kindsOf` of an event whose options give `st:{int}` twice and `st:{cha}` once → `["study"]`; tie `int`/`cha` once each → both; tag `งาน` with no `st` → `["money"]`; `hunter: true` adds `hunt`; `kinds:["luck"]` overrides; tag `ข่าวโลก` and no st → `[]`.
- [ ] Run, FAIL (module missing). Implement per the spec's mapping (most frequent stat across options; tag map; `gold>0`/`jobXp` → money only when no stat wins and the tag gives none; `mind>0` same). Run, PASS. Commit `"core: infer an event's kinds"`.

### Task 2: Plans with kinds, descriptions and a secondary plan

**Files:** `src/data/stats.js` (each plan gets `kinds`, `desc` from the spec table; write the teen/adult/old descs in the same style), `src/core/clock.js` (`focus2List`, `setFocus2`, `applyFocus`), `src/core/state.js` (`focus2: null`), test `test/plans.test.mjs`.

**Interfaces:** Produces `focus2List(s) => plan[]` (age ≥ 13, excludes current main, `hunt`, `work`), `setFocus2(s, id|null)`, `s.focus2`.

- [ ] Tests: every plan in every stage has non-empty `kinds` ⊂ KINDS and `desc`; at 12 `focus2List` is `[]`; at 15 with main `study` it excludes `study`; `setFocus2(s,"work")` at 30 is ignored; secondary `train` gives exactly half the `str` monthly gain of main `train` and no `mind` change; setting main onto the secondary's id clears `focus2`; at 18 a teen-only secondary id clears.
- [ ] FAIL → implement → PASS. Commit `"plans: kinds, descriptions and a secondary plan"`.

### Task 3: Plans pull their events, and say so

**Files:** `src/core/clock.js` (`planWeight`, `randomEvent`), `src/core/events.js` (`openEvent` keeps `fromPlan`; `choose` appends ` · มาจากแผน <n>` to the log text when set), test `test/plans.test.mjs`.

**Interfaces:** Produces `planWeight(s, ev) => number` (2.5 if any kind ∈ main plan kinds, else 1.5 if ∈ secondary, else 1; main wins), `s.ev.fromPlan: string|undefined` (plan name, set only when weight > 1).

- [ ] Test "study plan pulls study events": an adult at 30 with an empty counter set; weighted share of `study` kind in `randomPool(s)` using `planWeight` under main `study` ÷ the same under main `work` ≥ 1.8. Test log suffix after choosing an event opened via a plan.
- [ ] FAIL → implement → PASS. Run lifecheck 60 and playtest 200 (silence ≤ 2y). Commit `"plans: the main plan pulls its kind of event, and the log says so"`.

### Task 4: The first-birthday grab sets the first plan

**Files:** `src/data/events/quiet.js` (`infToy` options set `c: { grab: 1|2|3 }`), `src/core/clock.js` (at the tick where age becomes 4, if `s.c.grab` set: main = `sport`/`study`/`chores`), test `test/plans.test.mjs`.

- [ ] Test: grab 2 → at 4 the main plan is `study`; no grab → `play`; a player who picks another plan at 5 keeps it.
- [ ] FAIL → implement → PASS. Commit `"plans: what the baby grabbed becomes the first plan"`.

### Task 5: Effect chips on options

**Files:** `src/core/events.js` (`optionView` → `fx: string[]`), `src/ui/layout.js` (event option buttons render chips), test `test/events-ui.test.mjs`.

**Interfaces:** `fx` items like `"ปัญญา↑"`, `"เงิน+"`, `"เงิน−"`, `"สุขภาพ−"`, `"จิต+"`, `"ชื่อเสียง+"`; stat names from `STATS` in `src/data/stats.js`.

- [ ] Tests: option `y:{ st:{int:0.3}, gold:-500, mind:4, c:{x:1}, fac:{state:2} }` → `["ปัญญา↑","เงิน−","จิต+"]` (order: st, gold, hp, mind, fame); `n` effects never appear.
- [ ] FAIL → implement → PASS. Commit `"ui: options show what they touch"`.

### Task 6: Plan panel

**Files:** `src/ui/layout.js`, `src/ui/main.js` (handler `focus2:`), `src/index.html` (styles `.pdesc`, `.chips`).

- [ ] Panel per the spec sketch: title (planTitle), main buttons, the chosen plan's `desc` line, then from 13 "แผนรอง (ผลครึ่งหนึ่ง)" with `[ไม่มี]` + `focus2List`, and its desc.
- [ ] `npm run build`; Playwright 420×860 screenshots at age 1, 15 and 30 (start a life, advance via `C` is not available in page: click through); check no overflow (`document.documentElement.scrollWidth <= 420`). Commit with `play.html` and ZIP: `"ui: plan panel explains each plan, with a secondary plan"`.

### Task 7: Content — thin kinds and a third option everywhere

**Files:** create `src/data/events/kinds2.js` (≥ 8 original events each for study, mind, luck, hunt; hunt ones `hunter: true`); add a third option to every two-option random event in `kid.js, teen.js, adult.js, hunter.js, more.js, systems.js, places2.js, ages.js, quiet.js, life2.js`; test `test/choices.test.mjs`.

- [ ] Tests: every non-`k` event in `ALL_EVENTS` with ≥ 2 options has ≥ 3; no third-option label is used more than 3 times across all events; every option with `y.gold < 0` has `need.gold ≥ cost` (all files); every event keeps an option with no `need` and `gold ≥ 0`; `KINDS` other than `social` and `money` each have ≥ 12 adult-eligible events.
- [ ] FAIL → write content (a third option is a real third approach: often another stat, a cost or a risk; never a copy of "do nothing") → wrap lines → PASS.
- [ ] lifecheck 200 clean, playtest 200 no bugs and silence ≤ 2y, sim 1000 exit 0. Commit per file batch: `"events: a third option for <file>"`.

### Task 8: Whole-branch check

- [ ] `npm test`, `node tools/artcheck.mjs`, `node tools/linelen.mjs`, sim, playtest, lifecheck; `npm run build`; commit `play.html` + ZIP; push `claude/beautiful-albattani-g86w3v`.
