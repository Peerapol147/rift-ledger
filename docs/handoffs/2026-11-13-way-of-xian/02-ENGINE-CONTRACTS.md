# Engine contracts — ข้อเสนอเทคนิคที่ Claude ใช้วาง implementation

ชื่อ/ค่าในเอกสารนี้เป็น proposed contract ไม่ใช่ API ที่มีอยู่แล้ว อ่านคู่ 01 และตรวจความเข้ากันได้กับ repo ล่าสุดก่อนเขียน

## A. เวลาและตัวตน

- `worldMonth(s) = (s.mon0 ?? 0) + s.ageM` เป็นเดือนนับจาก ม.ค. 2051 ไม่ใช่นับจากวันฟ้าแตก
- วันเกิด/วันตาย NPC, due date โลก, วันสร้าง memory ใช้ worldMonth ทั้งหมด ตัวเลข `s.ageM` เดิมใช้กับวัยผู้เล่นและระบบเดิมที่ยังไม่ย้าย
- สายเรื่องใหม่ใช้ dueWorldM และ lastServedWorldM แบบ absolute เสมอ `newHeir` ไม่เอา ageM ใหม่ไปเทียบ due เก่า
- IDs เป็น string แบบ `[A-Za-z0-9_-]+`; เรื่องและ node ใช้ namespace เช่น `career-office`, `audit` ห้ามเอาชื่อแสดงผลเป็น key
- `lifeId` แยกแต่ละชีวิต; `familyId` คงเดิมเฉพาะการเล่นต่อเป็นผู้สืบทอด; เริ่มโลกใหม่ไม่แชร์ state ครอบครัวโดยอัตโนมัติ
- hero ในเรื่องผูกด้วย lifeId ไม่สร้าง NPC ผู้เล่นที่ยังมีชีวิตซ้ำใน world.people คนในรุ่นก่อนอ้างผ่าน family member record ได้

## B. State ที่เพิ่ม (plain JSON เท่านั้น)

```js
s.narrative = {
  version: 1,
  lifeId: 'life-1', familyId: 'family-1',
  focusId: null, questLimit: 3,
  stories: {},
  lifeArc: { id: 'childhood', sinceWorldM: 0 },
  resolved: {},
  recentScenes: [],
};
// stories[storyId]
{
  nodeId: 'intake', routeId: null, status: 'available',
  enteredWorldM: 0, dueWorldM: 0, lastServedWorldM: null,
  cast: { claimant: 'p-17' }, vars: {},
  visited: [], endingId: null, waitReason: null,
}
s.world.people = {}; // id -> canonical person
s.world.nextPersonId = 1;
s.world.cityStates = {}; // cityId -> city state
s.world.factionPower = {}; // distinct from s.fac
s.world.journal = []; // resolved facts affecting the world
s.relations = {}; // personId -> relationship with THIS life
s.familyMemory = {
  familyId: 'family-1', seenScenes: {},
  members: [], legacies: [], knownEvidence: [],
};
```

Story status enum: `available|active|waiting|shelved|completed|abandoned` ไม่สื่อถึงความหายากหรือความลับ `available` ต้องค้นพบแล้ว; เรื่องที่ไม่รู้จักยังไม่มี entry ใน state ผู้เล่น

Person contract:

```js
{
  id: 'p-17', name: 'ชื่อแต่ง', country: 'th', city: 'bangkok',
  sex: 'm', bornWorldM: -300, diedWorldM: null,
  jobId: null, hunter: { rank: 2, cls: '...', lv: 20 },
  tags: [], nextUpdateWorldM: 12,
  storyRefs: [], retired: false,
}
```

`hunter` เป็น null สำหรับคนธรรมดา IDs job/cls/city ต้องอ้างรายการที่มีจริง `diedWorldM` ไม่ใช้ truthiness เพราะ 0 เป็นเดือนที่ถูกต้อง

Relation contract: `{ trust:0, obligation:0, tags:[], memories:[], lastContactWorldM:0, tested:false }` loyalty ทีมเดิมยังใช้ในการต่อสู้และออกทีมจนกว่าจะมี task ย้ายชัดเจน ห้ามแทนที่ด้วย trust แบบเงียบ ๆ

Memory contract: `{ id, kind, worldM, actorLifeId, personIds:[], storyId:null, nodeId:null, public:false, facts:{} }`; ข้อความแสดงผลมาจาก template ที่เขียน ไม่เก็บคำสั่ง JS ใน facts

City contract: `{ disruption:0, recoveryAtWorldM:null, causeId:null, modifiers:[] }`; modifier `{ id, sourceId, jobIds:[], incomeMul:1, costMul:1, expiresWorldM }`

## C. File responsibilities

| Proposed file | Responsibility |
|---|---|
| src/core/people.js | คนอ้างอิงเดียว, adapter roster/team, ตรวจ alive/age/location |
| src/core/relations.js | ความสัมพันธ์และความทรงจำร่วม |
| src/core/narrative/conditions.js | predicates ไม่มี mutation/RNG |
| src/core/narrative/engine.js | start/advance/complete เรื่องและ transition |
| src/core/narrative/scheduler.js | คัด event จากเรื่องและ focus โดยไม่เปิดซ้อน |
| src/core/narrative/validate.js | ตรวจ graph/references/content จาก pure data |
| src/core/life-arcs.js | derive บทชีวิตและ event weighting |
| src/core/world-effects.js | city effects, journal, recovery, idempotent effects |
| src/core/family-memory.js | บันทึกประวัติครอบครัว/น้ำหนักซ้ำ/knowledge inheritance |
| src/data/narrative/index.js | registry เรื่องใหม่; ไม่ import core |
| src/data/narrative/career-office.js | vertical slice สายประกัน |
| src/data/narrative/*.js | เรื่องที่ขยายทีละสาย |
| src/ui/tabs/stories.js | หน้าเฉพาะเรื่องที่ค้นพบและติดตาม |
| src/ui/tabs/people.js | คนที่รู้จัก ไม่ dump world.people |

`src/core/index.js` export public API ใหม่; core ไม่ import UI; data ไม่ import core เพื่อเลี่ยง cycle แบ่งไฟล์ตามความรับผิดชอบ ไม่ยัดทุกอย่างลง stories.js หรือ events.js

## D. Proposed API signatures

```ts
worldMonth(s:State):number
initNarrative(s:State):void
ensurePerson(s:State, input:PersonInput, sourceKey:string):string
personById(s:State, id:string):Person|null
personAliveAt(s:State, id:string, worldM:number):boolean
bindCast(s:State, storyId:string, roles:CastSpec):{ok:boolean, cast:Record<string,string>, reason:string|null}
remember(s:State, memory:Memory):boolean
changeRelation(s:State, personId:string, delta:RelationDelta):void
holds(s:State, condition:Condition, ctx:StoryContext):boolean
startStory(s:State, storyId:string):{ok:boolean, reason:string|null}
storyCandidates(s:State):NarrativeCandidate[]
selectNarrative(s:State):NarrativeCandidate|null
openNarrative(s:State, candidate:NarrativeCandidate):boolean
resolveNarrative(s:State, choiceId:string):{ok:boolean, reason:string|null}
setStoryFocus(s:State, storyId:string|null):boolean
shelveStory(s:State, storyId:string):boolean
abandonStory(s:State, storyId:string):boolean
deriveLifeArc(s:State):string
applyWorldEffect(s:State, effect:WorldEffect, effectKey:string):boolean
recoverWorld(s:State):void
familySceneWeight(s:State, sceneId:string, mandatory:boolean):number
inheritFamilyMemory(parent:State, heir:State):void
validateNarrative(definitions:Record<string,StoryDef>, catalogs:Catalogs):ValidationIssue[]
```

Returning false must not spend money, mutate route, consume RNG or alter timestamps. `ensurePerson` returns same ID when sourceKey already imported, so refresh/migration cannot duplicate people.

## E. Story definition

```js
{
 id: 'career-office', title: 'แฟ้มที่ไม่ได้ปิด',
 discover: { all: [{ job: 'office' }, { age: [18, 70] }] },
 entry: 'intake',
 cast: { claimant: { source: 'local-hunter', rank: [1, 3], required: true } },
 nodes: {
  intake: {
   kind: 'choice', delayM: [1, 3],
   t: 'ข้อความต้นฉบับของเรา ใช้ {cast:claimant} เมื่อผูกตัวแล้ว',
   choices: [
    { id: 'read', l: 'ตรวจสัญญา', check: {stat:'int',diff:16},
      success: { next:'claim', effects:[] },
      failure: { next:'seek-help', effects:[] } },
    { id: 'routine', l:'ทำตามแบบฟอร์ม', success:{next:'routine',effects:[]} },
   ],
  },
 },
 endings: { routine: { title:'งานที่ทำต่อไป', public:true } },
}
```

ตารางข้างบนอธิบาย schema ไม่ใช่เรื่องครบที่รันได้ทันที validate ต้องปฏิเสธ reference ของ node ที่ขาด

Node kind: `choice|beat|ending`. `beat` ไม่เปิด choice และเดินได้ไม่เกิน 1 node ต่อเรื่องต่อเดือน; จำกัดรวม auto chain 4 nodes ต่อ invocation ป้องกัน cycle ค้าง; ถ้าถึงเพดานแล้วมีงานต่อ รอ tick หน้า ไม่ทิ้ง state

Choice: `{id,l,when?,knownNeed?,check?,risk?,success,failure?,noAuto?}`
Transition: `{next?:nodeId, ending?:endingId, route?:routeId, effects:Effect[]}` ต้องมี next หรือ ending เพียงหนึ่ง ค่า route ถูกตั้ง explicit ไม่คาดเดาจากข้อความ

Conditions เป็น allowlist: `all`, `any`, `not`, `age:[min,max]`, `job:id`, `jobTierAtLeast:n`, `rank:[min,max]`, `city:id`, `goldAtLeast:n`, `debtAtMost:n`, `fameAtLeast:n`, `flag:id`, `var:{key,eq}`, `route:id`, `castAlive:role`, `relationAtLeast:{role,trust}`, `hasEvidence:id`, `teamRole:id`, `seenScene:id` unknown predicate = validation error ห้าม eval

ผลเป็น allowlist: `money`, `stat`, `mind`, `flag`, `storyVar`, `relation`, `memory`, `world`, `item`, `startStory`, `jobOffer` อ้างฟังก์ชันจริงผ่าน adapter ไม่ใส่ arbitrary act string ใหม่แล้วปล่อย silent no-op

Money effect `{type:'money',amount:-15000,label:'ทุนบริษัท',requireFunds:true}` ต้อง preflight ทุก effect ก่อน apply ทั้งชุด ไม่ใช้กู้หนี้อัตโนมัติแทนการยืนยันค่าใช้จ่ายที่เงื่อนไขบอกว่าต้องมีเงิน

## F. Exactly-once outcome และทางเชื่อม events.js

1. openNarrative ตรวจ `!s.ev && !s.op` รวม eligibility, cast, status และ context ปัจจุบันก่อนเปิด
2. จับ node snapshot พร้อม `{ storyId,nodeId,choiceIds,openedWorldM,nonce }` ใน `s.ev.narrative`; serialize ได้ทั้งหมด
3. `choose(s,i)` เดิม dispatch ถ้า `s.ev.narrative` ไป resolveNarrative; index แปลงเป็น choiceId ที่ snapshot เก็บ ไม่อ้าง index ใหม่หลัง UI sort
4. resolve ตรวจ nonce และ current node ถ้า resolved แล้ว return false. Preflight conditions/funds/target references ก่อนสุ่ม check
5. สุ่มจาก stream เฉพาะเรื่อง `narrative:<storyId>`; บันทึกผลและ apply effects หนึ่งครั้ง แล้ว update node/route/due/status และ clear ev
6. การ apply เป็น synchronous transaction: preflight สร้าง effect plan ที่ใช้เฉพาะ deterministic mutators ที่ไม่ throw; ถ้าผิดพลาด ที่ไม่คาดคิดให้ rollback state และ RNG snapshot อย่ากินเงินครึ่งหนึ่งแล้วโยน error จบ
7. ใส่ `s.narrative.resolved[nonce] = { worldM, choiceId }` และ log ที่มี reference ไม่เพียงข้อความ; prune เมื่อไม่มี save/event references จำเป็นแล้ว โดยต้องไม่เปิดทางให้ old ev ยิงซ้ำ
8. ความล้มเหลวไป failure transition ที่เขียนไว้ ไม่มี failure ให้ validate reject เมื่อมี check/risk ห้าม fallthrough เป็น success
9. ถ้า NPC ตายระหว่างพัก โหลด หรือก่อนยืนยัน ต้อง revalidate และเข้าทาง interruption ที่ผู้เขียนกำหนด ไม่เปลี่ยนคนแบบเงียบ ๆ ไม่เรียกคนตายมาพูดสด

เรื่องใหม่ใช้ `s.ev.narrative` และ public choose อย่างเดียว UI ไม่แก้ state โดยตรง operation ใช้เส้นทางเดิม `s.ev.op` ห้ามมีทั้งคู่ใน event เดียว

## G. Queue และ scheduler

อย่าแก้ clock ทั้งชุดครั้งเดียวใน P1: register narrative monthly ตำแหน่งตั้งใจผ่าน index.js และปิด producer เดิมของ story ID ที่ย้ายแล้ว

P2 จัดกลุ่มผู้สร้างเหตุการณ์เดิมเป็น candidate adapters โดยแยกการเดิน simulation จากการขอเปิด event ต้องไม่เรียกฟังก์ชันที่ mutate เพื่อ “สำรวจว่ามีอะไรบ้าง”

Priority: event/op ที่ค้างคงเดิม → วิกฤตสุขภาพ/คำสัญญาที่ครบกำหนด → calendar สำคัญ → focused story → side story → routine event/offer. Tie-break ใช้ priority, oldestDueWorldM, lastServedWorldM, ID ตามลำดับ ไม่พึ่ง object insertion order

- เรื่องค้นพบที่ active ได้ไม่เกิน questLimit=3; focus 1; เรื่องเกินเก็บ available/shelved โดยไม่ทิ้ง
- Default เดินเฉพาะ focus; เรื่อง side ไม่เดิน node จนเลือกติดตาม ยกเว้น deadline ที่อิงโลกและเรื่องผูก operation
- Story ที่รอเงื่อนไขยังอยู่ waiting และแสดงเหตุผลที่รู้ได้โดยไม่เผยเงื่อนไขลับ ไม่บล็อก slot งานพร้อมอื่นตลอดกาล
- `setStoryFocus` ได้เมื่อไม่มี ev/op; ไม่เพิ่ม due ใหม่ ไม่ทอย cast ใหม่; พัก-กลับมาไม่ใช้รีเซ็ต deadline โลก
- Fairness: เมื่อ routine/side candidate รอเกิน 6 เดือนที่ไม่มีเหตุเร่งด่วน ให้มี aging priority บริการได้อย่างน้อย 1 ครั้งใน 12 เดือนดังกล่าว Focus ไม่ตัด calendar/illness
- เด็ก tick ทีละ 3 เดือน: เปรียบช่วงเดือนที่ข้ามกับ due/expiry ห้ามเช็คแค่เดือนตรง equality; จำกัดหนึ่ง choice เปิดพร้อมกัน เหตุที่ยังไม่เปิดคงอยู่ ไม่ถือว่าจบแล้ว
- ห้ามเลื่อน clock เพิ่มจากการเลือกเพื่อชดเชย event backlog ทุก tick ยังเป็นช่วงเวลาเดิม

## H. Legacy coexistence

เพิ่ม explicit registry `MIGRATED_STORY_IDS` ใน data registry ใหม่ `core/stories.js` ข้ามเฉพาะสายที่ย้าย เรื่องอื่นใช้ ch/next เดิมต่อได้. secrets/truths ยังใช้ระบบเดิมจนมี mapping และ task ย้ายของตนเอง

อย่าให้ graph ใหม่เขียน `ch:<id>` แข่งกับระบบเก่า ใช้ legacy counters เพื่อ import ครั้งเดียวและ compatibility reads เท่านั้น. family events, factions และ calendar ที่ยังไม่ย้ายต้องไม่หายเพราะ scheduler เปลี่ยนลำดับ

## I. Save migration

- คง `s.v=2`, key `riftledger.slot.v2.*`, collection key เดิม; เพิ่ม `SAVE_SV` 2→3 สำหรับ P1 แล้วเพิ่มทีละ version หากเฟสถัดไปเพิ่มความหมาย ไม่ใช้เลขเดียวกับหลาย schema ที่เข้ากันไม่ได้
- เพิ่ม migration 2 และ validators สำหรับ narrative/people/relations/familyMemory ใน save.js. ปัจจุบัน deserialize ไม่ validate structures ใหม่ให้เอง
- มรดก `s.heir` ถูก rebuild ด้วย allowlist อยู่แล้ว ถ้าจะเพิ่ม field ใน heir ต้องเพิ่ม serializer/validator ด้วย ไม่คาดว่า object เดิมถูกเก็บทุก key
- migrate เป็น idempotent: เรียกซ้ำไม่สร้าง NPC ไม่แจกเงิน ไม่เปลี่ยน RNG และไม่เปลี่ยน node
- ของทีมเก่า: import ด้วย sourceKey `legacy-team:<lifeId>:<memberId>` และเพิ่ม personId ใน record เดิม ไม่เปลี่ยน m.id ที่ UI/actions ใช้อยู่ รักษา rank/lv/loyalty/wounds/story ทั้งหมด
- ของ roster เก่า: sourceKey `legacy-roster:<originalId>`; n→name ผ่าน adapter ไม่ลบ n จน caller เดิมย้ายครบ
- ไม่มีวันเกิดเก่า: ตั้งค่าฐานอายุเฉพาะตอน migration จาก stable hash ของ sourceKey ไม่กิน stream เกม; บันทึกว่า estimated เพื่อไม่เล่าว่าเป็นวันเกิดจริง
- เก่าไม่มี cast: ไม่แต่งว่าผู้เล่นเคยช่วยคนใหม่ ให้ legacy contact แบบไม่ระบุอดีต หรือจบผ่าน legacy ending ที่ตรงข้อมูล
- office ที่ยังไม่เริ่ม (`ch` 0/ไม่มี): เริ่ม graph ใหม่เมื่อเข้าเงื่อนไข
- office ที่กำลังเล่น (`ch` 1..4) หรือมี `s.ev.id` ตรง `/^office:\d+$/`: ใช้ legacy-to-completion สำหรับชีวิตนั้น แล้วเริ่ม graph ใหม่ในชีวิตใหม่ ไม่กระโดดข้ามผล/เงินจากบทที่ไม่เคยเลือก
- office จบแล้ว (`ch>=5`): mark completed legacy ending ไม่ replay reward
- เก่าไม่มี field ใหม่: defaults; มี field ใหม่แต่ชนิดผิด: sanitize เฉพาะ optional record หรือ fail invalid active event เพื่อ load backup พร้อมแจ้งผู้เล่น ไม่ทิ้ง main save ทับด้วย state ผิด
- sv มากกว่าที่รองรับ: return null/read-only export; ห้าม downgrade stamp แล้วเขียนทับข้อมูลอนาคต
- เก็บ fixture baseline v2 ทั้งก่อนเริ่ม ระหว่าง event และหลังจบก่อนเพิ่ม migration

## J. Family memory และ repeats

`seenScenes[sceneId]={count,lastWorldM,lastGen}`. บันทึกเมื่อฉากถูก resolve จริง ไม่ใช่ตอนอยู่ใน candidate pool. Mandatory scene factor=1; optional family-seen factor=`1/(1+count*2)`; unseen=1. น้ำหนักนี้คูณ repeat/cooldown เดิม ไม่แทนที่ eligibility.

ไม่เก็บตัวนับ scene ใน `s.c` ทั้งหมดข้ามรุ่นเพราะจะเอา progress/quest/reward มาให้ลูกด้วย. inheritFamilyMemory deep-copy เฉพาะ schema. families แยกกันไม่แชร์ memory เพียงเพราะ book เดียวกัน

Evidence inheritance เป็น `{ evidenceId, source:'journal'|'person'|'heirloom', inheritedWorldM }` บอกว่ามีร่องรอย ไม่เท่ากับเคยพบความจริงด้วยตา. UI ไม่สรุปความลับที่ผู้เล่นใหม่ยังไม่รู้

## K. Determinism / performance / growth

- ไม่ใช้ Date.now/Math.random ใน core. Render/preview/validation ไม่กิน RNG; isolate stream ต่อระบบ/เรื่อง
- sort IDs ก่อนการคัดเลือกที่ลำดับมีผล canonical entity updates ต้องเดิน chronological due order
- ไม่ prune คนตายที่มี story/memory/family refs; prune background unreferenced เท่านั้น
- caps เริ่ม: recentScenes 120, relationship memories 24/คน, world journal 240, family detailed memories 240; scene counters สรุปต่อ ID และ ending counters เก็บได้ ไม่ลบผลถาวรเพื่อให้ cap ดูดี
- caps ต้อง archive compact facts แทนลบข้อมูลที่ future predicate ใช้ ให้ validator ระบุ facts ที่พึ่งได้
- วัด 10 รุ่น × 100 seeds, JSON size และ runtime บนเครื่องจริงก่อนเพิ่ม NPC cap; เป้าตั้งต้น save ≤2 MiB ใน fixture ที่กำหนด ไม่อ้างเป็น browser limit สากล
- operation replay ของ seed/choices เดิมต้องได้ state เหมือนเดิม ตัดเฉพาะ telemetry ที่ไม่ใช่ state ออกจาก comparison


## L. Integration decisions ที่ต้องถือให้ตรงกัน

- worldMonth อยู่ใน `src/core/state.js` เพื่อให้ทุกระบบอ้างแหล่งเดียว; narrative APIs export ผ่าน index.js เท่านั้นสำหรับ UI/tests
- initNarrative สร้าง lifeId จาก familyId + generation + birthWorldMonth แบบ deterministic และเก็บลงเซฟ; familyId สร้างจาก seed ของโลกครั้งแรก ไม่เปลี่ยนเมื่อสร้างผู้สืบทอด. การเริ่มเกมใหม่จาก seed เดิมเป็นโลกอีก instance ที่ไม่แชร์ object หรือ storage progress โดยอัตโนมัติ
- canonical person เป็นแหล่งจริงของ identity/การมีชีวิต/ตำแหน่ง หลัง import แล้ว legacy roster/team เป็น projection สำหรับ caller เก่า. เพิ่ม `setPersonStatus(s,id,patch)` ใน people.js และให้ pulse death, move, team death, wounds ที่เกี่ยวข้องเรียกผ่าน adapter ทิศเดียว แทนแก้ alive สองที่ที่อาจไม่ตรงกัน. team combat fields ที่ยังไม่ย้ายยังอยู่ใน team record ตามเดิม ไม่ให้ generic patch เปลี่ยน rank/lv ของทีมโดยไม่ตั้งใจ
- วิธีหลีกเลี่ยงระบบใหม่ทำงานบน state เก่า: migration/import รันก่อนระบบ update และ story candidates เสมอ; canonical registry ขาดคนที่ถูกอ้างไม่สร้างตัวใหม่เงียบ ๆ ให้ validator/error เป็นเจ้าของการซ่อม
- live cast ที่ย้ายเมืองไม่จำเป็นตายจากเรื่อง: node ระบุ `contactMode:'local'|'remote'` ถ้า local ต้อง same city; remote ต้องมี contact ที่รู้จักจริง. absent source ไม่ใช้ชื่อ generic แทน cast สำคัญ
- ให้ทุก story definition มี `interruptions:{castUnavailable:nodeId,jobChanged:'pause'|'continue'}`. ถ้าเรื่องใช้ cast required ต้องมี castUnavailable เสมอ; node นี้ต้องไม่ใช้ cast คนที่หายมาพูดสด. กรณี claimant-gone ให้เก็บ `vars.resumeNodeId` ก่อนเข้า interruption แล้วจบหรือกลับเฉพาะ node ที่ไม่ต้องใช้เขาตามกราฟที่เขียนไว้
- knownNeed ใช้ mapping ต่อไปนี้เท่านั้น: `{stat:{id,min}}`, `{gold:min}`, `{skill:id}`, `{job:id}`, `{role:id}` ให้ adapter ไป optionView เดิม; เงื่อนไข secret ใช้ when และซ่อนทั้งตัวเลือก. UI ไม่แปลง raw condition เป็นข้อความอัตโนมัติ
- nonce เป็น deterministic increment ต่อชีวิต (`narrative.nextNonce`, เริ่ม1) พร้อม lifeId/storyId/nodeId; ไม่ใช้เวลาจริงเป็น nonce. init/migration เติม nextNonce ให้ไม่ชน active event ที่มีอยู่
- resolved ledger compact ได้เฉพาะ nonce ที่ต่ำกว่า last committed sequence และไม่มี active event อ้างถึง; เก็บ high-water mark ต่อชีวิตเพิ่มเพื่อ reject stale replay หลัง prune. เซฟเก่าที่ผู้เล่น restore เองถือเป็น timeline เก่าทั้งชุด ไม่พยายามแอบ sync รางวัลกับเซฟอื่น
- วันที่ due ต้องสัมพันธ์กับ enteredWorldM. เมื่อ node เสนอ delayM ให้สุ่มครั้งเดียวตอนเข้า nodeและเก็บ dueWorldM; UI เปิดดูหรือ focus/shelve ไม่ทอยใหม่
- ของขวัญสัมพันธ์: เฟสแรก trust เพิ่มได้ไม่เกิน5จากของขวัญต่อ person ต่อ12เดือน และสูงกว่า trust59 ต้องผ่าน authored trust test อย่างน้อยหนึ่งครั้ง. ตัวเลขนี้เป็นค่าเสนอ ไม่เชื่อมเปลี่ยน loyalty ทีมจนมี explicit task
- อายุ NPC ที่สร้างใหม่ต้องมี bornWorldM ที่เหมาะกับบทจริง; หากต้องมีอายุ18+ในปีปัจจุบันให้ bound bornWorldM ≤ now-216. ก่อนจะเพิ่มระบบตายด้วยวัยให้มี maxAge/nextUpdate ที่ชัดและทดสอบ; P1 สามารถอาศัย death events เดิมโดยไม่อ้างว่าจำลองชีวิต NPC ครบแล้ว
- jobChanged pause ไม่หยุดคำนวณคำสัญญาที่เป็น world deadline; priority case นี้ใช้ explicit interruption candidate ไม่แอบเลื่อน due. เมื่อเลือก abandon ต้องยืนยันถ้ามีคำสัญญาหรือผลผูกพันและ apply authored consequence ครั้งเดียว


## M. Minimal NPC lifecycle — owner Task7

ฟังก์ชัน `updatePeople(s,throughWorldM)` ใน people.js ถูกเรียกจาก simulation ก่อน narrative candidates ไม่ใช่ render. P1 ใช้ canonical identity + death events เดิม; P2 จึงเปิด lifecycle นี้ โดยต้องรายงานสองความสามารถแยกกัน

ค่าเสนอเริ่มต้น: background NPC ที่ไม่ใช่ active team/ผู้เล่น มี lifeMaxY seeded ครั้งเดียว 70–90 ปี และ deathDueWorldM=bornWorldM+lifeMaxY*12; ทุก24เดือนนับจาก creation/progression epoch ตรวจพัฒนางานหรือแรงก์ด้วย per-person stream โอกาส20% เพิ่มหนึ่งระดับ ไม่เกิน min(initialRank+1,6). คนธรรมดาไม่เปลี่ยนเป็นฮันเตอร์เพราะ update นี้. ถ้าข้อมูล catalog ไม่รองรับ progression ให้ยังคงอาชีพเดิมแทนสร้าง rank ปลอม

active team ไม่ได้ rank/lv ฟรีจาก background schedule แต่ยังมีอายุ/ความตายตามการเล่าเรื่องที่แจ้งเตือนล่วงหน้า. ก่อนถึง natural death12เดือนให้ warning fact/ฉากที่เหมาะกับคนที่รู้จัก ไม่สร้างเหตุให้ผู้เล่นตายแทน. หากการทดสอบพบว่าค่าสูงสุดอายุขัดการเกิดในโลกฮันเตอร์ ให้ Claude ปรับตารางโดยอธิบายและวัดผล ไม่ยกเลิกการมีอายุเพื่อแก้เควส

migration มี estimated age ต้องตั้ง lifeMaxY อย่างน้อย currentAgeY+1 ไม่ให้คนเก่าตายทันทีเพียงเพราะพึ่งเพิ่มฟิลด์. ทุก update ย้อนไป throughWorldM ที่ประมวลแล้วเป็น no-op. Batch updateหลายปีต้องเหมือนเรียกทุกเดือน; consume RNG ต่อ due event เท่านั้น เรียงchronologicalและID. หาก death/promotion ทับวันเดียวให้ deathมาก่อนและไม่สุ่ม promotionให้คนตาย

mutable data ownership: ID/name/born/died/country/city/background rank อยู่ canonical; active team rank/lv/loyalty/wounds อยู่ team เป็นเจ้าของในเฟสนี้และ personอ่านผ่าน adapter; ห้ามbackground updateเขียนทับข้อมูลทีม. เมื่อถอดสมาชิกออกจากทีมให้ snapshot stats ปัจจุบันเป็นcanonicalก่อนเริ่มbackground progression. ทุกworld/teamdeathต้องmark canonicalด้วย setPersonStatus; roster projectionไม่ใช้aliveเก่าขัดผลใหม่

## N. Automation — owner Task4

ทุก narrative choice ที่เปลี่ยน route, รับคำสัญญา, ใช้ทุนธุรกิจ หรือมี lethal risk กำหนด noAuto=true. ความเสี่ยงสูงที่ผู้เล่นรับรู้แสดงก่อนเลือก; secret conditionไม่เป็นข้ออ้างซ่อนความเสี่ยงตาย. Routine beatอัตโนมัติได้เมื่อไม่มี irreversibility ตามรายการนี้

auto.js ต้องตรวจ discriminant narrative/noAuto ก่อน heuristicเดิม. การแสดง odds/การเลือก focusไม่มีสิทธิ์เลือกchoiceแทน. สำหรับbot playtesterให้ส่ง explicit authored test policyเข้าchooserของtestโดยเก็บ traceว่าบอตเลือกเอง ไม่อ้างว่าเป็นpolicy autoปลอดภัยในผลิตภัณฑ์. Test must assert core state/choice remains pendingเมื่อ autoควรหยุด ไม่วัดแค่ข้อความ“หยุด”บนหน้าจอ


## O. Node-level cast requirements

`cast` ของเรื่องผูกคนตอนเริ่มเพียงครั้งเดียว; node อาจระบุ `requiredCast:['claimant']` เพื่อบังคับ alive/location สำหรับฉากนั้น. ถ้าไม่มี requiredCast ให้ถือว่าไม่ต้องมีคนมาพูดสด แต่ยังอ้างประวัติ/ชื่อผู้เสียชีวิตได้ผ่านข้อความที่เขียนว่าคืออดีต. validator ต้องบังคับทุก template ที่ใช้ live speaker ประกาศ requiredCast. interruption node เช่น claimant-gone ต้องไม่ require claimant มีชีวิต มิฉะนั้นจะขัดการเปิดฉากเอง. เมื่อ bind ตอนเริ่มสำเร็จแล้ว castUnavailable ห้าม bind คนใหม่ทับ ID เดิม
