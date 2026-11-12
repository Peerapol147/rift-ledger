import {test} from 'node:test';import assert from 'node:assert/strict';
import {motionProfile,motionPose,CLASS_MOTION,CAREER_MOTION} from '../src/character-motion.js';
import {CLASSES} from '../src/data/classes.js';import {CAREERS} from '../src/data/careers.js';
import {classArt,careerArt} from '../src/ui/art.js';
test('every playable class and career has an explicit public motion motif',()=>{
 for(const id of Object.keys(CLASSES))assert.ok(CLASS_MOTION[classArt(id)],id);
 for(const id of Object.keys(CAREERS))assert.ok(CAREER_MOTION[careerArt(id)],id);
 assert.equal(new Set(Object.values(CLASS_MOTION).map(p=>p.label)).size,15);
});
test('age and profession motion is bounded, animated, and neutral during calm or combat',()=>{
 const profiles=[0,18,72,168,300,600,800,950].map(age=>motionProfile(age));
 profiles.push(...Object.values(CLASS_MOTION),...Object.values(CAREER_MOTION));
 for(const profile of profiles){
  const poses=Array.from({length:100},(_,i)=>motionPose(profile,i/10));
  assert.ok(new Set(poses.map(p=>JSON.stringify(p))).size>1,profile.label);
  for(const pose of poses)for(const value of Object.values(pose))assert.ok(Number.isFinite(value)&&Math.abs(value)<=6);
  assert.deepEqual(motionPose(profile,1,true),motionPose(profile,1,false,true));
  assert.ok(Object.values(motionPose(profile,1,true)).every(x=>x===0));
 }
 assert.equal(motionProfile(0,'knight','doc').kind,'infant');
});
