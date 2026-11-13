# The main cast — design (P2)

Date: 2026-11-13. Builds on P1 (`src/core/people.js`, `src/core/narrative.js`). References: the model game notes
`docs/reference/way-of-xian-notes.md` §3 (cast that recurs, waits on time and closeness, recalls old events) and §4
(twin star: a rival or companion bound to your life), the owner's pack `docs/reference/rift-ledger-handoff-pack.md`
02.M (NPC lifecycle) and 03.6 (relationship scenes). Calls not stated by the owner are marked **(call)**.

## 1. Intent (owner's words, then why)

- Guilds and hunter families are **the same in every seed**, ranked by rarity and strength.
- Their big figures (the S-ranks of each guild or family) are **fixed people, not random**: same name, class, start
  rank, character, every seed. Some can be romanced, some are rivals, some mentors. Their specs are fixed so the game
  does not get too hard.
- They are **main characters whose lives are not locked**: what the player does to or with them changes their life;
  a life that never touches them lets them live on with **a little randomness** (owner, 2026-11-13).
- They recur through a whole life, like the model game's cast.

Why: lives should differ because of what the player did to real people of the world, and replaying a world should
feel like returning to the same world with the same famous people, whose stories bend around you.

## 2. Goals, non-goals, anti-goals

Goals (P2a, this design): fixed guild/family tiers; nine fixed cast members in the people list; a background life
for each (every 24 months, small seeded rolls); influence rules (relations and stories change those rolls and write
outcomes onto the person); the tower record-holders in the world calendar become cast members; four cast stories
(the ones every kind of life can reach); news and gate breaks name cast members; heirs meet them older, and meet
their children.

Non-goals now: the other five cast stories (P2b); a destiny role at birth (§4 twin star) beyond the friend-or-rival
choice inside stories; life arcs and the story focus queue (pack T6).

Anti-goals: a cast whose fate is the same every seed; a cast member who is stronger than the game's balance allows
(no cast member joins the player's team above the team caps); a cast that only hunters meet; romance with someone
far from the player's age; any secret revealed (the tower top-floor truths, the unmeasured one's nature); the
player as the only person who matters (the cast lives full lives without you).

## 3. Approaches

| | Approach | Trade-off |
|---|---|---|
| **A** | **People with a background life + a branching story each; the player's choices write onto the person** | Uses P1 engine; the player sees the moments they changed someone's life. |
| B | One "fate tendency" value per person that the player nudges; world news reads it | Simpler, but changes happen off-screen; they would not feel like main characters. |

Owner picked **A** (2026-11-13).

## 4. Tiers and the cast (fixed every seed)

Guild tiers **(call)**: legendary — สายน้ำเจ้าพระยา (th), แพ็กโฮ (kr); major — แสงเหนือ (th), ฮานึล (kr); shadow — เมฆดำ
(th), กอมึน (kr). New families **(call)**: ตระกูลศิลาวงศ์ (th, barrier makers for three generations), ตระกูลยุน (kr,
swordsmen). Tier shows on the guild list as a word (ตำนาน / ใหญ่ / เงา), never as a number.

Cast **(call, names and roles as proposed to the owner)**; birth is in world months from 2051 (the first player is
born at 0); rank letters F..S as in `RANKS`:

| id | name | born (year) | start rank → ceiling | class | home | role |
|---|---|---|---|---|---|---|
| poramet | ปรเมศวร์ ศิลาวงศ์ | −24 | S → S | Barrier Maker | สายน้ำเจ้าพระยา head, bkk | strict mentor; holds the หอเงียบ record |
| lalin | ลลิล ศิลาวงศ์ | +1 | F (awakens 18) → A | Healer | ศิลาวงศ์, bkk | peer; romanceable |
| seojin | ยุน ซอจิน | −20 | S → S | Magic Swordsman | แพ็กโฮ head, sel | national rival; holds the หอจมน้ำ record |
| harin | ยุน ฮาริน | −1 | F (awakens 18) → A | Swordsman | ตระกูลยุน, sel | peer rival who may become a friend; romanceable |
| thongbai | ครูทองใบ | −32 | B (retired) | Knight | แสงเหนือ rescue chief, bkk | mentor to civilians and hunters |
| mingyu | ชเว มินกยู | −10 | A → A | Healer | ฮานึล, pus | ally; runs the free clinic after gate breaks |
| hong | เจ๊หงส์ | −18 | C → C | Appraiser | เมฆดำ, bkk | fixer of the black market |
| dohyun | คัง โดฮยอน | −6 | B → A | Trapper | กอมึน, icn | smuggler rival |
| pim | พิมพ์ ศิลาวงศ์ | +26 | F (awakens 18) → S | Barrier Maker | ศิลาวงศ์, bkk | next generation (lalin's niece); romanceable for heirs |

- Each is created in `s.world.people` at world start with `src: "cast:<id>"`, `tags: ["cast", role…]`, and a fixed
  `cast` record: `{ id, ceiling, home, romance: bool }`. The world roster's `silentHolder` and `drownedHolder` entries
  point at poramet and seojin (their names and ranks come from the cast); the other roster entries stay random.
- Ranks never exceed `ceiling`; a cast member never joins the player's team (they can be met, helped, fought beside in
  a story, not hired), so the game's balance is not touched **(call)**.

## 5. A background life, a little random

Following pack 02.M, run by `updatePeople(s)` monthly before stories:
- Every 24 months per cast member, one roll on the stream `cast:<id>`: promote one rank (20%, never past ceiling, and
  only after they awaken); injury (8%: out for 6–18 months, recorded on the person); guild change (3%, within tier ±1).
- Retirement for hunters between 55 and 65 (seeded once); death of old age 70–90 (seeded once); death in a gate break
  only through world news or a story, chance 1% a year while hunting at A or below, 0.3% at S.
- Peers awaken at 18 if their table says so (lalin, harin, pim do).
- An update replayed for a month already processed changes nothing; batching years equals running them monthly.

## 6. The player changes their lives

- Relations (`relationOf`) bend the rolls **(call)**: trust ≥ 40 halves their death chance in a gate break in the
  player's city (you warned them, you were there); a rival's bad blood (trust ≤ −40) raises their promotion chance
  (spite drives them).
- Story outcomes write onto the person through `setPersonStatus` and a new `castAct` effect: `rescued`, `injured`,
  `quitGuild`, `joinGuild:<id>`, `rankUp`, `retire`, `partner`, `enemy`. A story can save someone the background roll
  would have killed: a rescued cast member gets `savedUntilWorldM` (no gate-break death for 10 years).
- Romance: only with `romance: true`, within 5 years of the player's age, both unmarried, trust ≥ 60, through a story
  node (as the friend's partner road: sets `married`, `dating`).

## 7. Stories (P2a: four that every kind of life can reach)

Built with `narrative.js`, cast bound to the fixed person (`cast: { x: () => ({ id: castId }) }`):
- **thongbai** "ครูกู้ภัย": the rescue chief appears at the first gate break in the player's city (civilian or hunter);
  scenes: training day for volunteers, a rescue gone wrong, his retirement, his funeral or his last lesson. Civilians
  can become rescue volunteers through him.
- **lalin + poramet** "บ้านศิลาวงศ์": the strict father and the healer daughter; for a peer life in Bangkok, from the
  school years: classmate, screening day, the father's test, romance or a lifelong colleague, the father's last tower
  record, or the day the barrier fails.
- **harin + seojin** "ดาบตระกูลยุน": for a peer life in Korea or a hunter anywhere: the rival at the national
  screening, a tournament, a gate where you can leave him or carry him, friendship or a grudge to the end.
- **hong** "เจ๊หงส์": for anyone who sells, buys or needs money badly: the fixer offers a deal, then a bigger one; you
  can turn her in, partner with her, or owe her.

Each story: at least three endings, a version for lives that never awaken, interruptions when the person is dead or
gone (P1's `castGone`), and every later scene recalls a real earlier memory (as the friend story does).

## 8. The world names them

- World news (`pulse.js`) picks a cast member for tower records, gate-break heroics and deaths when one fits, so their
  names recur in every life's news; their deaths and records are real person updates, not text.
- The world tab lists the guilds by tier and, for each, the cast members the player has heard of (news) or met
  (memory). Nothing about their future, their stats, or their story routes is shown.

## 9. Heirs and saves

- The cast is part of the world: an heir inherits `s.world.people`, so they meet the same people older (or learn they
  died). pim belongs to the heir's generation.
- Saves: schema stays 3; an idempotent repair on load adds missing cast members to older saves (source key
  `cast:<id>`), with ages from their fixed birth, and points the record-holder roster entries at them.

## 10. Measured, not assumed

- Sim × 3 policies × seeds a–e unchanged in balance rows (the cast never fights for the player).
- A cohort tool: 100 seeds, a life that never meets a cast member: their ranks and deaths at year 60 vary across
  seeds (not the same fate), and stay inside their ceilings; and a life that rescues thongbai: he is alive more often.
- lifecheck rules: no cast member speaks after death; romance only within the age window.

## 11. Left to the builder

Exact Thai text in the house tone; scene counts within each story (≥ 3 endings, ≥ 6 scenes); roll tables within §5's
numbers; file split (`src/data/cast.js` for the table, `src/data/narrative/<id>.js` for stories).

## 12. Settled after the builder check (all **(call)**)

1. **Tower records whose holder is gone.** A calendar record goes to its cast holder if they are alive and hunting;
   otherwise to the strongest living, hunting cast member of the same country at rank ≥ A; otherwise to a roster
   hunter as today. The record line is written from whoever got it. So poramet's last record can be lalin's first.
2. **Children of the cast.** P2a has one next-generation member, pim. Cast marriages and their children are P2b. The
   "heirs meet their children" goal is cut from P2a to "heirs meet pim".
3. **Who meets thongbai.** His story starts for any Thai life aged 12–40 through a new yearly event: he tours city
   drills for gate breaks ("ซ้อมอพยพ") in every Thai city, and also at any gate break in the player's city. Korean
   lives reach harin's story (schools, screening); hong reaches Thai lives. Every country has at least one story.
4. **Heirs.** Relations and stories stay per life. What lasts is on the person, in the world: `ties[familyId]` holds
   a word (`partner`, `friend`, `enemy`, `owes`) the heir sees ("เคยเป็นศัตรูของครอบครัวคุณ"). A cast story starts again
   for an heir only if its entry conditions fit (thongbai and hong can; lalin and harin are the first generation's
   peers, pim is the heir's).
5. **Randomness and news.** All background rolls use the person's own stream `cast:<id>`; their news lines are
   written by `updatePeople`, never by `pulse()`, so existing news per seed is unchanged. "In the player's city"
   means the person's city equals the player's. `initWorld` keeps its `npc()` calls (same `world` stream draws) and
   then writes the cast holders' name, rank and class over the record-holder entries.
6. **Families are not joinable guilds.** ศิลาวงศ์ and ตระกูลยุน are world-only listings. Tier is a label on guilds only.
   Guild change ±1 tier applies to guild members; family members join a guild when they awaken (seeded: their
   country's legendary or major guild).
