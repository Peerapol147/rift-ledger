# บันทึกหลังรอยแยก (Rift Ledger)

เกมจำลองชีวิตแบบข้อความในโลกฮันเตอร์ เกิดในปีที่ 21 หลังวันฟ้าแตก ใช้ชีวิตจนวันสุดท้าย จะตื่นพลังหรือไม่ก็ได้ ดับเบิลคลิก `play.html` เพื่อเล่น

แนวคิดและการออกแบบทั้งหมดอยู่ใน [`docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md`](docs/superpowers/specs/2026-11-11-rift-ledger-redesign-design.md) อ่านไฟล์นี้ก่อนเพิ่มระบบหรือเนื้อเรื่อง

## เตรียมเครื่อง

ต้องมี [Node.js](https://nodejs.org) 20 ขึ้นไป เอฟเฟกต์ของ [pixelfx](https://github.com/patch-gg/pixelfx) (MIT) อยู่ใน `vendor/pixelfx` แล้ว ไม่ต้องโหลดแยก

```bash
git clone https://github.com/Peerapol147/rift-ledger.git
```

```bash
cd rift-ledger && npm install
```

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm test` | เทสต์ระบบใน `src/core` (ไม่ต้องใช้ pixelfx) |
| `node tools/sim.mjs 1000 --policy normal` | เล่นอัตโนมัติ 1,000 ชีวิต ตรวจข้อมูลและเป้าสมดุล (`careful`, `normal`, `reckless`) |
| `node tools/linelen.mjs` | หาบรรทัดที่ยาวเกิน 120 ตัวอักษรใน `src/core` และ `src/data` |
| `npm run build` | สร้าง `play.html` ใหม่ |

`tools/sim.mjs` จะจบด้วย exit code 1 ถ้าข้อมูลอ้างถึงสิ่งที่ไม่มีอยู่ บรรทัดยาวเกิน อัตราตื่นพลังหลุดเป้า (เมื่อเล่น 1,000 ชีวิตขึ้นไป) หรือผลไม่เหมือนเดิมเมื่อเล่น seed เดิมซ้ำ

## โครงโค้ด

| ที่อยู่ | หน้าที่ |
|---|---|
| `src/core/` | ระบบเกมล้วน ไม่มี DOM รันใน Node ได้ ใช้ผ่าน `src/core/index.js` เท่านั้น |
| `src/data/` | ข้อมูลเนื้อหาทั้งหมด แยกไฟล์ตามหมวด |
| `src/ui/` | หน้าจอ อ่านสถานะจาก core และเรียกฟังก์ชันของ core |
| `src/stage.js` และ `src/*-art.js` | ฉาก pixel art และเอฟเฟกต์ |
| `src/fx/rift/` | เอฟเฟกต์ของเกมเราเอง (`gate-open` เกตเปิด, `gate-break` เกตแตก) สร้างด้วยวิธีของ pixelfx ตั้งชื่อ `rift/...` ใน `src/presets.js` |
| `vendor/pixelfx/` | สำเนา `src/` ของ pixelfx 0.3.1 (MIT) วิธีอัปเดตอยู่ใน `vendor/pixelfx/README.md` |
| `test/` | เทสต์ของ `src/core` |

## เพิ่มเนื้อหา (แก้แค่ `src/data/`)

| อยากเพิ่ม | ไฟล์ |
|---|---|
| เหตุการณ์ตามวัย | `src/data/events/kid.js`, `teen.js`, `adult.js`, `hunter.js` |
| หมุดหมายชีวิต | `src/data/milestones.js` |
| เหตุการณ์โลกตามปี | `src/data/calendar.js` (`views` แยกตามอาชีพ / `hunter` / `default`) |
| อาชีพ และงานใหญ่ของคนธรรมดา | `src/data/careers.js` (`CAREERS`, `BIG_JOBS`) |
| คลาส ความหายาก บทบาท | `src/data/classes.js` |
| สกิล | `src/data/skills.js` |
| เกต | `src/data/gates.js` |
| หอคอยและช่วงชั้น | `src/data/towers.js` |
| มอนสเตอร์ | `src/data/monsters.js` (ภาพอยู่ที่ `art/monsters`) |
| ไอเทม และของดรอป | `src/data/items.js` |
| ครอบครัวเริ่มต้น ชื่อ | `src/data/families.js` |
| สายเรื่องอาชีพและบทบาทฮันเตอร์ | `src/data/stories/careers.js`, `src/data/stories/hunters.js` |
| ลูกทีม ค่าจ้าง และบทของลูกทีม | `src/data/team.js`, `src/data/team-stories.js` |
| กิจการของคนธรรมดา | `src/data/business.js` |
| เควสลับ (สุ่ม 3 สายต่อชีวิต) | `src/data/secrets.js` |
| ของที่ปลดจากสมุดสะสม | `src/data/unlocks.js` |
| เหตุการณ์สุ่มตามเมือง อาชีพ วัย | `src/data/events/more.js` |
| ชื่อบาดแผล | `src/data/injuries.js` |
| เมือง ประเทศ อัตราตื่นพลัง สัดส่วนแรงก์ | `src/data/world.js` |

### รูปแบบเหตุการณ์

```js
{
  id: "adultRent", tag: "เงิน", age: [19, 40],
  t: "โจทย์ที่ผู้เล่นเห็น ({name} = ชื่อตัวละคร)",
  o: [
    { l: "ทางเลือก", s: "cha", diff: 16, y: { m: "ผลเมื่อสำเร็จ", gold: -200 }, n: { m: "ผลเมื่อพลาด" } },
  ],
}
```

- **ฟิลด์ของเหตุการณ์:** `once` เกิดครั้งเดียว · `important` ออโต้หยุดให้เลือกเอง · `k: "x"` เกิดได้เฉพาะเมื่อถูกเรียก (`next`, ปฏิทิน) · `hunter: true/false` · `who: [อาชีพหรือคลาส]` · `if`/`max` เงื่อนไขตัวนับ
- **ฟิลด์ของทางเลือก:** `s` + `diff` ทดสอบค่าสถานะ · `risk` โอกาสบาดเจ็บร้ายแรง · `need` เงื่อนไข
- **ฟิลด์ของผล:** `gold` `st` `hp` `mind` `fame` `c` (ตัวนับ) `injury: [id, เดือน|null]` `next: [id, เดือน]` `act` (เรียกฟังก์ชันใน core)
- **เงื่อนไขที่ผู้เล่นมองเห็น:** `need` ที่เป็นค่าสถานะ `gold` `hp` `mind` `skill:x` `job:x` `cls:x` `role:x` จะแสดงเป็นตัวเลือกล็อก 🔒 ส่วนตัวนับอื่นเป็นเงื่อนไขลับ ทางเลือกนั้นจะซ่อนจนกว่าจะทำได้
- **ข้อกำหนดของทุกเหตุการณ์:** ต้องมีอย่างน้อยหนึ่งทางเลือกที่ไม่มี `need`
