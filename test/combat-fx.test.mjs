import {test} from 'node:test';import assert from 'node:assert/strict';
import {monsterStrike,admitEffect} from '../src/combat-fx.js';
test('creature strikes express physical vs spectral identity without changing combat',()=>{
 assert.equal(monsterStrike('ปลาไร้น้ำ').name,'melee/claw-swipe');
 for(const name of ['เงาใต้ท่าเทียบ','ผู้โดยสารคนสุดท้าย','อาจารย์ที่ยังสอนอยู่']){
  const fx=monsterStrike(name);assert.equal(fx.name,'impacts/blunt-hit');assert.ok(fx.options.palette);
 }
 assert.equal(monsterStrike('unknown').name,'impacts/blunt-hit');
});
test('rapid effects stay at four total and two copies while newest impact remains visible',()=>{
 let active=[];
 for(let i=0;i<100;i++){
  const next={name:'fx-'+i%3,id:i};active=admitEffect(active,next);
  assert.ok(active.length<=4);assert.equal(active.at(-1),next);
  for(const f of active)assert.ok(active.filter(x=>x.name===f.name).length<=2);
 }
});
