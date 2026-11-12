import {test} from 'node:test';
import assert from 'node:assert/strict';
import {characterKey,frameIndex} from '../src/character-identity.js';
test('public sex, life stage and profession select independent identities',()=>{
 for(const sex of ['m','f']) {
  assert.equal(characterKey(0,'knight','doc',sex),`age-infant-${sex}`);
  assert.equal(characterKey(18,null,null,sex),`age-toddler-${sex}`);
  assert.equal(characterKey(300,'knight','doc',sex),`class-knight-${sex}`);
  assert.equal(characterKey(300,null,'doc',sex),`career-doc-${sex}`);
  assert.equal(characterKey(950,null,null,sex),`age-old-${sex}`);
 }
 assert.equal(characterKey(300,null,null,'unknown'),'age-adult-m');
});
test('four frame playback loops deterministically and freezes for calm/busy',()=>{
 assert.deepEqual([0,.25,.5,.75,1].map(t=>frameIndex(t,1)),[0,1,2,3,0]);
 for(const t of [-1,0,.5,10,NaN,Infinity]){
  assert.equal(frameIndex(t,4,true),0);
  assert.equal(frameIndex(t,4,false,true),0);
  assert.ok([0,1,2,3].includes(frameIndex(t,4)));
 }
});
import {readFileSync} from 'node:fs';
import {CLASSES} from '../src/data/classes.js';
import {CAREERS} from '../src/data/careers.js';
import {classArt,careerArt} from '../src/ui/art.js';
test('every age and playable role ships separate four-frame male and female sheets',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../art/animation/manifest.json',import.meta.url)));
 const keys=new Set();
 for(const sex of ['m','f']) {
  for(const age of [0,18,72,168,300,600,800,950])keys.add(characterKey(age,null,null,sex));
  for(const id of Object.keys(CLASSES))keys.add(characterKey(300,classArt(id),null,sex));
  for(const id of Object.keys(CAREERS))keys.add(characterKey(300,null,careerArt(id),sex));
 }
 assert.equal(keys.size,68);assert.equal(Object.keys(manifest).length,68);
 for(const key of keys){
  const item=manifest[key];assert.ok(item,key);
  const png=readFileSync(new URL('../'+item.file,import.meta.url));
  assert.equal(png.readUInt32BE(16),256,key);assert.equal(png.readUInt32BE(20),64,key);
  assert.equal(item.baseline,60);assert.equal(item.frames,4);
 }
});
