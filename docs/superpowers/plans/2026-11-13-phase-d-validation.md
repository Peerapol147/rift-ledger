# D — Validation and release evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Executor: Claude; this handoff does not start implementation or authorize merging.

**Goal:** พิสูจน์ว่าแก้ปัญหาและเล่าเรื่องดีขึ้นโดยไม่ทำสมดุลหรือเซฟเสีย

**Architecture:** ใช้behaviorregressionsและเครื่องมือหลายseedเดิม เพิ่มcoverageเรื่องกับsessionผู้เล่น ไม่เขียนcombatengineใหม่

**Tech Stack:** JavaScript ESM, Node `node:test`, esbuild, DOM; isolated Chromium/Playwright for interaction checks.

**Spec:** [Original life improvements design](../specs/2026-11-13-original-life-improvements-design.md). Also read [roadmap](2026-11-13-improvement-roadmap.md), original redesign spec and `AGENTS.md`.

## Global Constraints

- ภาษา UI เป็นไทย; class/skill/item names คง English ตามสเปกแม่
- Preview/read-only rendering ห้ามกิน RNG, เปลี่ยน state, เปิด event หรือให้ reward
- ไม่เปลี่ยนสูตร rank/combat/loot/เศรษฐกิจ/อายุโดยแฝงใน UX PR
- ไม่คัด code, art, sound, text, plot หรือ balance constants จากคู่เทียบ; ไม่ commit HAR/raw responses
- ใช้ constraints ทั้งหมดใน design; baseline98e5332ยังไม่ใช่main. Testsต้องพิสูจน์ behavior ไม่ใช่ snapshot implementation อย่างเดียว

## Review Focus

1. Retreatedbossreportedassafe/estimatevsactualmisread — D1.
2. Multi-generationlongsavesandgrowthofjournal — D1/D2.
3. Fastautopolicy skippingnewstory/choiceconflict — D1.
4. Narrativecontradictiondespitealltestsbeinggreen — D2.
5. Uploadedartifactnotmatchingtestedcommit/mobileaudiooffline — D3.

---

### D1: Mechanical and narrative regression matrix

**Files:** Extend `tools/story-check.mjs`, `tools/ux-regression.mjs`; create `docs/research/improvement-validation.md`. Existing `tools/sim.mjs`, `tools/playtest.mjs` retained.
**Interfaces:** Evidenceentry `{commit,command,exitCode,date,scope,limitations}`; storycoverage recordsarc/node/choice/closureidsfromtestfixtures(noownerpersonaldata).

- [ ] ReproduceoldUXcasesagainstcandidateandrecordfixed/notfixed perID; nevermarkN01/N02fixedfromdocedit. Testnormalfresh, importedold, pendingop, dead/heir, fullslots, storageblocked, mobiletouch/keyboard.
- [ ] Run `npm test`, `node tools/artcheck.mjs`, `node tools/linelen.mjs`, `node tools/story-check.mjs`, `npm run build`, browser`--group all` oncurrentbuild.
- [ ] Run separately `node tools/sim.mjs 1000 --policy careful --seeds a,b,c,d,e`, samefornormalandreckless, then `node tools/playtest.mjs 200`. Comparelifespan/awakening/rank/income/retreat/completion metricswithsamecommandsat98e5332inpreservedcheckout. Inspectbaselinewarningsvsnewregressions; don'tsilentlytunetosingle seed orpretendbaselineiswarning-free.
- [ ] Check20heirgenerationtestfixturewithcap120journal/cap8memory; save/read/resume stableandnoexponentialstate. IfruntimecosttooheavyinCI, runmanuallyandrecordratherthandropping.
- [ ] Commit `test: verify control and story improvement release gates` afteractualresults; anybalancechangeisaseparateproposalwithmulti-seedevidence.

### D2: Human narrative and usability review

**Files:** Create `docs/narrative/pilot-readthrough.md` andtestscriptforreadthroughinstructions(noproductiontracking).
**Interfaces:** Perroute rubric motivation/causality/agency/civilianweight/closure each0–2; 0=contradiction/missing,1=understandablebutweak,2=clearandconsequential. Proposededitorialgate≥8/10andno0; scorebyreader, notmodelclaimofplayerfun.

- [ ] Readallpilotbranchesnotonlyhappyending. Askreaderretell “ใครต้องการอะไร / ฉันเลือกอะไร / อะไรเปลี่ยน / ทำไมตอนนี้ต้องรอ / รุ่นลูกได้รับรู้อะไร”. Collectactualanswers; do notwritefictitioususerfeedback.
- [ ] Walkfreshcivilianandhunterprofileson390px/320px/desktop, lengthylogandfontlarge. Measurewhetherplanandcurrentdecisionfoundwithoutscrollingthroughhistory; countmisclicks/unexplainedpause/data-lossoccurrences (target0inobservedsessions, notglobalguarantee).
- [ ] Fixcopy/flowifcausality0ornewplayerbelievesautoisjusttextskip; rerunaffectedbranch. Do notrewriteplotsfromreferencegameasrepair.
- [ ] Recordunperformedphysicaldevice/screenreaderchecksasnotrun. A botcannotreplacehumanreadthrough; ifnotavailablehandoffwithexplicitremaininggate, notfalseall-clear. Commitreviewresults.

### D3: Claude handoff, PRs and original-art evidence

**Files:** Update `docs/HANDOFF.md`, reportswithstatuses, relevantartrequestifnewassetneeded; build`play.html` onlyfromtestedsource.
**Interfaces:** PRbodyproblem→behavior→tests→savecompat→remaininglimits; linktaskID/fixedUX/N IDs. ExistingrepoPR/mergepolicyapplies; noimpliedpermissiontomergefromthisplan.

- [ ] Inspectdiffonlyoursource/docs/tests/assets; noHAR/externalcode/cookies/othergameassets. Newvisualsneedourartbrief/requestandprovenance; borrowedideasdescribedasprinciples, notreusedimplementation.
- [ ] Runfreshbuildandmusiccheckwithexternalaudiorequestsblocked; verifydefaultmanualprofileandexplicitautopersistence. Attachtestedcommit/link; mainstatusmustbeaccurate.
- [ ] SeparatePRsA/B/C/D; A3+A4cannotshipasbrokenreturncontract;C0maylandbeforeA. UseanindependentreviewerforbigsystemchangeperAGENTS/HANDOFF; keepreviewscoperead-onlyuntilfixesnecessary.
- [ ] GiveownerThaioverviewincludingstoryexamplesandknownremainingissues; updateentrypointfornextClaude. Deferpoint-buy/MMO/newformulasuntilreviewofpilotoutcomes.
