# Roadmap สำหรับ Claude — ปรับ Rift Ledger โดยรักษาเรื่องและเอกลักษณ์

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. เจ้าของขอเอกสารให้ Claude; ยังไม่เริ่ม implementation ในงานรอบนี้

**Goal:** ควบคุมได้ เซฟเชื่อถือได้ การเตรียมตัวอ่านออก และเรื่องจำการเลือกโดยเป็นผลงานต้นฉบับของเรา

**Architecture:** Incremental changes บน existing core/UI; phase A/B/C แยกงานที่ทดสอบได้. Narrative audit เริ่มทันที ไม่รอ UI เสร็จทุกอย่าง; story pilots เป็น release gate ก่อนขยายระบบใหม่.

**Tech Stack:** JavaScript ESM / Node tests / esbuild / DOM / isolated browser diagnostics.

**Spec:** [Design](../specs/2026-11-13-original-life-improvements-design.md) · [Compare](../../research/rift-ledger-vs-way-of-xian.md) · [Research](../../research/way-of-xian-code-analysis.md).

## Global Constraints

อ่าน Global constraints ใน design และแต่ละ phase. เจ้าของย้ำ **เนื้อเรื่องสำคัญ** และ **ไม่ก็อปเกมเขา**. บทพูด ภาพ สูตรและcodeต้องออกแบบจากRift Ledger; ใช้คู่เทียบเพื่อถามคำถาม ไม่ใช้เป็นlibrary.

## Review Focus

1. Mainยังไม่มีfix98e5332: reconcilebranchก่อนทำA ไม่ทำซ้ำblindly.
2. Savecompat+futureversionมีความเสี่ยงถึงข้อมูล: A3/A4ต้องไปด้วยกัน.
3. Chapteropenedไม่เท่ากับchoicecompleted: C2ห้ามinferอดีตจากcounter.
4. คนธรรมดาต้องได้storyclosure: C0/C3เป็นmandatory, ไม่ตัดเพราะไม่มีcombat.
5. หลักฐานbrowser/HARไม่ได้พิสูจน์backendหรือทุกdevice: Dระบุข้อจำกัดตามจริง.

## เริ่มที่นี่

- [ ] Read `AGENTS.md`, `CLAUDE.md`, `docs/HANDOFF.md`, specแม่, comparisonและdesignนี้.
- [ ] Fetchlatestremote และrecordactualbase. Referenceworkingcommit98e5332มีmanual-default/musicfix; remote mainตอนวางแผน65e5621. Adopt equivalentchanges once, preserveownerfiles/saves. อย่าresetงานอื่นหรือเอาbuildเก่ามาส่งแทน.
- [ ] Reviewscopeกับคำขอเจ้าของที่มีอยู่; newgameplay/balanceproposalต่างจากspecแม่ให้บันทึกก่อนลงมือ. งานที่อนุมัติแล้วไม่ถามซ้ำเป็นขั้นตอนพิธีการ.
- [ ] Runbaselinecommandsและcaptureknownwarnings; diagnosticreportsก่อนหน้าคือหลักฐานเก่า ไม่ใช่ผลรันรอบใหม่.

## งานและ dependencies

| ชุด | Deliverable | ก่อนเริ่ม | เหตุผล/ความเสี่ยง |
|---|---|---|---|
| [A](2026-11-13-phase-a-trust.md) | settings/input/modal/slot/checkpoint | baseline reconciliation | กันเลือกแทนและเสียเซฟ; persistenceAPIต้องแก้callerครบ |
| [C0](2026-11-13-phase-c-narrative.md) | auditเรื่องเดิม+originalpilotbible | ทำได้ทันทีพร้อมA | ป้องกันเพิ่มเรื่องผิดเหตุผล; ให้เวลางานเขียนจริง |
| [B](2026-11-13-phase-b-decisions.md) | mobiledecisionlayout+briefing+publicchoiceinfo | A1/A2 | ใช้stateจริง; ไม่เปลี่ยนสมดุลหรือเปิดsecret |
| [C1–C2](2026-11-13-phase-c-narrative.md) | storycausality+resolution/journal | A3/A4+C0 | migrationและpendingdecision/duplicateeffects |
| [C3–C4](2026-11-13-phase-c-narrative.md) | 2originalarcs+publicheirmemory | C1/C2 และ Bเพื่ออ่านผล | ต้องtestทั้งทางเลือกและบท ไม่ใช่มีเนื้อหาแล้วจบ |
| [D](2026-11-13-phase-d-validation.md) | regression/simulation/readthrough/releaseevidence | candidateA/B/C | ห้ามอ้างสนุกขึ้น/ผ่านทั้งหมดก่อนมีหลักฐาน |

```mermaid
flowchart LR
  Base[ตรวจฐานโค้ด] --> A[การกดและเซฟ]
  Base --> C0[ตรวจบทเดิมและเขียนบทต้นฉบับ]
  A --> B[ข้อมูลและหน้าตัดสินใจ]
  A --> C12[ความจำเรื่องและผลของการเลือก]
  C0 --> C12
  C12 --> C34[เรื่องคนธรรมดา ฮันเตอร์ และมรดก]
  B --> C34
  C34 --> D[ทดสอบระบบและอ่านเรื่องทุกทาง]
```

## ขอบเขต releaseแรก

ต้องมี: false-save/accidentalchoiceแก้, manual-defaultretained, mobileplanreachable, narrativeN01/N02แก้, journalจริง, pilot2เรื่องมีจุดจบและpublicheircallback. หากต้องลดงานให้เลื่อนartใหม่/online/NPCgrowth/สูตรใหม่ก่อน **ไม่ตัดเรื่องคนธรรมดาหรือcallbackเพื่อทำหน้าจอสวยอย่างเดียว**.

ไม่กำหนดวันส่งจากจำนวนไฟล์. ประเมินหลังAและC0เมื่อเห็นจำนวนregressions/routecontradictionsจริง. แต่ละtaskเป็นreviewablecommit; executeonephaseแล้วสรุปผลก่อนขยาย ไม่เรียกแผนนี้ว่าของเสร็จ.

## Traceability: ทุกข้อมีเจ้าของงาน

| Requirement/finding | งาน |
|---|---|
| UX01/14 false-save, malformedimport | A3,A4 |
| UX02/03/07 accidentalinput/modal/nativebutton | A2 |
| UX04/08/09 staleview/draft/feedback | A2,A4,B1 |
| UX05/13 delete/destructiveflow | A3,A4 |
| UX06/10 mobileplan/targets | B1 |
| UX11/12/15 speed/config/manualdefault | A1; preservebaselinefix |
| R3 briefing/secretvisibility | B2,B3 |
| N01/N02 loan/leave contradiction | C0,C1 |
| N03 resolutionvsopened/history | C2 |
| N04 storynotafterthought | C0 startsparallel; C3/C4mandatory |
| R4/R5 storyagency/callback/civilian/heir | C0–C4 |
| R6 originalidentity/noformula-copy | allphases + D3 |
| R7 readableart/text/mobile | B1/B3/D2 |
| R8 reproducibleevidence | D1–D3 |

## Review และสถานะส่งมอบ

Independent builder-checkตามSuperpowersตรวจdesign+comparisonและsourceที่เกี่ยวข้องแล้ว ไม่พบblockerหลัก และย้ำให้เพิ่มfuture-saveprimary+oldbackupregressionในA3. การreviewนี้ไม่ใช่การตรวจimplementationหรือรับรองว่าphaseplansถูกimplementแล้ว. ผู้จัดทำ self-reviewแผนเรื่องcoverage/API/dataflow/link.

สิ่งที่ยังต้องตัดสินจากหลักฐานภายหลัง: full NPCgrowth, combatrebalance, craftingdepthและonline. แผนนี้ไม่ยืมตัวเลขคู่เทียบมาอนุมัติแทนเจ้าของ.
