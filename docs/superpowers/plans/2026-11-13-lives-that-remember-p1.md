# Lives that remember (P0–P1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stable people, a branching story engine, the office career rewritten as a branching story with a
recurring claimant, and a childhood-friend story every life gets.

**Architecture:** New `people.js` (canonical people + relations) and `narrative.js` (graph engine) in `src/core/`,
story data in `src/data/narrative/`. Story nodes open as ordinary events (`s.ev.story = {id, node}`) using today's
option shape plus `go`/`end`, so odds, chips, locks, autopilot and lifecheck keep working. Save schema 2 → 3.

**Tech Stack:** Node ≥ 20, ES modules, `node:test`, esbuild (pinned), no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-13-lives-that-remember-design.md` (owner pack:
`docs/reference/rift-ledger-handoff-pack.md`, office graph = its §03.2 table).

## Global Constraints

- Core: no DOM, no `Date.now`, no `Math.random`; randomness only via `stream(s, name)`.
- Thai player text in the house tone; class/skill/item names stay English; lines ≤ 120 (`node tools/linelen.mjs`).
- Saves keep key `riftledger.slot.v2.*` and `s.v = 2`; `SAVE_SV` becomes 3; a save with `sv > 3` loads as `null`.
- Never show route ids, ending lists, unseen stories, trust numbers or "secret" in UI/HTML.
- A dead or departed person never speaks in a scene and is never replaced by another person in the same role.
- No reward twice: a story node moves at most once per opened event, across reload and double tap.
- Merge gates: `npm test`, linelen, artcheck, `node tools/lifecheck.mjs 200`, `node tools/playtest.mjs 200`,
  `node tools/sim.mjs 1000 --policy <careful|normal|reckless> --seeds a,b,c,d,e` (three runs), `npm run build`.

## Review Focus

1. A child life (3-month ticks) whose story `due` falls between ticks still opens (due compared with `<=`). Task 3.
2. A save made while a story event is open, reloaded, then chosen: the node moves once and money applies once. Task 3.
3. The claimant dies (pulse/roster) while the office story waits: the next scene is `claimant-gone`, never the dead
   person speaking. Task 4.
4. An old save with the legacy office chain at chapter 2 keeps playing the legacy chain; one at chapter 5 never sees
   the new story's rewards. Task 4.
5. The friend is a hunter and the player is not (and the reverse): beat text matches who awakened. Task 5.

---

### Task 1: Schema 3, world month and life ids

**Files:** Modify `src/core/state.js`, `src/core/save.js`, `src/core/heir.js`; create `test/narrative-save.test.mjs`,
`test/fixtures/v2-before.json`, `test/fixtures/v2-office-open.json`, `test/fixtures/v2-office-done.json`.

**Interfaces:**
- Produces: `worldMonth(s): number` (= `(s.mon0 ?? 0) + s.ageM`) in `state.js`; `newLife` sets `s.familyId =
  "fam-" + seed`, `s.lifeId = familyId + ":1"`, `s.narrative = { v: 1, stories: {} }`, `s.relations = {}`,
  `s.world.people = {}`, `s.world.nextPersonId = 1`, `sv: 3`. `newHeir` keeps `familyId`, sets
  `lifeId = familyId + ":" + gen`, resets `narrative` and `relations`. `MIGRATIONS[2]` adds the same defaults.

- [ ] **Step 1:** Generate the three fixtures with a script run once on `main` (sv 2): a plain adult at 30; an office
  worker with the open event `office:1`; an office worker with `ch:office = 5`. Note in a comment at the top of the
  test which seeds made them. Commit the JSON.
- [ ] **Step 2: Write the failing tests** in `test/narrative-save.test.mjs`:
  `v2 loads as v3 and keeps gold, debt, rng and open event` (deep-equal `gold`, `debt`, `r`, `ev` before/after
  `deserialize(fixture)`; `s.sv === 3`; `s.narrative.stories` is `{}`); `a future schema does not load`
  (`deserialize` of `{...fixture, sv: 999}` is `null`); `migration is idempotent` (`migrate(migrate(x))` deep-equals
  `migrate(x)`); `world month survives an heir` (`worldMonth(heir) === worldMonth(parent)` at the heir's birth);
  `an heir keeps the family id and gets a new life id`.
- [ ] **Step 3:** `node --test test/narrative-save.test.mjs` → FAIL (`worldMonth` not exported / sv 2).
- [ ] **Step 4:** Implement. In `deserialize`, return `null` when `sv > SAVE_SV` before migrating.
- [ ] **Step 5:** `node --test test/narrative-save.test.mjs` → PASS; `npm test` → all pass.
- [ ] **Step 6:** Commit `"save: schema 3 with world month and family/life ids"`.

### Task 2: People and relations

**Files:** Create `src/core/people.js`, `test/people.test.mjs`; modify `src/core/save.js` (migration 2 imports),
`src/core/team.js` (`hire`, `dismiss`, `loseAlly`), `src/core/pulse.js` or wherever roster `alive = false` is set,
`src/core/index.js`.

**Interfaces:**
- Consumes: `worldMonth` (Task 1).
- Produces (all in `people.js`, exported via `index.js`):
  `ensurePerson(s, input, sourceKey): string` — same id for same `sourceKey`; person shape
  `{ id, name, country, city, sex, bornWorldM, diedWorldM: null, goneWorldM: null, job: null, hunter: null|{rank,cls},
  tags: [], src: sourceKey }`, ids `"p" + n`;
  `personById(s, id)`; `personAlive(s, id): boolean` (`diedWorldM == null`, never truthiness);
  `personPresent(s, id, city?): boolean` (alive, not gone, and same city if `city` given);
  `setPersonStatus(s, id, patch)`; `relationOf(s, id)` → `{ trust: 0, owe: 0, tags: [], memories: [] }` (created on
  read); `changeRelation(s, id, { trust, owe, tag })` (trust and owe clamped −100..100);
  `remember(s, id, { id, text, worldM })` — idempotent by memory id, keeps last 24;
  `trustWord(t): string` (Thai words, e.g. ≥ 60 "ไว้ใจคุณมาก", ≥ 20 "ไว้ใจคุณ", > −20 "รู้จักกัน",
  else "ไม่ไว้ใจคุณ").
  Roster entries and team members gain `personId`.

- [ ] **Step 1: Write the failing tests:** `same source key gives the same person`; `a person who died in month 0 is
  dead` (`diedWorldM: 0` → `personAlive` false); `migration lists the roster and team without changing them`
  (team member `id`, `rank`, `lv`, `loyalty`, `wounds` deep-equal before/after, each has `personId`, people count =
  roster + team); `hiring lists the member, dismissing marks them gone`; `a roster death marks the person dead`;
  `remember is idempotent and capped at 24`; `two roster people with the same name stay two people`.
- [ ] **Step 2:** `node --test test/people.test.mjs` → FAIL.
- [ ] **Step 3:** Implement; source keys `legacy-roster:<id>` and `team:<lifeId>:<m.id>`; birth month for imports
  from a stable hash of the source key (no RNG stream), tagged `estimatedAge`.
- [ ] **Step 4:** `node --test test/people.test.mjs test/narrative-save.test.mjs` → PASS; `npm test` → all pass.
- [ ] **Step 5:** Commit `"core: one list of people with stable ids, relations and memories"`.

### Task 3: Story engine

**Files:** Create `src/core/narrative.js`, `src/data/narrative/index.js`, `test/narrative-engine.test.mjs`; modify
`src/core/events.js` (`choose`, `fill`, `eventKind`), `src/core/auto.js`, `src/core/index.js`, `src/core/clock.js`
(register monthly via `registry.js`).

**Interfaces:**
- Consumes: Task 2 people API.
- Produces: `STORY_DEFS` (from `src/data/narrative/index.js`, data only, no core imports);
  `startStory(s, id): boolean`; `storyMonth(s)` registered in `monthly` (opens at most one node a month, before the
  legacy `stories.js` monthly); `resolveStory(s, ev, out)` called by `choose` after `applyOutcome` when `ev.story`;
  `followedStory(s): { title, last } | null`; `validateNarrative(defs): string[]` (issue strings).
  Definition: `{ id, title, discover(s): boolean, entry, cast: { role: (s) => personInput|personId }, nodes: { id:
  { t, delay: [min, max], needCast: [roles], when?(s, st): boolean, o: [option] } }, endings: { id: { title,
  apply?(s, st) } }, castGone: nodeId }`. Option = today's option plus on `y`/`n`: `go`, `end`, `route`, `vars`,
  `rel: { role: { trust, owe, mem } }`, and `noAuto` on the option.
  Story state: `{ node, route: null, vars: {}, cast: { role: personId }, due: worldM, status:
  "active"|"paused"|"done", ending: null, lastText: "" }`.
  Text placeholder `{cast:role}` → bound person's name (in `fill`).

- [ ] **Step 1: Write the failing tests** with a small test-only story def passed in:
  `a choice moves to its node and another choice to another node`; `a failed check follows n`;
  `choosing twice moves once` (call `choose` again after resolve: node and gold unchanged);
  `a stale event does not move the story` (saved node changed before choose → no move);
  `save, reload, choose moves once` (serialize/deserialize round trip with event open);
  `due between child ticks still opens` (age 2, due one month after a tick → opens next tick);
  `a dead cast member's node opens castGone instead`; `the cast is bound once` (two starts → same personId);
  `the validator finds a missing node, a check without n, an unreachable node, an undeclared cast role`;
  `autopilot stops on noAuto options` (`autoDecide(s, "skip") === -1`).
- [ ] **Step 2:** `node --test test/narrative-engine.test.mjs` → FAIL.
- [ ] **Step 3:** Implement. Node opens via `openEvent(s, { id: "story:" + id + ":" + node, tag, t, o, important:
  true, story: { id, node } })`; `eventKind` shows it as the ordinary story tier (no part count). Due checks use
  `due <= worldMonth(s)`. Delays roll on `stream(s, "story:" + id)` once when entering a node.
- [ ] **Step 4:** Tests PASS; `npm test` → all pass.
- [ ] **Step 5:** Commit `"core: branching stories with a cast bound once"`.

### Task 4: The office story

**Files:** Create `src/data/narrative/office.js`, `test/office-story.test.mjs`; modify `src/data/narrative/index.js`,
`src/core/stories.js` (skip legacy `office` for lives that start the new one), `src/data/stories/careers.js` (no
change to legacy chapters).

**Interfaces:**
- Consumes: Task 3 definition shape; Task 2 `ensurePerson`, `personPresent`, `changeRelation`, `remember`.
- Produces: story `office` with nodes named as the pack §03.2 table plus `liability`; endings `steady`, `transfer`,
  `reform`, `independent`, `complicit`, `burned`; `castGone: "claimant-gone"`.

Rules (spec §5.4, §5.7): start 1–3 months after an office job at 18+; legacy chain in progress (`ch:office` 1–4 or
open `office:n`) keeps legacy; `ch:office ≥ 5` → new story never starts. Out of office work → `paused`, due kept;
back within 36 months → resumes; else closes with `transfer` (log line, no choice). Claimant: hunter rank 1–3 (E–C),
same country and city, created once with `src: "story:office:claimant:<lifeId>"`. Investigator: Association.
Ending effects: complicit → `c.offDirty`; reform → `c.offClean`, `flags.insureReform`; leak → `c.offLeak`;
independent → `act: "open:ownFirm"` with `need.gold 15000`; burned → `fac.assoc −5`, fame −2; transfer →
`act: "quitJob"`; steady → jobXp 3, mind +5. `client-return` only when claimant present and trust ≥ 40, else
`client-search`. Reform scope by `s.job.lv` (low tier: team trial text, no `insureReform`).

- [ ] **Step 1: Write the failing tests:** `help, duty and gain reach different endings` (three seeded office lives
  driven by choice policies through `advance`/`choose` only; ≥ 3 distinct `ending`); `an unhelped claimant is not
  the first client`; `the firm needs the money`; `a dead claimant gets claimant-gone, then the story continues`;
  `an old save mid-chain keeps the old chain` (fixture `v2-office-open`); `a finished old chain never starts the new
  story` (fixture `v2-office-done`); `leaving office work pauses, and 36 months away closes as transfer`;
  `validateNarrative(STORY_DEFS)` returns `[]`.
- [ ] **Step 2:** `node --test test/office-story.test.mjs` → FAIL.
- [ ] **Step 3:** Write `office.js` (our own Thai text; reuse no line from legacy chapters or the pack's sample).
  Mark route-changing, promise, business-money and lethal options `noAuto`. `python3 tools/wrapdata.py
  src/data/narrative/office.js`.
- [ ] **Step 4:** Tests PASS; `npm test`; `node tools/lifecheck.mjs 200` clean.
- [ ] **Step 5:** Commit `"stories: the office career branches around one recurring claimant"`.

### Task 5: The childhood friend

**Files:** Create `src/data/narrative/friend.js`, `test/friend-story.test.mjs`; modify `src/data/narrative/index.js`.

**Interfaces:**
- Consumes: Task 3 engine; Task 2 people API.
- Produces: story `friend`, started at birth for every life (`discover: () => true`, entry due age 4–7); cast
  `friend` = neighbour child born within ±12 months, same city, `src: "story:friend:<lifeId>"`; whether the friend
  awakens is rolled once at bind on the story stream and stored on the person (`hunter`), never shown early.
  Nodes (spec §5.8): `meet` (4–7), `school` (8–12), `teenFork` (13–17: close/drift/rival), `awaken` (18–20, text by
  who awakened), `ask` (help request, 22–35), `silence` (beat), `reunion` (35–55), `old` (60+), `funeral` (castGone).
  Routes `close`, `drift`, `rival`, `partner`; `partner` needs both unmarried (`max: { married: 0 }`) and trust ≥ 60,
  sets `c.married`, `c.dating`. Endings `lifelong`, `apart`, `rivals-to-end`, `together`. Every node after `meet`
  quotes a stored `lastText` memory of an earlier node.

- [ ] **Step 1: Write the failing tests:** `every life meets a friend between 4 and 7`; `close and drift lives see
  different later nodes`; `a later scene quotes an earlier memory` (text includes the remembered phrase);
  `partner never opens for a married player`; `the friend's awakening is fixed at birth` (same seed → same);
  `awaken text follows who awakened` (four cases: both, only player, only friend, neither → four different texts);
  `a dead friend gets the funeral, which recalls one memory`; `an heir gets a different friend`.
- [ ] **Step 2:** `node --test test/friend-story.test.mjs` → FAIL.
- [ ] **Step 3:** Write `friend.js`; wrap lines.
- [ ] **Step 4:** Tests PASS; `npm test`; lifecheck 200 clean; `node tools/playtest.mjs 200` no bugs, median silence
  ≤ 2 years.
- [ ] **Step 5:** Commit `"stories: a childhood friend who stays in every life"`.

### Task 6: What the player sees

**Files:** Modify `src/ui/layout.js`, the Team tab view under `src/ui/tabs/`, `src/index.html` (CSS);
test `test/ui-stories.test.mjs` (pure view functions).

**Interfaces:**
- Consumes: `followedStory(s)`, `personById`, `relationOf`, `trustWord`.
- Produces: `storyLine(s): string` (HTML, escaped) under the event header "เรื่องที่ติดตาม: <title> — <last>";
  `peopleView(s): string` in the Team tab: name, how you know them (role word), `trustWord`, last memory; children
  see only the friend and family; no unseen stories, no routes, no numbers.

- [ ] **Step 1: Write the failing tests:** `the story line names the title and the last scene`; `the people view
  shows trust as words, never numbers`; `nothing about routes or unseen stories is in the HTML` (no `route`,
  `ending`, story ids); `names are escaped` (a person named `<b>x</b>`).
- [ ] **Step 2:** FAIL → implement → PASS; `npm test`.
- [ ] **Step 3:** `npm run build`; Playwright at 420×860 and 1280×800: a life at 6 (friend met), an office worker at
  30 with the story open; no page errors, `scrollWidth ≤ 420`.
- [ ] **Step 4:** Commit `"ui: the story you follow and the people you know"`.

### Task 7: Whole-branch check

- [ ] Run every merge gate in Global Constraints; compare sim rows with main (careful mind WARN is known); fix
  regressions by TDD.
- [ ] Fresh whole-branch reviewer (most capable model) with the plan, spec and this Review Focus; one fix pass.
- [ ] `npm run build`, commit `play.html` + ZIP, update `docs/HANDOFF.md` (what P1 did, what P2 starts with: the
  fixed guild/family cast).
