# Art brief for the art agent (Codex)

Read `AGENTS.md` first for who owns what and the pull-request rules. This brief is the **approved design** for the
current art requests. Do not start a new brainstorm. Plan the batch, draw it, verify it, and open the pull request.

## 1. The game in one minute

**Rift Ledger** (บันทึกหลังรอยแยก) is a Thai text life-sim set 21 years after "Rift Day" (วันฟ้าแตก), when towers
and gates opened all over the world. The player lives one life from birth to death in Thailand or Korea, as a civilian
or an awakened hunter.

**The towers.** Each tower is the remains of a whole universe that was swallowed. Its floors show that dead world's
everyday life, then its end:
- **The Silent Tower (หอเงียบ, Thailand):** a world almost like ours. Parking garages with every light on and no cars,
  a mall whose sale signs still blink, a school where the lesson never ends, an office where everyone still sits at
  their screens.
- **The Drowned Tower (หอจมน้ำ, Korea):** an undersea civilisation whose water slowly dried up. A market where fish
  still swim around the stalls, a harbour of stranded ships, a temple with water only ankle-deep, a salt desert that
  was once an ocean.

**How the art is shown.** Monsters appear on a small pixel stage (256×144). The hero stands on the left and the monster
walks in from the right, faces left, takes hits, and falls apart. Sprites are drawn at 1× pixel scale and the whole
canvas is scaled up with nearest-neighbour filtering. The game's own UI text is Thai. Sprites carry no text.

## 2. Style guide (match the existing sprites)

Before drawing anything, open and study these files. They are the reference:
- `art/monsters/beast/sewer-hound.png`, `art/monsters/beast/flying-fish.png`, `art/monsters/beast/signal-bat.png`
- `art/monsters/construct/concrete-humanoid.png`, `art/monsters/construct/streetlight-spider.png`
- `art/monsters/spirit/floating-eyes.png`, `art/monsters/spirit/old-house-owner.png`
- `art/monsters/boss/parking-king.png` (a 56×56 boss) and `art/monsters/contact-sheet.png` (all of them together)

Rules:

| Rule | Value |
|---|---|
| Canvas | PNG, **56×56** with a transparent background (no matte, no shadow baked onto the background) |
| Facing | **Left**, toward the hero, in three-quarter view like the references |
| Ground | Walkers' feet touch the bottom row minus 2 px. Flyers (`fly: true`) hover with their body centred around y≈24–32, and nothing touches the bottom |
| Outline | 1 px dark outline (near-black tinted toward the creature's main colour, never pure #000) |
| Palette | 8–14 colours per sprite. Hard ramp steps, no smooth gradients, no anti-aliasing against the transparent edge |
| Light | From the **top-left**: brighter top-left edges, darker bottom-right |
| Readability | Must read at 1×: one clear silhouette, one focal point (eyes, glow or maw), no single-pixel noise inside shapes |
| Mood | Eerie and "wrong", not cute. Each creature is a piece of its dead world gone bad |
| Originality | Generic motifs are fine. Never copy a specific game's or manhwa's sprites, characters, logos or recognisable designs |

## 3. Requests (all `open` in `art/requests.json`)

| id | Thai name | English sense | Where it appears | Look | Colours | Fly | Save as |
|---|---|---|---|---|---|---|---|
| mon-5 | เถาวัลย์กินเรือ | Ship-eating vine | Drowned Tower floors 11–15, the temple | A knot of thick seaweed-vines with a wide mouth of curled tendrils, barnacles and a broken plank caught in it, crawling on its vines | kelp greens, wet olive, a sick yellow-green glow in the mouth | no | `beast/ship-eating-vine` |
| mon-6 | ปูเกราะตู้สินค้า | Container-armoured crab | Drowned Tower 6–10 harbour, 16–20 salt desert, 41–60 | A crab whose shell is a dented, rust-striped shipping container; one huge claw, small eyes peering from the container's door gap | rust orange, faded container blue, grey steel | no | `beast/container-crab` |
| mon-7 | นกล่อฟ้า | Sky-luring bird | Drowned Tower 11–15, the temple | A long-necked wading bird whose glowing throat-sac mimics a patch of sky to lure prey; wings half-spread, legs trailing | pale grey-white body, a sky-blue glowing throat, dark wingtips | yes | `beast/sky-lure-bird` |
| mon-9 | ปลาไร้น้ำ | Waterless fish | Drowned Tower 1–5, 16–20, 21–40, 61+ | A gaunt fish swimming through air: dry cracked scales, gill slits gasping, bulging dead-white eyes, tail flicking | dusty teal, salt-white crust, dark gills | yes | `beast/waterless-fish` |
| mon-20 | เงาใต้ท่าเทียบ | Shadow under the pier | Drowned Tower 6–10, 21–40 | A drowned silhouette hanging upside-down like a reflection under a pier, with long fingers and hair floating as if still underwater; faint ripple lines | deep blue-black, a cold cyan rim light, two pale eyes | yes | `spirit/pier-shadow` |
| mon-21 | ผู้โดยสารคนสุดท้าย | The last passenger | Silent Tower 16–20, the office | A translucent commuter with a briefcase and a hanging train-strap still in hand, face just a blur, feet not touching the ground | washed-out office greys, a sickly fluorescent green-white glow | yes | `spirit/last-passenger` |
| mon-23 | เงาสะท้อนผิดจังหวะ | Reflection out of sync | Silent Tower 16–20, the office | A person-shape made of mirror shards, slightly offset from itself (a double edge), one arm raised a beat late | silver-blue glass, white glints, a violet edge where the two copies overlap | yes | `spirit/offbeat-reflection` |
| mon-24 | อาจารย์ที่ยังสอนอยู่ | The teacher still teaching | Silent Tower 11–15, the school | A thin teacher-ghost in a cardigan holding chalk and a pointer, mouth open mid-lecture, chalk dust drifting off them | chalk white, blackboard green, cardigan brown | yes | `spirit/teacher-still-teaching` |
| mon-26 | ตัวคุณจากอีกฝั่ง | You, from the other side | Silent Tower 41–60 and 61+ (the late floors) | A hooded human-shaped silhouette that looks like a generic hunter, but hollow: dark inside the outline, with the dead world's violet light showing through cracks | void black, violet cracks (#6c3fc8–#a37cf2), a white pinpoint eye | yes | `spirit/you-from-the-other-side` |

Notes:
- `fly` is already set for each one in `src/data/monsters.js`. Keep it: pass `1` as the third argument of `own(...)`
  for flyers.
- Only these nine are needed now. The code agent adds new rows when content needs more.

## 4. Working method (superpowers)

You have the superpowers skills. Use them like this for a batch of 3–5 monsters:
1. **No brainstorming.** This brief is the approved design. If something in it is truly unclear, ask in the pull
   request instead of guessing.
2. **Branch.** Use `codex/art-<short-topic>` from the latest `main` (or the open development branch if `main` does not
   have `AGENTS.md` yet).
3. **Short plan** (writing-plans): list the monsters in the batch, the reference sprite you will match for each, and
   the file paths.
4. **Before you draw, see the check fail on purpose** (the art version of test-first): set one request to `done`
   before its PNG exists and run `node tools/artcheck.mjs`. It must report the problem. Then put the row back.
5. **Draw, then look.** Render each sprite at 1× and at 4× and compare it beside the reference sprites. Fix the worst
   problem and look again. Do at least two rounds per sprite.
6. **Wire it.** Follow the steps in `AGENTS.md` → "To fulfil a monster request".
7. **Verify before you claim it is done** (verification-before-completion). Run
   `node tools/artcheck.mjs && npm test` and paste the last lines of the output into the pull-request description.
8. **Finish** (finishing-a-development-branch): push the branch and open a pull request. Do not merge. The code agent
   reviews automatically about every 4 hours, and the owner merges.
9. **Provenance.** Add one line per sprite to `art/README.md`: the tool or model used, the date, and the prompt or
   method.

## 5. Pull request description template

```
## Art: <batch name>
- mon-xx <Thai name> → art/monsters/<folder>/<file>.png (56×56, fly yes/no)
- ...
## Verification
<last lines of: node tools/artcheck.mjs && npm test>
## Provenance
<tool/model, date>
```
