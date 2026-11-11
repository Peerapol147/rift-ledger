# Phase 3: Locked Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fill the locked backbone of the spec: the world calendar, career and class story chains, and towers floors 1–20. First clear the deferred minors from the Phase 2 review, and re-tune the soft balance rows.

**Architecture:** All content goes in `src/data/`. The only new system is the story-chain scheduler, in `src/core/stories.js`. It registers through `src/core/registry.js` like every other module.

**Tech Stack:** Same as Phase 2 (Node `node --test`, esbuild via `npm run build`, vendored pixelfx).

**Spec:** `docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md` §4.1, §3.4, §15 and §18.

## Global Constraints

- Narrative text is Thai. Class and skill names are English. Nothing is copied from a specific manhwa.
- Every event keeps at least one option without `need`. Only options with `risk` can kill.
- Hidden things stay hidden (spec §11.1).
- Lines in `src/core` and `src/data` stay ≤ 120 characters (`node tools/linelen.mjs`).
- Determinism holds: `node tools/sim.mjs` reports `determinism same`.

## Review Focus

1. **Chains:** a chapter must never open twice, and a chain must survive a job change. Changing job pauses the chain; returning resumes it.
2. **Calendar:** views are per city as well as per country, so a Chiang Mai life does not get the Bangkok-subway text.
3. **Saves:** an imported save cannot inject markup. Numbers are coerced, and strings are escaped.
4. **Late-life hunters:** a hunter story chapter never opens after retirement from hunting.
5. **Autopilot:** story chapters are `important`, so they never auto-resolve.

---

### Task 1: Deferred minors from the Phase 2 review

**Files:**
- Modify: `src/ui/*.js`, `src/core/save.js`, `src/core/awaken.js`, `src/core/world.js`, `src/core/items.js`, `src/core/events.js`, `src/core/ops.js`, `src/core/goals.js`, `tools/sim.mjs`
- Test: `test/minors.test.mjs`

- [ ] `deserialize` coerces every number field it reads to a finite number, and rejects a save if `name` or `seed` is not a string. The UI wraps every number in `Number()`.
- [ ] Loading a finished save goes straight to its end screen without counting the life again.
- [ ] `pin` ignores the press when the event has closed.
- [ ] `collection().get()` normalises a bad `seen` or `titles` value to an empty one.
- [ ] Calendar entries may carry a `city` field. A life in the same country but another city gets the `views.nearby` view, or the news line if there is none.
- [ ] Only Legendary (rarity 3) is unique per world. Mythic (rarity 4) can roll only for a player whose rank is EX. The `unmeasured` NPC keeps its class but does not block it.
- [ ] The Phoenix Token does not fire for the cause `อายุขัย`.
- [ ] Options tagged `nerve: true` are locked when `mind < 20`, with lock text `สุขภาพจิตไม่พอ`.
- [ ] Lock text and goal labels show role and skill names, never raw ids.
- [ ] A failed civilian big job logs a work line, not the gate-rescue line.
- [ ] Sim: the start-rank row is a real ±2 check at N ≥ 1000, and the token check covers event `t`.

### Task 2: Story-chain scheduler

**Files:**
- Create: `src/core/stories.js`, `src/data/stories/index.js`
- Test: `test/stories.test.mjs`

**Interfaces:**
- Data: `STORIES = { [chainId]: { who: [careerOrClassOrRoleIds], hunter?: bool, gap: [minM, maxM], chapters: [Event] } }`.
  - Chapter events are ordinary events.
  - The scheduler sets `important: true` and `k: "x"` on each chapter and gives it the id `${chainId}:${n}`.
- Produces:
  - `storyMonth(s)` (monthly): for the life's active chain (career id, class id, or role), open the next chapter when `s.ageM >= s.c["next:" + chainId]`. It then sets the next due month from `gap` using stream `story`.
  - `activeChains(s) -> chainId[]`.
- Rules:
  - At most one chapter per month.
  - Progress is stored per chain in `s.c["ch:" + chainId]`.
  - A chain not matching the current job or class pauses.
  - Hunter chains pause when `canHunt(s)` is false.

### Task 3: Civilian career chains (12 careers × 5 chapters)

**Files:** Create `src/data/stories/careers.js`.

Each chapter:
- Ties the career to the hunter world.
- Offers a stat test, a cheaper safe path and, where it fits, one known-lock option (skill, job, or a gold or stat need).
- Has an outcome that can set counters later chapters read.

Chapter 5 is a turning point with a lasting effect (fame, gold, a permanent flag, or a big-job-like risk).

### Task 4: Hunter role chains (5 roles × 5 chapters)

**Files:** Create `src/data/stories/hunters.js`.

One chain per role: vanguard, striker, support, scout, artisan. Each covers:
- the first party
- a guild offer
- a choice between an illegal gate and the association
- a chapter where a teammate is lost or saved
- a role-defining climax

### Task 5: World calendar to ~20 entries (years 21–100)

**Files:** Modify `src/data/calendar.js`.

Covers:
- gate breaks in Thai and Korean cities
- tower record entries for both towers (rising through 48–60 over the life)
- a world first floor-60 clear by the EX legend
- an association scandal
- a hunter-rights law
- a mana-stone market crash
- a second Rift-Day anniversary memorial
- a foreign tower opening to tourists

Each break gets views for default, hunter, doc, rescue, police and `nearby`.

### Task 6: Towers floors 1–20

**Files:** Modify `src/data/towers.js` (`bands[].decisions`) and `src/core/hunt.js` (`towerOp` uses band decisions when present, else `TOWER_DECISIONS`).

Each 5-floor band of each tower gets 2 decisions of its own, written to its dead world's story.

### Task 7: Re-tune soft rows

**Files:** `src/data/*`, `src/core/*` numbers only.

Target: all three sim policies pass every row. Fallback if a row cannot be reached: record a ruling with the measured value.
