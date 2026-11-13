# Claude handoff — รีวิว P1 หลังเพิ่มเรื่องที่มีความทรงจำ

วันที่ 13 พฤศจิกายน 2026 · งานตรวจและเอกสาร ไม่ได้แก้โค้ดผลิตภัณฑ์

**ตรวจ branch `claude/pensive-hypatia-xtqvox` ที่ commit `d12f64da180d8fa325c66f54a66ef8b0890b66ee`** เทียบ `main` ที่ `352f4a81ea29b9df647871dcf2d9c98d719950dd` งาน P1 ที่ตรวจยังไม่ได้อยู่บน main ณ เวลาตรวจ

## ลำดับอ่านและลงมือ

1. [ผลรีวิวและหลักฐาน](REVIEW.md)
2. [แผนรับงานแก้ไข](CLAUDE-NEXT-STEPS.md)
3. [สคริปต์ทำซ้ำปัญหา](evidence/reproduce.mjs) และ [ผลที่พบ](evidence/observed.json)
4. แบบ P1 ที่ Claude เขียน: `docs/superpowers/specs/2026-11-13-lives-that-remember-design.md`
5. handoff ใหญ่เดิม: `docs/reference/rift-ledger-handoff-pack.md`

## สรุปให้ผู้รับงาน

P1 มีความก้าวหน้าจริง: graph สายประกันและเพื่อนวัยเด็ก, cast คงเดิม, relations/memories, save sv3, UI เรื่องที่ติดตามและคนรู้จัก, tests 309 ผ่าน

ยังไม่ควรนับว่า P1 ตรวจรับครบ: พบปัญหา save เวอร์ชันใหม่ถูก backup เก่าเขียนทับ และเส้นทางได้ลูกทีมบางแบบไม่ลงทะเบียน personId รวมทั้งข้อผิดพลาดบริบทจากรอบก่อนยังไม่แก้

**ลำดับแนะนำ: ป้องกันข้อมูลสูญหาย → ปิดช่องทางสร้างลูกทีมที่ไม่เข้าระบบกลาง → แก้บริบท event เดิม → ขยาย regression/paired-choice cohort → ตรวจรับ P1 → จึงเริ่ม P2**

ไม่ต้องเริ่ม engine ใหม่หรือเขียน handoff ใหญ่ซ้ำ และอย่า replay งานเก่าที่ทำแล้ว ใช้ core/narrative.js ที่มีอยู่ให้ถูกต้องก่อนขยาย

## Superpowers ที่ใช้ในรอบนี้

requesting-code-review: มีผู้ตรวจอิสระตรวจ engine/save/people และทำซ้ำสองข้อค้นพบใหม่; ผู้ตรวจหลักตรวจซ้ำด้วยสคริปต์แนบ
verification-before-completion: รันคำสั่งบน snapshot ที่ตรวจจริง ผลใน REVIEW แยก passed กับยังไม่ได้รัน

ผลตรวจนี้เป็น snapshot ที่ SHA ข้างต้น หาก Claude push เพิ่ม ให้ตรวจ delta ใหม่ก่อนอ้างว่าแก้แล้ว ไม่ถือข้อเสนอทั้งหมดเป็นคำสั่งอนุมัติ merge หรือเผยแพร่เกม
