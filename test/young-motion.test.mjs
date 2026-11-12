import {test} from 'node:test';
import assert from 'node:assert/strict';
import {youngMotion} from '../src/young-motion.js';
test('young idle motion is bounded, differs by age and stops for reduced motion',()=>{
  const samples=Array.from({length:100},(_,i)=>i/10);
  assert.ok(samples.some(t=>youngMotion('toddler',t).lift>0));
  for(const t of samples){
    const baby=youngMotion('infant',t), toddler=youngMotion('toddler',t);
    assert.ok(Math.abs(baby.x)<=1);assert.equal(baby.lift,0);
    assert.ok(Math.abs(toddler.x)<=5&&toddler.lift>=0&&toddler.lift<=2);
    assert.deepEqual(youngMotion('toddler',t,true),{x:0,lift:0});
    assert.deepEqual(youngMotion('adult',t),{x:0,lift:0});
  }
});
