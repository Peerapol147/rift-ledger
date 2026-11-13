# Lives that remember — design (adapting the owner's handoff pack to Rift Ledger)

Date: 2026-11-13. Source: the owner's handoff pack "Rift Ledger — Complete Claude handoff" (GPT-written proposal,
sections 00–08), checked against `main` at 352f4a8 (246 tests). The owner said: decide by judgment, base it on the
pack, fit it to our world as closely as possible. Every call below that is not in the pack is marked **(call)**.

## 1. Intent

The same job played twice with different choices must give different people, scenes and endings, for reasons the
player can follow. The person you helped comes back as the same person. A plain civilian life ends whole, without
being the hero. Later phases carry this to cities, guilds, gates and heirs.

Why now: the owner likes how Way of Xian makes lives differ, and our audit confirms the gap is connection, not
volume: career chains still advance one chapter at a time (`src/core/stories.js:34–46`), the office finale says
"your first client is the hunter you once helped" even when you helped no one (`src/data/stories/careers.js:46`),
world NPCs (`world.js` roster) and team members (`team.js` m1, m2…) are separate people, heirs forget what the family
saw.

## 2. Goals, non-goals, anti-goals

Goals (this design, phases P0–P1):
- Versioned save migration so old saves keep playing (sv 2 → 3).
- One list of people with stable ids that stories, news and the team can all point at.
- A branching story engine: nodes, routes, waits, endings, a cast bound once.
- The office career rewritten as a real branching story with a recurring claimant and six endings.
- A small "story you are following" line in the UI.

Non-goals now (roadmap §8): life arcs and the focus queue, relationship requests, city effects, gate variety, family
memory, the other 16 chains, the fixed guild/family cast.

Anti-goals (a failure even if tests pass):
- Branches that differ only in wording or money.
- A dead person speaking, or another person silently standing in for them.
- A reward paid twice after reload or double tap.
- Route names, secret conditions or "secret" labels shown anywhere in the UI or HTML.
- Old saves losing an open chapter or replaying a finished one's reward.
- Copying the model game's text, names, code or art.

## 3. Constraints (from repo rules and the pack)

Core has no DOM, `Date.now` or `Math.random`; RNG by named stream. Thai text, English class/skill/item names. Lines
≤ 120. Saves keep key `riftledger.slot.v2.*` and `s.v = 2`. Gates before merge: `npm test`, linelen, artcheck,
lifecheck 200, playtest 200, sim × 3 policies × seeds a–e, build, browser check.

## 4. Approaches

| | Approach | Trade-off |
|---|---|---|
| A | Only patch the office text and add more events | Cheap, but chains stay a straight line: the audit's main gap stays. |
| **B** | **Add a story graph and a people list on top of today's engine; prove it on the office chain** | Needs a migration and a new engine piece, but keeps every system and balance we have. |
| C | Port the pack's full contract as written (new choice schema, nonce ledger, transactions) | Most "correct" on paper, but duplicates what our event engine already does and costs most. |

Picked **B** (the pack's own recommendation), built in our engine's idiom rather than the pack's literal schema
**(call)**: see §5.3.

## 5. Design

### 5.1 Time and identity
- `worldMonth(s)` in `state.js`: months since Jan 2051, from the world start plus `ageM`, so dates survive an heir.
  New story and people dates use it; old systems keep `ageM`.
- `s.lifeId` and `s.familyId`: deterministic strings; an heir keeps `familyId`, gets a new `lifeId`.

### 5.2 People (`src/core/people.js`)
- `s.world.people = { [id]: { id, name, country, city, sex, bornWorldM, diedWorldM, job, hunter, tags, src } }`,
  `s.world.nextPersonId`.
- `ensurePerson(s, input, sourceKey)` returns the same id for the same `sourceKey` (migration and reload safe).
- Migration imports the 12-person roster (`legacy-roster:<id>`) and team members (`legacy-team:<lifeId>:<m.id>`),
  adding `personId` to the old records; old fields stay so every caller still works. Roster death writes through
  `setPersonStatus`.
- Relations: `s.relations[personId] = { trust, owe, tags, memories[] }`, memories capped at 24 per person and
  idempotent by id. Shown to the player only as words ("ไว้ใจคุณ", "ติดค้างคุณ"), never numbers **(call)**.
- No background aging of NPCs yet (pack P2).

### 5.3 Story graph (`src/core/narrative.js`, data in `src/data/narrative/`)
Our own idiom **(call)**: a node's options use the existing option shape (`l`, `s`, `diff`, `need`, `risk`, `y`, `n`),
so effect chips, odds, locks, the autopilot and lifecheck work unchanged. Each outcome adds
`go: "<node>"` or `end: "<ending>"`, optional `route`, `vars`, `rel: { role: { trust, owe, mem } }`.

- Definition: `{ id, title, who, discover, entry, cast: { role: spec }, nodes: { id: { t, delay:[min,max],
  needCast:[roles], when, o:[…] } }, endings: { id: { title } }, interrupt: { castGone: node } }`.
  `{cast:role}` in text fills the bound person's name.
- State: `s.narrative = { v:1, stories: { id: { node, route, vars, cast, due, status, ending, seen[] } } }`.
- Monthly: for each started story whose `due` has come and node `when` holds, open it as an ordinary event with
  `ev.story = { id, node }`. `choose()` resolves the option exactly like now (same odds, same `applyOutcome`), then
  the narrative step moves the node. Exactly once is already guaranteed by `s.ev = null` before outcomes; resolve
  also checks `ev.story.node` equals the saved node, so a stale event cannot move a story twice.
- Cast bound once at start from the people list (or created once with a reason); never rebound. A `needCast` node
  whose person died or left opens the story's `castGone` node instead.
- Validator (`validateNarrative`, run in tests): every `go`/`end`/interrupt exists, every check has `n`, every node is
  reachable, cast roles used in text are declared, no unknown keys.
- Coexistence: `MIGRATED = ["office"]`. `stories.js` skips migrated chains for lives that did not start the old one.
  A save with the old office chain in progress (`ch:office` 1–4 or an open `office:n` event) finishes the old way;
  `ch:office ≥ 5` counts as done.

### 5.4 The office story (rewrite of `careers.js` office, our own text)
Follows the pack's graph (§03.2): intake → seek-help → claim → appeal → paid / paid-late / denied / denied-honest →
routine → routine-review → audit → pushback / cover-up → liability → investigation → fallout → reform-offer →
independent-offer → client-return / client-search, plus claimant-gone. Six endings: steady, transfer, reform,
independent, complicit, burned. Fitted to our world **(call)**:
- The claimant is a hunter rank E–C hurt in a gate break in the player's own city, with a family; a Thai or Korean
  name from `NAMES` by country.
- The investigator is from the Association (fac `assoc`), the guild client is one of `data/guilds.js`.
- Reform scale follows job tier (`s.job.lv`): low tier gets a team trial, not national law.
- Opening your own firm uses the existing `open:ownFirm` act and needs the money; the first client is the claimant
  only if `claimant` trust is high and alive, otherwise `client-search`.
- Nodes wait 1–24 months; the whole story spans roughly 8–15 years of a career.

### 5.5 Autopilot and UI
- Story options that change route, accept a promise, spend business money or carry lethal risk get `noAuto`; the
  autopilot already stops on `important` and checks, and will stop on `noAuto`.
- UI: one line in the event area's header "เรื่องที่ติดตาม: <title> — <last thing that happened>" and, in the Team
  tab, a short "คนที่รู้จัก" list (name, how you know them, one memory). Children see only family and school. No
  route names, no unseen stories, no endings list.

### 5.6 Save
`SAVE_SV = 3` with migration 2: add `lifeId/familyId`, `narrative`, `people`, `relations`, import roster and team.
Idempotent; a save with `sv` above 3 loads as null (never downgraded). Fixtures of v2 saves (before, office open,
office done) kept under `test/fixtures/`.

### 5.7 Settled after the builder check (all **(call)**)
- **The pack** is kept at `docs/reference/rift-ledger-handoff-pack.md`; the office graph's edges are its §03.2 table
  (node → choices → next), endings its §03.2 list, gates its §05.
- **Start and pauses.** The office story starts 1–3 months after the player takes an office job at 18+. If the player
  leaves office work (quits, fired, becomes a hunter, retires), the story pauses and its due date is kept. Back in
  office work within 36 months: it resumes. Otherwise it closes quietly with the `transfer` ending (a log line, no
  choice). Death simply stops it.
- **What endings leave** (so routes differ beyond money): `complicit` sets `offDirty` (factions read it), `reform`
  sets `offClean` and `insureReform`, the anonymous leak sets `offLeak`, `independent` opens the firm through
  `open:ownFirm`, `burned` costs Association standing (−5) and fame (−2), `transfer` quits the job, `steady` gives
  job XP and a mind lift. The claimant's trust and memories differ by route and are what later stories read.
- **`claimant-gone`** is a node, not an ending: it plays the right note (thanks from family if you helped them, a
  short news line if not) and goes on to `routine-review`, which needs no claimant.
- **Heirs.** `s.world.people` passes on (it is world). `s.relations` and `s.narrative` are per life and reset in
  `newHeir`. An heir in office work starts the story fresh and never binds a person who was a cast member of an
  earlier family story.
- **Which people are listed.** Migration imports roster and team. New team members are listed on hire only (offers
  are not). Team death, `loseAlly`, `dismiss`, roster death all go through `setPersonStatus`.

## 6. Decided by the pack, kept
Pack sections 02.A–I, 03.2 graph and endings, 05 acceptance gates and the C1 paired-choice cohort, scoped to P0–P1.

## 7. Left to the builder
Function splitting, test names, exact Thai copy (in the house tone: daily life beside the strange, dry, specific),
node delays within the ranges, the people-list UI layout.

## 8. Roadmap after P1 (each gets its own design pass)
- **P2** life arcs + story focus/queue + relationship requests (pack T6–T7); **the fixed guild and family cast the
  owner ordered (S-ranks who are the same every seed, some romanceable, some rivals) lands here as the first big
  set of canonical people**.
- **P3** city crisis effects (T8) and gate variety (T9). PR #34's seven themes are a starting point but do not meet
  T9 (≥ 4 decision templates per theme, picked by the real team; solo never reads about teammates), and its
  observatory boss is the tower's secret top-floor boss. Recommendation: close PR #34 and reuse its scene text in P3.
- **P4** family memory, evidence, item provenance (T10; our backlog item 5).
- **P5** the other 16 chains, diversity audit tool (T11–T12).
