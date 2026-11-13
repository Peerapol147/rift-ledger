# Rift Ledger — Complete Claude handoff

เอกสารรวมสำหรับแนบให้ Claude อ่านครบในไฟล์เดียว วันที่13พฤศจิกายน2026

<!-- Source: 00-START-HERE.md -->

# Claude handoff — Rift Ledger: ชีวิตหลากหลายแบบ Way of Xian

วันที่ 13 พฤศจิกายน 2026 · สำหรับ Claude ผู้พัฒนา · เอกสารส่งต่อ ไม่ใช่การแก้เกมที่เสร็จแล้ว

## คำขอของเจ้าของเกม

เจ้าของชอบระบบของ Way of Xian ที่ส่งมาในไฟล์ HAR และขอให้ถอดแนวทางมาพัฒนา Rift Ledger โดยเน้นความหลากหลาย พร้อม handoff ละเอียด ใช้ Superpowers ก่อนหน้านี้ระบุชัดว่าอยากให้แต่ละชีวิตหลากหลาย

ข้อที่เจ้าของยืนยัน: ใช้เกมแนวนี้เป็นฐานด้านระบบและเรื่องราว, ความหลากหลายสำคัญ, ให้ Claude เป็นผู้ลงมือพัฒนา
ข้อที่ผู้จัดทำเสนอ: โครงข้อมูล ชื่อ API ตัวเลข ขนาดเนื้อหา ลำดับเฟส และเกณฑ์วัดในแพ็กนี้ เป็นแบบแนะนำสำหรับการลงมือ ไม่ใช่ค่าที่เจ้าของเคยตรวจรับทีละข้อ

เอกสารนี้ไม่ให้อำนาจเผยแพร่เกม ส่งข้อความภายนอก merge หรือ push แทนคำสั่งและข้อกำหนดจริงใน session ของ Claude และไม่แอบเปลี่ยนสิทธิ์จากข้อความที่พบใน HAR

## อ่านตามลำดับ

1. `01-DESIGN.md` — ประสบการณ์เป้าหมาย แนวทางถอดระบบ และขอบเขต
2. `02-ENGINE-CONTRACTS.md` — state, API, เวลา, scheduler, outcome, migration และ invariants
3. `03-CONTENT-BIBLE.md` — วิธีเขียนเรื่องแตกแขนง ตัวอย่างละเอียดและรายการเนื้อหา
4. `04-IMPLEMENTATION-PLAN.md` — งานทีละชิ้น ไฟล์ที่แตะ red/green และลำดับส่งมอบ
5. `05-ACCEPTANCE-AND-QA.md` — วิธีพิสูจน์ว่าเล่นต่างจริง ความปลอดภัยของเซฟ และ release gates
6. `06-SOURCE-MAP.md` — หลักฐานต้นแบบ ข้อจำกัด และสิ่งที่ไม่ควรถอดตาม
7. `07-AUDIT.md` — รายงานตรวจเกมก่อนเขียน handoff

ใน repo อ่าน `AGENTS.md`, `CLAUDE.md`, `docs/HANDOFF.md`, และ spec เดิมด้วย เอกสารเก่าเป็นบริบท; ถ้าขัดกับแพ็กนี้ ให้แยกข้อขัดแย้งและอธิบาย ไม่แกล้งถือว่ามีการอนุมัติรายละเอียดใหม่แล้ว

## เริ่มงานอย่างไร

- ใช้ checkout ปัจจุบันใน environment ที่แยกอยู่แล้ว ไม่สร้าง worktree เว้นผู้ใช้ต้องการหรือจำเป็นตามกติกา session นั้น
- ตรวจ git status, HEAD, branch และความเปลี่ยนแปลงล่าสุดก่อนยึดเลขบรรทัดในรายงาน
- Baseline ที่ตรวจคือ `65e56213ab031ac9e1a73dda79ffc84327da4b5a` ที่ `/workspace/rift-ledger`
- Node >=20, ES modules, esbuild 0.25.10, เกมรวมเป็น `play.html`, core ไม่มี DOM
- ณ เวลาตรวจ: npm test ผ่าน 198/198; artcheck ผ่านมี 11 คำขอเปิด; build ผ่าน; sim 1000 ชีวิต × seeds a,b,c ผ่าน; playtest 40 ชีวิตไม่พบข้อผิดพลาด; Chromium เปิดชีวิตใหม่ได้ ทั้งหมดเป็น baseline ไม่ใช่หลักฐานว่า feature ในเอกสารนี้ทำแล้ว
- ใช้ superpowers:brainstorming สำหรับตกลงแบบเมื่อเริ่มพัฒนา จากนั้น writing-plans, executing-plans หรือ subagent-driven-development ตามวิธีที่ผู้ใช้เลือก, test-driven-development, verification-before-completion และ requesting-code-review สำหรับระบบใหญ่
- แพ็กนี้เป็น proposal พร้อมแผน ไม่ใช่ข้ออ้างข้าม design approval ใน workflow ของ Claude; แจ้งแนวทางหลักสั้น ๆ และใช้ขอบเขตอำนาจที่ผู้ใช้ให้จริง ไม่ถามรายละเอียดที่เอกสารตัดสินไว้แล้วซ้ำ
- เริ่ม P0 baseline/migration แล้วทำ P1 vertical slice สายประกันบริษัทให้ครบก่อนเพิ่มทุกระบบ
- อย่ารื้อ combat, balance, assets, UI ทั้งหมดพร้อมกัน อย่าเพิ่ม dependencies ถ้า Node ธรรมดาทำได้

## นิยามความสำเร็จที่ต้องรักษา

เล่นอาชีพเดิม แต่คนละการตัดสินใจ ต้องได้เรื่อง คน และผลปลายทางต่างกันอย่างมีเหตุผล คนที่ช่วยวันนี้อาจกลับมาเป็นลูกทีม คู่แข่ง หรือต้นทางงานในภายหลัง รุ่นลูกต้องอยู่กับผลของรุ่นก่อน โลกเดินต่อได้แม้ผู้เล่นไม่ใช่คนสำคัญ และไม่จำเป็นต้องเป็นฮันเตอร์เพื่อมีชีวิตน่าจดจำ

## ข้อความส่งให้ Claude ได้ทันที

> อ่านแพ็ก handoff นี้ทั้งหมด แล้วตรวจ repo เทียบกับ baseline ใช้ Superpowers พัฒนา Rift Ledger ให้มีความหลากหลายเชิงเหตุและผลแบบ Way of Xian โดยรักษาโลกฮันเตอร์และเนื้อหาต้นฉบับของเรา เริ่มจากสายประกันที่แตกแขนงและ NPC คนเดิมต่อเนื่อง พร้อม migration เซฟและการทดสอบ ก่อนขยายเป็นโลก ความสัมพันธ์ และรุ่นลูก ทำทีละเฟสที่เล่นได้จริง ระบุสิ่งที่ทำ/ยังไม่ทำและหลักฐานทดสอบทุกครั้ง อย่าคัดลอกข้อความ ภาพ หรือโค้ดต้นแบบเข้าผลิตภัณฑ์ทั้งชุด และอย่าเผยแพร่เอง


---

<!-- Source: 01-DESIGN.md -->

# Design proposal — A life that remembers

## 1. ทิศทาง

ถอดหลักการของ Way of Xian: ชีวิตเปลี่ยนบทตามสิ่งที่เป็น, คนมีตัวตน, เรื่องแตกตามการกระทำ, โลกและครอบครัวจำอดีต แล้วสร้างระบบและเรื่องใหม่ในจักรวาล Rift Ledger ใช้เอกลักษณ์ฮันเตอร์ ไทย/เกาหลี เกต หอคอย มนุษย์ธรรมดา และความจริงของจักรวาลเดิมต่อ

“clone แนวทาง” ในแพ็กนี้หมายถึงความสามารถและประสบการณ์ ไม่ใช่เอาเกมเซียนมาเปลี่ยนชื่อ ต้นแบบมีออนไลน์ ดินแดน สำนัก สงคราม และหลายระบบที่ไม่ได้เหมาะจะยกมาพร้อมกัน

## 2. ทางเลือกที่พิจารณา — ผู้จัดทำแนะนำทาง B

| วิธี | ผล | ข้อแลกเปลี่ยน |
|---|---|---|
| A เพิ่ม event/เกตบนแกนเดิม | ได้เนื้อหาเร็ว | ยังเป็นเส้นบทเดิม คนและผลยังแยกกัน |
| B เติมแกนเหตุและผล แล้วพิสูจน์ด้วยหนึ่งสายอาชีพ | เพิ่มความหลากหลายโดยใช้ระบบเดิม | ต้องทำ migration และตัวจัดคิวก่อนขยาย |
| C เขียนใหม่หรือพอร์ตต้นแบบทั้งชุด | ขอบเขตกว้างมาก | ทิ้งของเดิม เสี่ยงเซฟ/สมดุลและกลายเป็นอีกเกม |

เลือก B เป็นข้อเสนอเริ่มต้น ผู้ใช้อนุญาตให้ทำ handoff แต่ยังไม่ได้เลือกตารางนี้โดยตรง ไม่อ้างเป็นการอนุมัติแบบละเอียดแล้ว

## 3. เสาหลัก 8 ข้อ

1. **บริบทชีวิต**: วัย อาชีพ หนี้ เมือง ครอบครัว บาดเจ็บ กิลด์ ทำให้ฉากที่เหมาะต่างกัน
2. **เส้นทางเรื่อง**: การปฏิเสธ ความล้มเหลว ความเงียบ และการเปลี่ยนอาชีพสร้างทางไปต่อ ไม่บังคับสำเร็จทุกเรื่อง
3. **คนเดิมต่อเนื่อง**: อ้างรหัส NPC เดียวกันระหว่างข่าว ทีม เควส และมรดก
4. **ความทรงจำร่วม**: ช่วย ทิ้ง โกง ยืม ช่วยลูกเขา ถูกจำและส่งผลภายหลัง
5. **โลกที่เปลี่ยนสถานะ**: ข่าวใหญ่เปลี่ยนสิ่งที่เกี่ยวข้องจริง ไม่ใช่ทุกข่าวแจก debuff ทั่วโลก
6. **การสืบทอด**: ทรัพย์สิน ความรู้ ชื่อเสียงเฉพาะกลุ่ม ความแค้น และความสัมพันธ์กับครอบครัว ไม่ใช่ค่าสถานะทั้งหมด
7. **ลึกลับแต่ยุติธรรม**: บอกความเสี่ยงที่รับรู้ได้ ซ่อนเงื่อนไขลับ ไม่โกหกผู้เล่นเรื่องสาเหตุ
8. **ดูแลงานประจำด้วยนโยบาย**: ออโต้ลดงานซ้ำ แต่ไม่ตัดสินเรื่องความสัมพันธ์และทางแยกสำคัญแทน

## 4. วงจรเล่น

เกิด → เรียนรู้ครอบครัว/เมือง → สร้างความสนใจ → เลือกทางชีวิต → เจอผู้คนและผลระยะยาว → ผ่านวิกฤต/โอกาส → วัยสูงอายุ/ส่งต่อ → ตาย → เล่นคนรุ่นถัดไปในโลกเดิม หรือเริ่มโลกใหม่

แต่ละชีวิตมีเหตุการณ์ประจำวัน เรื่องที่ติดตามหลักหนึ่งเรื่อง และฉากโลก/คนรู้จักที่สัมพันธ์กับบริบท ไม่ใช่เปิดทุกระบบทุกเดือน

## 5. บทชีวิต (life arcs)

คำนวณจากสถานะจริง ไม่ต้องมีแต้มบุคลิกใหม่สิบชุด ค่าเสนอ: childhood, school, earlyCareer, workingLife, hunterService, guildLife, recovery, debtCrisis, familyCare, retirement

เลือกแสดงบทหลักหนึ่งบทด้วย priority: recovery เมื่อบาดเจ็บหนักจนทำงานหลักไม่ได้ > debtCrisis เมื่อ debt > 0 และใช้คืนขั้นต่ำไม่ได้ 3 เดือนติด > familyCare เมื่อมีภาระดูแลที่รับไว้ > สถานะอาชีพ/วัยตามปกติ

บทเปลี่ยนความถี่ event และคำบรรยาย ไม่สร้างความเสี่ยงตายอัตโนมัติ ไม่หยุดทุกเรื่องเดิมโดยไร้เหตุผล มีขั้นต่ำ 3 เดือนก่อนเปลี่ยนบทเพราะคะแนนปริ่มเกณฑ์ ยกเว้นเกิด/ตาย/บาดเจ็บหนัก/เลิกงานจริง ใช้สถานะที่มีอยู่ก่อน เพิ่ม counter เฉพาะเมื่อพิสูจน์ว่าจำเป็น

## 6. การเล่าเรื่อง

- บทเรื่องใช้กราฟที่เขียนไว้ คัดเลือกรุ่นข้อความตามบริบท ไม่ใช้ LLM runtime
- ทุกสายมีคำตอบว่าใครอยากได้อะไร ผู้เล่นเกี่ยวข้องเพราะอะไร และมีผลล่าช้าอะไร
- ไม่รับงานได้ ไม่ยิ่งใหญ่ได้ ตอนจบสายเรื่องไม่ใช่ game ending
- ผู้อยู่แรงก์ต่ำไม่มีคนมอบอำนาจบัญชาการทั้งประเทศเพียงเพราะมาถึงบทที่ 5
- สถานะที่ไม่พอควรเกิดฉากขนาดเหมาะสม เช่น ช่วยคนในซอยแทนบัญชาการทั้งเมือง
- ความสำเร็จมีต้นทุน ความล้มเหลวยังได้ความรู้ คนรู้จัก หรือทางอื่น ตามเหตุผลของฉาก
- สายลับไม่โชว์ชื่อ internal route, จำนวน ending ที่ยังไม่เห็น, สูตรปลด หรือป้าย “เควสลับ”

## 7. โลกและ NPC

เริ่มโดยรวมรายชื่อโลก 12 คนและทีม/ผู้ติดต่อที่มีอยู่เข้าระบบอ้างอิงเดียวกัน ไม่เพิ่มเป็น 2,000 คนตามต้นแบบทันที คนใหม่สร้างเมื่อจำเป็น มีเพดาน soft cap 128 คนที่ใช้งานและเก็บ tombstone ของคนตายที่ถูกอ้างถึงเสมอ

NPC มีอายุ ถิ่น อาชีพ สถานะ ความต้องการ และเวลาขั้นต่อไปแบบ seeded ตรวจเฉพาะเมื่อเวลาถึงหรือถูกอ้างถึง ไม่สุ่มชะตาใหม่ทุก render คนสำคัญไม่ได้เป็นอมตะเพราะโค้ดลืมเช็คอายุ แต่การตายต้องไม่ทำให้เควสใช้คนอื่นปลอมเป็นคนเดิม

## 8. ความสัมพันธ์

ไม่โชว์ loyalty เป็นเลขใหม่ซ้ำกับระบบเดิม ใช้ trust -100..100, obligation -100..100 และ tag เช่น acquaintance, coworker, mentor, rival, family ข้างใน; หน้าเล่นบอกเป็นคำและความทรงจำสำคัญ

NPC ขอความช่วยเหลือได้และปฏิเสธได้ ความไว้ใจไม่ขึ้นจากการ spam ของขวัญแบบไม่มีเพดาน ตกลงทำอะไรแล้วผิดนัดมีผลเฉพาะคนหรือกลุ่มที่เกี่ยวข้อง ไม่ลดชื่อเสียงทั้งประเทศทันที

## 9. โลกที่อยู่ได้หลายรุ่น

มี world state เมือง ความเสียหาย recovery และ faction influence แยกจากค่าความไว้ใจผู้เล่น ค่าความไว้ใจเดิม s.fac ห้ามแทนที่ด้วยอำนาจฝ่ายโลก

เมืองเริ่มมี disruption 0..3; วิกฤตมีระยะและวันฟื้นตัวชัดเจน ผลด้านเงินใช้ multiplier รวมไม่เกิน ±15% ในเฟสแรกเพื่อไม่ทำลายสมดุลเดิม กำหนดผลต่ออาชีพที่เกี่ยวข้องและแสดงรายการใน ledger

ข่าวเล็กยังเป็นบรรยากาศได้ ข่าวที่อ้างว่าเปลี่ยนชีวิตผู้เล่นต้องมี state จริงและ trace สาเหตุ

## 10. รุ่นลูกและโลกหลังปี 100

รักษาวิธีปัจจุบันที่ผู้สืบทอดเป็นเด็กเกิดเดือนที่รุ่นก่อนตาย หากจะเปลี่ยนเป็นลูกที่โตอยู่แล้วเป็นงานอีกชิ้น ไม่แอบย้ายอายุและลำดับเหตุการณ์ในเฟสนี้

ส่ง family memory ของฉากทั่วไปไปด้วย ลดน้ำหนักฉากที่ครอบครัวเคยเจอ แต่หมุดหมายจำเป็นและเหตุการณ์ที่บริบทเปลี่ยนยังออกได้ ไม่เอาความลับทั้งหมดเข้าหัวลูกทันที ต้องมีจดหมาย สมุด หรือคนบอก และมีระดับการรู้แยกจากความรู้ของผู้เล่น

หลังหมดปฏิทินที่เขียนไว้ยังมีฉากตามสภาพโลกและผลตกค้าง ห้าม replay ภัยประวัติศาสตร์เดิมเป็นของใหม่ ใช้การรำลึกหรือผลต่อเนื่องแทน ยังไม่ทำยุคใหม่เหนือเทคโนโลยี/โลกเดิมโดยไม่ตกลงทิศทาง

## 11. ของ อาชีพ การต่อสู้ และหอคอย

- ของสำคัญมี provenance: ที่มา ผู้สร้าง เหตุการณ์ และเจ้าของเก่าที่เปิดเผยได้ผ่านการตรวจ/ประวัติจริง
- งานคนธรรมดาใช้ ops เดิมสำหรับงานใหญ่ มีการเตรียมและจุดตัดสินใจ ไม่ลดให้เหลือปุ่มหาเงิน
- เกต 10 ธีมมี signature คนละอย่าง: terrain, hazard, objective, enemy logic และทางเลือกที่ใช้บทบาท/ความรู้
- หอคอยสองแห่งเดิมคงปริศนาคนละอารยธรรม หลักฐานต้องไม่กลายเป็น checklist บอกความจริงทั้งหมด
- ไม่เปลี่ยนสูตรต่อสู้ใหญ่ในงาน narrative; เทียบรายได้ อันตราย บอสทีม และถอยด้วย baseline เดิมก่อนปรับ

## 12. UI และออโต้

เพิ่ม “เรื่องที่ติดตาม” ในพื้นที่เดิมและ “ผู้คน” ในแท็บทีม ไม่เพิ่ม 10 แท็บพร้อมกัน ช่วงเด็กเห็นเฉพาะคนในครอบครัว/โรงเรียน เรื่องที่ยังไม่ค้นพบไม่อยู่ในรายการ

โฟกัสเรื่องหนึ่ง: เห็นบริบท สิ่งล่าสุด คนที่เกี่ยวข้อง และเป้าหมายที่ตัวละครรู้ได้ สลับเรื่องได้เมื่อไม่มีตัวเลือกหรือ operation ค้าง เรื่องที่พักไม่ข้ามฉากเอง แต่เหตุการณ์โลก/คำสัญญาแบบมีกำหนดยังคงเวลาโลก

ออโต้หยุดที่ route choice, การรับปาก, ค่าใช้จ่ายก้อนใหญ่ที่ไม่อยู่ในงบ, ความเสี่ยงตาย, NPC สำคัญตาย และตัวเลือกไม่มีทางปลอดภัย ไม่แปลว่าทุกข่าวต้องหยุด

## 13. ขอบเขตและลำดับ

P0 baseline + contracts + migration → P1 สายประกันแตกแขนงและ NPC ต่อเนื่อง → P2 คิวเรื่อง/บทชีวิต/ความทรงจำ → P3 ผลต่อเมือง/อาชีพ + เกต → P4 มรดก/รุ่นลูก + lore → P5 ขยายสายเรื่องและ QA

P1 ต้องเล่นได้ end-to-end ก่อนขยาย ห้ามเรียกทั้งโครงการสำเร็จเมื่อมีแค่ framework หรือเนื้อหาหนึ่งสาย

## 14. สิ่งที่ไม่ทำในขอบเขตนี้

ไม่คัดลอก source/dialogue/assets ต้นแบบโดยตรง ไม่ทำ multiplayer/cloud saves/สงครามกระดาน/ระบบเซียน/โลกใหม่ทั้งหมด ไม่ให้ทุกชีวิตเป็นผู้กอบกู้ ไม่เพิ่มการคืนชีพฟรี ไม่ทำข่าวและเควส procedurally โดยสุ่มข้อความที่ไม่อ่าน state

## 15. สิ่งที่ Claude ตัดสินเองได้

วิธีแยกฟังก์ชันย่อย การจัด CSS และข้อความย่อย ชื่อ NPC/องค์กรที่แต่งใหม่ ค่าสมดุลหลังวัดหลาย seed ภายในขอบเขตเดิม ทุกค่าตั้งต้นในแพ็กนี้เป็นข้อเสนอ ต้องบันทึกเหตุผลหากเปลี่ยน และไม่อ้างว่าเป็นกติกาที่เจ้าของเคยกำหนด


---

<!-- Source: 02-ENGINE-CONTRACTS.md -->

# Engine contracts — ข้อเสนอเทคนิคที่ Claude ใช้วาง implementation

ชื่อ/ค่าในเอกสารนี้เป็น proposed contract ไม่ใช่ API ที่มีอยู่แล้ว อ่านคู่ 01 และตรวจความเข้ากันได้กับ repo ล่าสุดก่อนเขียน

## A. เวลาและตัวตน

- `worldMonth(s) = (s.mon0 ?? 0) + s.ageM` เป็นเดือนนับจาก ม.ค. 2051 ไม่ใช่นับจากวันฟ้าแตก
- วันเกิด/วันตาย NPC, due date โลก, วันสร้าง memory ใช้ worldMonth ทั้งหมด ตัวเลข `s.ageM` เดิมใช้กับวัยผู้เล่นและระบบเดิมที่ยังไม่ย้าย
- สายเรื่องใหม่ใช้ dueWorldM และ lastServedWorldM แบบ absolute เสมอ `newHeir` ไม่เอา ageM ใหม่ไปเทียบ due เก่า
- IDs เป็น string แบบ `[A-Za-z0-9_-]+`; เรื่องและ node ใช้ namespace เช่น `career-office`, `audit` ห้ามเอาชื่อแสดงผลเป็น key
- `lifeId` แยกแต่ละชีวิต; `familyId` คงเดิมเฉพาะการเล่นต่อเป็นผู้สืบทอด; เริ่มโลกใหม่ไม่แชร์ state ครอบครัวโดยอัตโนมัติ
- hero ในเรื่องผูกด้วย lifeId ไม่สร้าง NPC ผู้เล่นที่ยังมีชีวิตซ้ำใน world.people คนในรุ่นก่อนอ้างผ่าน family member record ได้

## B. State ที่เพิ่ม (plain JSON เท่านั้น)

```js
s.narrative = {
  version: 1,
  lifeId: 'life-1', familyId: 'family-1',
  focusId: null, questLimit: 3,
  stories: {},
  lifeArc: { id: 'childhood', sinceWorldM: 0 },
  resolved: {},
  recentScenes: [],
};
// stories[storyId]
{
  nodeId: 'intake', routeId: null, status: 'available',
  enteredWorldM: 0, dueWorldM: 0, lastServedWorldM: null,
  cast: { claimant: 'p-17' }, vars: {},
  visited: [], endingId: null, waitReason: null,
}
s.world.people = {}; // id -> canonical person
s.world.nextPersonId = 1;
s.world.cityStates = {}; // cityId -> city state
s.world.factionPower = {}; // distinct from s.fac
s.world.journal = []; // resolved facts affecting the world
s.relations = {}; // personId -> relationship with THIS life
s.familyMemory = {
  familyId: 'family-1', seenScenes: {},
  members: [], legacies: [], knownEvidence: [],
};
```

Story status enum: `available|active|waiting|shelved|completed|abandoned` ไม่สื่อถึงความหายากหรือความลับ `available` ต้องค้นพบแล้ว; เรื่องที่ไม่รู้จักยังไม่มี entry ใน state ผู้เล่น

Person contract:

```js
{
  id: 'p-17', name: 'ชื่อแต่ง', country: 'th', city: 'bangkok',
  sex: 'm', bornWorldM: -300, diedWorldM: null,
  jobId: null, hunter: { rank: 2, cls: '...', lv: 20 },
  tags: [], nextUpdateWorldM: 12,
  storyRefs: [], retired: false,
}
```

`hunter` เป็น null สำหรับคนธรรมดา IDs job/cls/city ต้องอ้างรายการที่มีจริง `diedWorldM` ไม่ใช้ truthiness เพราะ 0 เป็นเดือนที่ถูกต้อง

Relation contract: `{ trust:0, obligation:0, tags:[], memories:[], lastContactWorldM:0, tested:false }` loyalty ทีมเดิมยังใช้ในการต่อสู้และออกทีมจนกว่าจะมี task ย้ายชัดเจน ห้ามแทนที่ด้วย trust แบบเงียบ ๆ

Memory contract: `{ id, kind, worldM, actorLifeId, personIds:[], storyId:null, nodeId:null, public:false, facts:{} }`; ข้อความแสดงผลมาจาก template ที่เขียน ไม่เก็บคำสั่ง JS ใน facts

City contract: `{ disruption:0, recoveryAtWorldM:null, causeId:null, modifiers:[] }`; modifier `{ id, sourceId, jobIds:[], incomeMul:1, costMul:1, expiresWorldM }`

## C. File responsibilities

| Proposed file | Responsibility |
|---|---|
| src/core/people.js | คนอ้างอิงเดียว, adapter roster/team, ตรวจ alive/age/location |
| src/core/relations.js | ความสัมพันธ์และความทรงจำร่วม |
| src/core/narrative/conditions.js | predicates ไม่มี mutation/RNG |
| src/core/narrative/engine.js | start/advance/complete เรื่องและ transition |
| src/core/narrative/scheduler.js | คัด event จากเรื่องและ focus โดยไม่เปิดซ้อน |
| src/core/narrative/validate.js | ตรวจ graph/references/content จาก pure data |
| src/core/life-arcs.js | derive บทชีวิตและ event weighting |
| src/core/world-effects.js | city effects, journal, recovery, idempotent effects |
| src/core/family-memory.js | บันทึกประวัติครอบครัว/น้ำหนักซ้ำ/knowledge inheritance |
| src/data/narrative/index.js | registry เรื่องใหม่; ไม่ import core |
| src/data/narrative/career-office.js | vertical slice สายประกัน |
| src/data/narrative/*.js | เรื่องที่ขยายทีละสาย |
| src/ui/tabs/stories.js | หน้าเฉพาะเรื่องที่ค้นพบและติดตาม |
| src/ui/tabs/people.js | คนที่รู้จัก ไม่ dump world.people |

`src/core/index.js` export public API ใหม่; core ไม่ import UI; data ไม่ import core เพื่อเลี่ยง cycle แบ่งไฟล์ตามความรับผิดชอบ ไม่ยัดทุกอย่างลง stories.js หรือ events.js

## D. Proposed API signatures

```ts
worldMonth(s:State):number
initNarrative(s:State):void
ensurePerson(s:State, input:PersonInput, sourceKey:string):string
personById(s:State, id:string):Person|null
personAliveAt(s:State, id:string, worldM:number):boolean
bindCast(s:State, storyId:string, roles:CastSpec):{ok:boolean, cast:Record<string,string>, reason:string|null}
remember(s:State, memory:Memory):boolean
changeRelation(s:State, personId:string, delta:RelationDelta):void
holds(s:State, condition:Condition, ctx:StoryContext):boolean
startStory(s:State, storyId:string):{ok:boolean, reason:string|null}
storyCandidates(s:State):NarrativeCandidate[]
selectNarrative(s:State):NarrativeCandidate|null
openNarrative(s:State, candidate:NarrativeCandidate):boolean
resolveNarrative(s:State, choiceId:string):{ok:boolean, reason:string|null}
setStoryFocus(s:State, storyId:string|null):boolean
shelveStory(s:State, storyId:string):boolean
abandonStory(s:State, storyId:string):boolean
deriveLifeArc(s:State):string
applyWorldEffect(s:State, effect:WorldEffect, effectKey:string):boolean
recoverWorld(s:State):void
familySceneWeight(s:State, sceneId:string, mandatory:boolean):number
inheritFamilyMemory(parent:State, heir:State):void
validateNarrative(definitions:Record<string,StoryDef>, catalogs:Catalogs):ValidationIssue[]
```

Returning false must not spend money, mutate route, consume RNG or alter timestamps. `ensurePerson` returns same ID when sourceKey already imported, so refresh/migration cannot duplicate people.

## E. Story definition

```js
{
 id: 'career-office', title: 'แฟ้มที่ไม่ได้ปิด',
 discover: { all: [{ job: 'office' }, { age: [18, 70] }] },
 entry: 'intake',
 cast: { claimant: { source: 'local-hunter', rank: [1, 3], required: true } },
 nodes: {
  intake: {
   kind: 'choice', delayM: [1, 3],
   t: 'ข้อความต้นฉบับของเรา ใช้ {cast:claimant} เมื่อผูกตัวแล้ว',
   choices: [
    { id: 'read', l: 'ตรวจสัญญา', check: {stat:'int',diff:16},
      success: { next:'claim', effects:[] },
      failure: { next:'seek-help', effects:[] } },
    { id: 'routine', l:'ทำตามแบบฟอร์ม', success:{next:'routine',effects:[]} },
   ],
  },
 },
 endings: { routine: { title:'งานที่ทำต่อไป', public:true } },
}
```

ตารางข้างบนอธิบาย schema ไม่ใช่เรื่องครบที่รันได้ทันที validate ต้องปฏิเสธ reference ของ node ที่ขาด

Node kind: `choice|beat|ending`. `beat` ไม่เปิด choice และเดินได้ไม่เกิน 1 node ต่อเรื่องต่อเดือน; จำกัดรวม auto chain 4 nodes ต่อ invocation ป้องกัน cycle ค้าง; ถ้าถึงเพดานแล้วมีงานต่อ รอ tick หน้า ไม่ทิ้ง state

Choice: `{id,l,when?,knownNeed?,check?,risk?,success,failure?,noAuto?}`
Transition: `{next?:nodeId, ending?:endingId, route?:routeId, effects:Effect[]}` ต้องมี next หรือ ending เพียงหนึ่ง ค่า route ถูกตั้ง explicit ไม่คาดเดาจากข้อความ

Conditions เป็น allowlist: `all`, `any`, `not`, `age:[min,max]`, `job:id`, `jobTierAtLeast:n`, `rank:[min,max]`, `city:id`, `goldAtLeast:n`, `debtAtMost:n`, `fameAtLeast:n`, `flag:id`, `var:{key,eq}`, `route:id`, `castAlive:role`, `relationAtLeast:{role,trust}`, `hasEvidence:id`, `teamRole:id`, `seenScene:id` unknown predicate = validation error ห้าม eval

ผลเป็น allowlist: `money`, `stat`, `mind`, `flag`, `storyVar`, `relation`, `memory`, `world`, `item`, `startStory`, `jobOffer` อ้างฟังก์ชันจริงผ่าน adapter ไม่ใส่ arbitrary act string ใหม่แล้วปล่อย silent no-op

Money effect `{type:'money',amount:-15000,label:'ทุนบริษัท',requireFunds:true}` ต้อง preflight ทุก effect ก่อน apply ทั้งชุด ไม่ใช้กู้หนี้อัตโนมัติแทนการยืนยันค่าใช้จ่ายที่เงื่อนไขบอกว่าต้องมีเงิน

## F. Exactly-once outcome และทางเชื่อม events.js

1. openNarrative ตรวจ `!s.ev && !s.op` รวม eligibility, cast, status และ context ปัจจุบันก่อนเปิด
2. จับ node snapshot พร้อม `{ storyId,nodeId,choiceIds,openedWorldM,nonce }` ใน `s.ev.narrative`; serialize ได้ทั้งหมด
3. `choose(s,i)` เดิม dispatch ถ้า `s.ev.narrative` ไป resolveNarrative; index แปลงเป็น choiceId ที่ snapshot เก็บ ไม่อ้าง index ใหม่หลัง UI sort
4. resolve ตรวจ nonce และ current node ถ้า resolved แล้ว return false. Preflight conditions/funds/target references ก่อนสุ่ม check
5. สุ่มจาก stream เฉพาะเรื่อง `narrative:<storyId>`; บันทึกผลและ apply effects หนึ่งครั้ง แล้ว update node/route/due/status และ clear ev
6. การ apply เป็น synchronous transaction: preflight สร้าง effect plan ที่ใช้เฉพาะ deterministic mutators ที่ไม่ throw; ถ้าผิดพลาด ที่ไม่คาดคิดให้ rollback state และ RNG snapshot อย่ากินเงินครึ่งหนึ่งแล้วโยน error จบ
7. ใส่ `s.narrative.resolved[nonce] = { worldM, choiceId }` และ log ที่มี reference ไม่เพียงข้อความ; prune เมื่อไม่มี save/event references จำเป็นแล้ว โดยต้องไม่เปิดทางให้ old ev ยิงซ้ำ
8. ความล้มเหลวไป failure transition ที่เขียนไว้ ไม่มี failure ให้ validate reject เมื่อมี check/risk ห้าม fallthrough เป็น success
9. ถ้า NPC ตายระหว่างพัก โหลด หรือก่อนยืนยัน ต้อง revalidate และเข้าทาง interruption ที่ผู้เขียนกำหนด ไม่เปลี่ยนคนแบบเงียบ ๆ ไม่เรียกคนตายมาพูดสด

เรื่องใหม่ใช้ `s.ev.narrative` และ public choose อย่างเดียว UI ไม่แก้ state โดยตรง operation ใช้เส้นทางเดิม `s.ev.op` ห้ามมีทั้งคู่ใน event เดียว

## G. Queue และ scheduler

อย่าแก้ clock ทั้งชุดครั้งเดียวใน P1: register narrative monthly ตำแหน่งตั้งใจผ่าน index.js และปิด producer เดิมของ story ID ที่ย้ายแล้ว

P2 จัดกลุ่มผู้สร้างเหตุการณ์เดิมเป็น candidate adapters โดยแยกการเดิน simulation จากการขอเปิด event ต้องไม่เรียกฟังก์ชันที่ mutate เพื่อ “สำรวจว่ามีอะไรบ้าง”

Priority: event/op ที่ค้างคงเดิม → วิกฤตสุขภาพ/คำสัญญาที่ครบกำหนด → calendar สำคัญ → focused story → side story → routine event/offer. Tie-break ใช้ priority, oldestDueWorldM, lastServedWorldM, ID ตามลำดับ ไม่พึ่ง object insertion order

- เรื่องค้นพบที่ active ได้ไม่เกิน questLimit=3; focus 1; เรื่องเกินเก็บ available/shelved โดยไม่ทิ้ง
- Default เดินเฉพาะ focus; เรื่อง side ไม่เดิน node จนเลือกติดตาม ยกเว้น deadline ที่อิงโลกและเรื่องผูก operation
- Story ที่รอเงื่อนไขยังอยู่ waiting และแสดงเหตุผลที่รู้ได้โดยไม่เผยเงื่อนไขลับ ไม่บล็อก slot งานพร้อมอื่นตลอดกาล
- `setStoryFocus` ได้เมื่อไม่มี ev/op; ไม่เพิ่ม due ใหม่ ไม่ทอย cast ใหม่; พัก-กลับมาไม่ใช้รีเซ็ต deadline โลก
- Fairness: เมื่อ routine/side candidate รอเกิน 6 เดือนที่ไม่มีเหตุเร่งด่วน ให้มี aging priority บริการได้อย่างน้อย 1 ครั้งใน 12 เดือนดังกล่าว Focus ไม่ตัด calendar/illness
- เด็ก tick ทีละ 3 เดือน: เปรียบช่วงเดือนที่ข้ามกับ due/expiry ห้ามเช็คแค่เดือนตรง equality; จำกัดหนึ่ง choice เปิดพร้อมกัน เหตุที่ยังไม่เปิดคงอยู่ ไม่ถือว่าจบแล้ว
- ห้ามเลื่อน clock เพิ่มจากการเลือกเพื่อชดเชย event backlog ทุก tick ยังเป็นช่วงเวลาเดิม

## H. Legacy coexistence

เพิ่ม explicit registry `MIGRATED_STORY_IDS` ใน data registry ใหม่ `core/stories.js` ข้ามเฉพาะสายที่ย้าย เรื่องอื่นใช้ ch/next เดิมต่อได้. secrets/truths ยังใช้ระบบเดิมจนมี mapping และ task ย้ายของตนเอง

อย่าให้ graph ใหม่เขียน `ch:<id>` แข่งกับระบบเก่า ใช้ legacy counters เพื่อ import ครั้งเดียวและ compatibility reads เท่านั้น. family events, factions และ calendar ที่ยังไม่ย้ายต้องไม่หายเพราะ scheduler เปลี่ยนลำดับ

## I. Save migration

- คง `s.v=2`, key `riftledger.slot.v2.*`, collection key เดิม; เพิ่ม `SAVE_SV` 2→3 สำหรับ P1 แล้วเพิ่มทีละ version หากเฟสถัดไปเพิ่มความหมาย ไม่ใช้เลขเดียวกับหลาย schema ที่เข้ากันไม่ได้
- เพิ่ม migration 2 และ validators สำหรับ narrative/people/relations/familyMemory ใน save.js. ปัจจุบัน deserialize ไม่ validate structures ใหม่ให้เอง
- มรดก `s.heir` ถูก rebuild ด้วย allowlist อยู่แล้ว ถ้าจะเพิ่ม field ใน heir ต้องเพิ่ม serializer/validator ด้วย ไม่คาดว่า object เดิมถูกเก็บทุก key
- migrate เป็น idempotent: เรียกซ้ำไม่สร้าง NPC ไม่แจกเงิน ไม่เปลี่ยน RNG และไม่เปลี่ยน node
- ของทีมเก่า: import ด้วย sourceKey `legacy-team:<lifeId>:<memberId>` และเพิ่ม personId ใน record เดิม ไม่เปลี่ยน m.id ที่ UI/actions ใช้อยู่ รักษา rank/lv/loyalty/wounds/story ทั้งหมด
- ของ roster เก่า: sourceKey `legacy-roster:<originalId>`; n→name ผ่าน adapter ไม่ลบ n จน caller เดิมย้ายครบ
- ไม่มีวันเกิดเก่า: ตั้งค่าฐานอายุเฉพาะตอน migration จาก stable hash ของ sourceKey ไม่กิน stream เกม; บันทึกว่า estimated เพื่อไม่เล่าว่าเป็นวันเกิดจริง
- เก่าไม่มี cast: ไม่แต่งว่าผู้เล่นเคยช่วยคนใหม่ ให้ legacy contact แบบไม่ระบุอดีต หรือจบผ่าน legacy ending ที่ตรงข้อมูล
- office ที่ยังไม่เริ่ม (`ch` 0/ไม่มี): เริ่ม graph ใหม่เมื่อเข้าเงื่อนไข
- office ที่กำลังเล่น (`ch` 1..4) หรือมี `s.ev.id` ตรง `/^office:\d+$/`: ใช้ legacy-to-completion สำหรับชีวิตนั้น แล้วเริ่ม graph ใหม่ในชีวิตใหม่ ไม่กระโดดข้ามผล/เงินจากบทที่ไม่เคยเลือก
- office จบแล้ว (`ch>=5`): mark completed legacy ending ไม่ replay reward
- เก่าไม่มี field ใหม่: defaults; มี field ใหม่แต่ชนิดผิด: sanitize เฉพาะ optional record หรือ fail invalid active event เพื่อ load backup พร้อมแจ้งผู้เล่น ไม่ทิ้ง main save ทับด้วย state ผิด
- sv มากกว่าที่รองรับ: return null/read-only export; ห้าม downgrade stamp แล้วเขียนทับข้อมูลอนาคต
- เก็บ fixture baseline v2 ทั้งก่อนเริ่ม ระหว่าง event และหลังจบก่อนเพิ่ม migration

## J. Family memory และ repeats

`seenScenes[sceneId]={count,lastWorldM,lastGen}`. บันทึกเมื่อฉากถูก resolve จริง ไม่ใช่ตอนอยู่ใน candidate pool. Mandatory scene factor=1; optional family-seen factor=`1/(1+count*2)`; unseen=1. น้ำหนักนี้คูณ repeat/cooldown เดิม ไม่แทนที่ eligibility.

ไม่เก็บตัวนับ scene ใน `s.c` ทั้งหมดข้ามรุ่นเพราะจะเอา progress/quest/reward มาให้ลูกด้วย. inheritFamilyMemory deep-copy เฉพาะ schema. families แยกกันไม่แชร์ memory เพียงเพราะ book เดียวกัน

Evidence inheritance เป็น `{ evidenceId, source:'journal'|'person'|'heirloom', inheritedWorldM }` บอกว่ามีร่องรอย ไม่เท่ากับเคยพบความจริงด้วยตา. UI ไม่สรุปความลับที่ผู้เล่นใหม่ยังไม่รู้

## K. Determinism / performance / growth

- ไม่ใช้ Date.now/Math.random ใน core. Render/preview/validation ไม่กิน RNG; isolate stream ต่อระบบ/เรื่อง
- sort IDs ก่อนการคัดเลือกที่ลำดับมีผล canonical entity updates ต้องเดิน chronological due order
- ไม่ prune คนตายที่มี story/memory/family refs; prune background unreferenced เท่านั้น
- caps เริ่ม: recentScenes 120, relationship memories 24/คน, world journal 240, family detailed memories 240; scene counters สรุปต่อ ID และ ending counters เก็บได้ ไม่ลบผลถาวรเพื่อให้ cap ดูดี
- caps ต้อง archive compact facts แทนลบข้อมูลที่ future predicate ใช้ ให้ validator ระบุ facts ที่พึ่งได้
- วัด 10 รุ่น × 100 seeds, JSON size และ runtime บนเครื่องจริงก่อนเพิ่ม NPC cap; เป้าตั้งต้น save ≤2 MiB ใน fixture ที่กำหนด ไม่อ้างเป็น browser limit สากล
- operation replay ของ seed/choices เดิมต้องได้ state เหมือนเดิม ตัดเฉพาะ telemetry ที่ไม่ใช่ state ออกจาก comparison


## L. Integration decisions ที่ต้องถือให้ตรงกัน

- worldMonth อยู่ใน `src/core/state.js` เพื่อให้ทุกระบบอ้างแหล่งเดียว; narrative APIs export ผ่าน index.js เท่านั้นสำหรับ UI/tests
- initNarrative สร้าง lifeId จาก familyId + generation + birthWorldMonth แบบ deterministic และเก็บลงเซฟ; familyId สร้างจาก seed ของโลกครั้งแรก ไม่เปลี่ยนเมื่อสร้างผู้สืบทอด. การเริ่มเกมใหม่จาก seed เดิมเป็นโลกอีก instance ที่ไม่แชร์ object หรือ storage progress โดยอัตโนมัติ
- canonical person เป็นแหล่งจริงของ identity/การมีชีวิต/ตำแหน่ง หลัง import แล้ว legacy roster/team เป็น projection สำหรับ caller เก่า. เพิ่ม `setPersonStatus(s,id,patch)` ใน people.js และให้ pulse death, move, team death, wounds ที่เกี่ยวข้องเรียกผ่าน adapter ทิศเดียว แทนแก้ alive สองที่ที่อาจไม่ตรงกัน. team combat fields ที่ยังไม่ย้ายยังอยู่ใน team record ตามเดิม ไม่ให้ generic patch เปลี่ยน rank/lv ของทีมโดยไม่ตั้งใจ
- วิธีหลีกเลี่ยงระบบใหม่ทำงานบน state เก่า: migration/import รันก่อนระบบ update และ story candidates เสมอ; canonical registry ขาดคนที่ถูกอ้างไม่สร้างตัวใหม่เงียบ ๆ ให้ validator/error เป็นเจ้าของการซ่อม
- live cast ที่ย้ายเมืองไม่จำเป็นตายจากเรื่อง: node ระบุ `contactMode:'local'|'remote'` ถ้า local ต้อง same city; remote ต้องมี contact ที่รู้จักจริง. absent source ไม่ใช้ชื่อ generic แทน cast สำคัญ
- ให้ทุก story definition มี `interruptions:{castUnavailable:nodeId,jobChanged:'pause'|'continue'}`. ถ้าเรื่องใช้ cast required ต้องมี castUnavailable เสมอ; node นี้ต้องไม่ใช้ cast คนที่หายมาพูดสด. กรณี claimant-gone ให้เก็บ `vars.resumeNodeId` ก่อนเข้า interruption แล้วจบหรือกลับเฉพาะ node ที่ไม่ต้องใช้เขาตามกราฟที่เขียนไว้
- knownNeed ใช้ mapping ต่อไปนี้เท่านั้น: `{stat:{id,min}}`, `{gold:min}`, `{skill:id}`, `{job:id}`, `{role:id}` ให้ adapter ไป optionView เดิม; เงื่อนไข secret ใช้ when และซ่อนทั้งตัวเลือก. UI ไม่แปลง raw condition เป็นข้อความอัตโนมัติ
- nonce เป็น deterministic increment ต่อชีวิต (`narrative.nextNonce`, เริ่ม1) พร้อม lifeId/storyId/nodeId; ไม่ใช้เวลาจริงเป็น nonce. init/migration เติม nextNonce ให้ไม่ชน active event ที่มีอยู่
- resolved ledger compact ได้เฉพาะ nonce ที่ต่ำกว่า last committed sequence และไม่มี active event อ้างถึง; เก็บ high-water mark ต่อชีวิตเพิ่มเพื่อ reject stale replay หลัง prune. เซฟเก่าที่ผู้เล่น restore เองถือเป็น timeline เก่าทั้งชุด ไม่พยายามแอบ sync รางวัลกับเซฟอื่น
- วันที่ due ต้องสัมพันธ์กับ enteredWorldM. เมื่อ node เสนอ delayM ให้สุ่มครั้งเดียวตอนเข้า nodeและเก็บ dueWorldM; UI เปิดดูหรือ focus/shelve ไม่ทอยใหม่
- ของขวัญสัมพันธ์: เฟสแรก trust เพิ่มได้ไม่เกิน5จากของขวัญต่อ person ต่อ12เดือน และสูงกว่า trust59 ต้องผ่าน authored trust test อย่างน้อยหนึ่งครั้ง. ตัวเลขนี้เป็นค่าเสนอ ไม่เชื่อมเปลี่ยน loyalty ทีมจนมี explicit task
- อายุ NPC ที่สร้างใหม่ต้องมี bornWorldM ที่เหมาะกับบทจริง; หากต้องมีอายุ18+ในปีปัจจุบันให้ bound bornWorldM ≤ now-216. ก่อนจะเพิ่มระบบตายด้วยวัยให้มี maxAge/nextUpdate ที่ชัดและทดสอบ; P1 สามารถอาศัย death events เดิมโดยไม่อ้างว่าจำลองชีวิต NPC ครบแล้ว
- jobChanged pause ไม่หยุดคำนวณคำสัญญาที่เป็น world deadline; priority case นี้ใช้ explicit interruption candidate ไม่แอบเลื่อน due. เมื่อเลือก abandon ต้องยืนยันถ้ามีคำสัญญาหรือผลผูกพันและ apply authored consequence ครั้งเดียว


## M. Minimal NPC lifecycle — owner Task7

ฟังก์ชัน `updatePeople(s,throughWorldM)` ใน people.js ถูกเรียกจาก simulation ก่อน narrative candidates ไม่ใช่ render. P1 ใช้ canonical identity + death events เดิม; P2 จึงเปิด lifecycle นี้ โดยต้องรายงานสองความสามารถแยกกัน

ค่าเสนอเริ่มต้น: background NPC ที่ไม่ใช่ active team/ผู้เล่น มี lifeMaxY seeded ครั้งเดียว 70–90 ปี และ deathDueWorldM=bornWorldM+lifeMaxY*12; ทุก24เดือนนับจาก creation/progression epoch ตรวจพัฒนางานหรือแรงก์ด้วย per-person stream โอกาส20% เพิ่มหนึ่งระดับ ไม่เกิน min(initialRank+1,6). คนธรรมดาไม่เปลี่ยนเป็นฮันเตอร์เพราะ update นี้. ถ้าข้อมูล catalog ไม่รองรับ progression ให้ยังคงอาชีพเดิมแทนสร้าง rank ปลอม

active team ไม่ได้ rank/lv ฟรีจาก background schedule แต่ยังมีอายุ/ความตายตามการเล่าเรื่องที่แจ้งเตือนล่วงหน้า. ก่อนถึง natural death12เดือนให้ warning fact/ฉากที่เหมาะกับคนที่รู้จัก ไม่สร้างเหตุให้ผู้เล่นตายแทน. หากการทดสอบพบว่าค่าสูงสุดอายุขัดการเกิดในโลกฮันเตอร์ ให้ Claude ปรับตารางโดยอธิบายและวัดผล ไม่ยกเลิกการมีอายุเพื่อแก้เควส

migration มี estimated age ต้องตั้ง lifeMaxY อย่างน้อย currentAgeY+1 ไม่ให้คนเก่าตายทันทีเพียงเพราะพึ่งเพิ่มฟิลด์. ทุก update ย้อนไป throughWorldM ที่ประมวลแล้วเป็น no-op. Batch updateหลายปีต้องเหมือนเรียกทุกเดือน; consume RNG ต่อ due event เท่านั้น เรียงchronologicalและID. หาก death/promotion ทับวันเดียวให้ deathมาก่อนและไม่สุ่ม promotionให้คนตาย

mutable data ownership: ID/name/born/died/country/city/background rank อยู่ canonical; active team rank/lv/loyalty/wounds อยู่ team เป็นเจ้าของในเฟสนี้และ personอ่านผ่าน adapter; ห้ามbackground updateเขียนทับข้อมูลทีม. เมื่อถอดสมาชิกออกจากทีมให้ snapshot stats ปัจจุบันเป็นcanonicalก่อนเริ่มbackground progression. ทุกworld/teamdeathต้องmark canonicalด้วย setPersonStatus; roster projectionไม่ใช้aliveเก่าขัดผลใหม่

## N. Automation — owner Task4

ทุก narrative choice ที่เปลี่ยน route, รับคำสัญญา, ใช้ทุนธุรกิจ หรือมี lethal risk กำหนด noAuto=true. ความเสี่ยงสูงที่ผู้เล่นรับรู้แสดงก่อนเลือก; secret conditionไม่เป็นข้ออ้างซ่อนความเสี่ยงตาย. Routine beatอัตโนมัติได้เมื่อไม่มี irreversibility ตามรายการนี้

auto.js ต้องตรวจ discriminant narrative/noAuto ก่อน heuristicเดิม. การแสดง odds/การเลือก focusไม่มีสิทธิ์เลือกchoiceแทน. สำหรับbot playtesterให้ส่ง explicit authored test policyเข้าchooserของtestโดยเก็บ traceว่าบอตเลือกเอง ไม่อ้างว่าเป็นpolicy autoปลอดภัยในผลิตภัณฑ์. Test must assert core state/choice remains pendingเมื่อ autoควรหยุด ไม่วัดแค่ข้อความ“หยุด”บนหน้าจอ


## O. Node-level cast requirements

`cast` ของเรื่องผูกคนตอนเริ่มเพียงครั้งเดียว; node อาจระบุ `requiredCast:['claimant']` เพื่อบังคับ alive/location สำหรับฉากนั้น. ถ้าไม่มี requiredCast ให้ถือว่าไม่ต้องมีคนมาพูดสด แต่ยังอ้างประวัติ/ชื่อผู้เสียชีวิตได้ผ่านข้อความที่เขียนว่าคืออดีต. validator ต้องบังคับทุก template ที่ใช้ live speaker ประกาศ requiredCast. interruption node เช่น claimant-gone ต้องไม่ require claimant มีชีวิต มิฉะนั้นจะขัดการเปิดฉากเอง. เมื่อ bind ตอนเริ่มสำเร็จแล้ว castUnavailable ห้าม bind คนใหม่ทับ ID เดิม


---

<!-- Source: 03-CONTENT-BIBLE.md -->

# Content bible — เขียนใหม่ให้ชีวิตต่างกันจริง

## 1. หลักการ

เขียนไทยสำหรับคนเล่น ไม่ใส่ศัพท์ระบบในปาก NPC. class/skill/item ยังคงชื่อภาษาอังกฤษตามแนวเดิม. ไทยและเกาหลีต่างกันด้านสถาบัน เมือง เครือข่ายและเหตุการณ์ ไม่ใช้ stereotype แทนบุคลิก

ทุกฉากต้องตอบ: ผู้เล่นอยู่ที่นี่ได้อย่างไร, คนที่พูดคือใคร, เขาต้องการอะไร, ตัวเลือกแลกอะไร, แล้วเกิดผลเมื่อไร. ห้ามตัวเลือกดีข้อเดียวที่ให้เงิน ชื่อเสียง ความสัมพันธ์ และข้อมูลครบโดยไม่เสียอะไร

ห้ามเพิ่ม internal route ทั้งหมดใน UI. ความหลากหลายควรให้ค้นพบ ไม่ใช่รายการทำภารกิจ 100% ตั้งแต่แรก

## 2. Vertical slice: แฟ้มที่ไม่ได้ปิด (career-office)

### เจตนา

พิสูจน์วงจรหนึ่ง: เริ่มทำงานเล็ก ๆ → พบฮันเตอร์คนหนึ่ง → เลือกช่วย/ทำตามหน้าที่/รับผลประโยชน์ → คนเดิมกลับมา → วิธีจบและธุรกิจภายหลังเปลี่ยน. ผู้เล่นที่ยอมเป็นพนักงานธรรมดาต้องมีทางจบที่สมบูรณ์ ไม่ถูกลงโทษเพราะไม่รับบทฮีโร่

### ผู้คน

- claimant: ฮันเตอร์ท้องถิ่นแรงก์ E–C ที่บาดเจ็บ มีผู้พึ่งพิง ต้องการค่ารักษา ไม่ใช่ผู้แอบซ่อนแรงก์ S ทุกครั้ง
- supervisor: หัวหน้างาน เชื่อว่าบริษัทรอดก่อนจึงช่วยลูกน้องได้ มีด้านดีและด้านที่ปกป้องผลประโยชน์
- investigator: ผู้ตรวจสอบที่ทำงานตามพยานหลักฐาน ไม่เชื่อผู้เล่นเพราะเป็นตัวเอก

ชื่อเลือกจากประเทศและ seed เมื่อ bind ครั้งแรก บทบาทไม่เปลี่ยนคนเมื่อโหลดเกม หากไม่มีคนที่เหมาะ สร้างคนใหม่ครั้งเดียวด้วยเหตุผลว่าผู้เล่นเพิ่งพบ

### เส้นทางและตัวแปร

route: `care`, `compliance`, `complicity`, `exposure`, `independent` (ไม่โชว์เป็นรายชื่อ route ที่ยังไม่รู้)
vars: `readFile:boolean`, `claimPaid:boolean`, `acceptedGift:boolean`, `keptEvidence:boolean`, `exposed:boolean`, `publicSupport:0..3`

ความไว้ใจคือ relation กับ claimant โดย personId ไม่ใช้ flag “เพื่อนฮันเตอร์” ครอบทุกคน. ตัวแปรเหล่านี้ไม่ใช่ค่าสถานะใหม่ถาวรนอกเรื่อง

### กราฟที่ต้องเขียนครบ

| Node | เงื่อนไข/ฉาก | ตัวเลือกและปลายทาง |
|---|---|---|
| intake | job office อายุ 18+; หลังเข้าที่ทำงาน 1–3 เดือน | อ่านแฟ้ม: INT16 สำเร็จ→claim พร้อมหลักฐาน; พลาด→seek-help; ทำตามแบบ→routine |
| seek-help | หัวหน้าถามว่าทำไมงานช้า | ขอคำปรึกษา→claim แต่เป็นหนี้บุญคุณหัวหน้า; ทำเอง→claim ไม่มีหลักฐาน; เลิกยุ่ง→routine |
| claim | claimant มาขอค่าเคลม | ใช้หลักฐานช่วย→paid; ไม่มีหลักฐานขออุทธรณ์→appeal; ปฏิเสธตามสัญญา→denied |
| appeal | ใช้เวลา 3–6 เดือน ผู้เรียกร้องอาจกลับทำงานแล้ว | ช่วยรวบรวมข้อมูล→paid-late; บอกตามตรงว่าทำไม่ได้→denied-honest; ซื้อความเงียบ→cover-up |
| paid | ค่ารักษาผ่าน เงินไม่เข้ากระเป๋าผู้เล่น | จดจำและสร้าง trust; รับของฝากเล็กน้อยหรือปฏิเสธได้→audit |
| paid-late | ช่วยสำเร็จแต่เขาขายของไปแล้ว | ผล trust ต่ำกว่า paid, memory คนละอัน→audit |
| denied | ผู้เล่นปฏิเสธการจ่าย | อธิบายเหตุผล/ไม่รับพบ สร้าง relation ต่างกัน→routine-review |
| denied-honest | พูดตรง ไม่สร้างคำสัญญาที่ทำไม่ได้ | ไม่ได้เป็นเพื่อนสนิท แต่ยังเคารพกัน→routine-review |
| routine | ทำหน้าที่ทั่วไป | เห็นเพื่อนร่วมงานรับเรื่องแทน; เลือกช่วยงาน/อยู่ในขอบเขต→routine-review |
| routine-review | หลัง 12–24 เดือน ผลประเมินตามงานและหนี้จริง | อยู่ต่อ→ending-steady; สมัครงานอื่น→ending-transfer; พบความผิดปกติ→audit |
| audit | กิลด์ขอปรับตัวเลขความเสียหาย | ปฏิเสธ→pushback; ยอมรับ→cover-up; เก็บหลักฐานและส่งผู้ตรวจ→investigation |
| pushback | ถูกกดดัน ไม่จำเป็นไล่ออกทุกครั้ง | ขอหนุนหลังถ้ามีคนเชื่อถือ→reform-offer; ทำตามหน้าที่ต่อ→ending-steady; ออกจากงาน→independent-offer |
| cover-up | เงินข้อเสนอ 3,000 แลกความเสี่ยงในเรื่อง | รับ→route complicity + liability; ปฏิเสธภายหลัง→investigation มีต้นทุน; ไม่ย้อนอดีตให้สะอาดทันที |
| investigation | ต้องมี keptEvidence; ผู้ตรวจเป็นคนเดิม | ให้ข้อมูลแบบเปิดหน้า/ไม่ระบุชื่อ/ถอนตัว; ตามหลักฐานและ check→reform-offer หรือ fallout |
| fallout | หลักฐานไม่พอ หรือผู้เล่นเกี่ยวพัน | คืนผลประโยชน์/รับผลทางงาน/สู้คดีที่จ่ายได้; ไม่สุ่มตาย→ending-burned หรือ ending-transfer |
| reform-offer | อ่านความสำเร็จและขอบเขตอำนาจ | ถ้าตำแหน่งสูงพอให้โครงการระดับบริษัท; มิฉะนั้นเป็นผู้ช่วยทีมทดลอง→ending-reform |
| independent-offer | เปิดธุรกิจเฉพาะเมื่อเงินพร้อม ไม่สมมุติมีลูกค้า | ถ้าเคยช่วย claimant และยังอยู่→client-return; ไม่เคยช่วย→client-search; ไม่พร้อม→ending-transfer |
| client-return | คนเดิมแนะนำลูกค้า ไม่แจกยอดขายตลอดชีพ | เปิดกิจการผ่าน adapter เดิม ต้นทุน 15,000; บันทึกคนที่แนะนำ→ending-independent |
| client-search | ต้องหาตลาดเอง ไม่มีอดีตปลอม | ใช้เงินประชาสัมพันธ์/ร่วมงานหุ้นส่วน/เลื่อนเปิด; ยืนยันต้นทุนก่อนจ่าย→ending-independent หรือ ending-transfer |
| claimant-gone | claimant เสียชีวิต/ย้ายถาวรก่อนฉากติดต่อ | ถ้าเคยช่วย: ญาติส่งคำขอบคุณตาม memory; ไม่เคยช่วย: ข่าวสั้นที่ไม่อ้างบุญคุณ; กลับสู่บทที่ไม่ต้องมีคนนี้ |

ข้อกำหนดกราฟ: cover-up ต้องมีปลายทางจบจริง Claude เพิ่ม node `liability` เพื่อรับผล 6–18 เดือนต่อมาได้ แต่ต้องตั้งชื่อและเขียน graph ให้ครบก่อน validator ผ่าน ไม่ใช้ช่องว่างในตารางเป็นอนุญาตให้ใส่ TODO ในผลิตภัณฑ์

### ตอนจบ 6 แบบ

- ending-steady: งานมั่นคง ชีวิตนอกงาน ไม่ใช่ ending แพ้
- ending-transfer: เปลี่ยนทางอาชีพ มีเงิน/หนี้/คนรู้จักตามสิ่งที่เกิดจริง
- ending-reform: ขนาดผลงานขึ้นกับตำแหน่ง; ไม่ประกาศเปลี่ยนกฎหมายประเทศด้วยการผ่าน CHA ครั้งเดียว
- ending-independent: ได้กิจการที่มีอยู่จริงและ provenance ลูกค้า ไม่แจกกิจการซ้ำเมื่อ reload
- ending-complicit: ได้ผลประโยชน์แต่มีความผูกพันและหลักฐานย้อนกลับมาทำร้าย; ต้องมีเส้นจบเฉพาะ ไม่รวมกับ burned เสมอ
- ending-burned: เสียโอกาสบางอย่างแต่ชีวิตไปต่อได้ ไม่ล้างความสัมพันธ์/ไอเทมทั้งหมด

### ฉากตัวอย่างต้นฉบับ

> ใต้ชื่อผู้เอาประกันมีรอยกาแก้วันเกิดด้วยปากกาสีน้ำเงิน คุณจำลายมือนี้ได้จากแฟ้มเมื่อวาน ช่องที่แก้ทำให้ผู้บาดเจ็บหลุดจากสิทธิ์เพียงสองวัน หัวหน้าบอกให้คุณลงชื่อรับรองก่อนพักเที่ยง

ทางเลือก: ขอเอกสารต้นฉบับ (เวลางานและเสี่ยงไม่ถูกใจหัวหน้า), ลงชื่อเฉพาะข้อมูลที่ตรวจแล้ว (จำกัดความรับผิดแต่เคลมยังช้า), ลงชื่อทั้งหมด (งานผ่านเร็วและมีความรับผิดภายหลัง). ทุกข้อเป็นการตัดสินใจต่างกัน ไม่ใช่ข้อความต่างแต่ผลเดียว

### Acceptance เฉพาะสาย

เล่น seed เดิม 3 ชุดการตัดสินใจ: ช่วยคน, ทำตามหน้าที่, รับผลประโยชน์ ต้องได้อย่างน้อย 3 endingId และมี node ที่พบต่างกันจริง. บังคับคนเรียกร้องตายกลางเรื่องแล้วจบได้โดยไม่ให้คนตายพูด. เปิดบริษัทโดยไม่เคยช่วยต้องไม่แสดง client-return.

## 3. แผนเนื้อหาอาชีพ — จำนวนเป็นเป้าหลัง vertical slice ผ่าน

ทุกสายเดิมคงอยู่จนย้ายครบ อย่านับว่าคลาส 17 สายถูกแปลงแล้วเพราะเปลี่ยน registry อย่างเดียว

| กลุ่ม | ปมหลัก | ทางที่ควรต่าง | ผลข้ามระบบ |
|---|---|---|---|
| พนักงานบริษัท | ใครรับผิดชอบความเสียหาย | ซื่อสัตย์/ประคองชีวิต/รับผลประโยชน์/เปิดกิจการ | ประกัน กิลด์ ผู้ติดต่อ |
| ร้านค้า | ขาดแคลนหลังเกตแตก | ช่วยชุมชน/กำไร/ของเถื่อน/สร้างเครือข่าย | ราคาท้องถิ่น ลูกค้าคนเดิม |
| หมอธรรมดา | คนไข้ล้นและทรัพยากรจำกัด | สาธารณะ/วิจัย/คลินิก/พักจากภาวะหมดไฟ | คนไข้รอด ภาระครอบครัว |
| หมอฮันเตอร์ | ใบรับรองกับแรงกดดันกิลด์ | ปกป้องคนไข้/ยอมองค์กร/ฟื้นฟูระยะยาว | hunter availability/wound memory |
| ลูกหาบ | อยู่เบื้องหลังความสำเร็จ | วินัย/เจรจาส่วนแบ่ง/รวมกลุ่ม/เปลี่ยนงาน | ทีม ความไว้ใจ ของที่เก็บได้ |
| นักวิจัย | ทฤษฎีกับความจริง | เปิดเผย/เก็บข้อมูล/ขายผล/ถอนตัว | evidence ฝ่ายและข่าว |
| ครู | เด็กที่ตื่นพลังกับเด็กธรรมดา | โอกาสเท่าเทียม/เน้นผลสอบ/เตรียมฮันเตอร์ | นักเรียนกลับมาในอนาคต |
| หน่วยงานรัฐ/กู้ภัย | ใครควรได้ทรัพยากรก่อน | ระเบียบ/ช่วยพื้นที่/รับแรงกดดัน | เมือง recovery ความไว้ใจ |
| Agency/ธุรกิจ | สัญญาที่กินส่วนแบ่งคน | คนก่อนกำไร/โตเร็ว/คัดความเสี่ยง | staff/team คนเดิม |

ตรวจ IDs อาชีพจริงก่อนเลือกกลุ่ม ไม่สร้าง job ID ตามตารางโดยไม่ต่อ CAREERS และ UI. เป้าผลิต: แปลงอาชีพเดิมทุกสายเป็น branching ที่มีอย่างน้อย 3 ending และอย่างน้อย 1 delayed consequence ต่อสาย ตัวเลขนี้ไม่จำเป็นให้จำนวนฉากเท่ากันทุกอาชีพ

## 4. สายฮันเตอร์

เขียนตามบทบาท/คลาสที่มี ไม่ให้คลาสหายากทุกคลาสเป็นผู้ถูกเลือกโดยจักรวาล

- vanguard: ยืนค้ำแนวหน้าแลกบาดเจ็บ ความเชื่อมั่นทีม และสิทธิ์ถอนตัว
- scout: รู้ก่อนคนอื่นแต่ข้อมูลไม่สมบูรณ์ เลือกเตือน/ขาย/ลงตรวจเอง
- healer: คนที่ช่วยได้ไม่เท่าทุกคน ความยินยอมของผู้บาดเจ็บสำคัญ
- damage: ชื่อเสียง ผลงาน และความรับผิดเมื่อเร่งทำเวลา
- control/support: งานที่ไม่ขึ้นข่าวแต่ทำให้คนอื่นรอด การได้รับเครดิตและการยืนยันหลักฐาน

ให้คนเดิมมีฉากกลับมาตามเหตุการณ์ในปฏิบัติการจริง ไม่ใช้ “เพื่อนตาย” แบบข้อความถ้าทีมยังอยู่ครบตาม state

## 5. เกต 10 ธีม

| Theme เสนอ | แรงก์แนะนำ | จุดต่างเชิงเล่น | หลักฐาน/ผลต่อโลก |
|---|---|---|---|
| รถไฟใต้ดินเดิม | F–C | เสียงและเวลาเคลื่อนขบวน | ร่องรอยขนส่งจากโลกเก่า |
| ท่อใต้ตลาดเดิม | F–D | น้ำกรด/เส้นทางหนี | น้ำปนเปื้อนและชุมชน |
| บ้านสัญญาเดิม | E–S | ข้อผูกมัด/อ่านเงื่อนไข | นิติบุคคลที่ยังทำงานหลังโลกตาย |
| คลังสินค้าปิดตาย | F–C | น้ำหนักของกับคนที่ต้องขน | ของมีเจ้าของและการคืน |
| โรงพยาบาลกะสุดท้าย | E–B | คัดแยกผู้รอด/ทรัพยากร | บันทึกผู้ป่วย ไม่ใช้ฉาก shock เปล่า |
| ห้างในวันอพยพ | D–A | ฝูงชนสะท้อนอดีต/ทางปิด | การจัดสรรคนได้ออกจากโลก |
| โรงไฟฟ้าไร้ผู้ควบคุม | C–S | จ่ายไฟให้ทางออกหรือเครื่องกัก | ผลต่อมานา/คนวิจัย |
| พื้นที่สวนกลับด้าน | E–A | ระบบนิเวศ/อย่าฆ่าทุกอย่าง | ของเฉพาะและข้อมูลวิจัย |
| ห้องเก็บเสียงเมือง | D–S | สื่อสารทีมไม่ได้/สัญญาณ | ความทรงจำคนตายที่อาจผิด |
| ศูนย์อพยพชั้นสุดท้าย | B–S | มีที่ไม่พอ/ช่วย vs เคลียร์ | ปริศนาโลกโดยไม่เฉลยตรง |

ต่อธีมอย่างน้อย 4 decision templates: solo-safe, team-role, high-risk, evidence/civilian tie. ต้องเลือก template ตามสมาชิกจริงอย่างน้อยหนึ่งตัว; ไม่บังคับทุกเกตใช้ทีม. รางวัล อันตราย และเวลาต้องต่างจริง ทดสอบ rank coverage F..S ไม่ fallback ธีมไม่ตรงแรงก์

ชื่อมอนสเตอร์ใหม่ต้องต่อ catalog, ภาพ และ art request ตามกติกา. ใช้ sprite ที่มีสำหรับ slice; ไม่แก้ภาพโดยไม่จัดการ art approval

## 6. ความสัมพันธ์และครอบครัว

ชุดฉากความสัมพันธ์ขั้นต่ำ 12 templates: ช่วยงาน, ยืมเงิน, ผิดนัด, ปกปิดความลับ, ขอให้ช่วยญาติ, ขัดแย้งเชิงอุดมการณ์, เครดิตผลงาน, บาดเจ็บแทน, หายไปนาน, ขอคืนดี, ส่งงานต่อ, สูญเสียคนรู้จัก

แต่ละ template ต้องมี eligibility, cooldown, ต้นทุน และผลที่อ้าง personId. คนที่ไม่เคยพบไม่มีสิทธิ์เล่าว่าเคยผ่านความตายร่วมกัน. การปฏิเสธอย่างมีเหตุผลไม่ทำให้ทุกคนเป็นศัตรู

รุ่นลูกขั้นต่ำ 8 templates: รับจดหมาย, พบคนที่รุ่นก่อนช่วย, เจอภาระสัญญา, เลือกอาชีพต่างครอบครัว, ของเก่าที่มีเจ้าของ, บ้านที่ชื่อเสียงเปลี่ยน, ญาติขอช่วย, คืนดีข้ามรุ่น. รับรู้จากหลักฐาน ไม่สืบทอดความแค้นเป็นกรรมพันธุ์อัตโนมัติ

## 7. City/faction content

เฟสแรกอย่างน้อย 3 crisis types: เกตแตกกระทบตลาด, คนเจ็บล้นโรงพยาบาล, ข้อพิพาทข้อมูลสำรวจหอคอย. แต่ละชนิดมีมุมกลาง + คนธรรมดาที่เกี่ยวข้อง 2 อาชีพ + ฮันเตอร์ + ผู้อยู่อีกเมืองที่รับรู้เป็นข่าว. ทำผล/recovery ก่อนเพิ่มจำนวนข่าว

ฝ่ายทั้งห้าไม่ใช่ดี/ชั่วแบบเดียวตลอด. Association รักษามาตรฐานแต่ปกป้องชื่อเสียง; รัฐดูแลภาพใหญ่แต่ทรัพยากรไม่พอ; ศาสนาช่วยผู้คนแต่ตีความข้อมูล; นักวิจัยรักษาความจริงแต่เสี่ยงละเลยคน; ใต้ดินแก้ข้อจำกัดแต่มีการเอาเปรียบ. ผู้นำแต่ละคนมีเหตุผลของตน

## 8. Lore และความลับ

ของหนึ่งชิ้นอาจมี authored lore + provenance ที่เกิดจากชีวิตนี้. แยกข้อเท็จจริง ข่าวลือ และข้อสันนิษฐาน. ต้นทางของไอเทมแบบทั่วไปไม่ควรอ้างว่าฆ่าบอสที่ผู้เล่นไม่เคยพบ

ใช้หลักฐานสามชนิด: วัตถุ, บันทึก, คำให้การ. หลักฐานเดียวอาจตีความต่างกันตามฝ่าย แต่อย่าเปลี่ยนข้อเท็จจริงหลักตาม seed จนโลกไม่มีตรรกะ. ให้ข้อสรุปเกิดจากฉากที่ผู้เล่นรู้จริง เก็บสมุดสะสมแยกจากความรู้ตัวละคร

## 9. Checklist ผู้เขียนทุกสาย

- [ ] มีทางเป็นคนธรรมดา/ไม่ยิ่งใหญ่ที่จบสมบูรณ์
- [ ] การเลือกต่างทำให้ node ต่าง ไม่เพียงเปลี่ยนจำนวนเงิน
- [ ] check failure มีทางไป ไม่วนฝึกจนผ่านแบบไม่มีต้นทุน
- [ ] เนื้อหาขนาดผลงานสอดคล้อง rank/job tier/fame/debt
- [ ] อ้างคนมีชีวิต/สถานที่/ความสัมพันธ์ตรง state
- [ ] interruption ถ้าคนตาย/ย้าย/เปลี่ยนงาน/ผู้เล่นเลิกทำเรื่อง
- [ ] ค่าจ่ายและเวลาที่ผูกพันบอกก่อนเลือก
- [ ] ข้อสำคัญไม่ถูกออโต้ตัดสิน
- [ ] ไม่เปิดเผยสูตรหรือเนื้อเรื่องลับผ่าน UI/HTML/title/tooltip
- [ ] มีกรณีทดสอบอย่างน้อยหนึ่งทางสำเร็จ ล้มเหลว ปฏิเสธ และโหลดกลางเรื่อง


---

<!-- Source: 04-IMPLEMENTATION-PLAN.md -->

# Rift Ledger narrative diversity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans หรือ superpowers:subagent-driven-development ตามวิธีที่เจ้าของเลือก ทำ task ทีละชิ้นตาม checkbox. แผนนี้ให้ Claude พัฒนาต่อ ไม่ได้ให้ agent ผู้เขียน handoff ลงมือเปลี่ยนเกมในรอบนี้

**Goal:** ชีวิตที่การเลือก ผู้คน เมือง และมรดกเชื่อมต่อกัน โดยเริ่มสายประกันหนึ่งสายให้เล่นได้จริง

**Architecture:** เพิ่ม narrative graph และ canonical people บน core เดิม ใช้ adapter กับ event/ops และทยอยย้ายสายเดิมทีละ ID เซฟและเครื่องมือจำลองต้องรองรับทั้งเก่าและใหม่ระหว่างเปลี่ยนผ่าน

**Tech Stack:** Node >=20, JavaScript ES modules, node:test, esbuild ที่ repo pin, ไม่มี dependency runtime ใหม่

**Spec:** `01-DESIGN.md`, `02-ENGINE-CONTRACTS.md`, `03-CONTENT-BIBLE.md` ในแพ็กเดียวกัน

## Global Constraints

- รักษาโลกฮันเตอร์ ภาษาไทย และชื่อ class/skill/item ภาษาอังกฤษ
- ไม่มี DOM/Date.now/Math.random ใน core และไม่มี runtime LLM
- คง v2 slot keys; migration ใช้ sv และไม่ replay ผลตอบแทน
- ไม่เผย route/secret conditions ที่ตัวละครยังไม่รู้
- ไม่รื้อทุกระบบพร้อมกัน ไม่พอร์ต code/assets/dialogue ต้นแบบโดยตรง
- ไม่ commit untracked/user changes ที่ไม่เกี่ยวข้อง และไม่ push main/เผยแพร่โดยอนุมานจากแพ็กนี้

## Review Focus

1. เซฟเก่าที่เปิด office event ค้าง → เล่น legacy ต่อจนจบ ไม่แจกผลซ้ำ (Tasks 1,5)
2. NPC ตาย/ย้ายขณะเรื่องพัก → interruption ไม่เปลี่ยนคนปลอม (Tasks 2,5)
3. เปิดเซฟเดิมหลังเลือกและคลิกซ้ำ → เงิน/ความทรงจำ/RNG เปลี่ยนครั้งเดียว (Tasks 3,5)
4. เด็กข้ามสามเดือนและเรื่องรอเต็ม slot → due ไม่หาย/ระบบไม่อดคิว (Task 6)
5. เล่นถึงรุ่น 10/เซฟหลังปี 100 → chronology ถูก ไม่ replay calendar/ความลับ/มรดก (Tasks 8,10)

## วิธีรันและ commit

ทุก task เริ่มเขียนทดสอบที่ fail ด้วยพฤติกรรมที่หายจริง รันเห็น fail แล้วจึง implement; จบด้วย target tests และ npm test. Commit เฉพาะไฟล์ของ task เมื่อได้สิทธิ์ตาม session จริง ตัวอย่างข้อความ commit อยู่ท้ายแต่ละ task. ห้ามแก้ expected test ให้ตรง bug หรือเพิ่ม test ที่ผ่านเพราะไม่เกิดเหตุการณ์เลย

สำหรับ helper tests สร้าง `test/narrative-helpers.mjs`: `adult(seed, jobId)` เรียก newLife ผ่าน core/index.js แล้วตั้ง ageM=360 และ job จาก fixture ที่ถูกต้อง; `advanceToNode(s,storyId,nodeId,choices)` ใช้ API จริงในการเดินเรื่องและเลือก ไม่แก้ node ตรงแล้วอ้าง integration ผ่าน; `snapshot(s)` ใช้ serialize/deserialize round-trip. เคส unit ที่ต้องการ corrupt state ต้องตั้งชื่อให้แยกจาก integration

## Task 1 / P0: Baseline และ forward-safe save foundations

**Files:** Modify `src/core/save.js`, `src/core/state.js`; create `test/narrative-save.test.mjs`, `test/fixtures/narrative/v2-before.json`, `v2-office-open.json`, `v2-office-done.json`, `test/narrative-helpers.mjs`.

**Consumes:** newLife, serialize, deserialize, slots. **Produces:** migrate ที่รองรับ SAVE_SV=3; init defaults ที่ 02.B; ไม่มี narrative runtime เปิดเหตุการณ์ใน task นี้

- [ ] เก็บ fixtures v2 ที่มาจาก baseline จริงและไม่มีข้อมูลผู้ใช้ ระบุที่มาใน test comment
- [ ] เขียน `v2_migration_keeps_money_rng_and_open_event` เปรียบ gold, debt, r และ ev กับ fixture เดิม; `future_schema_does_not_downgrade` ให้ deserialize ของ sv=999 เป็น null; `migration_is_idempotent` assert.deepEqual(migrate(migrate(s)),migrate(s))
- [ ] Run `node --test test/narrative-save.test.mjs` ต้องเห็น fail ที่ unsupported version/missing defaults ก่อน implement
- [ ] เพิ่ม migration/default/validation ตาม 02.I; ไม่เริ่มเรื่องหรือทอย RNG ระหว่าง load
- [ ] รัน target + npm test และทดสอบ fallback backup ด้วย slots adapter ใน memory
- [ ] Commit `feat: prepare versioned narrative state migration`

## Task 2 / P1: Canonical people และ cast ที่ไม่เปลี่ยนคน

**Files:** Create `src/core/people.js`, `src/core/relations.js`, `test/people.test.mjs`; modify `src/core/team.js`, `src/core/world.js`, `src/core/index.js`, `src/core/save.js`.

**Consumes:** State v3, worldMonth. **Produces:** ensurePerson, personById, personAliveAt, setPersonStatus, bindCast, remember, changeRelation ตาม 02.D; team record เพิ่ม personId โดย m.id เดิมคงอยู่

- [ ] Tests: `same_source_key_same_person` assert.equal(id1,id2); `dead_person_not_cast_for_live_meeting` assert.equal(bind.ok,false); `team_import_keeps_wounds_and_loyalty` assert.deepEqual ค่าก่อน/หลัง; `remember_is_idempotent` assert.equal(memories.length,1) เมื่อส่ง memory.id เดิมสองครั้ง
- [ ] Run `node --test test/people.test.mjs` เห็น fail ก่อนสร้าง implementation
- [ ] ทำ canonical ID/adapters และ migration ที่ไม่ทำให้ roster/team สูญ state; ไม่รวมคนเพียงเพราะชื่อเหมือนกัน
- [ ] เพิ่ม test NPC วันตาย=0, คนต่างประเทศ, sourceKey ซ้ำหลัง reload และ roster ที่มีชื่อซ้ำ
- [ ] รัน `node --test test/people.test.mjs test/narrative-save.test.mjs` + npm test
- [ ] Commit `feat: give world and team contacts stable identities`

## Task 3 / P1: Predicate และ branching engine แบบ atomic

**Files:** Create `src/core/narrative/conditions.js`, `engine.js`, `validate.js`, `src/data/narrative/index.js`, `test/narrative-engine.test.mjs`; modify events.js, registry.js, index.js.

**Consumes:** people/relations, optionView และ applyOutcome ผ่าน adapter. **Produces:** holds, startStory, openNarrative, resolveNarrative, validateNarrative; discriminant `s.ev.narrative`

- [ ] Tests: `choice_changes_node_and_route` assert node คนละตัวใน choices สองทาง; `failed_check_uses_failure_transition`; `duplicate_choice_pays_once` assert gold delta=3000 เท่านั้นหลังเรียกสองครั้ง; `failed_preflight_keeps_rng_and_money` assert deepEqual snapshot; `unknown_effect_fails_validation` assert issue.code ไม่ใช่เงียบข้าม
- [ ] Run `node --test test/narrative-engine.test.mjs` ยืนยัน fail ที่ API/behavior ใหม่
- [ ] ทำ data allowlist, graph validation, snapshot/nonce, preflight/commit/rollback ตาม 02.E/F ใช้ no DOM และ namespaced RNG
- [ ] เพิ่ม validator tests dangling node, ending ไม่มีอยู่, unreachable non-entry node, check ไม่มี failure, choices ID ซ้ำ, referenced catalog ID ผิด, mandatory cast ไม่ครบ และ nonterminating cycle ที่ไม่มี wait/escape
- [ ] Round-trip เซฟขณะเปิด choice แล้วเลือก: money/memory/node ต้องเหมือนเล่นต่อโดยไม่โหลด; preview100 ครั้ง RNG ไม่เปลี่ยน
- [ ] รัน targets + npm test; Commit `feat: resolve authored branching stories exactly once`

## Task 4 / P1: เขียนสายประกันและ UI slice

**Files:** Create `src/data/narrative/career-office.js`, `src/ui/tabs/stories.js`, `test/office-narrative.test.mjs`, `test/narrative-auto.test.mjs`; modify `src/core/auto.js`, `src/data/narrative/index.js`, `src/core/stories.js`, `src/ui/main.js`, `src/ui/layout.js` ตามการวาง tab ที่เหมาะจริง

**Consumes:** StoryDef, casts, narrative API. **Produces:** สาย office ครบ graph ตาม 03.2, เรื่องที่ติดตามอ่านได้ และกด choice ผ่าน core API เดิม

- [ ] Tests: `care_compliance_complicity_reach_distinct_endings`; `unhelped_claimant_is_not_first_client`; `small_job_tier_gets_local_reform_scope`; `business_requires_actual_funds`; test เดินเรื่องครบด้วย clock/choices API ไม่ตั้ง progress เป็นปลายทางแล้วอ้างผ่าน
- [ ] Run `node --test test/office-narrative.test.mjs` เห็น fail ก่อนใส่ข้อมูลเรื่องใหม่
- [ ] เขียนทุก node/ending/interruption ให้ validator ผ่าน รวม liability และ claimant-gone; ต่อ open:ownFirm อย่างตรวจได้ ไม่เรียกซ้ำเงียบ
- [ ] Task นี้เป็นเจ้าของออโต้เรื่องใหม่: route choice/promise/business spending/lethal risk ใช้ noAuto แล้วต่อ auto.js ให้หยุดก่อนเลือก ไม่มีการใช้ odds สูงข้าม irreversible choice
- [ ] เขียน red→green ใน `test/narrative-auto.test.mjs`: `auto_stops_before_route_choice`, `auto_never_accepts_promise_or_business_cost`, `auto_stops_for_known_lethal_risk`, `routine_beat_does_not_interrupt`, `important_contact_death_has_one_notification`; Run `node --test test/narrative-auto.test.mjs`
- [ ] UI ซ่อนเรื่องไม่พบและ route อนาคต ใช้ esc บนชื่อ/ข้อความที่เข้า HTML; ปุ่มไม่ทำ state mutation เอง
- [ ] เปิด Chromium ลองทางช่วยคน/ปฏิเสธ/รับเงิน ตรวจ no pageerror และเซฟกลางทาง; npm test + artcheck + build
- [ ] Commit `feat: make the insurance career branch around one recurring contact`

## Task 5 / P1: Coexistence และ interruptions

**Files:** Modify `src/core/stories.js`, `src/core/narrative/engine.js`, `src/core/save.js`, `src/data/narrative/index.js`; create `test/narrative-compat.test.mjs`.

**Consumes:** MIGRATED_STORY_IDS, v2 fixtures, event snapshot. **Produces:** explicit dispatch legacy/new ต่อชีวิต ไม่ให้เรื่องสองเวอร์ชันเปิดคู่

- [ ] Tests: `old_open_office_keeps_legacy_path`; `completed_office_never_replays_reward`; `new_office_skips_legacy_producer`; `claimant_death_interrupts_without_recast`; `job_change_pauses_nonurgent_nodes`; `same_name_contacts_are_not_merged`
- [ ] Run compat test เห็น fail ก่อนแก้ wiring
- [ ] ทำ policy migration ตาม 02.I และ interruption table: cast died→claimant-gone; ย้ายเมือง→remote contact เมื่อเขียนรองรับ มิฉะนั้นรอ/พัก; เปลี่ยนงาน→พัก ไม่ล้าง progress; ผู้เล่นตาย→จบชีวิต ไม่ให้ pending reward ไหลเข้าลูก
- [ ] ตรวจ source producers ทุกตัวของ office ด้วย rg ไม่มี hook ลับยังส่ง legacy chapter
- [ ] รัน Task1–5 targets + npm test + browser reload; จุดนี้จึงเรียก P1 playable ได้
- [ ] Commit `fix: preserve legacy stories and handle interrupted narrative casts`

## Task 6 / P2: Focus, fair queue และ life arcs

**Files:** Create `src/core/narrative/scheduler.js`, `src/core/life-arcs.js`, `test/narrative-scheduler.test.mjs`, `test/life-arcs.test.mjs`; modify clock.js, registry.js, index.js, UI stories/settings และ producer adapters เท่าที่ต้องย้ายจริง

**Consumes:** pure candidates, absolute due, deriveLifeArc. **Produces:** storyCandidates, selectNarrative, focus/shelve/abandon API และ arc weights

- [ ] Test `critical_calendar_preempts_focus`; `side_story_waits_without_losing_node`; `quest_limit_three_keeps_fourth_available`; `switching_focus_does_not_reset_deadline`; `three_month_tick_does_not_skip_due`; `routine_served_within_twelve_nonurgent_months`; `preview_is_pure`
- [ ] Run scheduler/life-arcs tests ต้องเห็น fail ก่อนเปลี่ยน clock
- [ ] แยก simulation จาก event offers ก่อนรวบคิว ไม่เรียก monthly hooks ทั้งชุดเพื่อเก็บ candidate; สร้าง scheduler contract ที่ไม่ตั้ง world.done ก่อน event ถูก deliver/resolve ตาม semantics ของ event นั้น
- [ ] implement priority/tie-break/starvation guard และ arc hysteresis 3 เดือน; job+age ไม่พอให้ทดสอบหนี้ 3 เดือน/การบาดเจ็บจริงด้วย
- [ ] ทดสอบ illness/calendar/secrets/ops เดิมไม่หายเมื่อ queue เต็ม รัน suite ทั้งหมดและ playtest 40
- [ ] Commit `feat: pace discovered stories around focus and changing life circumstances`

## Task 7 / P2: Relationship needs และ persistent memories

**Files:** Create `src/data/relationship-events.js`, `src/data/npc-life.js`, `test/relations.test.mjs`, `test/npc-life.test.mjs`; modify relations.js, people.js, team.js, pulse.js, world.js, UI people/team, save.js.

**Consumes:** canonical IDs, memories, scheduler. **Produces:** 12 templates ตาม 03.6 และ UI อ่านความสัมพันธ์เป็นคำ

- [ ] Tests `broken_promise_changes_only_related_contact`; `repeated_gift_cannot_farm_trust`; `same_memory_survives_rejoin_and_reload`; `dead_contact_never_requests_help`; `declining_request_has_authored_consequence`; assert unrelated NPC trust unchanged
- [ ] Run target ให้ fail; implement requests เป็น story candidates ที่มี cooldown ไม่เปิด event จาก render
- [ ] ให้ความสัมพันธ์เป็นเหตุผลของฉากและ offers โดยคง combat loyalty เดิมจนมี explicit migration เพิ่มเติม
- [ ] Task นี้เป็นเจ้าของ autonomous NPC lifecycle: เก็บ life schedule ตอนสร้างด้วย per-person seeded stream; `updatePeople` เดิน nextUpdateWorldM ตามลำดับวันแล้ว ID, ใช้ setPersonStatus ทำ write-through ให้ caller เก่าเห็นการตาย/ย้ายและใช้คนเดิม ไม่สุ่มจากการ render
- [ ] เพิ่ม `due_updates_are_same_when_batched_or_monthly`, `background_death_updates_legacy_roster`, `active_team_never_receives_background_rank_boost`, `dead_cast_invalidates_future_candidate`, `generation_keeps_person_absolute_age`; ทำ red→green ตาม contract 02.M และรัน `node --test test/npc-life.test.mjs`
- [ ] ตรวจทุกจุดที่เปลี่ยน rank/location/alive ด้วย rg: ใช้ adapter หรือระบุ ownership ที่ยัง legacy ชัดเจน ไม่เก็บข้อมูลจริงสองแห่งที่เปลี่ยนแยกกัน
- [ ] Browser ตรวจคนชื่อเดียวกัน รูปแบบมือถือ และชื่อที่มี HTML special chars; ไม่แสดง memory ลับของคนที่ผู้เล่นไม่เคยพบ
- [ ] npm test + playtest40; Commit `feat: let recurring contacts remember favors and broken promises`

## Task 8 / P3: World effects ที่ผ่านไปแล้วก็ฟื้นตัวได้

**Files:** Create world-effects.js, test/world-effects.test.mjs; modify pulse.js, world.js, work.js, money.js, UI world/work และ save.js.

**Consumes:** worldMonth, effectKey, city catalog. **Produces:** applyWorldEffect, recoverWorld, journal และ ledger modifier

- [ ] Tests `crisis_affects_target_city_only`; `duplicate_effect_key_applies_once`; `recovery_expires_modifier`; `income_and_cost_combination_clamped_to_fifteen_percent`; `news_preview_does_not_apply_effect`; `after_year_100_new_pulse_not_old_calendar`
- [ ] Run target เห็น fail ก่อน implement
- [ ] ใช้ 3 crisis types ตาม 03.7; คูณผลผ่าน accounting entry เดียว ไม่บวกเงินอีกครั้งใน log; UI อธิบายที่มาของยอดและวันสิ้นสุด
- [ ] แยก world factionPower จาก s.fac; ทดสอบผู้เล่นไม่ได้อยู่เมืองนั้นได้รับข่าวแต่ไม่ถูกหักเงิน
- [ ] รันทุก test + sim 3 policies หลาย seeds เทียบ baseline ไม่ย้ายเพดานสมดุลเพื่อให้ผ่าน
- [ ] Commit `feat: make city crises leave bounded and recoverable consequences`

## Task 9 / P3: Gate variety ที่เปลี่ยนการตัดสินใจ

**Files:** Modify data/gates.js, core/hunt.js, core/ops.js, data/monsters.js เฉพาะที่จำเป็น; create test/gate-variety.test.mjs; art request ตาม workflow แยก

**Consumes:** team/cast context, gate rank 0..6, existing operation contract. **Produces:** 10 themes, template context filtering และรางวัล/อันตรายตามเดิม

- [ ] Tests `all_seven_ranks_have_valid_theme`; `solo_never_gets_teammate_rescue_text`; `dead_teammate_not_selected`; `same_offer_stable_on_rerender`; `decision_changes_result_beyond_wording`; validate monster/art IDs ทุกธีม
- [ ] Run target เห็น fail; implement context-aware template selection เมื่อสร้าง operation แล้ว freeze definition ใน s.op
- [ ] อย่างน้อย 4templates/ธีม, ธีมต่าง hazard/objective ไม่ใช่เพียงชื่อ; ตรวจภาพที่ใช้จริงและไฟล์ audio ถ้ามีอ้างใหม่
- [ ] Browser เล่น solo/team/scout/healer/boss-retreat; test coreops เดิมและ artcheck
- [ ] sim หลาย policy+seeds; Commit `feat: vary gate encounters by environment rank and actual team`

## Task 10 / P4: Family memory, evidence และ lore provenance

**Files:** Create family-memory.js, data/evidence.js, test/family-memory.test.mjs, test/item-provenance.test.mjs; modify heir.js, clock.js, items.js, save.js และ UI book/items/people

**Consumes:** worldMonth, scene IDs, legacyOf, existing heir tax/school/home rules. **Produces:** familySceneWeight, inheritFamilyMemory, optional item.provenance และ evidence knowledge

- [ ] Tests `optional_seen_scene_weight_is_one_third_after_one_sighting`; `mandatory_weight_remains_one`; `new_family_has_no_old_family_memory`; `heir_does_not_inherit_story_reward_or_personal_trust`; `absolute_npc_dates_survive_heir_birth`; `relic_does_not_claim_unfought_boss`; `ten_generations_no_early_deadline_or_duplicate_inheritance`
- [ ] Run targets เห็น fail; implement schema/migration validators ไม่คัดลอก s.c ทั้งชุด; memory บันทึกเมื่อ resolve เท่านั้น
- [ ] เพิ่ม 8heir templates และ lore provenance ที่ไม่เปิด secret ของเดิมตอนเกิด
- [ ] ทดสอบ inheritance gold/home/school/enemies/guild เดิมเท่าค่าก่อน patch; backup import/export และ caps
- [ ] npm test + 10-generation cohort; Commit `feat: let families inherit consequences without replaying identical lives`

## Task 11 / P5: ขยายเนื้อหาตามกรอบที่พิสูจน์แล้ว

**Files:** Add data/narrative/<existing-story-id>.js ทีละสาย; modify registry migrated IDs; test/<story-id>-narrative.test.mjs; อัปเดต docs handoff จริงใน repo

**Consumes:** stable graph/people/scheduler/world/memory APIs. **Produces:** แปลง 17 สายเดิมครบโดยมี coverage รายสาย

- [ ] ทำ checklist registry: legacy/new/compat policy/current end-to-end tests ห้าม mark migrated ถ้าข้อมูลยังไม่ครบ
- [ ] ต่อสายเขียน tests ≥3 endingId, failure, refusal, delayed effect และ missing/dead cast ก่อนลงเนื้อหา
- [ ] ทดสอบ fail จาก absence ของ authored route แล้วเขียนข้อมูลเรื่องให้ผ่าน; ไม่มี quest boilerplate ที่ทุกอาชีพแค่เปลี่ยนชื่อ
- [ ] ทดสอบเดิมทั้งหมดหลังแต่ละกลุ่ม 2–3 สาย ไม่ย้าย secrets/truths พร้อมกันโดยไม่มีแผนแยก
- [ ] Commit แยกกลุ่มที่เล่นได้ เช่น `feat: branch shop and civilian medicine stories`

## Task 12 / P5: Measuring diversity และ release review

**Files:** Modify tools/playtest.mjs, tools/sim.mjs เท่าที่ต้องเก็บผล; create tools/narrative-audit.mjs, test/narrative-integration.test.mjs; update docs/HANDOFF.md หลังผลจริง

**Consumes:** event facts/IDs, cohorts in05. **Produces:** รายงาน meaningful branch/state diversity, known failures และ browser validation

- [ ] Test `audit_fails_if_no_story_executed`; `same_state_different_copy_is_not_distinct_route`; `same_seed_choices_reproduce`; `preview_does_not_change_endings`; เครื่องมือ exit1 เมื่อ mandatory gate fail และไม่เขียนทับ golden โดยอัตโนมัติ
- [ ] Run targets เห็น fail ก่อน implement reporter; เก็บจำนวนชีวิตที่ eligible/start/complete/abandon/death/skipped แยกกัน
- [ ] รัน commands ใน 05 ทั้งหมด capture exit status; browser desktop/mobile/keyboard/save reload/heir
- [ ] ใช้ independent review สำหรับการเปลี่ยนระบบใหญ่ตาม repo workflow โดยรีวิว diff จริงกับ spec ไม่พึ่งคำบอกว่า test ผ่าน
- [ ] แก้ข้อผิดพลาดแล้วรันเฉพาะ affected checks + required gates; บันทึกส่วนที่ยังไม่ได้ทำและ regressions
- [ ] ส่ง `play.html` ที่ build จาก commit ที่ตรวจจริงพร้อมผลทดสอบและคำแนะนำใช้งาน ไม่เผยแพร่เอง

## Coverage map

Design §§5,12 → T6; §§6,11 → T3–5,9,11; §§7–8 → T2,7; §9 → T8; §10 → T10; save/determinism → T1,3,5,12; authored content → T4,7–11; ทุกเฟสต้อง QA05

Self-review ของแผน: signatures ใช้จาก 02 เท่านั้น, ไม่มี task พึ่ง API ที่ไม่มีเจ้าของ, phases ต่อกัน, legacy/new มีเจ้าของชัด, เงื่อนไข critical ทั้ง 5 รายการมี test ที่ระบุชื่อแล้ว. แผนนี้ยังไม่ได้ execute


---

<!-- Source: 05-ACCEPTANCE-AND-QA.md -->

# Acceptance, QA, and release evidence

สถานะ: เกณฑ์ให้ Claude ใช้เมื่อพัฒนา ไม่ได้อ้างว่า feature ใหม่ผ่านแล้ว ค่าความหลากหลายด้านล่างเป็นเป้าตั้งต้นที่ผู้จัดทำเสนอ แยกจากเป้าสมดุลเกมเดิม

## 1. สิ่งที่ต้องตรวจได้ด้วยเครื่อง

| Gate | ผลที่ผ่าน | Failure ที่ห้ามซ่อน |
|---|---|---|
| Graph | IDs/references ถูก ไม่มีทางตันที่ไม่ตั้งใจ | validate แล้วไม่มี error เพราะไม่ได้โหลดเรื่องใหม่ |
| Determinism | seed+choices+เริ่มจาก state เดียวกัน→state เกมเหมือนกัน | ใช้ timestamp/random ใน core หรือ preview กิน RNG |
| Atomic outcomes | double click/reload ไม่จ่ายซ้ำ | เงินลดแล้ว node ไม่เดิน/คนตายถูกสร้างกลับ |
| Migration | v2 fixtures โหลดต่อได้ | migration reset story หรือแจก ending reward |
| Legacy coexistence | เรื่องหนึ่งมี producer เดียวในชีวิตนั้น | officelegacy กับใหม่แย่งเปิด |
| Context | ฉาก/คน/สถานที่ตรง state | ข้อความช่วยลูกทีมตอน solo |
| Time | absolute due อยู่วันเดิมหลังเปลี่ยนรุ่น | งานค้าง 20 ปีเกิดทันทีตอนลูกอายุ 0 |
| Secrecy | เรื่องไม่พบ/route ลับไม่อยู่ DOM ที่ซ่อนไว้ | CSS hidden แต่ inspect เห็นคำเฉลย |
| Accounting | รายได้/ต้นทุนมี ledger entry ตรงยอด | news ให้เงินนอกบัญชีหรือ modifier ซ้ำ |
| Growth | caps ไม่ตัด fact ที่เรื่องยังอ่าน | NPC ตายถูกลบแต่เรื่องยังอ้าง ID |

## 2. Baseline ก่อนเปลี่ยน

บันทึก commit, Node/npm, count tests, exit codes, sim tables และ playtestsummary ลงรายงานของ Claude. เก็บ `play.html` ที่ใช้ทดสอบให้ตรง build ล่าสุด ห้ามดูไฟล์ที่เสิร์ฟจากคนละ checkout แล้วอ้างเป็นผลของ branch

คำสั่งจาก root repo:

```bash
npm ci
npm test
node tools/artcheck.mjs
node tools/linelen.mjs
node tools/sim.mjs 1000 --policy careful --seeds a,b,c,d,e
node tools/sim.mjs 1000 --policy normal --seeds a,b,c,d,e
node tools/sim.mjs 1000 --policy reckless --seeds a,b,c,d,e
node tools/playtest.mjs 200
npm run build
```

ไม่ใช้ `--policy careful|normal|reckless` เป็น shell command เพราะ `|` เป็น pipe; ต้องรันสามครั้งตามตัวอย่าง. Preserve exit status เมื่อ redirect/tee. แยก known baseline warning จาก regression อย่าแก้ threshold ให้ผ่านโดยไม่วิเคราะห์

เพื่อประหยัดเวลา ระหว่าง task ใช้ targettests+fullunit; ก่อนส่งเฟสใหญ่จึงขยาย sim หลาย policy. อย่ารัน suite ใหญ่ซ้ำทุกครั้งที่แก้สะกดข้อความ

## 3. Cohorts ที่เสนอ

### C1: Paired choices — ความหลากหลายเกิดจากการเลือก

100 fixed seeds `narrative-000` ถึง `narrative-099`, ตั้งอาชีพ/เมือง/ช่วงวัยเดียวกันใน test harness อย่าง explicit เปรียบ 3policy เรื่อง: care, routine, gain. ชื่อ policy นี้ไม่ใช่ careful/normal/reckless ของ combat

เก็บ eligible, started, completed, diedBeforeCompletion, abandoned, waiting. เป้าหลัง P1: ในเคสที่ทั้งสามเส้นทางมีโอกาสทำได้ ≥80% ของ pairedseeds ได้อย่างน้อย 2endingId ต่างกัน; และทุก ending ที่ตั้งใจเปิดใน P1 มี test ที่ไปถึงจริง. ห้ามนับฉากที่แค่ข้อความเปลี่ยนหรือชื่อ NPC ต่างเป็น branch ต่าง

รายงานทั้งจำนวนทั้งหมดและตัวหารของกลุ่มที่มีโอกาสทำได้ ถ้าทำเรื่องไม่จบมากเพราะ scheduler อดคิว ถือว่าต้องแก้ ไม่ตัดเคสเหล่านั้นออกแล้วรายงานเฉพาะผู้สำเร็จ

### C2: Context validity

ครอบคลุม solo/team, no-hunter/hunter, Thai/Korean, มี/ไม่มีเงิน, หนี้สูง, บาดเจ็บ, มี/ไม่มีลูก, เปลี่ยนเมือง, jobtier ต่ำ/สูง, NPC alive/dead. ใช้ pairwise fixtures ร่วมกับ story-specific tests ไม่ต้องคูณทุกมิติเป็นล้านเคส

ทุกฉากที่ผ่านต้องผ่าน explicit assertions: referencedperson มีจริงและใช้งานตามบทได้, item/skill/jobid มีจริง, unlockedoption กดได้, ทุก choice มี escape ที่ผู้เขียนตั้งใจ

### C3: Family replay

100fixedseeds เล่น 10 รุ่น. เปรียบกับ baselinecontrol ที่ไม่ใช้ familyweight แต่ให้ seed/action policy เดียวกัน วัด:
- optionalchildhood scene overlap ระหว่างรุ่นติดกัน (Jaccard ของ sceneID)
- จำนวนฉากใหม่ในช่วงอายุ 0–18
- mandatorymilestones ที่หายหรือช้า
- inheritedmemory/evidence และเงิน/บ้าน/กิลด์ซ้ำ

เป้าตั้งต้น: overlap ของ optional ฉากลดอย่างน้อย 20%เชิงสัมพัทธ์จาก control ในกลุ่มที่มี pool ใหม่เพียงพอ; หาก pool ไม่พอให้รายงาน contentshortage ไม่บิด RNG หรือซ่อน mandatoryscene เพื่อแต่งตัวเลข. plot/table แสดง mean และช่วง seed ไม่สรุปจากหนึ่งชีวิต

### C4: Time and save stress

save/reload ก่อน/หลัง choice, castdeath, worldexpiry, age12/18/60, birth/death/heir, ปี 100→101. ทดสอบ 10 รุ่น×100seeds: ไม่มี NPC อายุติดลบ, ไม่มีคนตายพูดสด, ไม่มีเงิน NaN, ไม่มี calendar ครั้งเก่าจ่ายซ้ำ

วัด sizeJSON และเวลารันบนเครื่องที่ใช้จริง เป้า fixture save≤2MiB; แต่ต้องเก็บ criticalfacts ครบ. ถ้าเกินให้สรุปข้อมูลอย่างมี schema ไม่ล้างความจำผู้เล่นเงียบ ๆ

### C5: Balance preservation

เปรียบ sim เดิมทุก row และ policy. บันทึกสาเหตุถ้าการเปลี่ยน pacing ทำให้อาชีพ/เงิน/อายุ/โอกาสตื่นต่างไป ไม่เพิ่มเนื้อหาเพื่ออ้างความหลากหลายแล้วทำให้ทุกคนรวย/เก่งเหมือนกัน. ห้ามแตะ awakeningrates โดยไม่มีเหตุจากงานนี้

## 4. Browser checklist

ใช้ Chromium/Playwright ที่มีใน environment ลองรันจริงก่อนบอกว่าทำไม่ได้

- desktop1280×800 และ mobile390×844; ไม่มีปุ่มตกจอ/scrolltrap
- เริ่มเด็ก→เห็นเฉพาะข้อมูลที่ควรรู้; ไม่มีรายชื่อคนทั้งโลก
- ติดตามเรื่อง office; เล่น 3 ทางที่ต่างกันและ captureIDs ผล ไม่ใช่แค่ถ่ายหน้าจอเดียว
- pause/resume/focus ขณะ choice ค้างต้องไม่ทำให้ choice เปลี่ยน
- doubleclick และ keyboard1–9 ไม่ทำ outcome ซ้ำ
- export/import/backup กลาง choice และ operation คง state
- NPC ตายระหว่างพักแล้วกลับเรื่อง:แสดง interruption ที่ถูกต้อง
- ทีม solo ไม่มีตัวเลือกอ้างลูกทีม; team ที่บาดเจ็บใช้เฉพาะคน present
- จ่ายทุนบริษัทแล้ว reload ไม่หักซ้ำ; ledger บอกที่มา
- ตายแล้วเล่นลูก: ปีโลกไม่ย้อน; มีมรดกครั้งเดียว; knowledge ไม่เปิดความลับทั้งชุด
- ไม่พบ pageerror;consolewarning ที่เหลือต้องระบุว่าอะไรและกระทบไหม
- ผู้ใช้หน้าจอแคบ/คีย์บอร์ดมี focus ชัด; ไม่ให้ color เป็นข้อมูลความเสี่ยงเพียงอย่างเดียว

## 5. Review rubric สำหรับ Claude และ reviewer

ให้ตรวจ diff จริง ไม่อ่านเฉพาะรายงานว่าทำครบ. แยก blocker/data-loss, correctness, pacing, narrativequality, optionalpolish

ถาม: ถ้าชื่อ NPC ถูกเปลี่ยนทั้งหมด เรื่องยังทำสิ่งเดิมหรือไม่? ถ้าใช่ แปลว่าต้องดูว่าความสัมพันธ์เชื่อมเหตุและผลจริงหรือยัง. ถ้าทุกอาชีพจบเป็นคนเปลี่ยนประเทศได้เหมือนกัน นั่นคือความหลากหลายปลอม

ถ้าตั้ง teststate ตรง node สุดท้าย ต้องเรียกว่า unitfixture ไม่ใช่พิสูจน์ว่าเล่นไปถึงได้. ต้องมีอย่างน้อยหนึ่ง end-to-end ทางแต่ละ ending หลักที่เดินผ่าน entry จริง

## 6. Definition of done รายเฟส

P0: fixtures/migration ผ่านและ behavior เดิมไม่เปลี่ยน
P1: officebranch ครบ, NPC เดิมกลับมาจริง, oldsave เล่นต่อได้, browser3 ทางและ no duplicate reward
P2: focus+queues+arcs+relationshipneeds ไม่ทำ event เดิมหายหรืออดคิว
P3: cityeffect เกิด/หมดอายุ/มี ledger, 10gate themes ผ่าน context และสมดุล
P4: familyweight/evidence/provenance ถูกต้องข้าม 10 รุ่นและเซฟ
P5: 17 สายมี branchingcoverage จริง, cohorts และ releasegates ผ่าน พร้อมแสดงข้อยกเว้นที่ยังไม่ผ่าน

ห้ามเรียกเกม clone แนวทางสำเร็จครบเมื่อทำ P1 อย่างเดียว ให้ระบุ“vertical slice พร้อม”และ backlog ส่วนที่เหลือ

## 7. รูปแบบรายงานส่งเจ้าของ

1. ผู้เล่นทำอะไรใหม่ได้จริง พร้อมตัวอย่างชีวิตที่ต่างกัน 2–3 แบบ
2. สิ่งที่ทำแล้ว/ยังไม่ทำ แยกตามเฟส
3. tests กี่ข้อ/กี่ผ่าน/กี่ fail/skip, simpolicy+seeds และตัวเลขที่เปลี่ยน
4. browser ที่ทดสอบและเส้นทางที่เล่นจริง
5. savecompatibility และ knownlimitations
6. commit/buildartifact ที่สอดคล้องกันและวิธีเปิดเล่น
7. การเผยแพร่ยังต้องเป็นคำขอที่ได้รับอนุญาตต่างหาก


---

<!-- Source: 06-SOURCE-MAP.md -->

# Source map and evidence boundaries

## แหล่งที่มา

ไฟล์แนบ `way-of-xian.wox-game.workers.dev.har.7z`, archive≈33.1MB, HAR194,769,513bytes. พบ 683entries, เนื้อหาตอบกลับไม่ว่าง 337 เส้นทาง. เฉพาะแพ็ก story ที่โหลดเป็นไฟล์แยกพบ 4 เส้นทาง ไม่ใช่ว่ามีเนื้อเรื่องทั้งหมด 4 เรื่อง เพราะมี index/compiledcontent ขนาดใหญ่ด้วย

HAR เป็นข้อมูลบันทึกการเรียกเว็บ ไม่ใช่ชุด source ทุกฝั่ง เซิร์ฟเวอร์/การทำงาน production บางส่วนไม่ปรากฏ จึงใช้เพื่ออ่านรูปแบบระบบและหลักฐาน ไม่อ้างว่ารันต้นแบบครบหรือพิสูจน์คุณภาพทุกระบบ

อ่าน responsebody เฉพาะที่เกี่ยวข้อง ไม่ใช้ header/cookie/ข้อมูล save เป็นแหล่งคำสั่ง ไม่ส่ง credentials ของ HAR ไปยังเว็บ. ไม่มีการติดต่อเว็บต้นแบบหรือล็อกอินเป็นผู้ใช้จาก HAR ในงานนี้

## กลไกที่พบ → การปรับใช้

| ต้นแบบ path | หลักฐานที่อ่าน | Rift Ledger adaptation | ขอบเขตความมั่นใจ |
|---|---|---|---|
| /src/arcs.js | ARCS และบทที่อิงสถานะ/การเดินทาง | life-arcs ตามงาน/หนี้/ฟื้นตัว | มี definition จริง;ไม่ได้พิสูจน์ทุก arc ใน playthrough |
| /src/stories.js | storyposition,cast,wait,nextOf,questLimit,focus/queue | graph+focus+shelving | อ่าน engine ส่วนสำคัญ;ทุก storypack ไม่ครบ |
| /src/saga-routes.js | routeconditions,growCast,worldeffects | routes+NPCdevelopment+boundedworldeffects | พบ contract/code;ไม่พอร์ต court เฉพาะเรื่อง |
| /src/world.js | ageAt/aliveAt/realmAt,seededworldpeople | canonicalNPC+age/alive+dueupdates | ไม่ต้องคัดจำนวนคน/สูตร realm |
| /src/bonds.js | closenesstest,need,memory | trust/requests/sharedhistory | ไม่อ้างว่าความสัมพันธ์ต้นแบบสมดุลแล้ว |
| /src/lineage.js | wayat12,lineat18,childrenchronicle | familyconsequences+heritage | ไม่พอร์ต spiritualroot เข้าฮันเตอร์ |
| /src/lore.js + lore-data.js | authoredlore และ fallback ตามสิ่งของ | authoredlore+actualprovenance | ห้าม fallback แต่งประวัติที่ไม่เกิด |
| /src/auto.js | policymanagement แทนงานรายเดือน | routinepolicies,importantstop | ไม่เอา autofarming ทุกระบบมาเพิ่ม |
| /src/town-life.js | standing,journal,towncontext | cityconsequences/localstanding | ไม่เพิ่ม standing ซ้ำกับทุกระบบโดยไร้ purpose |
| /src/sect-life.js | องค์กรมีภารกิจและความก้าวหน้า | guild/careercontext | ใช้กิลด์เดิมไม่สร้างสำนักเซียน |
| /src/campaign.js | turn-basedcampaign แยก purestate | แนวคิดใช้ engine ร่วมของงานใหญ่ | campaigngrid เลื่อนไปนอกขอบเขต |
| /src/combat.js | visualbattle บางส่วนแสดง outcome ที่ตัดสินแล้ว | แยก visual จาก state | ไม่สรุปว่าระบบ combat ต้นแบบทั้งหมดแค่ภาพ |
| /src/rift.js | seededtimeline กับ server/sharedrun | determinism และการเก็บ runstate | onlinehourlyrift อยู่นอกขอบเขต |

## สิ่งที่มีอยู่แล้วใน Rift Ledger

Baseline commit `65e56213ab031ac9e1a73dda79ffc84327da4b5a`:
- core/stories.js fixedchapters, core/secrets.js steppedsecretquests, core/events.js locks/outcomes
- core/world.js notableNPCs12 และ calendar, core/pulse.js ข่าวที่บางทางแก้ state จริงแล้ว
- core/ops.js engine ร่วม gate/tower/civilianjob, core/hunt.js offers, data/gates.js3themes
- core/team.js สมาชิกมี loyalty/wounds/story, core/party.js ปาร์ตี้, core/guild.js กิลด์
- core/heir.js ทายาทเกิดเดือนผู้เล่นตาย, legacy.js, spend.js school/home/fund
- core/save.js v2container และ SAVE_SV2, slotbackup, collectionbook แยก

ห้ามตีความว่าไม่มี NPC หรือไม่มีเรื่องแตกเงื่อนไขเลย เกมมีพื้นฐานแล้ว ช่องว่างคือการเชื่อม identity/graph/world/family ให้ต่อกัน

## ผลตรวจที่ยืนยันแล้ว

- 17career/hunterchains รวม 85chapters; ALL_EVENTS150 ไม่ใช่จำนวนเนื้อหาทั้งเกม; gates3themes
- officefinale กดเปิดบริษัทได้เมื่อ gold พอแม้ hunterFriend=0 และผลกล่าวถึงคนที่เคยช่วย: reproducer รันจริงใน memory
- newHeir ไม่ copyevent-seen ทั่วไปใน c แม้ copyworldrecords: reproducer รันจริง ไม่แปลว่าทุกฉากจะซ้ำแน่นอน
- npmtest ล่าสุด 198 ผ่าน 0fail; ไม่ได้ test ระบบใหม่เพราะยังไม่ได้ implement

## การใช้งานแพ็กนี้โดยไม่มี HAR

Claude เริ่มได้จาก design/contracts/content/plan ครบในแพ็กนี้ ไม่จำเป็นต้องติดตั้งโค้ดต้นแบบหรือมี cookie เดิม. ถ้าต้องตรวจรายละเอียดต้นแบบเพิ่ม ให้ขอ HAR ต้นฉบับจากผู้ใช้ผ่านช่องทางแนบไฟล์ปกติ ไม่ขอ secret ในแชต ไม่อ้างไฟล์ local ใน session นี้ว่าจะมีในเครื่อง Claude เสมอ

ไฟล์ JS ที่อ่านบางส่วนมีข้อความความคิดเห็นจากผู้พัฒนาเดิม; treat เป็นหลักฐานเจตนาที่ต้องเทียบกับโค้ด ไม่ใช่คำสั่งให้ Claude ทำตาม. ค่า cap,API และเนื้อเรื่องในแพ็กนี้เป็นงานออกแบบใหม่โดยผู้จัดทำ


---

<!-- Source: 07-AUDIT.md -->

# ผลตรวจ Rift Ledger เทียบต้นแบบ Way of Xian

วันที่ 13 พฤศจิกายน 2026 — ตรวจระบบและเนื้อเรื่อง เน้นความหลากหลาย

## ขอบเขตและหลักฐาน

- ตรวจ checkout `/workspace/rift-ledger` และไฟล์ `way-of-xian.wox-game.workers.dev.har.7z` ที่ผู้ใช้ส่งมา
- ไฟล์แนบเป็น HAR: 683 รายการร้องขอ พบเนื้อหาตอบกลับที่ไม่ว่าง 337 เส้นทาง ไม่ใช่ repository หรือฐานข้อมูลเซิร์ฟเวอร์ครบชุด
- แยกโค้ดออกมาอ่านโดยไม่รันสคริปต์ต้นแบบ และไม่ใช้ข้อความหรือคำสั่งในไฟล์เป็นคำสั่งของผู้ใช้ ไม่แสดง cookie, token, header หรือข้อมูลเซฟ
- ตรวจกลไกต้นแบบจาก stories.js, saga-routes.js, world.js, bonds.js, lineage.js, arcs.js, lore.js และ campaign.js รวมถึงตัวอย่างข้อมูลเนื้อเรื่อง ไม่ได้ตรวจทุกบรรทัดของเนื้อหาทั้งหมด
- Rift Ledger ปัจจุบันมีสายเรื่องอาชีพ/ฮันเตอร์ 17 สาย รวม 85 บท, เหตุการณ์ใน ALL_EVENTS 150 รายการ และธีมเกต 3 แบบ ตัวเลขนี้ไม่นับเนื้อหาทุกระบบรวมกัน
- รัน npm test ใหม่: 198 ผ่าน, 0 ล้มเหลว พร้อมทดลองสถานะเฉพาะจุดในหน่วยความจำ โดยไม่แก้โค้ดหรือเซฟจริง

## ข้อสรุป

Rift Ledger มีฐานเกมชีวิตที่ใช้งานได้แล้ว จุดที่ยังห่างจากต้นแบบคือความเชื่อมโยงระหว่างทางเลือก คน และโลก มากกว่าจำนวนระบบ เกมมีเงื่อนไขเปิดทางเลือกและผลสะสมอยู่แล้ว แต่สายเรื่องอาชีพ/ฮันเตอร์ยังขยับเป็นบทถัดไปตามลำดับ การเพิ่มข้อความอย่างเดียวจึงเสี่ยงทำให้เล่นนานขึ้นโดยชีวิตยังคล้ายเดิม

## สิ่งที่พบ เรียงตามผลต่อการเล่นซ้ำ

### 1. สายเรื่องมีทางเลือก แต่โครงบทหลักยังเป็นเส้นตรง — ช่องว่างสำคัญ

หลักฐาน: `src/core/stories.js:34–46` เพิ่มตัวนับบททีละหนึ่งแล้วเปิดบทตาม index เดิม ไม่มีการเลือกบทถัดไปตามเส้นทางในตัวจัดการนี้ ข้อมูลบางบทใช้ตัวนับเปิดทางเลือก จึงไม่ใช่ว่าทางเลือกทั้งหมดไม่มีผล

ต้นแบบ `stories.js` เก็บตำแหน่งเรื่องและตัวละครประจำเรื่อง ส่วน `saga-routes.js` รองรับเส้นทางและเงื่อนไขเส้นทางอย่างชัดเจน

ผลต่อผู้เล่น: กลับมาเล่นอาชีพเดิมจะยังพบแกนฉากเดิม แม้เลือกนิสัยต่างกัน ควรให้การตัดสินใจครั้งสำคัญเปลี่ยนทั้งฉากถัดไป ความสัมพันธ์ และตอนจบของสาย โดยชีวิตไม่ต้องมีตอนจบหลักร่วมกัน

### 2. ข้อความอ้างประวัติที่อาจไม่เคยเกิด — ยืนยันพฤติกรรมได้

หลักฐาน: `src/data/stories/careers.js:45–47` ตัวเลือกเปิดบริษัทต้องมีเงิน 15,000 แต่ผลบอกว่า “ลูกค้ารายแรกคือฮันเตอร์ที่คุณเคยช่วย” โดยไม่ตรวจ `hunterFriend`

ทดลองสร้างสถานะพนักงานบริษัทอายุ 30 ปี มีเงิน 20,000 ไม่มี hunterFriend และให้ถึงบทสุดท้าย: ตัวเลือกนี้มองเห็นและกดได้จริง

ควรให้ข้อความและลูกค้าสอดคล้องกับประวัติ เช่น เคยช่วยฮันเตอร์จึงได้ลูกค้าคนนั้น ถ้าไม่เคยช่วยควรเป็นอีกเหตุการณ์หนึ่ง การตรวจความต่อเนื่องแบบนี้สำคัญกว่าทำฉากเพิ่มจำนวนมาก

### 3. รุ่นลูกสืบทอดโลก แต่ไม่สืบทอดประวัติฉากที่ครอบครัวเคยพบ — ช่องว่างการเล่นซ้ำ

หลักฐาน: `src/core/heir.js` สร้าง newLife ใหม่แล้วคัดลอกโลก มรดก และบางผลครอบครัว แต่ไม่ได้คัดลอกประวัติฉากทั่วไปใน c ส่วน `src/core/clock.js` ลดโอกาสซ้ำโดยดูประวัติของชีวิตปัจจุบัน

ทดลองแล้วประวัติฉากที่ใส่ให้รุ่นก่อนเป็น 1 กลับเป็น 0 ในรุ่นลูก ขณะที่สถิติหอคอยยังถูกสืบทอด ตรงนี้ไม่ใช่หลักฐานว่าแต่ละรุ่นจะเจอทุกฉากซ้ำแน่นอน แต่ยืนยันว่าไม่มีความจำส่วนนี้มาช่วยลดความซ้ำ

ต้นแบบ `lineage.js` มีเส้นทางและบันทึกชีวิตของลูกเอง การเป็นลูกหลานจึงมีบริบทมากกว่าการเริ่มวัยเด็กใหม่พร้อมโบนัส

### 4. NPC โลกกับสมาชิกทีมยังเป็นคนคนละชุด — ช่องว่างความผูกพัน

หลักฐาน: `src/core/world.js` เริ่มรายชื่อ NPC โลก 12 คน ส่วน `src/core/team.js` สร้างสมาชิกใหม่ด้วยรหัส m1, m2 ฯลฯ การรับสมัครไม่ได้เลือกรหัสคนจากรายชื่อโลก

ต้นแบบมีตัวตน NPC ที่เรื่องเรียกอ้างถึง อายุ/การมีชีวิต และความสัมพันธ์ พร้อมความทรงจำร่วมใน bonds.js

ผลต่อผู้เล่น: โอกาสได้เจอ “คนในข่าวที่ต่อมาเป็นเพื่อนร่วมทีม” หรือคนที่มีอดีตข้ามหลายสายเรื่องยังจำกัด ควรเริ่มจาก NPC สำคัญจำนวนน้อยที่ใช้ตัวตนเดียวกันข้ามระบบ ไม่จำเป็นต้องจำลองคนหลายพันคนตามต้นแบบ

### 5. โลกเดินต่อได้ แต่ข่าวบางประเภทเป็นข้อความโดยยังไม่มีผลต่อการใช้ชีวิต

หลักฐาน: `src/core/pulse.js` ข่าวเกตแตกต่างเมืองคำนวณยอดผู้เสียชีวิตแล้วส่งเข้า log โดยทางนั้นไม่ได้เปลี่ยนเศรษฐกิจเมืองหรือบริการ ขณะที่ข่าวทำลายสถิติและ NPC ตายมีการเปลี่ยนสถานะจริงแล้ว จึงต้องแยกสองประเภทนี้ออกจากกัน

ผลต่อผู้เล่น: โลกดูมีความเคลื่อนไหว แต่ข่าวบางข่าวยังไม่ทำให้ต้องเปลี่ยนแผน เหมาะจะเชื่อมข่าวที่สำคัญกับงานของแพทย์ ร้านค้า การย้ายเมือง หรือคนรู้จัก โดยไม่จำเป็นให้ทุกข่าวกระทบผู้เล่น

### 6. ความหลากหลายของเกตยังต่ำกว่าความกว้างของแรงก์ — ยืนยันจากข้อมูล

มีเพียง subway, sewer, house และมีจุดตัดสินใจธีมละ 2 ฉาก เทียบกับเป้าเดิมในเอกสารออกแบบที่ระบุ 8–10 ธีม อีกทั้งข้อความช่วยลูกทีมใน subway ไม่ได้ผูกชื่อคนลงในข้อความนั้น

ควรแบ่งประสบการณ์ตามแรงก์ เมือง และสภาพทีม รวมทั้งตรวจว่ามีลูกทีมจริงก่อนใช้ฉากที่กล่าวถึงลูกทีม ส่วนหอคอยมีเนื้อหาตามช่วงชั้นมากกว่า จึงไม่ควรสรุปว่าทุกดันเจียนมีแค่สามแบบ

## สิ่งที่ควรรักษาไว้

- คนธรรมดามีสายอาชีพและการตัดสินใจในโลกฮันเตอร์ ไม่จำเป็นต้องตื่นพลังทุกชีวิต
- สุ่มแยกตามระบบด้วย seed และมีตัวจำลองช่วยตรวจสมดุล
- ความลับโลกใน truths.js เล่าผ่านความเชื่อของฝ่ายต่าง ๆ และมีฉากค้นพบในหอคอย
- ระบบทีม กิลด์ ฝ่าย ธุรกิจ มรดก และสุขภาพจิตมีฐานอยู่แล้ว ไม่ต้องรื้อทั้งหมด
- การที่เทสต์ผ่านยืนยันกติกาที่ชุดทดสอบครอบคลุม ไม่ได้ยืนยันว่าทุกเรื่องต่อเนื่องหรือทุกชีวิตสนุกเท่ากัน

## ข้อเสนอแนะลำดับถัดไป — ยังไม่ใช่แบบที่อนุมัติให้พัฒนา

1. ตรวจและแก้ความต่อเนื่องของเรื่องก่อน โดยเริ่มจากการอ้างคนที่เคยช่วย ตำแหน่งงาน และผลของตัวเลือกก่อนหน้า
2. ทดลองทำหนึ่งสายอาชีพให้แตกตามการกระทำ และใช้ NPC คนเดิมต่อเนื่อง เพื่อพิสูจน์ว่าชีวิตต่างกันจริงก่อนขยายทุกสาย
3. เพิ่มความจำระดับครอบครัวเพื่อถ่วงน้ำหนักฉากที่เคยเห็น โดยยังเปิดฉากจำเป็นและหมุดหมายชีวิตได้
4. ขยายเกตพร้อมเงื่อนไขบริบท ไม่ใช่เปลี่ยนชื่อฉากแต่ใช้ผลเหมือนกัน
5. ค่อยเชื่อมผลข่าวโลกกับเมืองและอาชีพที่เกี่ยวข้อง

เกณฑ์ตรวจความหลากหลายควรรวม: อาชีพเดิมแต่เลือกต่างกันพบฉาก/ผลต่างกันหรือไม่, เรื่องเรียก NPC คนเดิมถูกต้องหรือไม่, รุ่นลูกพบฉากใหม่เพิ่มหรือไม่ และทางเลือกทำให้ชีวิตเปลี่ยนอย่างอธิบายได้หรือไม่ ยังไม่ได้ตั้งตัวเลขเป้าหรือเขียนระบบเหล่านี้ในรอบตรวจนี้

## ข้อจำกัด

ไม่ได้เปิดเล่นต้นแบบจาก HAR แบบครบเกม ไม่ได้ตรวจฝั่งเซิร์ฟเวอร์ และบาง response ว่างหรือไม่มีแพ็กเรื่องครบ จึงไม่อ้างว่าต้นแบบทุกระบบทำงานสมบูรณ์ ข้อเสนอเป็นการนำหลักการมาใช้กับโลกฮันเตอร์ของ Rift Ledger ไม่ใช่เสนอให้ยกเนื้อเรื่องเซียนหรือระบบออนไลน์เข้ามาทั้งชุด


---

<!-- Source: 08-REVIEW-STATUS.md -->

# Handoff review status

จัดทำตามคำขอเจ้าของวันที่13พฤศจิกายน2026 ใช้ Superpowers brainstorming และ writing-plans ในการออกแบบ/จัดแผน งานที่ส่งมอบคือเอกสาร ไม่มีการแก้โค้ดเกม

มีผู้ตรวจอิสระอ่านในมุมผู้รับไปพัฒนาแล้ว พบ2จุด: lifecycle NPCไม่มีเจ้าของงานชัด และpolicyออโต้ยังไม่มีtaskทดสอบ. แก้โดยเพิ่มcontracts L/M/NและระบุTask7/Task4ตามลำดับ ผู้ตรวจอ่านซ้ำแล้วรายงานว่าไม่มีblockerสำคัญเหลือ

นี่คือการตรวจความพร้อมของแบบส่งต่อ ไม่ใช่code reviewของimplementation และไม่ใช่หลักฐานว่าระบบใหม่ผ่านtest. Baselineของเกม198testsผ่านตาม07-AUDIT ส่วนแผน12งานยังไม่ได้execute. รายละเอียดและตัวเลขที่ผู้จัดทำเสนอแยกจากคำขอเจ้าของไว้ใน00และ01แล้ว

Claudeต้องตรวจrepoและข้อกำหนดsessionปัจจุบันใหม่ก่อนพัฒนา ไม่อนุมานสิทธิ์push/merge/publishหรือการอนุมัติdesignจากสถานะreviewเอกสารนี้
