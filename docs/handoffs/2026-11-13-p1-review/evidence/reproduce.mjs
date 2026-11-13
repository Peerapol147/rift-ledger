// Read-only review probes. All mutations use synthetic state / in-memory storage.
// Run from repository root: node docs/handoffs/2026-11-13-p1-review/evidence/reproduce.mjs
// Reports observed bugs; this is evidence, not the future regression suite.
import * as C from '../../../../src/core/index.js';
import { CLASSES } from '../../../../src/data/classes.js';
const report = {};
const future = C.newLife('review-future'); future.sv = C.SAVE_SV + 1; future.gold = 99999;
const backup = C.newLife('review-future'); backup.gold = 100;
const key = 'riftledger.slot.v2.0';
const data = new Map([[key, C.serialize(future)], [key + '.bak', C.serialize(backup)]]);
const store = C.slots({ get:k=>data.get(k), set:(k,v)=>data.set(k,v), del:k=>data.delete(k) });
const loaded = store.load(0);
report.futureSave = { loadedVersion:loaded?.sv, loadedGold:loaded?.gold };
if (loaded) store.save(0, loaded);
report.futureSave.afterSaveVersion = JSON.parse(data.get(key)).sv;
report.futureSave.originalNewerBytesPreserved = data.get(key) === C.serialize(future);
const ally = C.newLife('review-ally'); ally.hunter = {rank:2}; C.hooks.act.loyalAlly(ally);
report.swornAlly = { personId:ally.team[0]?.personId ?? null,
  afterReload:C.deserialize(C.serialize(ally))?.team[0]?.personId ?? null };
const inherited = C.newLife('review-inherit');
inherited.party = {leader:{n:'Synthetic leader',rank:2},trust:90}; C.leaveParty(inherited,'inherit');
report.inheritedTeam = inherited.team.map(m=>m.personId ?? null);
const hunter = C.newLife('review-hunter'); hunter.ageM=360;
hunter.hunter={rank:0,cls:Object.keys(CLASSES)[0],lv:1,xp:0,ceil:0,skills:[]};
hunter.flags.stoppedHunting=true;
report.retiredEvents=C.randomPool(hunter).filter(e=>e.id.startsWith('k2')&&e.hunter).map(e=>e.id);
hunter.flags.stoppedHunting=false;
report.fabricatedHistory=C.eligible(hunter,C.EVENT_INDEX.get('k2Freeze'));
C.openEvent(hunter,C.EVENT_INDEX.get('k2PotionThief'));C.choose(hunter,2);
report.potionBan={canHunt:C.canHunt(hunter),until:hunter.c.huntBreakUntil??null};
const parent=C.newLife('review-parent');parent.ageM=480;
C.applyOutcome(parent,{c:{kids:1},act:'kidBorn'});parent.ageM++;
report.newbornSchool={monthsSinceBirth:parent.ageM-parent.c.kidAt,
  eligible:C.eligible(parent,C.EVENT_INDEX.get('adKidSchool'))};
const jobless=C.newLife('review-jobless');jobless.ageM=360;
jobless.c.k2Course=1;jobless.c['at:k2Course']=324;
report.joblessBossScene=C.eligible(jobless,C.EVENT_INDEX.get('k2CourseLater'));
console.log(JSON.stringify(report,null,2));
