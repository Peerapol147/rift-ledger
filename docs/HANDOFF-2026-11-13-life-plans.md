# ส่งต่องาน: แผนชีวิตและตัวเลือก (2026-11-13)

สำหรับ session ถัดไปที่รับงานต่อ อ่านไฟล์นี้ให้จบก่อนทำอะไร branch: `claude/beautiful-albattani-g86w3v` (push แล้ว ยังไม่เปิด PR)

## 0. กติกาของเจ้าของเกม (ห้ามลืม)

- **ตอบเป็นภาษาไทยเสมอ** เจ้าของเกมไม่อ่านภาษาอังกฤษ
- **ใช้ superpowers ทุกครั้งเองโดยไม่ต้องให้สั่ง**: brainstorming → เอกสารออกแบบ → writing-plans → executing-plans
  (TDD ทุก task) → reviewer ตัวใหม่ตรวจทั้ง branch → finishing-a-development-branch
- **อิงสิ่งที่มีประโยชน์จากเกมต้นแบบ แต่ห้ามลอก** (โค้ด ข้อความ ชื่อ ตัวละคร) และ "ทำไมต้องให้สั่ง": ให้เลือกกลไกที่มีประโยชน์มาใช้เองโดยไม่ต้องรอสั่ง
- ทำเร็ว ไม่ถามเรื่องที่ตัดสินเองได้ เจ้าของเกมมอบให้ผู้ออกแบบตัดสิน ("ตามสมควร")
- ประหยัด token: อย่าพิมพ์ output ยาวๆ ลงบทสนทนา ให้เก็บลงไฟล์แล้วอ่านแค่ส่วนท้าย
- อ่าน `CLAUDE.md` และ `AGENTS.md` ก่อนทำงาน: ภาพเป็นของ Codex (`art/`) โค้ดต้องการภาพใหม่ให้เพิ่มแถว `open` ใน
  `art/requests.json` และหลัง merge งานภาพให้รัน `npm run build` แล้ว commit `play.html`

## 1. เกมต้นแบบ (ใช้อ้างอิงเท่านั้น)

- ไฟล์ HAR ของ `way-of-xian.wox-game.workers.dev` อยู่ใน Google Drive ไฟล์ id `1tS-70GnLPQvZaN-X7dFIjRy5s-XrPAhC`
  (ลิงก์แบบ "ทุกคนที่มีลิงก์") environment นี้อนุญาต `drive.google.com` และ `drive.usercontent.google.com` แล้ว
- ดาวน์โหลด: `curl -sSL -o file.7z "https://drive.usercontent.google.com/download?id=1tS-70GnLPQvZaN-X7dFIjRy5s-XrPAhC&export=download&confirm=t"`
  แตกด้วย `py7zr` (pip) ลงโฟลเดอร์ใหม่ใน scratchpad แล้วดึง response body ออกจาก HAR ด้วย Python `-I`
  (scratchpad ของ session เก่าหายแล้ว ต้องทำใหม่)
- **ห้ามรันโค้ดของเขา** (ระบบบล็อกและถูกต้องแล้ว) อ่านเป็นข้อความเท่านั้น
- ใน HAR มี token ผู้เล่นและแชทของคนอื่น ห้ามเผยแพร่
- กลไกที่เอามาแล้ว: แนวทางหลัก/รองดึงเหตุการณ์ (เขา ×2/×1.4) คำอธิบายแนวทาง ป้ายที่มาในบันทึก ของคว้าตอนขวบแรก
  เรื่องต่อเนื่องที่มีตัวละครกลับมา ตัดสินใจครั้งเดียวต่อชีวิต
- กลไกที่ยังไม่ได้เอา (ไว้ส่วนถัดไป): ตัวละครประจำเรื่อง (cast) ที่คงอยู่และถูกอ้างถึง, บทของชีวิต (arcs) ที่เปลี่ยนชนิดเหตุการณ์,
  เส้นชะตาตั้งแต่เกิด, จังหวะชีวิต ×2 ของคนธรรมดา, สารานุกรมและหน้า "มีอะไรใหม่" ในเกม

## 2. งานที่เสร็จและ push แล้ว (ส่วนที่ 1 + ของสั่งเพิ่ม)

spec `docs/superpowers/specs/2026-11-12-continuity-pass-design.md` แผน `docs/superpowers/plans/2026-11-12-continuity-part1-base.md`
ผ่าน reviewer แล้ว แก้ข้อสำคัญครบ 5 ข้อ

- เหตุการณ์สุ่มเกิดครั้งเดียวต่อชีวิต ยกเว้น 9 เรื่องใน `HABITS` (`src/data/events/index.js`) ที่ `cap: 2`
- ข้อความ: ชื่อหอสั้นภาษาไทย (`TOWERS[t].short`) เว้นวรรคแรงก์
- เหตุการณ์เข้ากับชีวิต: คนรักต้องพบกันก่อน (`dating`), ฮันเตอร์อายุเกิน 60 หรือเลิกล่าไม่ถูกเรียก, แผนทารก 0–3
- เหตุการณ์ใหม่ 70 เรื่องใน `src/data/events/life2.js` มีเรื่องต่อเนื่องสองขั้น
- engine: เงื่อนไข `employed`, `after: { counter: months }` (ตัวนับจำเดือนที่เริ่ม `at:<k>`, save เก่านับว่านานแล้ว),
  `act: "quitJob"`
- ตัวตรวจ `tools/lifecheck.mjs` + `test/lifecheck-rules.mjs` (อยู่ใน `npm test`)
- ภาพ: merge `codex/art-brief-completion` ลงทะเบียนมอนสเตอร์ 13 ตัวใน `src/monster-art.js` + `test/art-registry.test.mjs`
- ZIP: `npm run build` แพ็ก `downloads/rift-ledger-play.zip` (`tools/package-download.mjs`) + `test/download-zip.test.mjs`
- ฉากห้องในบ้านสำหรับทารกและเหตุการณ์กลางคืนของเด็ก (`room` ใน `src/place-art.js`, `src/stage.js`), โทนกลางคืน (`stage.night`,
  `isNight` ใน `src/ui/art.js`), หัวข้อแผนทารก "พ่อแม่เลี้ยงคุณแบบ" (`planTitle`), banner อยู่เหนือแถบแท็บ ปุ่มเพลงมุมขวาบน

**จุดเล็กที่เลื่อนไว้ (ยังไม่แก้):** `mdReunionTwenty` บอก 20 ปีแต่เกิดอายุ 45–55, `adKidSchool` ลูกเพิ่งเกิดก็ "กลับจากโรงเรียน",
`yaGrandmaRoom` บอกค่าเช่าทุกเดือนแต่ได้ครั้งเดียว, `olNightWalk` "เหมือนยายของเขา" ใช้ได้กับผู้หญิงเท่านั้น, ตัวนับ `ownRoom`
`askedRiftDay` ไม่มีขั้นสอง, `isNight` คำว่า "คืนที่"/"ตีสอง" อาจจับผิด ("ส่งคืนที่ร้าน" "ตีสองที"), `newLife` เริ่ม `focus: "play"`
ทารกจึงไม่มีปุ่มแผนไฮไลต์จนเดินเวลา 1 รอบ, log ขนาด ZIP ไม่รวม directory, ZIP ~8 MB ต่อ build ลง git

**ยังไม่ได้ตรวจในเบราว์เซอร์:** ภาพมอนสเตอร์ใหม่ในฉากต่อสู้จริง และการแตก ZIP แล้วเปิดเล่น

## 3. งานที่กำลังทำ: แผนชีวิตและตัวเลือก

spec `docs/superpowers/specs/2026-11-13-life-plans-and-choices-design.md` (อ่านส่วน "คำตอบจากการตรวจของผู้ลงมือ" ด้วย)
แผน `docs/superpowers/plans/2026-11-13-life-plans-and-choices.md` (8 task) ใช้ executing-plans ต่อ ledger เดิมอยู่ใน
`.superpowers/` (git-ignore) อาจไม่มีใน session ใหม่ ให้สร้างใหม่ด้วย `sdd-workspace` และเริ่มที่ Task 6

| Task | สถานะ | commit |
|---|---|---|
| 1 `kindsOf` (`src/core/kinds.js`) | เสร็จ | fd411ac |
| 2 แผนมี `kinds` `desc` + แผนรอง `focus2` (`focus2List`, `setFocus2`, `applyFocus` export) | เสร็จ | c5bbd2e |
| 3 `planWeight` (หลัก 2.5 รอง 1.5) + `openRandom` + บันทึก " · มาจากแผน X" | เสร็จ | ec5fc6e |
| 4 ของคว้า `c.grab` 1/2/3 → แผนตอน 4 ขวบ sport/study/chores | เสร็จ | f2dd708 |
| 5 ป้ายผลบนตัวเลือก `effectChips` (`optionView().fx`) | เสร็จ | 93ad897 |
| 6 แผงแผน: คำอธิบาย + แถวแผนรอง | **โค้ดเสร็จ ยังไม่ได้ตรวจในเบราว์เซอร์** | c7f2cc8 (WIP) |
| 7 เนื้อหา: ตัวเลือกที่ 3 ทุกเหตุการณ์ + เหตุการณ์สายที่บาง | **ทำไปบางส่วน** | de7781b (WIP) |
| 8 ตรวจทั้ง branch + reviewer + push | ยังไม่เริ่ม | |

**Rulings ที่ตัดสินไปแล้ว:** (1) `fromPlan` ตั้งผ่าน `openRandom` เท่านั้น ไม่ผ่าน `openEvent` เพราะ `openEvent` เปิดหมุดหมายและปฏิทินด้วย
(2) ป้ายของ mind ใช้ "สุขภาพจิต" เพราะ "จิต" คือชื่อค่า `wil` (3) งานเนื้อหา Task 7 แบ่งให้ subagent เขียนพร้อมกันตามไฟล์
(4) แผนรองไม่ได้เงิน/สุขภาพ/สุขภาพจิต และ `hunt` `work` เป็นแผนรองไม่ได้

### Task 6 ที่เหลือ
- `npm run build` แล้วถ่ายภาพหน้าจอ 420×860 ที่อายุ 1, 15, 30 ตรวจว่ามีคำอธิบายแผน แถวแผนรอง (ตั้งแต่ 13) ป้ายผลบนตัวเลือก
  และ `document.documentElement.scrollWidth <= 420`
- สคริปต์เดิมเล่นถึงอายุ 30 ด้วยการคลิกแล้วหมดเวลา (เกิน 400 วินาที) ให้ใช้วิธีเร็วกว่า เช่น เปิดหน้าแล้วใส่ save ที่อายุตรงนั้นผ่าน
  localStorage (ดู `src/ui/` เรื่อง slots/save) หรือกด 16× และตั้งนโยบายหยุดให้เล่นเอง
- CSS `.chips` `.pdesc` อยู่ใน `src/index.html` แล้ว

### Task 7 ที่เหลือ (เทสต์ `test/choices.test.mjs` แดงอยู่ ตั้งใจ)
- เสร็จแล้ว: `ages.js`, `life2.js`, `quiet.js` มีตัวเลือกที่ 3 ครบ, `src/data/events/kinds2.js` มี 42 เหตุการณ์ใหม่
  (`KINDS2_EVENTS`) **ยังไม่ได้ใส่ใน `src/data/events/index.js`** ต้องเพิ่ม import และต่อท้าย `ALL_EVENTS`
  แล้วตรวจคุณภาพภาษาไทยและจำนวนต่อสาย (study/mind/luck/hunt/body)
- ยังไม่ทำ (ยังมี 2 ตัวเลือก): `more.js` 35, `places2.js` 23, `systems.js` 8, `adult.js` 7, `teen.js` 6, `hunter.js` 4, `kid.js` 2
  รวม 85 เรื่อง กติกาการเขียนอยู่ในบรีฟด้านล่าง (ข้อ 5)
- ต้องตรวจงานที่ subagent เขียนไว้ด้วยตา เพราะทุกตัวหยุดกลางทางจากโควตา (ไม่ได้รายงานผล)
- เทสต์ที่แดงเพราะงานค้าง ต้องแก้ก่อนปิด Task 7:
  - `test/life2.test.mjs` "taking the severance leaves you without the job": เทสต์เลือก `ev.o.length - 1` ซึ่งตอนนี้กลายเป็นตัวเลือกใหม่
    ให้แก้เทสต์ให้เลือกตัวเลือก "รับเงินชดเชยแล้วพัก" ตามชื่อ
  - `test/auto.test.mjs` "important policy finishes a civilian life with 40–160 stops" ได้ 162: ตัวเลือกมากขึ้นทำให้หยุดบ่อยขึ้น
    ตัดสินว่าจะขยายขอบเป็น 200 (บันทึกเป็น ruling) หรือปรับว่าอะไรนับเป็นเรื่องสำคัญ
  - 79 บรรทัดยาวเกิน 120: `python3 tools/wrapdata.py src/data/events/<file>.js` แล้ว `node tools/linelen.mjs`
- ตรวจรับ Task 7: `npm test` เขียวทั้งหมด, `node tools/lifecheck.mjs 200` สะอาด, `node tools/playtest.mjs 200` ไม่เจอบั๊กและช่วงเงียบ
  มัธยฐาน ≤ 2 ปี, `node tools/sim.mjs 1000 --policy normal` exit 0

### Task 8
`npm test`, `node tools/artcheck.mjs`, `node tools/linelen.mjs`, sim, playtest, lifecheck, `npm run build`, commit `play.html` + ZIP,
push แล้วส่ง reviewer ตัวใหม่ (opus) ตรวจทั้ง branch ตาม executing-plans (ใช้ `git diff` ที่ตัด `play.html` `downloads` `*.png` ออก)
แก้ Critical/Important ด้วย TDD รอบเดียว แล้วใช้ finishing-a-development-branch ถามเจ้าของเกมว่าจะ merge / เปิด PR / เก็บไว้

## 4. งานถัดไปที่เจ้าของเกมสั่งไว้แล้ว (ส่วนที่ 2)

**กิลด์และตระกูลฮันเตอร์ที่ล็อกไว้ตายตัวทุก seed:**
- คิดหลายกิลด์หลายตระกูล จัดอันดับความแรร์และความเก่ง
- ตัวใหญ่ (เช่น แรงก์ S ประจำกิลด์/ตระกูล) ไม่สุ่ม เป็นคนเดิมทุกรอบ บางคนจีบได้ บางคนเป็นคู่แข่ง/พี่เลี้ยง
- ล็อกสเปคไว้เพื่อไม่ให้ยากเกินไป
- กลับมาในเหตุการณ์ตลอดชีวิต (ตัวละครประจำแบบเกมต้นแบบ)

ตอนนี้ `src/core/world.js initWorld` สุ่มชื่อ NPC 12 คนต่อ seed (`silentHolder`, `drownedHolder`, `unmeasured` ฯลฯ ใช้ใน `calendar.js`)
และ `src/data/guilds.js` มีกิลด์ 6 แห่ง (ไทย 3 เกาหลี 3, perk safe/elite/shady) เริ่ม brainstorming จากตรงนี้ แล้วเสนอรายชื่อ
ให้เจ้าของเกมดูก่อนลงมือ ถ้าต้องการภาพตัวละครใหม่ ให้เพิ่มแถวใน `art/requests.json`

ต่อจากนั้น (แผนรวมในสเปค 2026-11-12): การปลุกพลังแบบมีขั้นตอน (ลางตั้งแต่เด็ก → ตรวจตอน 18 → ตื่นช้ามีเหตุ ตอนนี้ 35/37 ตื่นตอน 18 พอดี)
และจัด layout ใหม่ (ใช้ `tools/skills/game-ui-ux`)

## 5. บรีฟเขียนตัวเลือกที่ 3 (ใช้ต่อกับ Task 7)

โลก: เกมจำลองชีวิตภาษาไทย ผู้เล่นเกิดปีที่ 21 หลังวันฟ้าแตก (หอคอยและเกตโผล่ทั่วโลก) ในไทยหรือเกาหลี เกตแรงก์ F–S เปิดในเมืองและบางครั้ง
แตก ฮันเตอร์คือคนที่ตื่นพลัง คนส่วนใหญ่เป็นคนธรรมดา โทน: ชีวิตประจำวันข้างความแปลกประหลาด เรียบ เจาะจง ขำแห้งๆ ไม่ดราม่า
อ่านเหตุการณ์เดิมในไฟล์ 6–8 เรื่องก่อนเพื่อจับน้ำเสียง

- ใส่ตัวเลือกที่ 3 ให้เหตุการณ์สุ่ม (ไม่มี `k:`) ที่มี 2 ตัวเลือกพอดี
- ตัวเลือกที่ 3 ต้องเป็นทางที่สามจริง ไม่ใช่ตัวเติม มักใช้ค่าสถานะอีกตัว (`s:` ตรวจค่า หรือ `st:` เพิ่มค่า) จาก str กาย, agi ไว, int ปัญญา,
  wil จิต, cha เสน่ห์, luk โชค
- เป็นการตรวจค่า `{ l, s: "int", diff: N, y: {...}, n: {...} }` (diff ราว 6–14 เด็กต่ำกว่า) หรือผลแน่นอนก็ได้
- `y.m` เป็นประโยคไทยสั้นหนึ่งประโยคเล่าว่าเกิดอะไร (ไม่เขียน "+1 ปัญญา")
- ผลเล็กตามไฟล์: `st` 0.1–0.4, `mind` ±2..±10, `hp` ±2..±8, `gold` ตามวัย
- ห้ามเป็น "ไม่ทำอะไร/ปล่อยผ่าน" เว้นแต่อีกสองตัวเลือกเป็นการลงมือทั้งคู่ ชื่อตัวเลือกที่ 3 ห้ามซ้ำกันเกิน 3 ครั้งทั้งเกม
- ต้องเข้ากับทุกชีวิตที่เหตุการณ์ไปถึง (อายุ ฮันเตอร์หรือไม่ เงิน) ตัวเลือกที่เสียเงินต้องมี `need: { gold: cost }`
  และทุกเหตุการณ์ต้องเหลือตัวเลือกที่ไม่มี `need` และไม่เสียเงิน
- ห้ามเผยความลับหรือชื่อตัวนับ เก็บ `c:` `act:` `fac:` เดิมไว้
- `places2.js` ผูกกับเมืองจริง ให้ตัวเลือกที่ 3 อยู่ในบริบทเมืองนั้น เหตุการณ์ใน `hunter.js` ต้องเข้ากับฮันเตอร์
- บรรทัดไม่เกิน 120: `python3 tools/wrapdata.py <files>` แล้ว `node tools/linelen.mjs`

## 6. คำสั่งตรวจ

```bash
npm test
```
```bash
node tools/lifecheck.mjs 200
```
```bash
node tools/playtest.mjs 200
```
```bash
node tools/sim.mjs 1000 --policy normal
```
```bash
node tools/artcheck.mjs
```
```bash
node tools/linelen.mjs
```
```bash
npm run build
```
