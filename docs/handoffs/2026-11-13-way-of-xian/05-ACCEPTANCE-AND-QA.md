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
