# Five more cast stories (P2b-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give mingyu, dohyun, seojin, poramet and pim a branching story each, reachable by hunters and civilians, without touching balance or the engine.

**Architecture:** Each story is a data file in `src/data/narrative/<id>.js` built like `hong.js` on the P1 engine (`core/narrative.js`) with the helpers in `castref.js`, registered in `src/data/narrative/index.js`. The shared harness in `test/cast-stories.test.mjs` (validates, three-ways play, death → gone scene) covers each new story by adding a `SETUP` row; each task adds its own entry tests. A new cohort tool measures who meets which story.

**Tech Stack:** Node ES modules, `node --test`, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-13-cast-stories-p2b1-design.md` (and P2a `docs/superpowers/specs/2026-11-13-main-cast-design.md` §7, §12, §13, still binding).

## Global Constraints

- Each story: ≥ 6 scenes, ≥ 3 endings, a `gone` scene per speaking cast member (`castGone`), three options per scene, the most life-changing option `noAuto`, every scene after the first recalls a real earlier memory through `first`/`latest`.
- `needCast` lists every cast role that speaks or appears alive in that scene.
- Text fits every life that reaches it: either sex, hunter or never-awakened, the right country, any age in the entry window. No top-floor tower truth, no unmeasured one's nature. No scene says who holds a tower record now.
- Retired seojin/poramet: scenes read `personOf(s, st, role).retired` and show the retired version (training hall / home), never a gate or a new record by him.
- Korean-only stories `active: (s) => s.country === "kr"`, Thai-only `=== "th"`, `pauseMax: 120`.
- No new engine or save state, no changes to cast background rolls, no randomness on `pulse`/`world` streams.
- Romance: none in these five stories (pim's has none by design; mingyu/dohyun/seojin/poramet are not `romance: true`).
- Lines ≤ project limit (`node tools/linelen.mjs`). Names of classes/skills/items stay English; story text Thai.

## Review Focus

1. A Korean life that moves to Thailand mid-story (and back): the story pauses and closes cleanly after 10 years — owned by Task 2 (test pins mingyu pausing in Thailand).
2. seojin or poramet retires or dies between two scenes: the next scene shows the retired version, or the gone scene — Task 4 and Task 5 tests pin the retired text.
3. A life that already started `yoon` / `silawong` never starts the father's solo story, and one that finished it still doesn't — Task 4/5 tests.
4. An heir whose parent's tie with silawong is `enemy` gets the cold greeting and can reach `rivals`; with no tie, the drill version — Task 6 test.
5. A gone cast member never starts a story: every `discover` returns false when the cast member is dead — each story task's test.

---

### Task 1: Measure who meets which cast story, and a lifecheck rule for the cast

**Files:**
- Create: `tools/cast-story-cohort.mjs`
- Modify: `test/lifecheck-rules.mjs` (in `misfit` or the per-event check: an open story scene whose `needCast` person is dead)
- Test: `test/lifecheck.test.mjs`

**Interfaces:**
- Produces: `node tools/cast-story-cohort.mjs [n=100]` prints, per country (th, kr) and generation (1, heir), the share of lives that started each cast story (`thongbai silawong yoon hong mingyu dohyun seojin poramet pim`, missing ids show 0%), split hunter/civilian, and the share that started at least one. Lives: seeds `csc-<i>`, auto choices (`firstOpen`), played to death or 85; heirs via `C.newHeir(parent, seed)` from that life when `C.canHeir`, else skipped (report the count).

- [ ] **Step 1:** Write test `lifecheck: a story scene with a dead cast member is reported` — build a life, start `hong` (set Thai, age 25, gold 0, advance until `s.ev?.story?.id === "hong"`), then mark hong dead with `C.setPersonStatus(s, id, { diedWorldM: C.worldMonth(s) })` while the scene is open; assert the lifecheck rule function returns a string containing `"hong"`.
- [ ] **Step 2:** Run `node --test test/lifecheck.test.mjs` — expect FAIL (no rule).
- [ ] **Step 3:** Add the rule in `test/lifecheck-rules.mjs`: when `s.ev.story` is open, for each role in `STORY_DEFS[id].nodes[node].needCast ?? []`, the person `s.narrative.stories[id].cast[role]` must not have `diedWorldM != null`; message `` `${id}/${node}: ${role} speaks after death` ``. Export the check so the test can call it.
- [ ] **Step 4:** Run the test — PASS; run `node tools/lifecheck.mjs 200` — no new violations.
- [ ] **Step 5:** Write `tools/cast-story-cohort.mjs`; run `node tools/cast-story-cohort.mjs 100 > scratch/cohort-before.txt` (scratchpad) and copy the summary lines into this plan under "Baselines".
- [ ] **Step 6:** Commit: `tools: who meets which cast story; lifecheck: the dead never speak in a story`.

### Task 2: mingyu "คลินิกหลังเกตแตก"

**Files:**
- Create: `src/data/narrative/mingyu.js` (export `MINGYU`)
- Modify: `src/data/narrative/index.js` (register `mingyu: MINGYU`)
- Test: `test/cast-stories.test.mjs` (SETUP row + entry tests)

**Interfaces:**
- Consumes: `who, personOf, trust, first, latest, age, go, end, mem, hunts` from `castref.js`.
- Produces: `STORY_DEFS.mingyu` with `id: "mingyu"`, `entry` scene, `castGone: "gone"`, endings `successor`, `donor`, `patient`.

- [ ] **Step 1:** Add `mingyu: (s) => { s.country = "kr"; s.city = "pus"; }` to `SETUP` and tests:
  - `mingyu reaches a Korean life with a current injury, a doctor, or after a break in their city` — Korean life age 25 with `s.injuries = [{ id: "breakScar", untilM: null }]` → `discover` true; same with no injury and `s.job = { id: "hdoc" }` → true; neither → false (unless a break in `s.city` this year: use whatever the world records for a city break; if none is readable without new state, drop that clause and note it).
  - `mingyu: never for Thai lives, never after his death` — Thai injured life → false; Korean injured life with mingyu `diedWorldM` set → false.
  - `mingyu: a Korean life that moves to Thailand pauses the story` — start it, set `s.country = "th"`, advance 12 months: no mingyu scene opens; `status` not `done` before 120 months.
- [ ] **Step 2:** Run `node --test test/cast-stories.test.mjs` — the mingyu tests FAIL (`STORY_DEFS.mingyu` undefined).
- [ ] **Step 3:** Write `mingyu.js` per spec §4.1: entry ages 16–60; scenes (≥ 6) treated → clinic shift (doctors: night shift text) → the haneul board wants fees (unnamed office) → the patient you brought (recall) → burnout year → ending choice; `gone`. castAct: `quitGuild` when you back him against the board and fail; `rescued` when you carry him from a collapsed ward. Endings: `successor` (civilian manager / healer-doctor text by `hunts(s)` or job), `donor` (needs gold, `noAuto`), `patient`.
- [ ] **Step 4:** Run the file's tests — PASS (validates; ≥ 20/25 fit; ≥ 3 endings; gone scene).
- [ ] **Step 5:** Run `node tools/linelen.mjs` — clean. Commit: `stories: มินกยูกับคลินิกหลังเกตแตก`.

### Task 3: dohyun "เส้นทางท่าเรือ"

**Files:** Create `src/data/narrative/dohyun.js` (`DOHYUN`); modify `index.js`; test `test/cast-stories.test.mjs`.

**Interfaces:** Produces `STORY_DEFS.dohyun`, endings `partner`, `informer`, `reformed`, `rivals`.

- [ ] **Step 1:** `SETUP.dohyun = (s) => { s.country = "kr"; s.city = "icn"; }`; tests:
  - `dohyun reaches Korean hunters, traders and Incheon lives aged 18–50` — Korean age 30 hunter in Seoul → true; civilian `s.job = { id: "porter" }` in Busan → true; civilian office worker in Incheon → true; office worker in Seoul → false; age 55 → false; Thai → false; dohyun dead → false.
  - `dohyun: reformed sends him to haneul` — play with a picker that reaches `reformed` (or call the ending outcome) and assert his person's `guild === "haneul"` and `ties[familyId] === "friend"`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Write `dohyun.js` per spec §4.2: stolen kill/cargo at the port → the run offer (hunter: traps through an unregistered gate; civilian: a crate through customs) → a run goes wrong → coast-guard crackdown → ending; `gone`. Effects like `hong.js` (`fac: { under, state }`, gold with `goldLabel`). castAct: `enemy` on `informer`, `joinGuild:haneul` + `friend` on `reformed`.
- [ ] **Step 4:** Run — PASS. Step 5: linelen clean; commit `stories: คังโดฮยอนกับเส้นทางท่าเรือ`.

### Task 4: seojin "เงาหอจมน้ำ"

**Files:** Create `src/data/narrative/seojin.js` (`SEOJIN`); modify `index.js`; test `test/cast-stories.test.mjs`.

**Interfaces:** Produces `STORY_DEFS.seojin`, endings `student`, `rival`, `keeper`, `stranger`.

- [ ] **Step 1:** `SETUP.seojin = (s) => { s.country = "kr"; s.city = "sel"; s.job = { id: "press" }; }` (the harness life may never awaken: the press entry keeps ≥ 20/25 fitting — if `s.job` is replaced by the career system, set it in the `each` hook instead, see Step 1 note below). Tests:
  - `seojin reaches hunters at C or above anywhere, and Korean reporters and porters` — Thai hunter rank 2 (C) age 25 → true; rank 1 → false; Korean `press` civilian age 30 → true; Thai `press` → false.
  - `seojin: never for a life that started yoon` — Korean press life with `s.narrative.stories.yoon = { status: "done" }` → false.
  - `seojin: retired, he is met in the training hall, never at a gate` — force seojin `retired = true`, play to his first scene; assert scene text matches `/ห้องฝึก/` and not `/ในเกต|เข้าเกต/`.
  - `seojin: student ending only for hunters` — every option leading to `end: "student"` has a `show` that is false for a civilian.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Write `seojin.js` per spec §4.3 (scenes branch on `personOf(...).retired`; the record night = someone attempts the drowned-tower record he set years ago; no holder named); `gone`.
- [ ] **Step 4:** Run — PASS. Step 5: linelen; commit `stories: ยุนซอจินกับเงาหอจมน้ำ`.

Step 1 note: if the career system overwrites `s.job`, set `s.job` in `play()`'s `each` hook for seojin only (extend `play` with an optional `EACH[id]`).

### Task 5: poramet "บาเรียสามชั่วคน", and the stale record line

**Files:** Create `src/data/narrative/poramet.js` (`PORAMET`); modify `index.js`, `src/data/narrative/silawong.js` (father scene line); test `test/cast-stories.test.mjs`.

**Interfaces:** Produces `STORY_DEFS.poramet`, endings `successor`, `builder`, `apprentice`, `stranger`.

- [ ] **Step 1:** `SETUP.poramet = (s) => { s.country = "th"; s.city = "bkk"; s.mon0 = 12 * 12; }` (born world year 12: not lalin's peer). Tests:
  - `poramet reaches Bangkok lives 18–55 that are not lalin's peers` — Bangkok age 25 born year 12 → true; born year 1 (peer) who never started silawong → true; peer with `stories.silawong` set → false; Chiang Mai → false; poramet dead → false.
  - `poramet: successor ending only for barrier makers` — every option to `end: "successor"` has `show` false unless `s.hunter?.cls === "barrier"`.
  - `poramet: retired, he teaches at home or inspects the posts` — retired forced; first scene text not `/ในเกต|เข้าเกต/`.
  - `silawong: the father once set the silent-tower record` — the father scene text contains `"เคยตั้งสถิติหอเงียบ"` and not `"เจ้าของสถิติหอเงียบ"`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Write `poramet.js` per spec §4.4; change the silawong father line to "ผู้เคยตั้งสถิติหอเงียบ".
- [ ] **Step 4:** Run — PASS. Step 5: linelen; commit `stories: ปรเมศวร์กับบาเรียสามชั่วคน; the father once set the record`.

### Task 6: pim "ทายาทศิลาวงศ์" (heirs)

**Files:** Create `src/data/narrative/pim.js` (`PIM`); modify `index.js`; test `test/cast-stories.test.mjs` (`play()` accepts a SETUP that returns a replacement life).

**Interfaces:** Produces `STORY_DEFS.pim`, endings `ward`, `colleagues`, `rivals`, `apart`.

- [ ] **Step 1:** Change `play()` to `let s = C.newLife(seed); s = SETUP[id](s) ?? s;`. `SETUP.pim` makes a Bangkok parent `C.newLife(seed + "-p")` (`country "th"`, `city "bkk"`), sets `ageM = 40 * 12`, `c.kids = 1`, `dead = { cause: "อายุขัย", ageY: 40 }`, and returns `C.newHeir(parent, seed)`. Tests:
  - `pim reaches heirs in Bangkok aged 12–40 while she lives` — heir age 20 in Bangkok → true; first-generation life (`gen` 1) → false; heir in Chiang Mai → false; pim dead → false.
  - `pim greets by the family's old tie` — heir whose silawong person (lalin or pim) has `ties[familyId] = "enemy"`: the first scene's text differs from the no-tie text, and an option to `end: "rivals"` is visible somewhere on that path.
  - `pim: no romance` — no option in any `PIM.nodes` has `romance` or a `castAct` of `partner`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Write `pim.js` per spec §4.5 (`gone` for pim; lalin appears only through letters/grave unless alive, and if alive she is in `needCast` for that scene).
- [ ] **Step 4:** Run — PASS. Step 5: linelen; commit `stories: พิมพ์ ทายาทศิลาวงศ์`.

### Task 7: Measure against the targets and run every gate

**Files:** Modify this plan (Results); no code unless a target fails (then tune that story's `discover` window only, with a test first).

- [ ] **Step 1:** `node tools/cast-story-cohort.mjs 100 > scratch/cohort-after.txt`; check: ≥ 60% of Korean first-generation lives start ≥ 1 cast story; each new story ≤ 50% of its country's lives; pim ≥ 30% of Bangkok heirs where she lives. Record numbers here.
- [ ] **Step 2:** Run every check from `docs/HANDOFF-NEXT.md` §5 into files, read the tails: `npm test`, `node tools/linelen.mjs`, `node tools/artcheck.mjs`, `node tools/lifecheck.mjs 200`, `node tools/playtest.mjs 200`, the three `sim.mjs` runs, `npm run build`, `node tools/ux-check.mjs`, `node tools/story-cohort.mjs 100`, `node tools/cast-cohort.mjs 100`.
- [ ] **Step 3:** Compare sims and cohorts to the Baselines below: balance rows within noise, normal mind not higher; cast-cohort unchanged (stories only act when played).
- [ ] **Step 4:** Commit `play.html` + `downloads/` from the build and the Results section: `build and results for five cast stories`.

## Baselines (main before any change)

Sims, 1000 lives × seeds a–e, run on main at 6823ac6 (2026-11-13):

| policy | hunter death <50 | civ old age | mind 25–55 | money at death | median age |
|---|---|---|---|---|---|
| careful | 1.4% | 98.0% | WARN 81 [80–81] | 105632 | 78 |
| normal | 4.0% | 98.2% | 72 [72–73] | 107344 | 76 |
| reckless | 25.5% | WARN 78.9% | 36 [36–37] | 211810 | 73 |

The two WARNs are known (handoff §3), not regressions. Cohort of cast-story starts: filled in Task 1 Step 5.

## Results

Filled in Task 7.
