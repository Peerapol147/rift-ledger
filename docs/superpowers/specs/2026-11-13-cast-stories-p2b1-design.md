# The main cast, part 2b-1: five more cast stories — design

Date: 2026-11-13. Builds on P2a (`docs/superpowers/specs/2026-11-13-main-cast-design.md`, its §7 story rules and
§12–§13 settlements apply unchanged). Model-game reference: `docs/reference/way-of-xian-notes.md` §3 (a story is a
chain of steps; each step waits on time and on closeness to its cast; later steps recall a specific earlier moment;
stories are grouped by theme). Calls not stated by the owner are marked **(call)**.

P2b is three parts, built one at a time, each with its own design, plan, tests and review (owner, 2026-11-13):
**2b-1 the five stories (this document)** → 2b-2 cast marriages and children → 2b-3 the twin star at birth (a hint at
birth without the person's name; who it is shows when you meet them in a story — owner agreed).

## 1. Intent

Every cast member gets a story of their own, so that the famous people of the world are met in every kind of life,
not just four. Korea gets as many ways in as Thailand. The owner wants each part refined slowly and exactly ("เกลา
ทีละส่วนอย่างละเอียด") with the model game as the reference for how cast stories feel.

## 2. Goals, non-goals, anti-goals

Goals: five new stories — mingyu, dohyun, seojin (on his own), poramet (on his own), pim (for heirs); each reachable
by both hunters and lives that never awaken; each changes the person's life through `castAct`; the stale line in the
silawong father scene (P2a minor: "เจ้าของสถิติหอเงียบ" after the player broke the record) is fixed while poramet's
text is touched (§4.4).

Non-goals: cast marriages and children (2b-2), the twin star (2b-3), new engine or save features (e.g. storing who
holds a tower record), changes to the cast's background rolls, art.

Anti-goals (from P2a, still binding): the dead speak; a story starts with a gone cast member; romance outside trust 60,
≤ 5 years apart, both single, listed after friendship; text that only fits one sex, one country, hunters only, or one
age; any top-floor tower truth or the unmeasured one's nature; a cast member on the player's team; randomness on the
`pulse`/`world` streams; mind or marriage rates moving in sim normal (re-measure: twice before mind rose to 80+).

## 3. Approaches

| | Approach | Trade-off |
|---|---|---|
| **A** | **Five separate story files on the P1 engine, like `hong.js`; seojin and poramet get solo stories that only start for lives not already in their family story** | No engine work; each story has its own entry, so lives that never meet the daughters still meet the fathers. |
| B | Grow `yoon.js` and `silawong.js` with longer father branches instead of solo stories | Less new text, but the fathers stay reachable only by peers of harin/lalin — most lives never meet them. |
| C | One shared template that generates cast stories from a table | Cheaper per story, but every story reads the same; the model game's strength is specific scenes. |

**A** is the pick **(call; the owner handed over the how: "ลุย")**.

## 4. The five stories

Shared rules **(call)**: ≥ 6 scenes, ≥ 3 endings, a `gone` scene per speaking cast member (P1 `castGone`), every
scene after the first recalls a real earlier memory through `first`/`latest` (castref.js), `delay` ranges in years like
P2a's (stories span a decade or more), the choice that changes most is `noAuto`, three options per scene (notes §2),
text in the house tone. Korean-only stories pause in Thailand and Thai-only ones in Korea (`active`, `pauseMax: 120`).

### 4.1 mingyu "คลินิกหลังเกตแตก" (Korea, any life)

- Who: a Korean life aged 16–60 after a gate break in their own city, or any Korean life with a current injury in
  `s.injuries` (any id, still healing or permanent), or a doctor (`doc`, `hdoc`) in Korea **(call)**. Mingyu runs a free clinic beside haneul's office in Busan; he
  travels to any city after a break.
- Arc: you are treated or bring someone in → you help at the clinic (volunteer shift; doctors work a night shift) →
  the haneul guild board (an unnamed office, not a cast person) wants the clinic to charge hunters' prices → a patient you brought dies or lives (a scene that recalls who)
  → Mingyu burns out after a bad break year → ending.
- Endings: `successor` (you keep the clinic open: civilians as manager, healers/doctors as its doctor), `donor`
  (you pay for it from afar), `patient` (you were someone he saved once). castAct: `quitGuild` if you back him
  against haneul and fail, `rescued` if you carry him out of a collapsed ward.

### 4.2 dohyun "เส้นทางท่าเรือ" (Korea; the Korean answer to hong)

- Who: Korean life aged 18–50 that hunts, trades (`shop`, `appraise`, `porter`), or lives in Incheon **(call)**.
- Arc: he steals your kill or your cargo at the port → he offers a run (traps through an unregistered gate; civilians:
  a crate through customs) → a run goes wrong and someone is caught → the coast guard crackdown → ending.
- Endings: `partner` (you run the port with him), `informer` (you turned him in; `enemy`), `reformed` (he goes
  legit: `joinGuild:haneul`, the one Korean major guild, `friend`), `rivals` (the grudge stays). Uses `fac` like hong.

### 4.3 seojin "เงาหอจมน้ำ" (any hunter; Korean civilians)

- Who: a hunter at rank ≥ C anywhere aged 20–50, or a Korean civilian 20–50 who is a reporter (`press`) or works a
  gate (`porter`) **(call)**; never a life that already started `yoon` (he is in that story) **(call)**.
- Fact that shapes it (builder check): seojin retires at 55–65 (93% retired by world year 30) and records go only to
  hunting holders. So the story **reads his state each scene** **(call)**: while he hunts he watches you at a gate and
  spars; once retired he coaches from the baekho training hall and the "record" scene becomes the night someone tries
  to break the drowned-tower record he set years ago. No change to his rolls.
- Arc: he watches you (gate or training hall) / you interview him → he tests you (hunter: a spar; civilian: an
  off-record question you can print or keep) → the record night (recalls the test) → his injury or his student's
  death → he names a successor (or, retired, his last student).
- Endings: `student` (he trains you; hunter only), `rival` (you chase his record), `keeper` (civilians: you kept his
  secret / wrote his last interview), `stranger`. No scene says who holds a record now: nothing in the save stores a
  record's holder (only its floor), and adding that is out of scope **(call)**.

### 4.4 poramet "บาเรียสามชั่วคน" (Thai, any life)

- Who: a Thai life aged 18–55 in Bangkok, hunter or civilian, that is not a peer of lalin or never started
  `silawong` **(call)**. Hunters meet him as a chaophraya trainer; civilians build the city barrier posts he
  designs (a contract at work, or a volunteer crew).
- Like seojin he is usually retired when an adult player meets him (97% by world year 30); scenes read his state
  **(call)**: hunting, he trains you at chaophraya; retired, he inspects the city barrier posts and teaches at home.
- Arc: the barrier post you build / train under him → his strict test (recalls the first scene) → the night a barrier
  fails in your district → the silent-tower record he set is attempted again (by a roster hunter; text names no
  holder) → his last lesson or funeral.
- Endings: `successor` (barrier makers only: he teaches the family technique outside the family — rare), `builder`
  (civilians: your name is on a post), `apprentice`, `stranger`.
- The stale line fix (P2a minor): the silawong father scene says he **once set** the silent-tower record ("ผู้เคยตั้ง
  สถิติหอเงียบ"), which stays true whoever holds it now; no new record state **(call)**.

### 4.5 pim "ทายาทศิลาวงศ์" (heirs, Bangkok)

- Fact that shapes it (builder check): an heir is born the month the parent dies (`src/core/heir.js`), so pim
  (born world year 26) is usually 30–55 when an heir is born. She is **the head of the silawong family in her prime,
  not a classmate** **(call)**.
- Who: an heir (gen ≥ 2) living in Bangkok, aged 12–40, while pim is alive **(call)**. Text reads the family tie with
  silawong (`ties[familyId]`, P2a §12.4): partner/friend/enemy/owes of a parent changes how pim greets you (she knew
  your parent through her aunt lalin).
- Arc: pim comes to your home or school because of the old tie (or a barrier drill if there is none) → she tests you
  (hunters: barrier work; civilians: the barrier posts poramet designed) → lalin's letters or grave (recalls the
  parent's memory of lalin when one exists) → a gate where the family barrier is tested → choice.
- Endings: `ward` (she takes you under the family's wing), `colleagues`, `rivals` (an old family grudge goes on),
  `apart`. **No romance in this story** **(call)**: the age gap rule (≤ 5 years) almost never fits, and when a parent
  was lalin's partner pim is family.

## 5. Measured, not assumed

- Each story has a validator-clean definition (P1 key checks) and unit tests per scene key, `castGone` path and
  ending; tests written to fail first.
- A cohort tool (sibling of `tools/cast-cohort.mjs`) plays 100 seeds × 3 policies per country, first generation
  and heirs, and counts lives that start each of the nine cast stories, split by hunter/civilian. Targets **(call)**:
  ≥ 60% of Korean first-generation lives start at least one cast story; each **new** story starts in ≤ 50% of the
  lives of the country it serves (variety); pim's story starts for ≥ 30% of Bangkok heirs while she lives. Old
  stories' rates are reported, not tuned here. The numbers on main are measured first and written into the plan.
- lifecheck: no cast member speaks after death in the new stories; romance (pim) inside the window.
- Sim × 3 policies × seeds a–e: run on main before any change and keep the output; after, balance rows within
  noise of that run and mind (normal) not higher (handoff: careful mind WARN 81 is known, not a regression).

## 6. Left to the builder

Exact Thai text; delays within "years"; option stats and difficulties in the range existing cast stories use; small
`fac`/`gold`/`mind` effects in the size hong/thongbai use; file names `src/data/narrative/<id>.js`.
