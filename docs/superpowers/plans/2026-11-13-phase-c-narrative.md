# C — Narrative continuity and original story pilots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Executor: Claude; this handoff does not start implementation or authorize merging.

**Goal:** เรื่องจำการเลือกและตัวละครเดิม มีชีวิตคนธรรมดาและฮันเตอร์ที่จบอย่างมีความหมาย

**Architecture:** แก้storyfactsรายสมาชิกก่อน เพิ่มstructuredresolutionและjournalแบบไม่สปอยล์ แล้วใช้adapterเล็กสำหรับ2pilot arcs โดยไม่rewrite85legacychapters

**Tech Stack:** JavaScript ESM, Node `node:test`, esbuild, DOM; isolated Chromium/Playwright for interaction checks.

**Spec:** [Original life improvements design](../specs/2026-11-13-original-life-improvements-design.md). Also read [roadmap](2026-11-13-improvement-roadmap.md), original redesign spec and `AGENTS.md`.

## Global Constraints

- ภาษา UI เป็นไทย; class/skill/item names คง English ตามสเปกแม่
- Preview/read-only rendering ห้ามกิน RNG, เปลี่ยน state, เปิด event หรือให้ reward
- ไม่เปลี่ยนสูตร rank/combat/loot/เศรษฐกิจ/อายุโดยแฝงใน UX PR
- ไม่คัด code, art, sound, text, plot หรือ balance constants จากคู่เทียบ; ไม่ commit HAR/raw responses
- ใช้ constraints ทั้งหมดใน design; baseline98e5332ยังไม่ใช่main. Testsต้องพิสูจน์ behavior ไม่ใช่ snapshot implementation อย่างเดียว

## Review Focus

1. ปฏิเสธเงินกู้/สมาชิกสองคน/เซฟเก่าที่ไม่ทราบอดีต — C1.
2. Pendingchoice reload/doubleactivation/counteropenedbutunresolved — C2.
3. เปลี่ยนอาชีพ/ลูกทีมตายหรือถูกไล่/ตายกลางเรื่อง — C3/C4.
4. Journalclip120/unknownlegacy/futureending/hiddenloyalty — C2/C3.
5. ทายาทรับความทรงจำซ้ำ/ปลอมreward/เด็กรู้ความลับพ่อ — C4.

---

### C0: Narrative audit และ story bible ทำพร้อม phase A

**Files:** Create `docs/narrative/continuity-audit.md`, `docs/narrative/pilot-bible.md`, `tools/story-check.mjs`; inspect `src/data/stories/careers.js`, `hunters.js`, `src/data/team-stories.js`, `src/data/events/`, `src/core/stories.js`, `team.js`, `heir.js`. No rewritingallcontent.
**Interfaces:** Bibletable columns `arcId, promise, cast, nodeId, publicTrigger, choiceId, immediate, delayed, closure, absenceRoute, inheritedPublicFact`. `node tools/story-check.mjs` readsourdataandreturnsnonzeroonmissingID/danglingtarget/unreachableclosure; nostorysourcefromHAR.

- [ ] Inventory12career+5hunterchains and8teamtemplates; listwhichchoiceconditionsareactuallyreadlater; classify “มีcallback / ผลระยะสั้น / ขัดแย้ง / ยังไม่ได้ตรวจ”. Readtext—notjustcountflags. PrioritizeN01/N02andcareerchoiceirreversibility.
- [ ] Writeoriginalpilotbibleusingdesignbriefs. Checkoverlapwithoffice-insuranceexistingchain; ifsameconflict/outcome, changecontact/evidence/problemratherthanrenamingstory. Storyrewardproposalsmustuseourunitsofplay; initialpilotaddsnogold/stat/fame/loot/awakening/oddsbonus, onlypublicstoryfactsandexistingteamloyaltyorhealth-mind effectsifexplicitlybudgetedbelow.
- [ ] **Pilot balance budget for this slice:** allpilotoutcomes changeonlynarrativefacts/journal; hunterpilotmaychangeboundmemberloyaltyby−3/0/+3 pernode, atmost±6netperarc; civilianpilotmaychangemindby−2/0/+2 pernode, atmost±4netperarc. NoHP/death/money/itemrewards. Valuesareourproposededitorialprototypebudget, notcopiedconstants; consequencesarewhohelps/whatbecomespublic/whichclosure, notprofitoptimization. PhaseDmayproposechangingbudgetinseparatebalancePR.
- [ ] Humanreadthroughforbelievablemotivation, two defensiblechoices, failure-forward, tonalconsistencyandcivilianagency. Write all4nodeswithimmediate+delayedresponses, 2closuresand1absenceclosureeach beforecontentcode. Storylengthmustfitcards; longdetailbehindreadmorewithouttimelimit.
- [ ] Commit `docs: define original story pilots and continuity contracts`. C0isnotblockedbyAimplementation, butruntimechangesC1+dependonA3validation.

### C1: Repair teammate debt and leave causality

**Files:** Modify `src/core/team.js`, `src/data/team-stories.js`, `src/core/save.js`, `src/core/state.js`, `src/ui/tabs/team.js`; create `test/team-continuity.test.mjs`.
**Interfaces:** Addmember `storyFacts:{loan?:{principal:number,repaid:boolean}}`, `leaveUntilM:number` default0. Export `availableTeam(s)->Member[]` usesalive + hurtUntilM<=ageM + leaveUntilM<=ageM; teamRoles/teamPower/loseAllyuseit. Outcomeactions routeviaexisting`evMember`; newstoryact IDs do notchangeglobalflags.

- [ ] Failingtests: refusefirstloan→finalnodecannotaward3000; lend3000→exactlyoneprincipalrepayment≤3000; forgive→no repayment butexistingpubliceffect; m1loanmustnotunlockm2; future/repeatedresolutiondoesnotpaytwice.
- [ ] Addper-memberfactsonsuccessfulactualchoice, notwhenchapteropens. Buildthirdchapterbasedonfact; no-debtvariantmustnotcallitrepayment. Forlegacyunknownloan, neutralclosurewithnorefundorfalseclaim; neverinferloanfromm.storyorlogs. Persistpendinglegacychoicesnormallysofuturelendcanberecorded.
- [ ] Leavechoice sets `leaveUntilM=s.ageM+1`; recordstatedone-monthabsence; absentmemberexcludedfrompower/roles/losetarget immediately, availableagainatboundary, wagesunchanged(salaryleave). No injuryvisuals. Testhurtandleaveindependentandmemberdieswhileawaydoesnotreturn.
- [ ] Migrateoldmemberswithunknownfacts/leave0. IncrementSAVE_SVonceforCschema ascurrentcodepermits; C2sharesmigrationversion, notindependentbumps. NewLife.sv usescurrentconstantorupdatedsameversion; preservev2slotkeys.
- [ ] Run `node --test test/team-continuity.test.mjs test/team.test.mjs test/save-versions.test.mjs test/ops.test.mjs`; addbrowserteamviewavailabilityassertion. Commit `fix: preserve teammate story consequences`.

### C2: Structured story resolution and spoiler-safe journal

**Files:** Create `src/core/narrative.js`, `src/ui/narrative-view.js`, `test/narrative.test.mjs`; modify `src/core/events.js`, `src/core/ops.js` onlyforresolutionhook, `src/core/registry.js`, `src/core/stories.js`, `src/core/team.js`, `src/core/state.js`, `src/core/save.js`, `src/core/index.js`, `src/ui/tabs/log.js`.
**Interfaces:**
- `s.narrative={arcs:{},journal:[],memories:[],sequence:0}`; runtime arcs are keyed by `arcInstanceId` and keep resolved instance IDs separately from clipped journal. `arcId` identifies authored content; `arcInstanceId` identifies this life/member run (member ID included for teammate arcs); `instanceId` identifies a particular opened decision using incremented `sequence`. Allocate once on opening and persist in pending event; never regenerate on render/reload.
- `NarrativeMeta={arcId,arcInstanceId,nodeId,instanceId,castRefs:string[]}`; `openEvent` currentlycopiesexplicitfields, **mustcopythisvalidatedmetadataexplicitly** intoev. Eachoptionhasstable`choiceId`; auto-addedescapemappedexplicitlyto`leave` withvalidclosure/pause, notindexasID.
- `recordResolution(s,{meta,choiceId,success,publicText,publicTitle,publicCast})->boolean`: dedupbyinstanceId, recordsafteractualapplyOutcome; usescaptured ev/opt beforeclearing; noRNG/noextrareward. FutureC3canadvancegraphfromthiscallviahook.
- `journalView(s)->Array<{id,ageM,title,text,castNames}>`: onlypublicfieldsalreadyseen; UIescapesalltext. No future titles/counts/timers/raw flags. `publicCast` snapshots `{id,name}` เฉพาะคนที่ตัวละครรู้จัก ณ เวลาตัดสินใจ; journalView ไม่ resolve ชื่อย้อนหลังจาก roster ปัจจุบันจนคนที่ออกทีมกลายเป็นคนใหม่.

- [ ] Tests openingchapterdoesnotmarkresolved, successfulchoicecapturesonce, failedskillcheckrecordsactualfailure, locked/hiddenchoicehasnorecord, repeatedsameinstanceIDhasnonewrecord;savepending/reload/choose preservesidentity. Existingoldchaptercountersemanticsstayunchanged.
- [ ] Metadataonnewlyopenedlegacystory/teamchaptersmayrecordactualfuturechoices; oldsavepastunknownmustnotfabricateentries. Clipjournalto120butkeepunresolvedarcsanddedupids; max8publicmemories. Saving/reloadingmustnotreplayrewardorconsumeRNG.
- [ ] Hooknormalchooseandoperationdecideafteroutcomeonlywhenmetaexists; handlingdeathinoutcome recordsknownresultwithoutstartingnextnode. Escape/forgive/no-costoptionsarefirstclass. TestmismatchedevMembercan'twriteanothermemberfacts.
- [ ] Add “เรื่องที่ผ่านมา” sectionwithinexistingLogtab; showonlyencounteredthreads/publicwaitingreasonandreadhistory. Noextraalways-visibletabfornewborn. NamesXSSescaped;unknowncastmissingfriendlyneutraltext.
- [ ] Run `node --test test/narrative.test.mjs test/stories.test.mjs test/team-continuity.test.mjs test/save*.test.mjs`; browserjournalreload+nokeyboardleak. Commit `feat: remember resolved stories without spoilers`.

### C3: Two original pilot arcs with coherent branches

**Files:** Create `src/data/stories/pilots.js`, `src/core/pilot-stories.js`, `test/pilot-stories.test.mjs`; modify `src/core/index.js`, `src/core/registry.js` onlyforhookregistration, `tools/story-check.mjs` andC0bible.
**Interfaces:**
- `PILOT_ARCS` ownstaticdata: `{id,start,who,gap:[min,max],nodes}`; node `{id,title,text,options}`; option `{choiceId,label,success:{next,publicText,fx},failure?:{next,publicText,fx}}`; terminal `next:null` withclosureid/publicmemory. Schemafnfieldsneverpersist.
- `pilotMonth(s)` registersin`lastly` **beforehuntMonth**, andafterexistingmonthlystorysystems; opensonlywhennoev/op/dead. Existinglastlyorderdependsimportorder: addexplicitinsertionororderedregistrationwithtest—do notimportlastandstarvepilotbehindmonthlygateoffer.
- Atmost1activepilot,1newnodepermonth; reuseourstorygap3–8monthsforpilots(authoringdefault, nochangelegacygaps). Binding huntercastonlylivingpresentteammemberoncebyseededownstream; civiliancastisarc-localcontactwithstableid/namefromourdata,noanonymousactorreplacement. `who`predicateusesoffice careerforcivilian/hunter+teamforhunter.
- `resolvePilot(s,meta,choiceId,success)` calledfromrecordResolutionhookonce; appliesnorewarditself, onlynextnode/closure/scheduling basedonactualoutcome. Re-enteringnodecannotrepay.

- [ ] Graphcheckerfailswithmissingnext/duplicatechoice/unreachableclosure/missingabsencebranch/autoescapeunhandled. Validate4nodescore andatleast2distinctclosures + failureforward + interruptionroute ineacharc; assertioniscoverage, notforcedfullbinarytree.
- [ ] ImplementalltextfromreviewedC0bibleandbudgets. Pausewhenwhoineligible; onreturnreschedule3–8monthsusingnamed`pilotStory`stream. Do notleakdatesinUI. Closurewhencastdead/dismissedusesknownfact; neverrebindnewmemberwithsamename. Duepilotsgetturnbeforegateofferswithoutoverwritinglegacydecision.
- [ ] Deterministicbranchtestsforcivilianandhunter: success/failure/leave/lowfundsifanyknownneed/nonawakenedlife/saveatall4nodes/reentry/castdeath/jobchange/retirement/hero-death. Assertciviliancompleteswithoutawakening, unrelatedlegacychainstilladvances, protagonistnotforcedtowin.
- [ ] Run `node tools/story-check.mjs`, `node --test test/pilot-stories.test.mjs test/narrative.test.mjs test/stories.test.mjs test/auto.test.mjs`. Manualreadthrougheachclosureandfailureroute, editcopyforhumancredibility. Commit `feat: add original civilian and hunter story pilots`.

### C4: Public memory through heirs and life endings

**Files:** Modify `src/core/narrative.js`, `src/core/heir.js`, `src/core/goals.js`, `src/ui/main.js` endscreen; create `test/narrative-heir.test.mjs`.
**Interfaces:** `publicLegacy(s)->PublicMemory[]` onlypilotpublicfactsactuallyresolved; `{id,arcId,closureId,text,originName,originGen}` cap8; `inheritNarrative(parent,child)` initializesfresharcs/journalandcopiespublicmemoryonly. `legacyMemoryEvent(s)` createsage18once-onlypubliccallbackwithoneacknowledgement/noFXreward; ordinaryeverseenfactsnotsecretflags.

- [ ] Testfinishedpilottransfersknownfact, unfinishedarcdoesnotinventclosure, nochildinheritsparentpendingevent/dedupstate/hiddenflags. Noextraestatecash/statgain fromcallback; existinginheritancetaxanditemsunchanged.
- [ ] Atage18afterexistingestatehandoffandwhennoev/op, displayonecallbackatmostpermonth, stablememoryidguard; repeatreloaddoesnotduplicateack/reward. Parentcastdeadstayspast-tenseanddoesnotspawnaliveNPC.
- [ ] Deathsummaryaddsmax3publicstorylines(fromjournal/memories, nofutureends); civilianachievementvisiblewithoutrequiringrank. Storydata survivesjournalclipandonlyeightlegacymemoriesprioritydeterministicallylatestresolved, noRNG.
- [ ] Run `node --test test/narrative-heir.test.mjs test/heir.test.mjs test/narrative.test.mjs test/book.test.mjs`; humanreadbothgenerationhandoffs. Commit `feat: carry witnessed story consequences across generations`.
