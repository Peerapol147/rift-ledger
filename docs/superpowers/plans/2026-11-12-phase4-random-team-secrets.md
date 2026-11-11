# Phase 4: Random Layer, Team, Secret Quests, Collection Book — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the parts of the spec that make each seed different and make replaying worth it:
- NPC teammates with loyalty and their own short stories
- civilian partners
- secret quests with real rewards, including the only source of the Phoenix Token
- a cross-life collection book that unlocks starting families and small bonuses
- more random events by age, place and job

**Architecture:**
- Team members are plain JSON records in `s.team` (no new state shape beyond the fields named here).
- Team, secrets and the book live in their own core modules: `team.js`, `secrets.js`, `book.js`. Each registers through `registry.js`.
- Content goes in `src/data/team.js`, `src/data/secrets.js`, `src/data/unlocks.js`, and more files under `src/data/events/`.

**Tech Stack:** Same as Phases 2 and 3.

**Spec:** `docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`:
- §4.2 (random layer)
- §8 (team)
- §10 (collection book)
- §11.1 (never reveal secrets)
- §7.5 (one revival item)

## Global Constraints

- Secret quests are never labelled as secret. Their options stay hidden until their requirement is met (existing lock rules).
- At most one Phoenix Token per life. It comes only from a secret quest.
- Collection bonuses total no more than +10% to stats (spec §10). Unseen entries show as `???`.
- A teammate's true loyalty is never shown as a number. The UI shows a mood word (spec §11.1).
- Determinism, line length, and at least one need-free option per event, as before.

## Review Focus

1. **Being a member:** the leader's choices never override the player's own decision points, and a kicked-out player keeps their items.
2. **Team in fights:** teammates add power and fill roles. A lost ally (`lose.ally`) removes or kills a real teammate, never an empty slot.
3. **Betrayal and leaving:** these come only from low loyalty after things the player did, never at random with high loyalty.
4. **Secret quest gating:** a seed's secret quests are fixed by the seed. Their first step is reachable in normal play by at least 30% of lives in the sim.
5. **Book unlocks:** an unlock never applies twice. Starting a life with the book empty behaves exactly as today.
6. **Saves:** team and book data round-trip. Old Phase 3 saves without `s.team` fields still load.

---

### Task 1: Team members and recruiting

**Files:**
- Create: `src/core/team.js`, `src/data/team.js`
- Modify: `src/core/ops.js` (team power and roles in `heroPower` / prep, and `lose.ally`), `src/ui/tabs/team.js`, `src/ui/prep.js`
- Test: `test/team.test.mjs`

**Member record:** `{ id, n, rank, cls, role, lv, age0M, loyalty: 0..100, mood, alive, hurtUntilM, story: 0 }`

**Interfaces:**
- `recruitOffers(s) -> member[]`
  - 0–3 offers, seeded per year
  - rank within ±1 of the player's
  - hire fee by rank
- `hire(s, member) -> boolean`
  - costs gold
  - at most 4 members
- `dismiss(s, id)`
- `teamPower(s) -> { atk, def, hp, roles: Set }`
  - members add 35% of their own power
  - a hurt member adds nothing
- `loyaltyMonth(s)`:
  - pay share and wins raise loyalty
  - losses, unpaid months and choices tagged `ally: -n` lower it
  - loyalty < 20: a leave or betray event, chosen by seed
- `moodWord(loyalty) -> "ภักดี" | "พอใจ" | "เฉยๆ" | "ไม่พอใจ" | "คิดจะไป"`
- `lose.ally`:
  - picks the lowest-loyalty member present
  - on a boss op it dies; otherwise it is hurt for 6 months and loses 10 loyalty

**Tests:**
- hire and fee
- team power adds to the fight
- `lose.ally` hits a real member
- low loyalty → leave event
- mood words never show numbers

### Task 1b: Joining someone else's team (owner request)

The player can also be a **member** of a team led by an NPC. Sources are roster names, story characters, or a guild offer.

**State:** `s.party = { leader: npcId, trust: 0..100, rank: "member" | "vice" }`. The player is in their own team or in someone else's, never both.

**Who decides:**
- The leader picks the gate (rank up to leader rank − 1) and the battle plan.
- The player still decides their own decision points inside the gate.

**Money and progress:**
- Share is 40%, or 60% as vice.
- XP gets +30%.
- Team power from the leader's team applies.

**Trust:**
- Rises with wins and loyal choices. Falls with failed or selfish choices, including leaving an ally behind.
- High trust: promotion to vice, then an offer to inherit the team when the leader retires.
- Low trust: kicked out, or left behind inside a gate (a boss-op risk).

**Exits:**
- Leave peacefully.
- Split off and take members whose loyalty to the player is at least 60.
- Betray the leader: one big payout, a fame loss and a lasting enemy.

**Civilians:** the same model as a trusted employee of an NPC-owned business. Promotion goes to partner, and inheritance or a takeover can happen.

**Tests:**
- Gate choice follows the leader, and the player's decision points still open.
- The share is applied.
- Trust drives promotion and the kick-out.
- Splitting takes only members with loyalty ≥ 60.

### Task 2: Teammate stories (2–3 chapters each, random per member)

**Files:** Create `src/data/team-stories.js`; modify `src/core/stories.js` (team chains keyed by member id, gap [10, 18]).

8 story templates × 3 chapters:
- a debt
- a sick sibling
- a rival guild's offer
- a hidden rank
- an old grudge against a monster type
- a wish to retire
- a romance
- a secret from the black market

Each member gets one template by seed. Outcomes move loyalty and can end in leaving, death, or loyalty 100 ("ไว้ใจกันจนตาย").

### Task 3: Civilian partners and staff

**Files:** Modify `src/core/team.js` and `src/ui/tabs/team.js`.

- Civilians with a business flag (`ownFirm`, `shopChain`, `ownClinic`, `ownRestaurant`, `ownLogistics`, `ownAgency`, `ownAppraisal`, `ownPress`, `ownForge`) can hire up to 4 staff. They use the same records with role `staff`.
- A business yields monthly profit:
  - base by flag
  - × staff bonus
  - − wages
- Profit goes through `addLedger("กำไรกิจการ")`.
- Loyalty works as in Task 1. A staff betrayal is embezzlement, which costs gold.

### Task 4: Secret quests

**Files:** Create `src/core/secrets.js`, `src/data/secrets.js`; Test: `test/secrets.test.mjs`.

**Data:** `SECRETS = { id: { steps: [Event], start: { if, age, where?, who? }, reward } }`.

- Each seed picks 3 of the secret quests at birth (stream `secret`).
- Step 1 opens when its `start` holds. Each later step is scheduled with `next` from the previous outcome.

**Quests (8):**
- **the Phoenix Token** — a dying hunter's last request across 3 steps; reward: the token
- **the parking ticket with a name** — follows `silentTicket` from tower floor 1–5; reward: a Legendary weapon
- **the drowned world's song** — needs `drownedSong`; reward: a skill book
- **the child at the shelter** — needs `teachKid` or `docSaved`; reward: an ally who never betrays
- **the black market ledger** — needs `blackMarket`; reward: gold or exposure
- **the gate that opens every 7 years**; reward: a class evolution
- **the Bangkok subway, year 24** — needs `sawRift`; reward: +rank ceiling 1
- **the unmeasured legend's apprentice** — fame 60+; reward: training

**Tests:**
- the same seed gives the same 3 quests
- the token is granted once
- the steps run in order
- the sim reach is at least 30% for step 1 of at least one quest

### Task 5: Collection book unlocks

**Files:** Create `src/core/book.js`, `src/data/unlocks.js`; modify `src/ui/tabs/book.js`, `src/ui/main.js` (apply unlocks at `newLife`); Test: `test/book.test.mjs`.

**What the book records:**
- titles
- classes ever held
- secret quests finished
- causes of death
- calendar entries seen

**Unlocks:**
- 4 extra starting families. Examples: "ครอบครัวผู้รอดชีวิตจากรถไฟใต้ดิน" after `cal24` is seen; "ตระกูลช่างตีเหล็ก" after `legendCraft`.
- Stat bonuses of +1 to +2% each, capped at +10% in total.

`applyUnlocks(s, book)` runs once at birth, records `s.flags.unlocksApplied`, and is idempotent.

The UI shows every slot. Locked ones read `???` with a count.

### Task 6: More random events (the random layer)

**Files:** Add `src/data/events/places.js` and `src/data/events/jobs.js`, and grow `kid.js`, `teen.js` and `adult.js`.

Add about 40 events:
- 10 per age band
- 10 city-specific (Bangkok, Chiang Mai, Phuket, Seoul, Busan, Incheon)
- 10 job-specific, using `who`

Each event can set counters that the secret quests and team stories read.

### Task 7: Re-tune and verify

Run all three sim policies and the browser smoke test (`ui2.cjs` style). Update the README tables and tag the release.
