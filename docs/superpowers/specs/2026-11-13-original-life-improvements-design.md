# Rift Ledger: ชีวิตที่เลือกเองและเรื่องที่จดจำ — Design สำหรับ Claude

13 พฤศจิกายน 2026 · ข้อเสนอออกแบบจากคำขอ Compare/แผนปรับปรุง · ไม่ใช่การอนุมัติให้เปลี่ยน balance หรือรวม main อัตโนมัติ

## เจตนาและขอบเขต

เจ้าของขอใช้ Superpowers เปรียบเทียบเกมกับ Way of Xian วางขั้นตอนละเอียดให้ Claude และย้ำว่าไม่ก็อปกับเนื้อเรื่องสำคัญ เป้าหมายของเอกสารนี้คือทำระบบที่มีอยู่ให้ผู้เล่นควบคุม เข้าใจ และจดจำผลได้ สเปกแม่ `2026-11-11-rift-ledger-redesign-design.md` ยังมีผล ข้อเสนอเพิ่มด้านล่างต้องไม่เปิดเผยความลับหรือทำเส้นทางคนธรรมดาด้อยค่า

**Required outcomes:** R1 กดอย่างตั้งใจ; R2 เซฟผลจริง; R3 การเตรียมตัวอ่านออก; R4 เรื่องเคารพสิ่งที่เลือก; R5 เห็นผลถึงคน/งาน/รุ่นถัดไป; R6 คงเอกลักษณ์และสมดุล; R7 UI/Art ช่วยอ่านเรื่อง; R8 มีหลักฐานทดสอบและส่งต่อได้

## แนวทางที่พิจารณา

1. ยก feature คู่เทียบมาเติม: ดูเหมือนเร็วแต่ซ้ำระบบเดิม เสี่ยงเสียเอกลักษณ์และความซับซ้อนสูง ไม่เลือก
2. เขียน core/UI ใหม่: boundary สะอาดแต่ทำเซฟ/seed/content เสี่ยงและเลื่อนการแก้ UX ไม่เลือก
3. **แนะนำและใช้เป็นแนวทางของแผน:** ปรับ trust → decision surface → narrative continuity → validation แบบย่อย ใช้ `optionView`, operations, stories/team/heir hooks เดิม เพิ่ม projection/schema เล็กเท่าที่จำเป็น ไม่มี migration ใหญ่โดยไม่มี fixture

นี่เป็นคำแนะนำผู้จัดทำภายใต้งานวางแผน ไม่อ้างว่าเจ้าของอนุมัติค่าตัวเลขใหม่ทุกตัว

## Global constraints

- ใช้ JavaScript ESM, Node test runner, esbuild และ DOM เดิม; ไม่เพิ่ม frontend framework/บริการออนไลน์ในรอบนี้
- ภาษา UI เป็นไทย; class/skill/item names คง English ตามสเปกแม่
- ห้ามเปิดเผยเพดานลับ เงื่อนไขลับ คลาสหายากที่ยังไม่รู้ และค่าภักดีจริง รวมถึงผ่าน accessibility labels/exported UI snapshots
- Preview/read-only rendering ห้ามกิน RNG, เปลี่ยน state, เปิด event หรือให้ reward
- Save เก่า v2/sv1–2 ต้อง migrate ได้; version ใหม่กว่าที่รองรับต้องปฏิเสธโดยไม่เขียนทับ
- ต่อชีวิตใช้ named RNG streams เดิม; ไม่ใช้ wall-clock เป็น game outcome
- ไม่เปลี่ยนสูตร rank/combat/loot/เศรษฐกิจ/อายุโดยแฝงใน UX PR
- ไม่คัด code, art, sound, text, plot หรือ balance constants จากคู่เทียบ; ไม่ commit HAR/raw responses
- งานนี้เป็นแผน ไม่ติดตั้งระบบตามแผนในรอบเอกสาร

## A. Trust: ผู้เล่นเป็นผู้ตัดสินใจและข้อมูลไม่หายเงียบ

รับ fix98e5332 หรือ equivalent ก่อน: Stop/1× และ migration ครั้งเดียว; ยืนยันด้วย fresh/old/explicit-auto profiles

ใช้ control-context เดียวสำหรับ input/clock: modal, ผู้เล่น pause, editable field, pending event โดย pending event ยังรับ intentional choice ได้ หน้าของ/ทีม/ตัวฉันพัก **automatic advancement** ขณะอ่าน/จัดของ กลับ log/world/book/work ใช้กฎที่ระบุชัดใน plan; ไม่ reset pause ที่ผู้เล่นตั้งไว้ การกดเลือกเกิดตอน activation ที่สมบูรณ์ ไม่มี touchstart commit ใช้ event identity ป้องกันตัวเลือกเปลี่ยนกลาง gesture

Save adapter รายงาน error ตามจริง. backup+primary เป็นหลาย localStorage keys จึงไม่เรียก atomic transaction. สำรอง last-known-good ก่อน replace, ถ้า backup ล้มเหลวไม่ replace primary, validate+roundtrip ก่อน write, failureไม่กล่าวว่าสำเร็จ. Import ใช้เส้นทางเดียวกับ save และต้องยืนยัน slotที่มีข้อมูล. Delete active slot ปลด association หลังลบสำเร็จ; เมื่อออกเมนูต้องไม่สร้างกลับเอง.

Checkpoint เมื่อเริ่มชีวิต/ตัดสินใจจบ/operationจบ/ตายหรือเริ่มทายาท หลัง mutation ทั้ง action รวม fx เสร็จแล้ว ไม่ save ค้างครึ่ง callback; annual save ยังอยู่ ห้าม silently overwrite slotที่ไม่ใช่ active หรือเพิ่ม cloud. ถ้า full slots ให้ผู้เล่นเลือก/เล่นชั่วคราวพร้อมสถานะชัด

## B. Decision surface: อ่านโลกผ่านชีวิตฮันเตอร์

ใช้โครง “สถานะตอนนี้ → เรื่องที่รอ → สิ่งที่เลือกได้ → ผลที่เกิดแล้ว” สร้าง UIจาก safe projection ไม่ bind outcome ทั้งก้อน

มือถือ (แนวคิดการจัดวาง ไม่ใช่ mockup ตามคู่เทียบ):

```text
ชื่อ · อายุ · สุขภาพ · เงิน       [หยุด/เล่น]
เรื่องที่กำลังรอคำตอบ
[ทางเลือก + เงื่อนไขที่รู้ + โอกาสเดิม]
[แผนเดือนนี้]   [เตรียมตัว]   [อ่านเรื่องที่ผ่านมา]
ฉาก/บันทึกที่ผ่านมา (เลื่อนอ่านได้)
แท็บหลัก
```

At 390×844 monthly plan หรือปุ่มเปิดต้องอยู่ใน first viewport แม้ log600แถว; 320×568 ต้องไม่ overflowและเปิดได้โดยไม่ไล่ผ่านlogทั้งหมด. touch areasตั้งเป้า44 CSSpx, ไม่อ้าง28pxผิดWCAGอัตโนมัติ. keyboard native semantics, visible focus, dialogfocus, in-modal messages, reduced-motion CSS และstage opt-inตามAPIจริง. อ่านไทยบน smallscreenและข้อความยาวจริง; iconเสริมtext ไม่ใช้สีอย่างเดียว.

ใบภารกิจใช้ offersเดิม: ชื่อภารกิจ/ประเภท, rewardที่ประกาศ, skill slots, rolesที่ขาด, สุขภาพ, consumablesที่ผู้เล่นรู้, แผนและเกณฑ์ถอยจริง. ป้ายriskแยก “ประมาณการอันตรายถึงชีวิต” จากโอกาสสำเร็จ; estimateRisk0 ไม่หมายถึงไร้แผล/ค่าเสียเวลา. คง combat/loot engine. ไม่สร้าง chanceใหม่จากอัตราชนะเกมเขา.

## C. Narrative: เหตุผล → การเลือก → ผลทันที → ผลตามมา → มรดก

### มาตรฐานบท

ทุก arc มี promiseหนึ่งประโยค, คนที่ต้องการบางอย่าง, conflictที่มีเหตุผลอย่างน้อยสองฝ่าย, ทางเลือกไม่ใช่ดีฟรี/เลวเสียเงินฟรี, immediate consequence, delayed callback, closureและผลต่อโลก/คน. ความล้มเหลวต้องเดินเรื่องได้หรือปิดทางอย่างสมเหตุผล ไม่ส่งกลับให้กดซ้ำรับรางวัล. เรื่องคนธรรมดาต้องมี agencyและจบครบโดยไม่ตื่นพลัง

บันทึกการเลือกเป็นข้อมูลแยกจาก prose/log. Stable arc/node/choice/cast IDs; completed resolution != chapteropened. ไม่ดึงค่าที่ซ่อนมาเป็นtooltip. unknown pastของsaveเก่าห้ามแต่งว่าผู้เล่นเคยเลือกแล้ว. actorตาย/ออกทีม/ผู้เล่นเปลี่ยนอาชีพต้องมี route pause/closure/fallbackที่เขียนไว้. จัดผลต่อรางวัลกับเนื้อเรื่องให้ตรงกันโดยเฉพาะ N-01/N-02.

### Pilot ต้นฉบับที่เสนอ (ชื่อชั่วคราวของเรา ไม่ใช่พล็อตจากคู่เทียบ)

**“ชื่อที่ไม่อยู่ในบัญชี” — คนธรรมดา/งานสำนักงาน:** รายการชดเชยหลังเกตแตกไม่มีชื่อพนักงานส่งของที่อยู่ในพื้นที่ ผู้เล่นต้องจัดการหลักฐานที่ขัดกัน ภาระครอบครัวของผู้สูญหาย และกำหนดส่งบัญชี ตัวเลือกไม่ตีตราว่าเลือกผิดเพราะไม่เสี่ยงงาน: ขอทบทวนอย่างเป็นทางการ / ช่วยรวบรวมหลักฐานนอกเวลางาน / รับรองเฉพาะสิ่งที่ตรวจได้ ต่างมีต้นทุนและจุดจบ ต้องไม่ใช้เหตุการณ์นี้ซ้ำกับ office insurance chain เดิม; ผู้เขียนตรวจ `careers.js` ก่อนและเปลี่ยนรายละเอียดที่ทับซ้อน.

**“สัญญาณหลังการปิดเกต” — ฮันเตอร์/ทีม:** หลังทีมถูกสั่งถอน มีสัญญาณขอความช่วยเหลือที่ยืนยันตัวบุคคลไม่ได้ อุปกรณ์สื่อสารและเวลาของทีมกู้ภัยเป็นข้อจำกัด ผู้เล่นเลือกส่งข้อมูลให้สมาคม / จัดการค้นหาภายใต้ขีดจำกัด / ปิดปฏิบัติการพร้อมหลักฐาน ทุกทางต้องมีเหตุผล มีลูกทีมที่เห็นต่าง และบทตามมาที่จำสิ่งที่ทำจริง ไม่มีห้องลับ/รางวัลใหญ่การันตีเพราะเลือกเสี่ยง.

pilotแต่ละเรื่อง: 4 nodesหลัก (เริ่ม/เลือกท่าที/ผลตามมา/คลี่คลาย), อย่างน้อย2closuresที่มีความหมาย, 1failure-forward, 1pause/resume, 1cast-unavailable route; branchไม่จำเป็นต้องสร้างครบbinarytree. ตั้ง reward budgetจากระดับอาชีพ/เกตของเราใน phase D ไม่กำหนดเงินจากคู่เทียบ. ทั้งคู่ไม่บังคับให้เกิดในทุกชีวิต.

**ข้ามรุ่น:** ให้ tokenความทรงจำไม่ใช่แจกบัฟ: บทส่งต่อหนึ่งข้อความ+ทางตอบที่ไม่มี reward สำหรับแต่ละ pilotในรุ่นลูกเมื่ออายุ18 ถ้าผลนั้นถูกเห็นจริง. ไม่ยก actorที่ตายให้มีชีวิตอีก ไม่รับมรดกความรู้ลับ/questconditions. ผู้เล่นตายกลางarc ให้จบเป็นเรื่องค้างตามหลักฐาน ไม่จำลองการเลือกแทน.

### Data boundary และ migration

เพิ่ม namespace `narrative` พร้อม schema migrationหลังphaseA. ความจำแบ่ง runtime (active progress/cast/resolved ids) กับ journalสำหรับอ่าน; display historyจำกัด120รายการ, inherited public memoriesจำกัด8 โดย preserve unresolved arcsแยก. สมมติฐานตัวเลขเป็นเพดานข้อมูลที่เสนอ ไม่ใช่ balance. team-specific story stateอยู่บนmember.idไม่ใช้globalflagชื่อเดียว. leaveUntilMแยกจากhurtUntilM. ไม่เปลี่ยน counterของchainเก่าโดยไม่ migrationและtest.

Journalแสดงเฉพาะสิ่งที่รู้จริง: เรื่องที่เคยพบ คนที่พบ ผลที่เลือก ชื่อบทปัจจุบันและเหตุให้รอที่รู้ได้. ไม่โชว์futuretitles, จำนวนendingลับ, rosterลับหรือเวลาspawnแน่นอน. สรุปชีวิตใช้publicmemoriesที่เห็นแล้ว ไม่กลายเป็นwikiเฉลย.

## D. Validation และ release gates

Aผ่านก่อนเปิดใช้ใหม่; narrativeaudit/editorialทำขนานกับAได้; B/Cออกเป็นPRแยก; C pilotต้องผ่านก่อนขยายระบบใหม่. 198testsคือbaselineครั้งก่อน ไม่ใช่จำนวนที่ต้องหยุดเพิ่มหรือหลักฐานใหม่ในรอบแผน.

Gate A: UX-01/02/03/05/07/08/09/11/12/13/14มีregressionsตามscope; ไม่มีfalse-save/ghostchoice/active-slot resurrection.
Gate B: UX-04/06/10, 3viewports, fontสูงสุด, mobilelonglog; previewไม่เปลี่ยนRNG/state; labelretreatตรงengine.
Gate C: N-01/N-02แก้; pilotทั้งสองทุกnode/closure/reload/pause/cast-deathมีทางทดสอบ; secretleak0; storyflagsไม่ปนคน; no-rewardduplicates; inheritanceเฉพาะpublicfacts.
Gate D: existingtests, artcheck, linelen, build, simulation3policies×5seedsets, playtest200และมนุษย์อ่านบท; เจ้าของได้รับไฟล์เกมที่ทดสอบตรงcommit. ไม่ประกาศ “สนุกขึ้น”จากbotเพียงอย่างเดียว.

## ที่ยังไม่ทำ

point-buycreation, cultivation, เปลี่ยนcombatformula, MMO/cloudlogin, NPCsocialsimulationทั้งโลก, auction/craftingrewrite, วาดassetsทั้งหมดใหม่. ประเมินหลังpilotและtrustผ่าน หากต้องเพิ่มภาพให้ClaudeลงartrequestตามAGENTS แล้วทำoriginalartของเรา
