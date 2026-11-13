# แผนรับงานต่อสำหรับ Claude — แก้ review ก่อนขยาย P2

> ใช้ Superpowers: test-driven-development สำหรับแต่ละข้อ, executing-plans หรือวิธีที่เจ้าของเลือก, requesting-code-review สำหรับทั้ง branch และ verification-before-completion ก่อนรายงานสำเร็จ

**Goal:** ตรวจรับ P1 โดยไม่สูญเซฟ และทำให้ตัวตน/บริบทของคนเชื่อมกับระบบเดิมจริง
**Architecture:** ซ่อมขอบเขตการโหลด slot และ gateway สมาชิกบน engine ที่มี ไม่สร้าง narrative engine ใหม่
**Spec:** แบบ P1 เดิม + REVIEW.md ในโฟลเดอร์นี้
**Start SHA:** d12f64da180d8fa325c66f54a66ef8b0890b66ee

## ก่อนเริ่ม

- [ ] อ่าน AGENTS.md/CLAUDE.md/spec P1 และรีวิวนี้ ตรวจ git status/branch/HEAD ใหม่ ห้ามล้างงานค้างของผู้ใช้
- [ ] หาก HEAD ใหม่กว่า SHA ที่ตรวจ ให้ดู delta ก่อนแก้เพื่อไม่ย้อน patch ล่าสุด
- [ ] รัน probe ที่แนบเพื่อยืนยันสถานะปัจจุบัน สคริปต์พิมพ์ observed behavior ไม่ใช่ regression suite ที่ตั้งใจให้ผ่าน
- [ ] เก็บ fixtures เป็นข้อมูลสังเคราะห์ ไม่ใช้เซฟจริง/cookie/HAR ของผู้เล่น

## Task A: ปกป้อง slot ที่เป็น schema รุ่นใหม่กว่า — แก้ก่อนข้ออื่น

**Files:** src/core/save.js, src/ui/main.js, src/ui/settings.js หากเป็นตำแหน่งที่แสดง slots จริง; test/save-versions.test.mjs, test/narrative-save.test.mjs และ test slot UI ที่เกี่ยวข้อง

**Contract:** แยก parse outcome เป็น ok/corrupt/unsupported โดยให้ deserialize public ที่มี caller เดิมยังใช้ได้; slot layer ต้องรู้ unsupported โดยไม่อาศัย null อย่างเดียว. กำหนด slotStatus API ที่ UI อ่านได้ ไม่โยน runtime error ทำให้หน้าเริ่มพัง

- [ ] เขียน test primary sv4+backup sv3: ต้องไม่คืน backup เป็นเกมที่เขียนทับ primary ได้; bytes หลักและ backup ต้องคงเดิมแม้มี attempt save จาก state อื่น
- [ ] เขียน test JSON primary ขาดท้าย+validbackup: ยัง recoverbackup ได้ตามเดิม
- [ ] เขียน test slotlist/freeSlot: unsupported ไม่ถูกนับเป็น empty/finished; ห้ามเริ่มชีวิตใหม่ทับโดยไม่ explicit destructive confirmation
- [ ] เขียน test export: คืน rawbytes ของ unsupported primary ตรงเดิม; backup ไม่ถูกย้ายมาทับขณะ export
- [ ] รัน test ให้เห็น fail ก่อนแก้ จากนั้น implement การจำแนกและป้องกันที่ storage layer ด้วย ไม่ป้องกันแค่ซ่อนปุ่มใน UI
- [ ] UI ไทยบอก“เซฟนี้มาจากเกมเวอร์ชันใหม่กว่า”และให้ export ได้ ห้าม autosave/quit overwrite slot นี้
- [ ] ตรวจ unsupported ใน backup ด้วย ถ้า primary เสียแต่ backup ใหม่กว่า ให้รายงาน unsupported เช่นกัน ไม่อ้างว่าไม่มีเซฟ
- [ ] รัน targeted tests+ทั้งหมด และทดสอบ browser เปิด slot นี้จริงก่อน commit

**Done:** downgrade/backup ไม่ทำข้อมูลหายและการกู้ JSON เสียจริงยังใช้ได้

## Task B: ทุกทางได้สมาชิกต้องเข้าระบบคนกลาง

**Files:** src/core/team.js, src/core/party.js, src/core/people.js, src/core/save.js; test/people.test.mjs, test/p1-review-fixes.test.mjs หรือ test ใหม่ที่แยกชัด

**Contract:** เสนอ gateway `addTeamMember(s,member)` หรือฟังก์ชันตามรูปแบบ repo ให้ลงทะเบียน listMember ก่อน push. ห้ามเปลี่ยน m.id ที่ UI ใช้อยู่/ห้ามทอยคนใหม่เพื่อซ่อม record เดิม

- [ ] เขียน failing tests สำหรับ hire, loyalAlly, split, inherit แต่ละทางมี personId ที่ resolve ได้ มี canonicalperson เพียงหนึ่งคนต่อ member
- [ ] ทดสอบ round-tripsv3 ที่มี member แต่ไม่มี personId: หลัง load มี ID และ load ซ้ำไม่เพิ่มคนอีก; rank/lv/loyalty/wounds/sworn/story เท่าเดิม
- [ ] ตัดสินใช้ sv4migration หรือ idempotentrepair ตามนโยบายเซฟจริง ถ้าใช้ sv4 ให้ runTaskA ก่อนและเพิ่ม fixturever3→4. อย่าหวังให้ migration2 รันซ้ำบน sv3 โดยไม่มี versionstep
- [ ] ไล่ทุก `s.team.push`/assignment ด้วย rg; route ผ่าน gateway หรือมีเหตุผลเฉพาะที่ตรวจได้ รวม path ใน party
- [ ] ทดลอง dismiss/loseAlly/death กับสมาชิกแต่ละแหล่ง: canonical gone/death ตรงกับ team และไม่ทำให้คนชื่อเหมือนกันอีกคนเปลี่ยนสถานะ
- [ ] ยืนยัน reward เงิน/จำนวนสมาชิก/ข้อจำกัด team ไม่เปลี่ยนเพราะ refactor
- [ ] รัน test ที่เกี่ยวกับ team/party/people/save และ npmtest ก่อน commit

**Done:** คนที่ได้มาแต่ละทางอ้างข้ามระบบได้จริง และโหลดเซฟที่ได้รับผลกระทบไปแล้วซ่อมได้อย่างไม่ทำลายข้อมูล

## Task C: ปิดข้อผิดพลาดบริบทที่ค้างจากรีวิวก่อน

**Files:** src/data/events/kinds2.js, life2.js, src/core/events.js/core/hunter.js เท่าที่จำเป็น; test/kinds.test.mjs/test/life2.test.mjs/test/lifecheck-rules.mjs

- [ ] เลิกล่า/พักล่า: เขียน tests ทั้ง active และ stoppedHunting/huntBreakUntil สำหรับ k2activeoperations. เพิ่ม active-huntingpredicate ที่ตั้งใจใช้เฉพาะฉากลงงานจริง; ไม่เปลี่ยน hunter:true ทุกฉากจนคนเกษียณไม่มีเรื่อง
- [ ] k2PotionThief: เลือกแจ้งแล้วใช้สถานะพัก 3 เดือนจริง หรือปรับผลให้ตรงเจตนาที่บันทึก; ทดสอบก่อนครบ/ครบกำหนด, save/reload และ gateChoice/party ที่เกี่ยวข้อง
- [ ] adKidSchool: ใช้เวลาเกิดลูกตรวจวัยเรียน; test ลูก 1 เดือนต้อง false/ลูกวัยเรียนต้อง true; ทบทวนหลายลูก/รับเลี้ยงตามข้อมูลที่มี อย่าแต่งวันเกิดที่ไม่เคยมีแบบเงียบ ๆ
- [ ] k2CourseLater: unemployed ต้องไม่เจอหัวหน้า หรือได้ variant ที่ไม่อ้างนายจ้าง; employed ยังเกิดได้หลัง after ครบ
- [ ] k2Freeze: ไม่มี operationhistory ต้องไม่บอกลง D20 ครั้ง; รุ่นข้อความมือใหม่หรือเงื่อนไขประวัติจริง มี positivecase สำหรับคนที่ประสบการณ์ถึง
- [ ] เพิ่ม misfitrules ที่สัมพันธ์กับ metadata/สถานะจริง หรือเพิ่ม targetedtests ให้ครอบคลุมเหตุใหม่ ไม่เพิ่มเฉพาะรายชื่อสอง ID แล้วอ้างความต่อเนื่องทั้งเกม
- [ ] รัน probe หลังแก้ ดู output เปลี่ยนตามพฤติกรรมปลอดภัย แต่ห้ามแก้ observed.json เก่าให้ดูว่าตอน review ไม่เคยมี bug. เก็บ after-fix ผลต่างไฟล์พร้อม SHA

**Done:** ทั้ง 5 พฤติกรรมทำซ้ำเดิมไม่ผิดบริบทแล้ว และ positivecases ยังเปิดได้ ไม่ปิด event ทั้งชุดเพื่อให้ test เขียว

## Task D: ตรวจรับ story engine และ P1 แบบไม่ขยายขอบเขต

- [ ] ตรวจ validatorunknownkeys/unknownoutcomefields ตาม spec แล้วเพิ่ม negativefixture ที่สะกด go/rel ผิดให้ reject ก่อน play ไม่รอ silentno-op ใน runtime
- [ ] defensive stale-event test: หาก node/status ไม่ตรงต้องไม่มี money/stat/act/relationship/RNG เปลี่ยน; ตรวจ preflight ก่อน applyOutcome. ระบุว่านี่คือ hardening ไม่อ้างว่าพบ exploit ผ่าน UI แล้ว
- [ ] เปลี่ยน job/เมือง/คนตายขณะพักและก่อนเปิด node: คนเดิมไม่ถูก recast, ถ้า cast ไม่อยู่ยังมี authoredpath จบได้
- [ ] รัน paired-choice100seeds ตามเป้า handoff แยก normalstats กับ forcedstats ใน unitfixtures; รายงาน eligible/started/completed/dead/abandoned/waiting ทั้งหมด ไม่อ้าง helper เติม job ว่าเป็น naturalplaythrough
- [ ] ทำ save/reload กลาง office/friend, doubletap, partneralreadyMarried และ heirfriendfresh ให้ผ่าน
- [ ] ห้ามเพิ่ม NPC จำลองวัย/ระบบเมือง/เรื่องใหม่อีกหลายสิบสายเพื่อกลบ bug ก่อน P1 ผ่าน

## Task E: Gates ก่อนสรุป P1 พร้อม merge

รันจาก repo root และเก็บ exitcode จริง:

```bash
npm test
node tools/artcheck.mjs
node tools/linelen.mjs
node tools/lifecheck.mjs 200
node tools/playtest.mjs 200
node tools/sim.mjs 1000 --policy careful --seeds a,b,c,d,e
node tools/sim.mjs 1000 --policy normal --seeds a,b,c,d,e
node tools/sim.mjs 1000 --policy reckless --seeds a,b,c,d,e
npm run build
```

Browser:390px และ desktop, officecare/duty/gain, childfriend/partner/death, loadoldsave, unsupportedslot, inherit/split/loyalAlly, export/import และ unzipdownload เปิดจริง. แยก fixtureUIchecks กับ end-to-endplaythrough ในรายงาน

ใช้ reviewer ใหม่ตรวจ difffixes กับ review นี้ก่อนเสนอ merge ตามอำนาจที่ผู้ใช้ให้ใน session จริง. เอกสารนี้ไม่อนุมัติ merge/publish โดยตัวเอง

## รูปแบบส่งมอบครั้งถัดไป

| ID | Bug | Commit ที่แก้ | regressiontest | ผลก่อน→หลัง |
|---|---|---|---|---|
| R1 | newer-slot overwrite | กรอกจากผลจริง | กรอกชื่อจริง | แนบ bytes-preservationresult |
| R2 | missingmemberpersonId | กรอกจากผลจริง | ครบ 4entrypaths | canonicalID ไม่ซ้ำ |
| R3–R7 | บริบท event ค้าง | กรอกจากผลจริง | ทั้ง negative/positive | แยกทีละข้อ |

อัปเดต docs/HANDOFF.md ให้ชี้รายงานล่าสุดและบอก P1done/pending อย่างตรงไปตรงมา อย่าลบ historicalreview เพื่อทำให้เหมือนไม่เคยพบ bug

หลัง P1 ผ่านจึงเดิน P2 ตาม roadmap เดิม: life-arcs/focusqueue/relationshiprequests/fixedguild-familycast; ไม่ต้องถามเจ้าของซ้ำเรื่องที่ตัดสินไว้แล้ว เว้นขอบเขตใหม่เปลี่ยนทิศทางใหญ่
