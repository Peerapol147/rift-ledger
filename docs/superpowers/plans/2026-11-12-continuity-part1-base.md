# Continuity Part 1 (a sensible base) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No random event repeats in a life unless it declares it may, no broken text, no event that contradicts the life, and a checker that keeps it so.

**Architecture:** A bot checker (`tools/lifecheck.mjs`, with its rules in `test/lifecheck-rules.mjs` so `npm test` runs a small version) plays lives and reports rule breaks. Fixes land in the engine's repeat rule (`src/core/clock.js`), in text templates, in event conditions, and in new Thai events that fill the gaps the stricter repeat rule opens.

**Tech Stack:** Node 20+ ES modules, `node:test`, Playwright (pre-installed) for the phone screenshot.

**Spec:** `docs/superpowers/specs/2026-11-12-continuity-pass-design.md` (section "ส่วนที่ 1")

## Global Constraints

- Narrative text is Thai. Class and skill names stay English (main spec §5.3); item names stay English **[designer]**.
- Lines in `src/core` and `src/data` stay at or under 120 characters (`node tools/linelen.mjs`).
- Never copy the reference game's text, names or characters. New events are original, in the game's own world (21 years after Rift Day, Thailand/Korea).
- Same seed gives the same life (`tools/sim.mjs` checks this).
- No new art; `art/requests.json` is untouched.

## Review Focus

- Old saves: a save where an event already ran 2–4 times must load and play on; the new cap only blocks further draws. (Task 2 test: a life with `s.c["ev:adultGym"]=3` keeps playing.)
- A quiet adulthood: with cap 1 the adult pool may empty; the playtest median "longest silence" must stay ≤ 2 years. (Task 5 verification.)
- A married life that met no one through the teen crush: the adult meet event must still offer a way to love. (Task 4 test.)
- A hunter who stopped hunting at 40 must not be called to a break. (Task 4 test.)
- The milestone at 18 and scheduled stories still fire after the repeat change (they do not go through `randomEvent`). (Task 2: existing tests stay green.)

---

### Task 1: The life checker

**Files:**
- Create: `test/lifecheck-rules.mjs`, `tools/lifecheck.mjs`, `test/lifecheck.test.mjs`
- Modify: `README.md` (one row in the commands table)

**Interfaces:**
- Produces: `checkLives(n: number, prefix?: string) => { lives, repeats: Map<id, livesHit>, badText: Map<sample, count>, ageMisfits: string[] }` from `test/lifecheck-rules.mjs`.
- Rules: an event id (part before `:`) that is not `once` and opened more times in one life than `e.cap ?? 1` is a repeat; text matching `/[A-Z]แตก/`, `/[ก-๙][A-Z][a-z]{3,}/` (English glued to Thai), `/undefined|NaN|\{[a-z]+\}/` is bad text; `hunterBreakCall` opened at age > 60 or after `stoppedHunting`, `adultLove` opened without `s.c.dating` or `s.c.firstLove`, are age misfits.

- [ ] **Step 1:** Write `test/lifecheck.test.mjs`: `checkLives(24, "lc")` returns `repeats.size === 0`, `badText.size === 0`, `ageMisfits.length === 0`.
- [ ] **Step 2:** Run `node --test test/lifecheck.test.mjs`. Expected: FAIL (today repeats ≈ 25 ids, bad text in the thousands).
- [ ] **Step 3:** Implement `checkLives` (drive lives like `tools/playtest.mjs`: random open option, random plan every 6 months). `tools/lifecheck.mjs [n=200]` prints the three lists, top 25 each, exits 1 if any is non-empty.
- [ ] **Step 4:** Commit (test stays red; later tasks turn it green). `git commit -m "tools: life checker for repeats, broken text and misfits"`

### Task 2: One time per life unless declared

**Files:** Modify `src/core/clock.js:15-60`, the event data files that need `cap`.

- [ ] **Step 1:** Add to `test/clock.test.mjs`: a random event without `cap` that has run once is not in the pool (`s.c["ev:adultGym"]=1` → never drawn again in 600 ticks of an adult life); a life loaded with `s.c["ev:adultGym"]=3` plays to death without throwing.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** `REPEAT_CAP = 1`. Mark with `cap` only events that are habits of life by nature (illness, rent rise, scam call, back pain, health check): `cap: 2` and they keep the 60-month cooldown. Everything else becomes once.
- [ ] **Step 4:** `npm test` green except `lifecheck.test.mjs`. Commit `"events: a random event comes once in a life unless it declares cap"`.

### Task 3: Text that reads right

**Files:** `src/data/towers.js` (add `short: "หอเงียบ"` / `"หอจมน้ำ"` / others' Thai name to each tower), `src/core/pulse.js:30-37`, `src/core/world.js:46`, `src/data/calendar.js:94-141`.

- [ ] **Step 1:** Add to `test/world.test.mjs`: every `news` line produced in 30 years of `newLife("txt")` ticks matches neither `/[A-Z]แตก/` nor `/สถิติ\S/`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** In narrative use `TOWERS[t].short` with a space before it: `ทำลายสถิติ ${short}`; rank text `เกตแรงก์ ${r} แตก` (space both sides). Calendar `{name}` in line 141 gets the same space.
- [ ] **Step 4:** Tests green (bar lifecheck). Commit `"text: Thai short tower names and spaced rank letters in news"`.

### Task 4: Events that fit the life

**Files:** `src/data/events/adult.js:66-76`, `src/data/events/adult.js` (new `adultMeet`), `src/core/hunt.js:80-86`, `src/data/stats.js:8-14`, `src/core/clock.js` (`focusList`, `applyFocus`).

- [ ] **Step 1:** Tests in `test/review-fixes.test.mjs`:
  - `adultLove` is not eligible with `c.dating` and `c.firstLove` both unset; eligible with `c.dating=1` at 25.
  - `adultMeet` (age 20–40, once, `max: { married: 0 }`) sets `c.dating` on its yes-branch.
  - `breakCheck` with a hunter aged 61, or `flags.stoppedHunting`, opens `adultBreakNear`, never `hunterBreakCall`.
  - `focusList` at age 1 returns only ids `baby`-tagged plans: `cuddle` ("เล่นกับพ่อแม่") and `nap` ("นอนกลางวัน"); at 5 it returns the old kid plans.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** `adultLove`: `if: { dating: 1 }` with the teen crush's yes-branch also setting `dating: 1`. `adultMeet` text original (e.g. meeting someone at an evacuation shelter drill). `breakCheck`: hunter branch only when `canHunt(s)` and `ageY(s) <= 60`. Kid plans gain `age: [min, max]`; `focusList` filters by it; `applyFocus` falls back to the first plan that fits the age.
- [ ] **Step 4:** Green (bar lifecheck). Commit `"events: love needs a meeting, retired hunters are not called, babies have baby plans"`.

### Task 5: Fill the quiet years

**Files:** Create `src/data/events/life2.js`; modify `src/data/events/index.js`.

- [ ] **Step 1:** Run `node tools/playtest.mjs 200`; note "ช่วงที่ไม่มีให้เลือกนานสุด (มัธยฐาน)". If > 2 years, continue.
- [ ] **Step 2:** Write 40–60 original Thai events: about 25 for 18–59, 15 for 60+, 10 for 13–17; at least 10 two-step pairs (step one sets a counter `c: { x: 1 }`, step two has `if: { x: 1 }` and an age window a few years later and refers to step one, e.g. a neighbour's child you tutored comes back as a young hunter). Same shape as `src/data/events/more.js` (`ev(id, tag, [lo, hi], t, options)`), lines ≤ 120.
- [ ] **Step 3:** Run `node tools/playtest.mjs 200` (median silence ≤ 2 years, no bugs), `node tools/lifecheck.mjs 200` (all lists empty), `npm test` (all green incl. lifecheck), `node tools/sim.mjs 1000 --policy normal` (exit 0). If silence is still > 2 years, add events rather than raise caps.
- [ ] **Step 4:** Commit `"events: 50 new life events and two-step follow-ups for the quiet years"`.

### Task 6: Nothing covers the log

**Files:** `src/index.html:83` (`#banner`), `src/index.html:110-116` (`#bgm` button).

- [ ] **Step 1:** Banner moves to the bottom, above the tab bar: `top:auto; bottom: calc(64px + env(safe-area-inset-bottom))`. The music button moves to the top-right corner (`right:8px; left:auto`) inside the safe area.
- [ ] **Step 2:** `npm run build`, then the Playwright script at 420×860 (click start, ~40 options) screenshots; check by eye that the first log line and the age banner do not overlap anything.
- [ ] **Step 3:** Commit `src/index.html` and `play.html`: `"ui: banner and music button no longer cover the log"`.

### Task 7: Whole-branch check

- [ ] `npm test`, `node tools/artcheck.mjs`, `node tools/linelen.mjs`, `node tools/sim.mjs 1000 --policy normal`, `node tools/playtest.mjs 200`, `node tools/lifecheck.mjs 200` all pass; push `claude/beautiful-albattani-g86w3v`.
