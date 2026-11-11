# Rift Ledger monster art

Small side-facing transparent pixel sprites for the 256×144 battle stage. They use a dark outline, compact clusters, restrained colors and a 46 px enemy / 58 px boss display height to sit beside the existing 56 px hero.

## Folders

One folder per kind. The folder is the kind of the picture; the same four kinds group the in-game picture book (`สมุดภาพ`).

| Folder | Kind | Pictures |
|---|---|---|
| `beast/` | สัตว์กลายพันธุ์ | sewer-hound, acid-snail, flying-fish, signal-bat, glass-frog |
| `construct/` | เศษเมืองมีชีวิต | wire-eater, concrete-humanoid, streetlight-spider, driverless-machine, rail-centipede |
| `spirit/` | เงาและวิญญาณ | floating-eyes, old-house-owner |
| `boss/` | เจ้าถิ่น | flesh-matriarch, parking-king, time-eater, voiceless-choir, water-shadow-lord, scaffold-giant, stalled-elevator-god, death-manager, cable-dragon, thing-on-top-floor, rift-mother |

`contact-sheet.png` shows all 23 at once. `prompts.md` records how each was generated.

## How the game uses them

- `src/monsters.js` is the one table: Thai creature name → picture, kind, `fly` (hovers) and `borrow` (no picture of its own yet).
- `src/monster-art.js` imports the PNGs and serves the stage raster and the UI portraits.
- `node build.mjs` fails if a name in `MON`, `BOSS` or `PLACES[].mon` has no row, or a row points at a missing file.
- A name missing from the table (a new story foe) still gets a body, picked by its name from bosses or common creatures.

To add a creature: drop the PNG in the folder of its kind, add its import and `ART` entry in `src/monster-art.js`, and add or change its row in `src/monsters.js`.

## Still wearing a borrowed body

These 23 names have no picture of their own. They use the closest silhouette with a name tint, and boss pictures are kept for bosses only.

| Wanted | Borrows now |
|---|---|
| เถาวัลย์กินเรือ | beast/glass-frog |
| ปูเกราะตู้สินค้า | construct/streetlight-spider |
| นกล่อฟ้า | beast/signal-bat |
| แพะหินปูน | beast/sewer-hound |
| ปลาไร้น้ำ | beast/flying-fish |
| หมุดย้ำเดินได้ | construct/wire-eater |
| ตะกรันมีชีวิต | construct/concrete-humanoid |
| ห้องสมุดหิว, เงาใต้ท่าเทียบ, เงาสะท้อนผิดจังหวะ, ของในตู้ที่สอง | spirit/floating-eyes |
| ผู้โดยสารคนสุดท้าย, ผู้เฝ้าท่าข้ามฟาก, อาจารย์ที่ยังสอนอยู่, ตัวคุณจากอีกฝั่ง | spirit/old-house-owner |
| เสียงตามสาย, ผู้เผยแผ่วิถีมาร | boss/voiceless-choir |
| องครักษ์เจ็ดตระกูล | boss/parking-king |
| ผู้สอบบัญชีชั้นล่าง, ผู้จัดการคลินิก, ผู้ตรวจหน้ากากขาว | boss/death-manager |
| เจ้าหนี้แห่งวันฟ้าแตก | boss/time-eater |
| ผู้ลงนามคนแรก | boss/thing-on-top-floor |

## Provenance

The sixteen roster images were generated as one PixelLab 1-direction object batch on 2026-11-11, using `art/professions/class-shade.png` as a style reference. Seven more boss images were generated individually with PixelLab Pixen on the same date. Images are original generated assets; prompts described creature identity and materials, with no living-artist imitation. PixelLab terms: https://pixellab.ai/termsofservice . Check the terms before redistributing or using commercially.
