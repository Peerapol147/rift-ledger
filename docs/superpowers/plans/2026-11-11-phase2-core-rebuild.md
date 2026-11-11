# Phase 2: New Core Game (playable birth → death) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old engine with a readable, modular core that plays a full life from birth (year 21 after Rift Day) to death, covering both civilian and hunter paths, with the new UI, autopilot policies, and a balance simulator. Sample content is enough to play one life; full content is Phase 3.

**Architecture:** Pure game logic lives in `src/core/` (no DOM, runs in Node). It operates on one plain-JSON state object `s` and uses seeded RNG streams so the same seed with the same choices always gives the same life. Content lives in `src/data/`, one file per domain. The UI in `src/ui/` only reads the state and calls core functions. `src/stage.js` and all art modules are reused unchanged, apart from one import path.

**Tech Stack:** JavaScript ES modules, Node ≥ 20 (`node --test`), esbuild plus pixelfx for the bundle (existing `build.mjs`), no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`

## Global Constraints

- Lines ≤ 120 characters. One data record per block. Short functions with clear names (spec §13).
- Determinism: same seed + same choice sequence ⇒ identical state. All randomness goes through `src/core/rng.js` streams stored in `s.r` (spec §13).
- Player-facing narrative text is Thai. Class and skill names are English generic genre terms. Never copy trademark names such as "Shadow Monarch" or "Arise" (spec §5.3).
- Never reveal hidden things: hidden rank ceiling, class rarity tier label at awakening, secret quests, secret requirements, or true NPC loyalty. Hint only through in-world Thai text (spec §11.1).
- Locked options 🔒 are shown only when every requirement is a known kind (stat, skill, career, class, role, gold). Options whose requirements include a hidden flag are not shown at all (spec §11.1).
- Rift Day is 2030. The player is always born in 2051. The date is shown as `ปี 2058 (ปีที่ 28 หลังฟ้าแตก)` (spec §3.1).
- Birth country: `th` 65% and `kr` 35%. Real country and city names. Every organisation and person is fictional (spec §3.2).
- Awakening rate is 25%. Starting rank weights are F40 E20 D15 C10 B9 A5 S1. EX chance is 0.00001. Ceiling offset weights are +0:45 +1:40 +2:15 (spec §5.1–5.2).
- Skill slots: 4, plus 1 each at ranks C, A and S (spec §5.3).
- Death is final except for the one-use revival item (spec §7.5).
- No compatibility with old saves. The cross-life collection is stored separately from life saves (spec §13).
- Do not touch `art/`, `audio/`, `src/*-art.js`, `src/hero-*.js` or `src/presets.js` contents.

## Review Focus

1. **Autopilot vs. death.** On autopilot in an ordinary gate, the hero must never die from a decision the player did not see. If every option risks death, autopilot stops (`-1`). Tests are in Task 9 and Task 12.
2. **Money that goes negative with no visible reason.** Every change to `s.gold` must go through `addLedger`, so the money tab can always explain it. Test in Task 6.
3. **Hidden information leaking.** The class rarity label, rank ceiling and secret flags must not appear in any `optionView` or log text. Tests in Task 4 and Task 7.
4. **Life ending mid-event.** Death during an event outcome or an operation must close the event and stop ticking cleanly, with no throw on the next `tick`. Test in Task 3.
5. **Corrupt or old save in localStorage.** Loading must fall back to the start screen without crashing, and the collection must survive. Test in Task 14.

---

## File Map

| File | Responsibility |
|---|---|
| `src/core/rng.js` | Moved from `src/rng.js` unchanged. Seeded streams |
| `src/core/state.js` | `newLife`, date/age helpers, stage of life |
| `src/core/clock.js` | `tick`: the monthly step, focus, scheduling, aging and death |
| `src/core/events.js` | Event eligibility, option views (lock rules), `choose`, `applyOutcome` |
| `src/core/money.js` | Ledger, living costs, debt |
| `src/core/body.js` | Health, mental health, injuries, lifespan |
| `src/core/work.js` | Careers, ladders, promotion, monthly pay |
| `src/core/awaken.js` | Awakening, rank, hidden ceiling, rank-up, class roll |
| `src/core/ops.js` | Shared "operation" engine: prep → auto rounds → decision points. Combat and civilian big jobs |
| `src/core/hunt.js` | Gates, towers, gate breaks, building operations from tables |
| `src/core/world.js` | Seed NPC roster, world calendar, tower records, moving between cities |
| `src/core/auto.js` | Autopilot policies |
| `src/core/save.js` | Serialize and validate saves, collection store (pure, takes a storage adapter) |
| `src/core/index.js` | Re-exports the public API for UI and sim |
| `src/data/world.js` | Constants: years, countries, cities, ranks, rates |
| `src/data/families.js` | Starting families per country |
| `src/data/stats.js` | Stat ids and Thai labels, focus plans per stage |
| `src/data/careers.js` | Civilian careers with ladders |
| `src/data/classes.js` | 12–15 hunter classes, roles, rarity, art keys |
| `src/data/skills.js` | Skills with trigger rules |
| `src/data/monsters.js` | Moved from `src/monsters.js`, plus stat blocks |
| `src/data/elements.js` | `ELEMENTS` (moved out of old data so `stage.js` keeps working) |
| `src/data/gates.js` | Gate themes and rank bands |
| `src/data/towers.js` | Silent and Drowned towers: floor bands, bosses, records |
| `src/data/calendar.js` | World calendar entries (3 sample entries in this phase) |
| `src/data/milestones.js` | Life milestone events by age |
| `src/data/events/*.js` | Sample events: `kid.js`, `teen.js`, `adult.js`, `hunter.js` |
| `src/data/index.js` | Re-exports all data |
| `src/ui/main.js` | Boot, loop, keyboard, render scheduling |
| `src/ui/layout.js` | Card, event panel, controls, tabs shell |
| `src/ui/tabs/*.js` | `log.js`, `me.js`, `items.js`, `team.js`, `work.js`, `world.js`, `book.js` |
| `src/ui/prep.js` | Operation prep screen and decision cards |
| `src/ui/settings.js` | Auto policy, font size, glossary, save slots |
| `test/*.test.mjs` | One test file per core module |
| `tools/sim.mjs` | Rewritten simulator with player policies and spec §14 targets |

Old `src/engine.js`, `src/data.js`, `src/ui.js`, `src/rng.js`, `src/monsters.js` and `STORY.md` are deleted in Task 16.

## Shared State Shape (every task uses these names)

```js
s = {
  v: 2, seed, name, sex: "m" | "f",
  country: "th" | "kr", city: string, family: string,
  ageM: 0,                                   // months since birth
  st: { str, agi, int, wil, cha, luk },      // numbers
  hp: 100, mind: 100, lifeY: number,         // health, mental health 0–100, lifespan in years
  gold: number, debt: 0, ledger: [],         // ledger: { m: ageM, label, amt }
  flags: {}, c: {},                          // flags = hidden booleans, c = counters
  focus: string,                             // current monthly plan id
  job: null | { id, tier, xp },
  hunter: null | { rank, ceil, cls, lv, xp, skills: [], slots: [], ex: false, broke: 0 },
  injuries: [],                              // { id, untilM | null }
  team: [],                                  // NPC ids (Phase 4 fills; Task 9 uses for prep)
  items: [], equip: {}, quick: [],           // item instances { uid, id, lock }
  world: { roster: [], records: { silent: 47, drowned: 44 }, done: {} },
  ev: null,                                  // open event { id, opts: [...] } or op decision
  op: null,                                  // running operation (Task 9)
  sched: [],                                 // { id, atM } forced events
  goals: [],                                 // pinned goals { kind, key, target }
  log: [],                                   // { m, tag, text, tone }
  dead: null | { cause, ageY },
  r: {},                                     // rng streams by domain
}
```

---

### Task 1: Core scaffold, RNG move, world constants, `newLife`

**Files:**
- Create: `src/core/rng.js` (content of `src/rng.js`), `src/core/state.js`, `src/core/index.js`
- Create: `src/data/world.js`, `src/data/families.js`, `src/data/stats.js`, `src/data/index.js`
- Modify: `package.json` (add `"scripts": { "test": "node --test test/" }`)
- Test: `test/state.test.mjs`

**Interfaces:**
- Produces:
  - `newLife(seed: string) -> State`
  - `ageY(s) -> number` (whole years)
  - `dateText(s) -> string`
  - `stageOf(s) -> "kid" | "teen" | "adult" | "old"` (kid < 13, teen < 18, old ≥ 60)
  - `stream(s, name) -> rng` (lazily creates `s.r[name] = mk(s.seed, name)`)
- Data:
  - `WORLD = { RIFT_YEAR: 2030, BIRTH_YEAR: 2051 }`
  - `COUNTRIES = { th: { n: "ไทย", w: 65, cities: [...] }, kr: { n: "เกาหลีใต้", w: 35, cities: [...] } }` with cities `กรุงเทพฯ, เชียงใหม่, ภูเก็ต` and `โซล, ปูซาน, อินชอน`. Each city: `{ id, n, cost, gateRate }`
  - `RANKS = ["F","E","D","C","B","A","S"]`, `RANK_W = [40,20,15,10,9,5,1]`, `EX_P = 0.00001`, `AWAKEN_RATE = 0.25`, `CEIL_W = [45,40,15]`
  - `STATS = { str: "กาย", agi: "ไว", int: "ปัญญา", wil: "จิต", cha: "เสน่ห์", luk: "โชค" }`
  - `FAMILIES`: at least 4 per country, each `{ id, country, n, d, gold, st: {...}, w }`
  - `NAMES = { th: { m: [...], f: [...] }, kr: { m: [...], f: [...] } }`, at least 12 each

- [ ] **Step 1: Write the failing tests**

```js
import { test } from "node:test"; import assert from "node:assert/strict";
import { newLife, dateText, ageY, stageOf } from "../src/core/index.js";
test("same seed gives identical life", () => assert.deepEqual(newLife("a1"), newLife("a1")));
test("born 2051, date shows years after Rift", () => {
  const s = newLife("x"); s.ageM = 7 * 12;
  assert.match(dateText(s), /^ปี 2058 \(ปีที่ 28 หลังฟ้าแตก\)/);
});
test("country split near 65/35", () => {
  let th = 0; for (let i = 0; i < 2000; i++) th += newLife("c" + i).country === "th";
  assert.ok(th / 2000 > 0.6 && th / 2000 < 0.7);
});
test("family and city belong to the birth country", () => {
  for (let i = 0; i < 200; i++) { const s = newLife("f" + i);
    assert.ok(FAMILIES.find((f) => f.id === s.family).country === s.country);
    assert.ok(COUNTRIES[s.country].cities.some((c) => c.id === s.city)); }
});
test("stages", () => { const s = newLife("s"); s.ageM = 12 * 12; assert.equal(stageOf(s), "kid");
  s.ageM = 17 * 12; assert.equal(stageOf(s), "teen"); s.ageM = 60 * 12; assert.equal(stageOf(s), "old"); });
```

Import `FAMILIES` and `COUNTRIES` from `../src/data/index.js` in the test.

- [ ] **Step 2: Run `npm test`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `src/core/rng.js` (copy), the data files, and `state.js`. `newLife` builds the Shared State Shape and logs one `ชะตา` line describing birth.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): state, rng and world constants for redesign`

### Task 2: Events engine with lock rules

**Files:**
- Create: `src/core/events.js`, `src/data/events/kid.js` (6 sample events)
- Test: `test/events.test.mjs`

**Interfaces:**
- Consumes: `stream`, `ageY` (Task 1)
- Event schema:
  `{ id, tag, t, age: [minY, maxY], who?: [jobOrClassIds], country?, if?: {key: min}, max?: {key: max}, once?: true, important?: true, o: [Option] }`
- Option schema:
  `{ l, d?, s?: statId, diff?: number, need?: { [key]: min }, hide?: [flagKeys], y: Outcome, n?: Outcome }`
- Outcome schema:
  `{ m?: text, gold?, st?: {}, hp?, mind?, c?: {}, flags?: {}, injury?, next?: [eventId, months] }`
- Known requirement kinds: stat ids, `gold`, `skill:<id>`, `job:<id>`, `cls:<id>`, `role:<id>`. Anything else is hidden.
- Produces:
  - `eligible(s, ev) -> boolean`
  - `openEvent(s, ev) -> void` (sets `s.ev = { id, opts }`)
  - `optionView(s, opt) -> { label, desc, odds: number | null, locked: boolean, lockText: string | null, visible: boolean }`
  - `choose(s, i) -> void`
  - `applyOutcome(s, out) -> void`
  - `EVENT_INDEX` (a Map built from all event files)
- Odds: `clamp(35 + (stat - diff) * 4, 5, 95)`. No `s` means `null` odds (certain).

- [ ] **Step 1: Write the failing tests**

```js
test("known requirement shows lock with text", () => {
  const v = optionView(kidState, { l: "x", need: { str: 50 }, y: {} });
  assert.equal(v.visible, true); assert.equal(v.locked, true); assert.match(v.lockText, /กาย 50/);
});
test("hidden requirement hides option entirely", () => {
  const v = optionView(kidState, { l: "x", need: { secretKey: 1 }, y: {} });
  assert.equal(v.visible, false);
});
test("odds formula clamps", () => {
  assert.equal(optionView(st({ str: 100 }), { l: "x", s: "str", diff: 10, y: {} }).odds, 95);
});
test("choose is deterministic and applies outcome", () => {
  const a = run("e1"), b = run("e1"); assert.deepEqual(a, b);
});
test("max/once blocks repeat", () => { /* eligible false after once event chosen */ });
test("view text never contains rank ceiling or rarity words", () => {
  const txt = JSON.stringify(allKidOptions.map((o) => optionView(kidState, o)));
  assert.doesNotMatch(txt, /ceil|Legendary|Mythic|คลาสลับ/);
});
```

`kidState`, `st()` and `run()` are small helpers inside the test file built on `newLife`. `run(seed)` opens `kid.js` event 0, calls `choose(s, 0)` and returns `s`.

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement** `events.js`. Gold changes call `addLedger` from Task 6. Until then, use a local `addGold(s, label, amt)` that Task 6 replaces. Write the 6 Thai kid events for ages 3–12, each with at least one option that has no requirement.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): event engine with known/hidden lock rules`

### Task 3: Monthly clock, focus plans, milestones, aging and death

**Files:**
- Create: `src/core/clock.js`, `src/core/body.js`, `src/data/milestones.js`
- Modify: `src/data/stats.js` (add `FOCUS`)
- Test: `test/clock.test.mjs`, `test/body.test.mjs`

**Interfaces:**
- Consumes: Tasks 1 and 2
- Produces:
  - `tick(s) -> void`. Advances 1 month (3 months while `stageOf` is `kid`). Applies focus, runs scheduled events, rolls random eligible events (at most 1 per tick), runs `yearEnd`, checks death.
  - `setFocus(s, id)`
  - `die(s, cause)`
  - `injure(s, id, months | null)`
  - `changeMind(s, d)`
  - `lifespan(s) -> years`
- Rules:
  - Base lifespan rolls 70–85.
  - Rank bonus `[0,1,2,4,6,10,15]` by rank index; EX gives +25.
  - Each permanent injury −2 years.
  - Mind < 20 locks options tagged `nerve` and raises the chance to quit a job or stop hunting (Tasks 5 and 8 read `s.mind`).
- `FOCUS`:
  - `kid: play, study, sport, chores`
  - `teen: study, train, work, social`
  - `adult`: `work, train, hunt, rest, social` (`hunt` only if `s.hunter`)
  - `old: rest, social, work`
  - Each has `st` gains per month and optional `gold`.
- `MILESTONES`: ages 6, 12, 15, 18, 22, 30, 40, 50, 60. Each is an event with `important: true`, forced into `s.sched` at that exact month.

- [ ] **Step 1: Write the failing tests**

```js
test("milestone opens at exact age", () => { const s = newLife("m"); while (ageY(s) < 6 && !s.ev) tick(s);
  assert.equal(s.ev.id, "ms6"); });
test("tick does nothing after death and never throws", () => { const s = newLife("d"); die(s, "test");
  assert.doesNotThrow(() => tick(s)); assert.equal(s.ageM, 0); });
test("death inside an outcome closes the event", () => { const s = withOpenEvent({ hp: -999 });
  choose(s, 0); assert.ok(s.dead); assert.equal(s.ev, null); });
test("civilian old-age death between 70 and 85 + bonuses", () => { /* run 50 seeds choosing option 0 */ });
test("whole life is deterministic", () => assert.deepEqual(playAll("z"), playAll("z")));
```

`playAll(seed)` ticks and always chooses the first visible unlocked option until `s.dead`, then returns `s`.

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement.** `hp <= 0` calls `die(s, cause)`. Old age is checked in `yearEnd`. `die` sets `s.ev = null` and `s.op = null`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): monthly clock, milestones, body and death`

### Task 4: Awakening, rank, hidden ceiling, class roll

**Files:**
- Create: `src/core/awaken.js`, `src/data/classes.js`, `src/data/skills.js`
- Test: `test/awaken.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–3
- `CLASSES`: 12–15 entries.
  - Shape: `{ id, n (English), role: "vanguard"|"striker"|"support"|"scout"|"artisan", rarity: 0..4, main: statId, art: string, skills: [[lv, skillId], ...], d (Thai) }`
  - Every role is covered at least twice. At least 3 artisan or support non-combat-earning classes: Smith, Appraiser, Healer, Barrier Maker.
  - `art` is an existing `art/professions/class-*.png` basename or an existing `profession-art.js` key.
  - Rarity tiers: `["Common","Rare","Advanced","Legendary","Mythic"]`. Weights: `[70, 22, 7, 0.9, 0.1]`.
- `SKILLS`: `{ id, n (English), kind: "active"|"passive", trigger: { when: "start"|"lowAlly"|"vsEl"|"every", el?, every? }, eff: { dmg?, heal?, def?, mul? }, d (Thai) }`
- Produces:
  - `awakenCheck(s, cause: "screen"|"event"|"late") -> boolean`
    - At 18 the milestone calls it with `AWAKEN_RATE` adjusted by ±0.03 from childhood counters `c.nearRift` and `c.trainHard`.
    - `late` is a monthly chance of 0.0004 for ages 25–45.
  - `rollRank(r) -> 0..6`
  - `rollCeil(r, rank) -> rank..6` (adds 0/1/2 using `CEIL_W`, capped at 6)
  - `rollClass(s) -> classId`. The seed gives 3 aptitude classes (weights 3/2/1.2 times `1 + max(0, st[main] - 8) * 0.08`). Rarity is rolled first, then a class within that rarity. A Legendary class owned by a roster NPC is excluded.
  - `canRankUp(s) -> boolean`: `lv >= LV_CAP[rank]` and `rank < ceil`
  - `rankUp(s)`
  - `ceilingHint(s) -> string | null`: Thai hint when `lv >= LV_CAP[rank] * 0.9` and `rank === ceil`
  - `slotsFor(rank) -> 4 + [3,5,6].filter((x) => rank >= x).length` (C=3, A=5, S=6)
  - `LV_CAP = [10, 20, 30, 40, 55, 70, 90]`
- On awakening, the log uses in-world text only, for example `"ผู้ประเมินเงียบไปนานผิดปกติ"` when rarity ≥ 2. Rarity is never printed.

- [ ] **Step 1: Write the failing tests**

```js
test("rank distribution within ±2 points", () => {
  const n = 20000, cnt = Array(7).fill(0); const r = mk("rk", "x");
  for (let i = 0; i < n; i++) cnt[rollRank(r)]++;
  [40,20,15,10,9,5,1].forEach((w, i) => assert.ok(Math.abs(cnt[i] / n * 100 - w) <= 2, `rank ${i}`));
});
test("ceiling never below rank, at most +2", () => { /* 5000 rolls */ });
test("cannot rank up past ceiling", () => { const s = hunterAt(0, 0); s.hunter.lv = 99;
  assert.equal(canRankUp(s), false); });
test("awakening rate at screening near 25%", () => { /* 4000 lives: 23–27% */ });
test("every class has art, roles covered twice", () => { /* checks fs for art file or ART key */ });
test("slots", () => assert.deepEqual([0,3,5,6].map(slotsFor), [4,5,6,7]));
test("log after awakening has no rarity words", () => { /* doesNotMatch /Rare|Advanced|Legendary|Mythic/ */ });
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement.** EX rank is `rank = 7`, label `"EX"`. Roll it with `EX_P` before the normal rank roll.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): awakening, ranks with hidden ceiling, class roll`

### Task 5: Careers and promotion

**Files:**
- Create: `src/core/work.js`, `src/data/careers.js`, `src/data/events/teen.js`, `src/data/events/adult.js`
- Test: `test/work.test.mjs`

**Interfaces:**
- `CAREERS`: 12 entries.
  - Shape: `{ id, n (Thai), tiers: [5 Thai titles], pay: [5 monthly], need: { tier: { stat: min } }, hunterOnly?: true, civOnly?: true, d }`
  - Must include: general hospital doctor `doc`, hunter hospital doctor `hdoc` (needs class role `support` or skill `heal`), gate logistics porter, office worker, shopkeeper, journalist, police, teacher, hunter agency staff, appraiser clerk, rescue worker, cook.
- Produces:
  - `jobOffers(s) -> careerId[]` (filtered by `need[0]`, `hunterOnly`, `civOnly`)
  - `takeJob(s, id)`
  - `quitJob(s)`
  - `workMonth(s)`: adds `job.xp` from focus `work` and the main stats, pays via `addLedger`
  - `canPromote(s) -> boolean`
  - `promote(s)`: needs `xp >= 12 * (tier + 1)` and the `need[tier + 1]` stats
- At most 30% of careers may promote everyone to tier 4. Tier 4 needs a stat ≥ 40.
- Teen and adult sample events: 6 each, including one per milestone 15/18/22 choice path.

- [ ] **Step 1: Write the failing tests**

```js
test("hunter hospital requires support role or heal skill", () => {
  assert.ok(!jobOffers(civAdult).includes("hdoc"));
  assert.ok(jobOffers(healerAdult).includes("hdoc"));
});
test("promotion needs xp and stats", () => { /* tier stays 0 when stat short */ });
test("pay goes through ledger", () => { workMonth(s); assert.equal(s.ledger.at(-1).label, "เงินเดือน"); });
```

- [ ] **Step 2–4:** Run (FAIL) → implement → run (PASS).
- [ ] **Step 5: Commit** `feat(core): careers with ladders and promotion`

### Task 6: Money, living cost, debt

**Files:**
- Create: `src/core/money.js`
- Modify: `src/core/events.js` (replace `addGold` with `addLedger`), `src/core/clock.js` (call `living(s)` monthly)
- Test: `test/money.test.mjs`

**Interfaces:**
- Produces:
  - `addLedger(s, label: string, amt: number)`: the only writer of `s.gold`. Pushes `{ m, label, amt }`. The ledger keeps only the last 24 months.
  - `living(s)`: city `cost` × 1, plus hunter upkeep, plus kids. Costs start at age 18. Under 18 the family pays.
  - `borrow(s, amt) -> boolean`: cap `= max(5000, monthlyIncome * 24)`, 1% monthly interest
  - `repay(s, amt)`
  - `monthSummary(s) -> { in: [{label, amt}], out: [...], net }` for the current month
- When debt exceeds the cap, the hidden counter `c.default` increments and the `debtCollector` event is scheduled.

- [ ] **Step 1: Write the failing tests**

```js
test("every gold change has a ledger line", () => {
  const s = playMonths("g", 400); const sum = s.ledger.reduce((a, e) => a + e.amt, 0);
  assert.equal(Math.round(s.gold - s.startGold), Math.round(sum)); // with ledger window disabled in test mode
});
test("no living cost before 18", () => { /* gold unchanged by living() at 10 */ });
test("borrow cap", () => { /* borrow above cap returns false */ });
```

The test sets `s.flags.fullLedger = true` so the ledger keeps everything.

- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): ledger-backed money, living cost and debt`

### Task 7: Monsters, gates, towers, NPC roster, world calendar

**Files:**
- Create: `src/data/monsters.js` (moved from `src/monsters.js`, each entry gains `{ hp, atk, def, el, traits: [] }` scaled by `tier`), `src/data/elements.js`, `src/data/gates.js`, `src/data/towers.js`, `src/data/calendar.js`
- Create: `src/core/world.js`, `src/core/hunt.js`
- Modify: `src/stage.js:20` (import `ELEMENTS` from `./data/elements.js`)
- Test: `test/world.test.mjs`, `test/hunt.test.mjs`

**Interfaces:**
- `GATES`: 3 sample themes.
  - Shape: `{ id, n, ranks: [min,max], mon: [names], boss: name, decisions: [Decision] }`
  - Decision shape: `{ t, o: [Option + { risk: 0..1, lose?: { item?, ally? } }] }`
- `TOWERS`: `silent` (th) and `drowned` (kr).
  - Shape: `{ id, n, country, record, bands: [{ from, to, t (Thai band story), mon, boss }] }`
  - Floors 1–20 get explicit band rows.
  - Floors 21–50 are generated by `genFloor(tower, floor)` from the band with scaled stats, tagged `filler: true`.
- `CALENDAR`: 3 sample entries.
  - Shape: `{ id, year, country, kind: "break"|"record"|"news", t, views: { default: Event, [jobOrClassId]: Event }, outcome: (s) => ... }`
  - Year-24 S-rank gate break in Bangkok
  - Year-30 Silent Tower record by roster NPC
  - Year-27 Korea news
- Produces:
  - `initWorld(s)`: rolls the roster of 12 notable NPCs per seed. Each: `{ id, n, country, rank, cls, fame, alive }`. Includes the record holders and one EX-rank legend.
  - `calendarMonth(s)`: opens the matching `views[job or class] ?? views.default`. If the player is in another country, logs it as news instead.
  - `recordFloor(s, tower, floor, byPlayer)`: updates `s.world.records` and the log. If the player sets a record first, the scheduled NPC record entry turns into news about the NPC failing.
  - `gateOffers(s) -> Gate instance[]`
  - `breakCheck(s)`: a monthly chance by city `gateRate`, raised by `calendar` entries
  - `moveCity(s, cityId)`: cost 3× city `cost`. Cross-country moves also set `flags.relicense` and halve job tier.
  - `towerOp(s, tower, floor)` and `gateOp(s, gate) -> OpDef` for Task 9

- [ ] **Step 1: Write the failing tests**

```js
test("records start at 47 and 44", () => assert.deepEqual(newLife("w").world.records, { silent: 47, drowned: 44 }));
test("calendar break fires in year 24 for Thai lives in Bangkok", () => { /* forced country/city */ });
test("player record pre-empts NPC record", () => { recordFloor(s, "silent", 48, true);
  advanceToYear(s, 30); assert.match(lastLog(s), /ล้มเหลว|ไม่สำเร็จ|ช้ากว่า/); });
test("floors 21–50 generate with rising difficulty", () => { assert.ok(genFloor(T, 40).mon[0].atk > genFloor(T, 21).mon[0].atk); });
test("foreign-country calendar becomes news", () => { /* kr life sees th break as log tag ข่าวโลก */ });
test("legendary class held by roster NPC is never rolled for player", () => { /* 3000 seeds */ });
```

- [ ] **Step 2–4:** FAIL → implement → PASS. Also run `node -e "import('./src/stage.js')"` and expect no import error. Node may reject canvas usage, but only module resolution is checked here.
- [ ] **Step 5: Commit** `feat(core): world roster, calendar, gates and towers`

### Task 8: Hunter progression loop

**Files:**
- Modify: `src/core/clock.js` (focus `hunt` / `train`), `src/core/awaken.js` (XP and level)
- Create: `src/data/events/hunter.js` (8 sample events: license exam, first party, rank re-evaluation, hiding rank offer, retirement thoughts at 45+)
- Test: `test/hunter.test.mjs`

**Interfaces:**
- Produces:
  - `gainXp(s, n)`, `xpNeed(lv) -> number` (`round(40 * lv^1.5)`)
  - Monthly focus `hunt` offers a gate via `s.ev` built from `gateOffers`.
  - Focus `train` raises the main stat. Gains near the ceiling shrink by `max(0.2, 1 - lv / LV_CAP[ceil])`.
  - Power decline from age 45: −1% of combat stats per year (computed in `ops.js`, not stored).
  - Mind < 20 gives a 3%/month chance of the `burnout` event (stop hunting option).
- Hunter income: gate payouts by rank. Median income for rank ≥ C hunters > civilian median > F–E median, as verified in Task 13.

- [ ] **Step 1: Write the failing tests:** XP curve, training slows near ceiling, decline after 45, burnout event reachable when `mind` < 20.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): hunter leveling, training and decline`

### Task 9: Operation engine (combat and civilian big jobs)

**Files:**
- Create: `src/core/ops.js`
- Test: `test/ops.test.mjs`

**Interfaces:**
- `OpDef`:
  `{ id, kind: "gate"|"tower"|"job", t, foes?: [Monster], power?: number, decisions: [Decision], rewards: { gold, items: [] }, boss?: true }`
- Prep: `{ plan: "push"|"careful"|"retreat", skills: [ids], quick: [itemUids], team: [npcIds] }`
- Produces:
  - `startOp(s, def, prep)`: sets `s.op = { def, prep, round, hp, foeHp, log: [], step }`
  - `stepOp(s) -> "running" | "decision" | "won" | "lost" | "fled"`
    - One round: hero, team and foes act. Skills fire on their `trigger`.
    - Decisions open at rounds `2` and `5` (bosses also at `8`), set as `s.ev` with `opts`.
  - `decide(s, i)`: applies the option. `risk` rolls death or injury, using the same `optionView` lock rules.
  - `endOp(s)`: rewards, injuries, team losses, log summary
  - `heroPower(s) -> { atk, def, hp }`: from stats, rank, level, gear and age decline
- Civilian `job` ops use `power` from career stats instead of foes. They have no foes and run decision rounds only.
- Death: `lost` on a boss op or a `risk` roll → `die`. On a non-boss op, `lost` means injury plus flee.
- Retreat plan auto-flees at 50% hp.

- [ ] **Step 1: Write the failing tests**

```js
test("same prep same seed same result", () => assert.deepEqual(runOp("o1", P), runOp("o1", P)));
test("skill vsEl doubles damage vs element", () => { /* foe el ice, skill vsEl ice mul 2 */ });
test("retreat plan flees at half hp instead of dying (non-boss)", () => { /* weak hero */ });
test("boss loss can kill", () => { /* 200 weak runs: some s.dead */ });
test("locked decision option needs skill", () => { /* option need skill:telekinesis shows lock */ });
test("civilian job op runs decisions without foes", () => { /* kind job */ });
```

- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): shared operation engine for gates, towers and big jobs`

### Task 10: Items, storage and loadouts (core)

**Files:**
- Create: `src/core/items.js`, `src/data/items.js` (rarity colours shared: `RARITY = [{ n: "Common", c: "#b9c6d6" }, …]` five entries)
- Test: `test/items.test.mjs`

**Interfaces:**
- `ITEMS`: weapons, armour, charms, potions, materials, skill books, and one revival item `phoenixToken` (`use: "revive"`, rarity 4). Each is `{ id, n, kind, slot?, rarity, stats?, use? }`.
- Produces:
  - `giveItem(s, id, from: string) -> uid` (the instance stores `from` for provenance)
  - `equip(s, uid)`, `lockItem(s, uid, on)`, `sellItem(s, uid) -> boolean` (false if locked)
  - `compare(s, uid) -> { [stat]: delta }`
  - `sortFilter(items, { kind?, minRarity?, q?, sort: "rarity"|"name"|"new" })`
  - `bagCap(s) -> 20`
  - `saveLoadout(s, name)`, `useLoadout(s, name)`
  - `autoJunk(s, rule: { belowRarity })`: never sells locked or equipped items
- `die` checks for an unused `phoenixToken`: it consumes it, sets `hp = 30`, logs, and does not die. Only one is ever granted per life.

- [ ] **Step 1: Write the failing tests:** locked item cannot be sold; autoJunk skips equipped and locked; compare deltas; revival consumes the token once; second fatal blow kills.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): items, provenance, locks, loadouts and revival token`

### Task 11: Goals, notifications, summaries

**Files:**
- Create: `src/core/goals.js`
- Test: `test/goals.test.mjs`

**Interfaces:**
- Produces:
  - `pinGoal(s, { kind: "stat"|"gold"|"rank"|"job", key, target })`
  - `goalProgress(s) -> [{ label, cur, target, done }]`
  - `pinFromOption(s, optView)`: pins the known requirement of a locked option
  - `alerts(s) -> [{ kind, text }]`
    - Fires when hp < 30, mind < 25, debt > 80% of cap, or a known calendar entry is ≤ 6 months away (known = seen in a previous life via the collection, or announced in news)
    - Team loyalty alerts use mood words only
  - `yearSummary(s, year) -> { lines: [] }`
  - `deathSummary(s, unseenCount) -> {...}`: the count of locked or hidden options never taken in this life. It shows the count only, never what they were.

- [ ] **Step 1: Write the failing tests:** pin from locked option creates stat goal with cur/target; alerts fire at thresholds; death summary contains a number and no option labels of hidden options.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): pinned goals, alerts and summaries`

### Task 12: Autopilot policies

**Files:**
- Create: `src/core/auto.js`
- Test: `test/auto.test.mjs`

**Interfaces:**
- Produces: `autoDecide(s, policy: "stop"|"important"|"skip") -> number` (option index, or `-1` meaning wait for player)
  - `stop`: always `-1`
  - `important`: returns `-1` when `ev.important`, an op decision is on a boss or a break, any option is a long-term trade-off (`noAuto: true`), or **every** visible unlocked option has `risk > 0`. Otherwise it picks the highest-odds option with `risk === 0`, without negative `mind` or gold below 0.
  - `skip`: like `important`, but only stops at milestone or calendar events and when all options are risky
- Default policy is `important`. Stored in UI settings, not in `s`.

- [ ] **Step 1: Write the failing tests**

```js
test("never picks a death-risk option when a safe one exists", () => { /* op decision with risk options */ });
test("all options risky → -1", () => {});
test("milestone → -1 under important", () => {});
test("important policy finishes a civilian life with ≤ 40 stops", () => { /* count -1 returns */ });
```

- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): autopilot policies`

### Task 13: Simulator with spec targets

**Files:**
- Replace: `tools/sim.mjs`
- Test: run it

**Interfaces:**
- Consumes: `src/core/index.js`
- `node tools/sim.mjs [lives=300] [--policy careful|normal|reckless]`
  - Player policies decide every `-1`:
    - `careful`: lowest risk, and plan `retreat`
    - `normal`: highest odds, and plan `careful`
    - `reckless`: highest reward, and plan `push`
  - Focus choice for adults: hunters pick `hunt` with these frequencies: careful 40%, normal 60%, reckless 85%.
- Static checks (fail with exit code 1):
  - every `next`, `who`, `art`, skill id and monster name resolves
  - every event has at least one option without `need`
  - no `{token}` the engine cannot fill
  - no line in `src/core` or `src/data` longer than 120 chars
- Prints a table of the spec §14 metrics with PASS/FAIL per row:
  - awaken 23–27%
  - rank dist ±2
  - hunter death < 50: reckless ≈ 20–30%, careful ≤ 8%
  - civilians old-age ≥ 85%
  - income order: C+ > civ > F–E
  - ceiling hit 30–50%
  - determinism
- Exit code 1 if any static check fails or determinism fails. Metric FAILs print as warnings and do not fail the run until Phase 3 content lands. Awaken rate, rank distribution and determinism are hard-fail.

- [ ] **Step 1:** Write the sim.
- [ ] **Step 2:** Run `node tools/sim.mjs 300 --policy normal`, `node tools/sim.mjs 300 --policy careful` and `node tools/sim.mjs 300 --policy reckless`. Tune `src/data` numbers until all hard rows PASS and soft rows are reported.
- [ ] **Step 3: Commit** `feat(tools): simulator with redesign balance targets`

### Task 14: Save system and collection book (storage only)

**Files:**
- Create: `src/core/save.js`
- Test: `test/save.test.mjs`

**Interfaces:**
- Produces:
  - `serialize(s) -> string`
  - `deserialize(str) -> State | null`: returns null unless `v === 2` and the required keys exist
  - `slots(store, n = 3)`: `{ list(), load(i), save(i, s), del(i), exportStr(i), importStr(str) }`
  - `collection(store)`: `{ get(), addTitle(t), addSeen(kind, id) }` under key `riftledger.book.v2`
- `store` is an adapter `{ get(k), set(k, v), del(k) }` so tests pass a Map-backed fake.
- Keys: `riftledger.slot.v2.<i>`. Old `riftledger.save.v1` is ignored, never read as v2.

- [ ] **Step 1: Write the failing tests:** round-trip; garbage string → null; v1 JSON → null; collection survives deleting all slots; import of invalid string returns false.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(core): save slots, import/export and collection store`

### Task 15: New UI

**Files:**
- Create: `src/ui/main.js`, `src/ui/layout.js`, `src/ui/prep.js`, `src/ui/settings.js`, `src/ui/tabs/{log,me,items,team,work,world,book}.js`
- Modify: `src/index.html` (styles: rarity colour tokens from `RARITY`, tab bar at bottom under 820px, `font-variant-numeric: tabular-nums` on numbers, `--fs` font-size variable)
- Modify: `build.mjs`
  - entry becomes `src/ui/main.js`
  - its validations read the new data modules: every class or career id needs `STYLE[LOOK[id]]` (add `LOOK` rows in `src/presets.js` only by mapping new ids to existing style keys), and every monster needs a picture
- Test: manual run in browser (see steps), plus `npm test` still green

**Interfaces:**
- Consumes: `src/core/index.js`; `initStage`, `setScene`, `setHero`, `trigger` from `src/stage.js`
- Layout per spec §11.2:
  - left card: name, age, date, hp, mind, gold, rank or job title, monthly plan buttons
  - centre: stage and speed controls `1×/2×/4×/8×` plus the auto policy dropdown
  - right: event card
  - bottom tabs: บันทึก, ตัวฉัน, ของ, ทีม, งานและเงิน, โลก, สมุดสะสม
- Progressive disclosure:
  - `ทีม` and `งานและเงิน` hidden until `stageOf` is `teen` or later, or `s.job` is set
  - class and skills section hidden until `s.hunter`
  - each newly revealed tab shows a one-time Thai banner
- Event card:
  - option rows show label, desc, odds badge and a lock row `🔒 ต้องการ <label> <n> · คุณมี <m>` with a 📌 pin button calling `pinFromOption`
  - invisible options are not rendered
- Prep screen (`prep.js`): loadout picker, 4+ skill slots per `slotsFor`, quick items, plan radio. A missing-role warning lists roles absent from the team.
- `งานและเงิน` tab: `monthSummary` table, ledger list, debt with borrow/repay buttons
- `ของ` tab: `sortFilter` controls, compare arrows ↑↓, lock toggle, auto-junk rule, loadouts
- `โลก` tab: calendar of seen entries, tower records, roster news
- `สมุดสะสม` tab: collection with unseen slots shown as `???`
- Settings: auto policy (default `important`), font size 3 steps, glossary list, save slots 3, export/import
- Keyboard: `1–9` choose, `Space` pause, `+/−` speed, `A` cycles auto policy
- Death screen: `deathSummary`, title, buttons for a new life

- [ ] **Step 1:** Build the shell and event card. Verify in Chromium via Playwright. Load `play.html`, start a life, run at 8× with policy `important` for 120 s, and expect age ≥ 20. Take a screenshot.
- [ ] **Step 2:** Build the tabs and prep screen. Verify with a Playwright script that clicks every tab with no `pageerror`.
- [ ] **Step 3:** Settings, saves and death screen. Verify that save → reload → load restores the same age and gold, and that a corrupt slot (set to `"xx"`) shows the start screen.
- [ ] **Step 4:** Verify phone width 390px: no horizontal scroll (`document.documentElement.scrollWidth <= 390`) and tabs at the bottom.
- [ ] **Step 5: Commit** `feat(ui): new layout, tabs, prep screen, settings and saves`

Note: `node build.mjs` needs `../pixelfx-main` with its `node_modules`, per README. If it is missing in the environment, stop and ask the owner to run the build locally or to allow cloning pixelfx.

### Task 16: Remove old code and update docs

**Files:**
- Delete: `src/engine.js`, `src/data.js`, `src/ui.js`, `src/rng.js`, `src/monsters.js`, `STORY.md`
- Modify:
  - `README.md`: new content table pointing to `src/data/*`, the test and sim commands, and a link to the spec
  - `src/stage.js` / `src/monster-art.js`: import monsters from `./data/monsters.js`
- Test: `npm test`, `node tools/sim.mjs 300`, `node build.mjs` (if pixelfx present), `grep -r "engine.js\|data.js" src tools build.mjs` returns nothing

- [ ] **Step 1:** Delete and fix imports.
- [ ] **Step 2:** Run all checks. Expected: tests PASS, sim hard rows PASS, build prints `play.html: … KB JS`.
- [ ] **Step 3: Commit** `chore: remove old engine, data and story bible`
