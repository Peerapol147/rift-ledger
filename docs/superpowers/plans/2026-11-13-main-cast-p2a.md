# Main cast (P2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nine fixed cast members who live their own slightly random lives, whose lives the player can change through
four branching stories, named in world news and tower records.

**Architecture:** Cast table in `src/data/cast.js`; cast people created in `s.world.people` (P1 `ensurePerson`, key
`cast:<id>`); a monthly `updatePeople` in `src/core/cast.js` rolls each member's life on `cast:<id>` streams; stories in
`src/data/narrative/` write onto people through a new outcome key `castAct`. Calendar records resolve their holder at
the time of the record.

**Tech Stack:** Node ≥ 20, ES modules, `node:test`, Playwright for UI checks.

**Spec:** `docs/superpowers/specs/2026-11-13-main-cast-design.md` (§4 table, §5 rolls, §6 influence, §7 stories, §12
settled answers). References the spec cites: `docs/reference/way-of-xian-notes.md` §3–4, pack 02.M and 03.6.

## Global Constraints

- Same cast identities every seed; lives not locked: rolls on `cast:<id>` streams only; `pulse` and `world` streams
  draw exactly as before (§12.5).
- Ranks never exceed `ceiling`; cast never joins the player's team.
- Romance only with `romance: true`, |age difference| ≤ 5, both unmarried, trust ≥ 60.
- No secrets in UI; trust and rolls never shown as numbers; Thai text in the house tone; lines ≤ 120.
- Save schema stays 3; cast added to older saves by an idempotent repair.
- Gates: `npm test`, linelen, artcheck, lifecheck 200, playtest 200, sim × 3 policies × seeds a–e (balance rows as
  main), `node tools/ux-check.mjs`, build.

## Review Focus

1. A save made before P2a (sv 3 without cast) loads, gets the cast once, and loading again adds no one. Task 1.
2. A cast member dies in the background while their story waits: the story goes to its gone-node, never a live scene
   with them. Task 4 (each story) test.
3. Two seeds, no player involvement: the same cast member ends year 60 with a different rank or alive/dead state in
   at least some seeds (not locked), and never above ceiling. Task 2.
4. A calendar record falls due after its holder retired or died: someone else alive gets it, the news names them, and
   no dead person sets a record. Task 3.
5. An heir loads the world: cast are older, dead ones stay dead, `ties` words show, and no cast story replays for the
   heir unless its entry fits. Task 5.

---

### Task 1: The cast exists in every world

**Files:** Create `src/data/cast.js`, `src/core/cast.js`, `test/cast.test.mjs`; modify `src/core/world.js`
(`initWorld`: after the roster is built, `addCast(s)` and point `silentHolder` → poramet, `drownedHolder` → seojin),
`src/core/people.js` (`repairPeople` also calls `addCast`), `src/core/index.js`, `src/data/guilds.js` (add `tier`:
`"legend" | "major" | "shadow"`), `src/data/families.js` (export `HUNTER_FAMILIES` with ศิลาวงศ์, ยุน).

**Interfaces:** `CAST: { [id]: { name, sex, country, city, bornY, rank, ceiling, cls, guild, family, role, romance,
awakenAt?: 18 } }` (values from spec §4; `bornY` years relative to 2051); `addCast(s): void` (idempotent; sets
person fields `cast: id`, `rank`, `ceiling`, `guild`, `hunter` or null until awakened, `ties: {}`); `castPerson(s, id)`
→ person | null; `castId(person)` → id | null.

- [ ] Tests: `every seed has the same nine cast members` (two seeds: same names, ranks, classes, births);
  `the record holders are poramet and seojin` (roster `silentHolder.n === CAST.poramet.name`); `world draws are
  unchanged` (roster ids/ranks of non-holder entries equal those from main for seed "w1" — capture before the change
  in the test as a literal); `an old save gets the cast once` (fixture `v2-before` → 9 cast; reload → still 9);
  `guild tiers are labels` (every guild has a tier in the three words).
- [ ] FAIL → implement → PASS; `npm test`.
- [ ] Commit `"cast: nine fixed people in every world"`.

### Task 2: Their own lives, a little random

**Files:** Modify `src/core/cast.js` (register `updatePeople` in `monthly` before `narrativeMonth`); test
`test/cast-life.test.mjs`; create `tools/cast-cohort.mjs`.

**Interfaces:** `updatePeople(s): void` — per cast member, from `person.nextRollWM` (start: birth + 18y or now), every
24 months on stream `cast:<id>`: promote 20% (if awakened, < ceiling), injury 8% (`hurtUntilWM` = now + 6..18 months),
guild change 3% (guild members only, tier ±1, same country). Once seeded at creation: `retireAtY` 55..65 (hunters),
`lifeMaxY` 70..90. Gate-break death 1%/year at rank ≤ A, 0.3% at S, while hunting and not retired; halved when
`person.city === s.city` and `relationOf(s,id).trust >= 40`; zero while `savedUntilWM > now`. Awakening at 18 for
`awakenAt` members (rank 0, joins their country's legend or major guild by a seeded pick). Deaths and retirements log a
`ข่าวโลก` line once. Rival boost: trust ≤ −40 → promote 35%.

- [ ] Tests: `batched years equal monthly steps` (two copies, one advanced 120 months at once vs month by month →
  deep-equal people); `a month already processed changes nothing`; `ranks never pass the ceiling` (200 seeds × 70
  years); `lives differ across seeds` (poramet or seojin alive/rank at world year 60 differs in ≥ 10 of 100 seeds);
  `the pulse stream is untouched` (`s.r.pulse` equal with and without cast updates after 10 years); `a saved friend
  survives more` (cohort 300 seeds: deaths of thongbai by year 70 with trust 60 + same city < without).
- [ ] `tools/cast-cohort.mjs`: prints per member alive%, mean rank, retired% at world years 30/60/90 over 100 seeds.
- [ ] FAIL → implement → PASS; `npm test`; sim normal × a–e unchanged.
- [ ] Commit `"cast: they live their own lives, a little different every world"`.

### Task 3: Records and news name them

**Files:** Modify `src/core/world.js` (record events: holder = `recordHolder(s, rosterId, country)`); test
`test/cast-news.test.mjs`. `pulse.js` is not changed: cast news comes from `updatePeople` (Task 2) and records (§12.5).

**Interfaces:** `recordHolder(s, rosterId, country): { name, personId | null }` — the cast holder if alive and hunting;
else the highest-rank living hunting cast member of that country with rank ≥ 5 (A); else the roster entry. A record
by a cast member raises their rank to S if below ceiling allows.

- [ ] Tests: `a retired holder's record goes to the strongest living cast hunter`; `with no cast hunter the roster
  name is used`; `a dead person never sets a record`; `pulse news draws the same numbers as before` (stream equality).
- [ ] FAIL → implement → PASS. Commit `"cast: tower records and news follow who is alive"`.

### Task 4: Stories that change them

**Files:** Modify `src/core/narrative.js` (outcome key `castAct`, allowed in the validator), `src/core/events.js` (new
yearly event `castDrill` for Thai lives 12–40 that starts thongbai's story); create `src/data/narrative/thongbai.js`,
`silawong.js`, `yoon.js`, `hong.js`; tests `test/cast-stories.test.mjs`.

**Interfaces:** `castAct: { role: "rescued" | "injured" | "quitGuild" | "joinGuild:<id>" | "rankUp" | "retire" |
"partner" | "enemy" | "friend" | "owes" }` applied to the bound cast person; `rescued` sets `savedUntilWM` = now + 120;
`partner` sets player `c.married`, `c.dating` and person `ties[familyId] = "partner"`; friend/enemy/owes set `ties`.
Story cast spec binds the fixed person: `cast: { x: () => ({ id: castPersonId }) }`.

Stories (spec §7, entry rules from §12.3): thongbai (Thai, 12–40, drill or home-city break); silawong (Bangkok peers
born within ±5 years of lalin, from school age; poramet + lalin); yoon (Korean peers within ±5 of harin, or any hunter
at the national screening; harin + seojin); hong (Thai, 18+, gold < 2000 or a shop/appraise job or a sale of loot).
Each: ≥ 6 scenes, ≥ 3 endings, a non-awakened road, `castGone` node, later scenes recall a real memory, romance node
gated by the global romance rule.

- [ ] Tests per story: validates; `three choice policies reach ≥ 3 endings over 5 seeds`; `a dead cast member gets the
  gone node`; `romance never opens outside the age window or when married`; `a rescue keeps them alive through the next
  background break` (savedUntil); `castAct writes onto the person`.
- [ ] FAIL → write data → PASS; `npm test`; lifecheck 200 clean; playtest 200 no bugs.
- [ ] Commit per story: `"stories: <name>"`.

### Task 5: Seeing them, and heirs

**Files:** Modify `src/ui/tabs/world.js` (guilds by tier word; cast the player has heard of or met: name, guild, rank
letter if public, alive/retired/gone; nothing else), `src/ui/people.js` (cast met appear in คนที่รู้จัก; `ties` word for
this family), `src/core/heir.js` (ties survive in world people; nothing else carried); tests in `test/ui-stories.test.mjs`
and `test/cast.test.mjs`; `tools/ux-check.mjs` case `cast-world` (390 px: world tab lists guilds by tier, no overflow).

- [ ] Tests: `heirs see the family tie as a word`; `a cast member never heard of is not listed`; `no numbers for trust
  or rolls in the HTML`; ux-check case. FAIL → implement → PASS.
- [ ] Commit `"ui: the guilds by tier and the cast you know"`.

### Task 6: Gates and review

- [ ] All gates; `node tools/cast-cohort.mjs` (report: lives differ, ceilings hold); fresh reviewer on the branch; one
  fix pass; build; handoff note in `docs/HANDOFF.md`.
