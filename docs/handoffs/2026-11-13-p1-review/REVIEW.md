# ผลตรวจ P1 — Lives that remember

## ขอบเขต

Reviewed HEAD: `d12f64da180d8fa325c66f54a66ef8b0890b66ee`
Base main: `352f4a81ea29b9df647871dcf2d9c98d719950dd`
ตรวจ source และทดสอบสำเนาแยก ไม่ reset/เปลี่ยน checkout ผู้ใช้ ไม่แก้ logic ในรอบรีวิว

## 1. P1 / ข้อมูลสูญหาย: เซฟจากเวอร์ชันใหม่กว่าอาจถูกเขียนทับด้วย backup เก่า

ตำแหน่ง: `src/core/save.js:19`, `:103`, `:110–113`

เพิ่ม guard ให้ deserialize ปฏิเสธ sv > SAVE_SV แล้ว แต่คืน null แบบเดียวกับ JSON เสีย slots.load จึงลอง .bak ต่อทันทีและโหลดสำเร็จจาก backup รุ่นเก่า เมื่อ autosave/quit เรียก slots.save เซฟหลักรุ่นใหม่จะถูกเขียนทับ โดยไม่เก็บ bytes เดิมเพราะ deserialize(prev) เป็น null

หลักฐานใน memory store: primary sv4/gold99999, backup sv3/gold100 → load ได้ sv3/gold100 → save กลายเป็น primary sv3 และข้อมูล sv4 เดิมไม่ถูกเก็บไว้ นี่ไม่ได้เกิดกับทุกเซฟปกติ แต่เกิดเมื่อเปิดข้อมูลรุ่นใหม่กว่าด้วยเกมรุ่นเก่า ซึ่งเป็นกรณีที่ guard ใหม่ตั้งใจปกป้อง

**ควรแก้ก่อน merge:** แยก unsupported-version ออกจาก corrupt-input ให้ slot ระบุ locked/unsupported และห้าม auto-save ทับทั้ง primary/backup อย่าตีว่าเป็นช่องว่างแล้ว new game ทับได้ รองรับ export bytes เดิม และแสดงคำอธิบายให้ผู้เล่น ขณะเดียวกันเซฟ JSON เสียจริงยัง recover backup ได้

## 2. P2 / Integration: ลูกทีมคำสาบานและรับช่วงปาร์ตี้ยังไม่มีตัวตนกลาง

ตำแหน่ง: `src/core/team.js:128–134` และ `src/core/party.js:69–70`

เส้นทาง hire ปกติเรียก listMember แล้ว แต่ loyalAlly และ leaveParty(split/inherit) ยัง push member โดยตรง จึงไม่มี personId หรือ canonical person ใหม่ โหลด sv3 กลับมาก็ไม่ซ่อมเพราะ migration สร้างคนทำเฉพาะรุ่นเก่า

ทำซ้ำ: newLife + hunter rank2 + hooks.act.loyalAlly → team[0].personId undefined; round-trip เซฟยัง undefined. leaveParty inherit ได้สมาชิกสองคนที่ personId undefined ทั้งคู่

ผล: ระบบทีมเล่นต่อได้ แต่คนเหล่านี้ไม่พร้อมถูกอ้างร่วมจากเรื่อง/ข่าว/ความทรงจำ และ status death/departure ไปไม่ถึงตัวตนกลาง เป็นช่องว่างในเป้าหมาย P1 ที่ประกาศว่าคนโลก/ทีมอ้างรายการเดียวกัน

**ควรแก้ก่อน merge:** ใช้ gateway เพิ่มสมาชิกเดียวกันทุกทาง รักษา m.id/loyalty/wounds เดิม เพิ่ม repair สำหรับ current sv3 ที่ถูกบันทึกไปแล้วอย่าง idempotent ไม่เรียก migration ที่แจกผลซ้ำทั้งชุด และไม่สร้าง personId ใหม่เมื่อโหลดซ้ำ

## 3. P2 / ยังไม่แก้จากรอบก่อน: คนเลิกล่ายังได้ฉากลงเกต

`src/data/events/kinds2.js:5`, `src/core/events.js:97`

age30, hunter rankF, stoppedHunting=true: randomPool มี k2LootSplit, k2Rookie, k2Freeze, k2BodyCam, k2PotionThief, k2Standby. บางฉากจ่ายเงินว่าลงเกตสำเร็จจริงแล้ว ไม่ใช่เพียงคนเกษียณอ่านข่าว

เพิ่ม active-hunting eligibility สำหรับฉากที่ต้องกำลังทำงาน ไม่เปลี่ยน hunter:true ทั้งโลกเป็น canHunt เพราะเรื่องของอดีตฮันเตอร์ยังสมควรเกิดได้

## 4. P2 / ยังไม่แก้: แจ้งสมาคมแล้วไม่ได้พักล่า 3 เดือนจริง

`src/data/events/kinds2.js:325`, k2PotionThief ตัวเลือก index2

outcome บอกทีมลงเกตไม่ได้ระหว่างสอบสวน แต่มีเพียง wil+0.2: หลังเลือก canHunt=true, huntBreakUntil=null. ใช้สถานะพักที่มีอยู่หรือปรับข้อความให้ตรงผลจริงตามเจตนา มี licPause ที่ตั้งพัก 3 เดือนใช้เป็นแนวทางได้ แต่ต้องตรวจทุกช่องทาง gate/party ว่าปฏิบัติตาม

## 5. P2 / ยังไม่แก้: ลูกเพิ่งเกิดแต่กลับจากโรงเรียนแล้ว

`src/data/events/life2.js:220`, adKidSchool

สร้างลูกด้วย kidBorn ตอนผู้เล่น 40 ปีแล้วผ่าน 1 เดือน eligible=true. เงื่อนไข kids>=1 ไม่ยืนยันวัยเรียน ต้องอิง kidAt/ประวัติลูกที่เหมาะกับโมเดลปัจจุบัน ไม่ใช้เพียงอายุผู้เล่น

## 6. P2 / ยังไม่แก้: ตกงานแล้วมีหัวหน้าเรียกไปสอน

`src/data/events/kinds2.js:28`, k2CourseLater

job=null แต่ c.k2Course=1 และผ่าน 36 เดือน → eligible=true ทั้งที่ข้อความอ้างหัวหน้าและที่ทำงาน เพิ่ม employed หรือข้อความคนตกงานตามบริบท ไม่ล้างประวัติเคยเรียน

## 7. P2 / ยังไม่แก้: เรื่องแต่งประวัติลงเกตให้มือใหม่

`src/data/events/kinds2.js:301`, k2Freeze

ฮันเตอร์ F ไม่มีประวัติลงเกต eligible=true แต่ฉากอ้างว่าเคยลง D มา 20 ครั้งและยืนหน้าเกต C. อ้าง operation history/rank access ที่มีจริง หรือเขียนฉบับมือใหม่แทน ไม่ตั้ง counter ปลอมให้ตรงเรื่อง

## สิ่งที่ดีขึ้นและไม่ต้องทำซ้ำ

- core/narrative.js มี node/go/end/routes/waits/cast interruption แล้ว ไม่ใช่เพียงเพิ่ม choice ที่ 3
- มี office + friend authored graphs. office claimant เดิมกลับมาได้; client-return ผูก trust/present แยกจาก client-search
- แก้ปัญหา“ฮันเตอร์ที่เคยช่วย”บางฉากด้วยเงื่อนไขจริง และเพิ่ม regression ของซองเงิน/เปลี่ยนงาน/แต่งงานซ้ำ
- เพิ่ม canonical people, relations และ shared memories, import roster/team จาก v2, ปฏิเสธ schema ที่ใหม่กว่าที่ deserialize ระดับเดียวได้แล้ว แต่ slot layer ยังมีข้อ 1
- ช่วงเรื่องเพื่อนรอผ่าน ms18, เซฟผู้ใหญ่เก่าไม่เริ่มเรื่องวัยเด็กใหม่, ผู้สืบทอดได้เรื่องและเพื่อนใหม่
- UI แสดงเรื่องที่ติดตามกับคนที่มีความทรงจำร่วม ไม่ dump รายชื่อคนทั้งโลก

## ช่องว่างตรวจรับ ไม่ใช่ bug ที่พิสูจน์แล้ว

- Test paired-choice ของ office ใช้ 5 seeds และตั้ง stat40/เติมงานผ่าน helper ไม่ใช่ cohort100 seeds และพฤติกรรมผู้เล่นธรรมชาติทั้งหมดตาม handoff ใหญ่ อย่าเรียกว่าผ่าน C1 เต็มชุด
- Validator ยังไม่ตรวจ unknown keys/ทุกชนิด effect ตามข้อความใน spec; ตอนนี้ไม่พบข้อมูลเรื่องจริงที่ใช้ effect ผิดจนเกมพัง ควร harden ก่อนเพิ่มเรื่องจำนวนมาก
- story stale guard อยู่หลัง applyOutcome; เคสสร้าง stale event ด้วยมือยังจ่ายผลได้ แต่ไม่พบทาง gameplay ปัจจุบันที่เลื่อน node โดยค้าง ev เก่า จึงไม่รายงานว่าเกิด replay exploit จริง ให้เพิ่ม defensive test ก่อนมี asynchronous/event producers ใหม่
- NPC aging, quest focus queue, world city effects, family memory และ gate10 ธีม เป็นเฟสหลังที่ spec เลื่อนชัด ไม่ควรนับเป็น defect ของ P1 แต่ก็ยังไม่ถือว่าเสร็จแล้ว

## หลักฐานทดสอบใหม่บน HEAD ที่ตรวจ

| Check | ผล |
|---|---|
| npm test | 309 passed, 0 failed, 0 skipped |
| artcheck | ผ่าน, 0 open requests |
| linelen | ผ่าน |
| npm run build | ผ่าน; play.html 3401KB JS/69effects, ZIP8072KB |
| playtest200 | ไม่รายงานบั๊ก;242choices/life,180distinct events/life,median longest silence2years |
| lifecheck200 | รายงาน 0 repeat violations/0 bad text/0 checked misfits |
| sim normal1000 × seeds a,b,c | ทุก row PASS, deterministic; mean awakening25.2%, working-age mind74 |
| Chromium390×844/1280×844 | fixture เพื่อนวัยเด็กแสดง storyline; no pageerror/no horizontaloverflow |

ข้อจำกัด: sim รอบนี้ไม่ได้รัน careful/reckless หรือ seed d,e จึงไม่ใช่ merge gates ครบตาม spec. Browser ใช้ savefixture ที่สร้างด้วย core API เพื่อดู UI ใหม่ ไม่ใช่เล่นครบชีวิตด้วยมือ. lifecheck ยังตรวจ misfit เฉพาะบาง ID จึงไม่ขัดกับข้อ 3–7 ที่ทำซ้ำได้ด้วย probe

ผลผู้ตรวจอิสระสอดคล้องกับข้อ 1–2 และผู้ตรวจหลักรันซ้ำแล้ว ดู evidence/observed.json. โค้ดเกมยังไม่ได้รับการแก้จากรีวิวนี้
