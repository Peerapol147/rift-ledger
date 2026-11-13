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
