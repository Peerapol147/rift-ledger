import {test} from 'node:test';import assert from 'node:assert/strict';
import {profileStyle} from '../src/ui/profile-style.js';
import {makeHeroArt,lifeStage} from '../src/hero-art.js';
import {civilianArt} from '../src/civilian-art.js';
test('infancy and toddler age boundaries do not wear professional badges',()=>{
 for(const [ageM,label] of [[0,'ทารก'],[11,'ทารก'],[12,'วัยเตาะแตะ'],[35,'วัยเตาะแตะ']]){
  assert.equal(profileStyle({ageM,job:{id:'doc',tier:4}}).label,label);
 }
 assert.equal(lifeStage(0),'infant');assert.equal(lifeStage(1),'toddler');assert.equal(lifeStage(3),'child');
 assert.equal(civilianArt(0),null);assert.equal(civilianArt(11),null);assert.ok(civilianArt(12));
 assert.equal(makeHeroArt(0).life,'infant');
});
test('rank frame depends on known rank, not hidden ceiling or class rarity',()=>{
 const s={ageM:240,hunter:{rank:3,cls:'knight',ceil:4},flags:{}};
 assert.deepEqual(profileStyle(s),profileStyle({...s,hunter:{...s.hunter,ceil:7}}));
 assert.equal(profileStyle(s).badge,'C');
 const a=profileStyle({...s,flags:{hiddenRank:true}});
 const b=profileStyle({...s,hunter:{...s.hunter,rank:7},flags:{hiddenRank:true}});
 assert.deepEqual(a,b);assert.equal(a.badge,'—');
});
test('civilian professions get their own insignia and progression',()=>{
 const doc=profileStyle({ageM:300,job:{id:'doc',tier:3}}), cook=profileStyle({ageM:300,job:{id:'cook',tier:0}});
 assert.notEqual(doc.mark,cook.mark);assert.notEqual(doc.color,cook.color);assert.equal(doc.badge,'IV');
});
