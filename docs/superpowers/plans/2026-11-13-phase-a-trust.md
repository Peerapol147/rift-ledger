# A — Control and persistence trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Executor: Claude; this handoff does not start implementation or authorize merging.

**Goal:** เลือกโดยตั้งใจและบันทึกผลอย่างเชื่อถือได้ก่อนเพิ่มเนื้อหา

**Architecture:** แยก control context/settings และ persistence results ออกจาก main.js เท่าที่จำเป็น รักษา core outcomes และ save key เดิม สร้าง browser assertionsจาก diagnostic ที่มีแล้ว

**Tech Stack:** JavaScript ESM, Node `node:test`, esbuild, DOM; isolated Chromium/Playwright for interaction checks.

**Spec:** [Original life improvements design](../specs/2026-11-13-original-life-improvements-design.md). Also read [roadmap](2026-11-13-improvement-roadmap.md), original redesign spec and `AGENTS.md`.

## Global Constraints

- ภาษา UI เป็นไทย; class/skill/item names คง English ตามสเปกแม่
- Preview/read-only rendering ห้ามกิน RNG, เปลี่ยน state, เปิด event หรือให้ reward
- ไม่เปลี่ยนสูตร rank/combat/loot/เศรษฐกิจ/อายุโดยแฝงใน UX PR
- ไม่คัด code, art, sound, text, plot หรือ balance constants จากคู่เทียบ; ไม่ commit HAR/raw responses
- ใช้ constraints ทั้งหมดใน design; baseline98e5332ยังไม่ใช่main. Testsต้องพิสูจน์ behavior ไม่ใช่ snapshot implementation อย่างเดียว

## Review Focus

1. Corrupt/unknown config และ explicit auto preferences — A1.
2. Touch cancellation/DOMเปลี่ยนระหว่างgesture/nativeSpace/modalshortcut — A2.
3. Partially failed backup/primary/delete/import และfuture schema — A3.
4. Pending operation/active deletion/slotfull/newborn reload — A4.
5. Text focus/IME/importdraft/error feedbackในmodal — A2/A4.

---

### A1: ตรึง baseline และ normalize settings

**Files:** Create `src/ui/config.js`, `test/config.test.mjs`; modify `src/ui/main.js`, `src/ui/layout.js`.
**Interfaces:** `readConfig(raw:string|null)->{speed,policy,fs,manualDefaults}` pure; `SPEED_SECONDS` shared map; `writeConfigValue(config)->string` JSON serializer. Consume baseline migration `manualDefaults:1`; produce settings usable by dropdown/keyboard/loop.

- [ ] เขียน tests fresh/`null`/array/string/brokenJSON/unknownpolicy/fsนอกFONT; expected speed1/stop/fs2. old important/skip without marker resets; marker1 with validexplicitpolicy stays. Only [1,2,4,8] accepted for this release; saved16 normalizes1.
- [ ] Run `node --test test/config.test.mjs` ให้ failด้วยbehavior/ขาดAPIที่คาด แล้วทำ normalize; drop16 buttonและkeyboard ceilingด้วยsharedkeys (ไม่เดาค่าระยะเวลา16ใหม่).
- [ ] Retest พร้อม assertทุกspeedมีfinitepositive interval; migrateครั้งเดียวผ่านsaveCfgเดิม ไม่ลบslot/book/bgm.
- [ ] Commit `fix: normalize manual-first controls and supported speeds` เฉพาะfilesงานนี้.

### A2: Intentional activation, dialog isolation and live views

**Files:** Create `src/ui/control-context.js`, `tools/ux-regression.mjs`; modify `src/ui/main.js`, `src/ui/settings.js`, `src/ui/dom.js`, `src/index.html`. Browser scripts use `PLAYWRIGHT_MODULE` / `CHROMIUM_PATH` env; no dependency in production bundle.
**Interfaces:** `canAutoAdvance({paused,settings,tab,editing})->boolean`; pausesfor tabs `me/items/team`, settings, editing or explicitpaused; others allow unlesspaused. `canUseGameShortcut({settings,editing,onControl})->boolean`. UI-only event revision increases whenever pendingevent changes. No core mutation in helpers.

- [ ] Port targeted auditrepros to assertions (not full script snapshots): touchStart+touchCancel nochoice; pointerdownonE1 then eventrevisionchange beforeclick cannot chooseE2; onecomplete tap/Enter/Space => exactlyonechoice. Use realcorefixture and compare save/log/event.
- [ ] Implement activationoncompletedclick, pointergesture associatedwithrevision; removechooseonpointerdown. Guardkeyboard numbers/A/Space/+− whilemodal/editor/interactivecontrol; eventpendingstillaccepts deliberatechoice whencontextallows. NativebuttonSpace/Enterleftnative; no duplicatedkeydown+clickdispatch.
- [ ] Modal role/aria-modal/initialfocus, Tab/ShiftTabcontainment, inertbackground, Escclose/returnfocus; nestedconfirm restorereturnswithinparent. Assertions backgroundeventunchanged on1 andtabfocusinside.
- [ ] Preserveeditinginput/selection/IME; updateactionbuttons immediately afterequip/sell/lock/use. Refine render exemptiontoactualeditor instead of entirefocusedview. `importText` reflects draft acrossfontchanges. Assertnohiddenimportmismatch; timeoutnoticeexpireswhilepaused usingUIclock.
- [ ] Assertviews me/items/team pauseautomaticadvancement, returninglog resumes onlyifuserwasnotpaused; manualpausedneveroverwritten. Run `node tools/ux-regression.mjs --group input --base-url http://127.0.0.1:5183/play.html` againstfreshbuild/isolatedprofiles. Implement theseCLIflagsinthisscript.
- [ ] Commit `fix: isolate input and preserve intentional decisions` after allassertionspass.

### A3: Save outcomes, validation and replace safety

**Files:** Modify `src/core/save.js`, `src/ui/dom.js`; create `test/save-integrity.test.mjs`; update `test/save.test.mjs`, `test/save-versions.test.mjs` and any testadapterfound by `rg 'C.slots|slots\(' test`.
**Interfaces:** Keep `deserialize(str)->State|null`, `slots.load/list/exportStr`; add `slots.inspect(i)->{status:"ok"|"empty"|"future-version"|"corrupt",state?:State}`. `load` returns null for future-version primary even if supported backup exists; load UI presents blocked reason and never associates active slot. Change save/import/del to `Result={ok:true}|{ok:false,code:'invalid'|'future-version'|'backup-failed'|'write-failed'|'delete-failed'}`. Adapter `get->string|null,set->boolean,del->boolean`; synchronizeallcallersinA4 beforeintegration. Add `validateSave(raw)->{ok:true,state}|{ok:false,code}` for parse→version→migrate→validate. NoHTMLinerrorcodes.

- [ ] Redtests: primarywritefalse/throw, backupwritefalse, corruptedprimarywithvalidbackup, invalidminimalHAR-reportpayload, futureversion, nullnestedfields, malformedop/ev; oldsv1/2realfixtures and mid-op validloadmustpass. Assertfailedimport leavesoldslotandbackupbyte-identical. Errorsneverprintsavecontents. **Future-primary + old-valid-backup** must stay blocked: no automatic fallback/autosave replacement. Backup recovery allowed only for corruption, never unsupported newer version. Explicit user-directed export/replacement is a separate confirmed flow.
- [ ] Validate requiredstatefromnewLife and allcurrentoptional-systemschemas; rejecttype-invalidrequiredrecords, missingflags/c/st/r/world/log, wrongnestedarrays, nonfinite or invalidenum/referencewhereconsumed; legitimateunreleasedfields mustnotbe invented. Keepexistingcompat sanitation withtests ratherthan rejectingallolderexports. Runtime-generatedeventoptionsmustnotrequiremembershipinEVENT_INDEX.
- [ ] Serializevalidatedcopy beforewrites. Ifexistingprimaryvalid: writebackupfirst andstopifitfails; ifprimaryinvalidpreserveexistingvalidbackup. Thenwriteprimary. Avoidwritingempty/invalidbackupovergoodone. Noatomic/crash-proofclaimacrosskeys. For delete primary first, thenbackup; partialfailure returnsfalse and keepsUIattached untilretry succeeds.
- [ ] Run `node --test test/save*.test.mjs`; testsave→deserialize→advance/choose forinfant/adult/hunter/operation/dead/heirwithoutfallbacktonewLife. `rngState` equivalenthereis `s.r`: assertpreserved.
- [ ] Commit `fix: report persistence failures and validate replacements` withcoretests green; A4requiredbeforeshipping changedreturncontracts.

### A4: Slot lifecycle, checkpoints and visible recovery

**Files:** Modify `src/ui/main.js`, `src/ui/settings.js`, `src/index.html`, `tools/ux-regression.mjs`; create `src/ui/persistence.js`, `test/persistence.test.mjs`.
**Interfaces:** `persistActive({slots,slot,state})->Result` returnsfailureifslot<0withoutwrite; UIcontrollerownsassociationandconfirmation. ConsumeA3Result; never changeactiveassociationonfailedwrite. Checkpoint dispatcher runs once afteraction+fx state settles; annual fx andactionfinish shareone pending checkpoint perlogicalaction.

- [ ] Assert nofalse-success banneronblockedstorage; error isvisibleinsidecurrentmodal, retrybuttoncallswriteagain, exportcurrent state availableevenifslotwritefails (do not exportstale slotasrecovery).
- [ ] Confirmoverwrite/importintooccupiedslot anddelete withname/slotshown; cancelmakesnowrites. Successfuldeleteactiveslotsetsui.slot=-1; quit/annualcheckpointdoesnotrecreateit. Partialdeletefailure showsrecoverablefailureandkeepsassociationuntilretry; tests inspectprimary+backup loadpath.
- [ ] Checkpoint initialnewLife, successfulmanual/fatechoice includingoperationdecide, operationfinished, death, andnewheir; saveonlyaftercurrentmutation+fxcomplete. Test reloadbeforefirstyearretainslife; reloadpendingdecisionandmidoperationresumesexactly; nochoice/rewardduplication.
- [ ] Define slotfull: showpersistent “ยังไม่มีช่องบันทึกสำหรับชีวิตนี้”; noimplicitoverwrite. Failedcheckpointdoesnotpauseplayerforeverorclearcurrentlife; showunsavedstatusuntilsuccess/export. Do notautofilldeletedslotwithoutuserSave.
- [ ] Run `node --test test/persistence.test.mjs test/save*.test.mjs`, buildand `node tools/ux-regression.mjs --group persistence --base-url http://127.0.0.1:5183/play.html`; runrepoAchecksfromroadmap.
- [ ] Commit `fix: checkpoint decisions and make save recovery visible`. Record fixed UX IDs withcommit/testresults; do notmarkallUXclosed.
