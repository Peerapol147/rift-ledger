# B — Readable decisions and mission preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Executor: Claude; this handoff does not start implementation or authorize merging.

**Goal:** ผู้เล่นเห็นแผนและต้นทุนก่อนตัดสินใจทั้งมือถือและเดสก์ท็อป

**Architecture:** สร้าง read-only projectionsจากoptionViewและoperationoffersเดิม จัดตำแหน่ง UIใหม่โดยไม่เปลี่ยนcombat/เวลา/รางวัล

**Tech Stack:** JavaScript ESM, Node `node:test`, esbuild, DOM; isolated Chromium/Playwright for interaction checks.

**Spec:** [Original life improvements design](../specs/2026-11-13-original-life-improvements-design.md). Also read [roadmap](2026-11-13-improvement-roadmap.md), original redesign spec and `AGENTS.md`.

## Global Constraints

- ภาษา UI เป็นไทย; class/skill/item names คง English ตามสเปกแม่
- Preview/read-only rendering ห้ามกิน RNG, เปลี่ยน state, เปิด event หรือให้ reward
- ไม่เปลี่ยนสูตร rank/combat/loot/เศรษฐกิจ/อายุโดยแฝงใน UX PR
- ไม่คัด code, art, sound, text, plot หรือ balance constants จากคู่เทียบ; ไม่ commit HAR/raw responses
- ใช้ constraints ทั้งหมดใน design; baseline98e5332ยังไม่ใช่main. Testsต้องพิสูจน์ behavior ไม่ใช่ snapshot implementation อย่างเดียว

## Review Focus

1. Longlog600rows/longThai/largefont on320px — B1.
2. Missingrolebutwoundedmember andactualbossretreat35% — B2.
3. Hiddenneed/ceil/loyaltyvalues leakingviaHTMLoraria — B2/B3.
4. Repeatedpreview consumingRNG or modifyingoffers — B2.
5. Current0risk interpretedaszerocost/guaranteedsurvival — B2/B3.

---

### B1: Decision-first mobile structure and art hierarchy

**Files:** Modify `src/index.html`, `src/ui/layout.js`, `src/ui/main.js`, `tools/ux-regression.mjs`.
**Interfaces:** Moveexistingmonthlyplanrender to `planPanel(s)->string`; renderonceinresponsivecontainer, no duplicatedactionIDs. Retain `C.setFocus` andstageeligibility; do notaddsecondmonthlyaction.

- [ ] Assert390×844 monthlyplanortriggerinviewportwithadultlog600rows;320×568 nohorizontaloverflow;3fontoptions; keyboardfocusorderfollowsvisualorder; nofixedfootercoveringlastchoice.
- [ ] Moveplan/controlshortcutnearevent; longlogscrolldoesnotpushplanbelowit. Makeactiontouchareas44CSSpx wherepossiblewithoutoverlap; 24pxAA exceptionsnotclaimedviolationsautomatically. Preservecurrenttabwhenresizing.
- [ ] Artpasslimitedtoexistingassets, typography/contrast/spacing/focus: backgroundsbehindreadablesurface, iconswithtext, importantstorytextnothiddenbyFX. Auditreduced-motion stageAPIbeforewiring; CSSandstageeffectsbothrespectpreference, notjustdisabletransition. Noimageneededforlayoutfix; missingartbecomesartrequest.
- [ ] Run `node tools/ux-regression.mjs --group layout --base-url http://127.0.0.1:5183/play.html` pluskeyboard/contrastmanualchecks; saveviewportshotsat1440×900,390×844,320×568. Commit `ui: keep monthly decisions within reach`.

### B2: Operation briefing from existing facts

**Files:** Create `src/core/briefing.js`, `test/briefing.test.mjs`; modify `src/core/index.js`, `src/core/ops.js`, `src/ui/prep.js`, `src/ui/layout.js`.
**Interfaces:** `operationBrief(s,def)->{title,kind,advertisedGold,plan,retreatAt:number|null,skills:{selected,max},missingRoles:string[],warnings:string[]}`. `retreatThreshold(def,plan)->number|null` extractedfromexistingopschecks, returns.35boss/.5normalforretreat,nullotherwise. ConsumeexistingdefaultPrep/slotsFor/teamRoles/optionView info; do notcallgateOffers/recruitOffersfromrender.

- [ ] Redtests equality `JSON.stringify(s)` before/after100calls, s.runchanged, offerssameidentity/data; dead/woundedmembersarenotcountedavailable; noceil/loyalty/hiddenflagsinprojection.
- [ ] Extractthresholdwithsame `<` semanticsandpriorityafterlostbeforetimeout; existingboss-retreattestsproveunchangedcombat. Label “ถอยเมื่อสุขภาพการต่อสู้ต่ำกว่า35% (บอส)” vs50%; specifycanlosebeforewithdrawalnotguaranteedrescue.
- [ ] Renderbriefbesideexistingoffer/prep; rewardlabel “ค่าตอบแทนที่ประกาศ” becauseactualshare/loot/party differs; plan/skillseditablethroughsameactions. NoextraAcceptdialogforordinarychoiceunlessactionirreversibleasA.
- [ ] Bossriskremainscurrentestimatefromoffer; explain “ประมาณการอันตรายถึงชีวิต” andordinary0maystillinjure/costtime. Do notgeneratewin%from16simulation samples. Forjoboperationfoes=[] showcareerbriefwithoutcombatzeros.
- [ ] Run `node --test test/briefing.test.mjs test/boss-retreat.test.mjs test/ops.test.mjs test/party.test.mjs`; browserassertchangingplanupdatescopyandpreviewimmediately. Commit `ui: explain existing operation preparation`.

### B3: Clear choices without spoilers

**Files:** Create `src/ui/choice-summary.js`, `test/choice-summary.test.mjs`; modify `src/ui/layout.js`, `src/core/goals.js` onlyifneededforpubliclabels; extendbrowserregression.
**Interfaces:** `choiceSummary(s,opt)->null|{label,desc,locked,lockText,odds,risk,goalEligible}` builtfrom `C.optionView`; nullforinvisible; `goalEligible` mirrors publicunmetneedlogic. Noarbitraryoutcome/flagsserializedasDOMdataset.

- [ ] Tests hiddenchoicehasnoelement/ariahint; publiclockedoptionshowscurrent/neededvalueandpin; normaloddsremainsamevalueascoreincludingmindpenalty. Rareclassnamesorloyaltynumbersneverappearunlessalreadyallowedbyparentspec.
- [ ] Groupcopy “สิ่งที่ต้องมี / โอกาส / ข้อมูลที่รู้” usingexistingopt.d; do notpredictout.m, futurestorybranches, permanentinjuryifnotpubliclytelegraphed. Aresultstripshowsactualresolvedtextonly.
- [ ] Browserkeyboardandtouchinspectthesameoptions; labelsanddescriptionsnotrenderedasnestedbuttons; planchangesnotselectevent. Run `node --test test/choice-summary.test.mjs test/events-ui.test.mjs test/goals.test.mjs` andbrowsergroupchoices.
- [ ] Commit `ui: clarify public requirements without revealing hidden routes`; gateBreadywithUX04/06/10evidence.
