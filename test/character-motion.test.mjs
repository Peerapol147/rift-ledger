import {test} from 'node:test';import assert from 'node:assert/strict';
import {motionProfile,CLASS_MOTION,CAREER_MOTION} from '../src/character-motion.js';
import {CLASSES} from '../src/data/classes.js';import {CAREERS} from '../src/data/careers.js';
import {classArt,careerArt} from '../src/ui/art.js';
test('every playable class and career has an explicit public motion motif',()=>{
 for(const id of Object.keys(CLASSES))assert.ok(CLASS_MOTION[classArt(id)],id);
 for(const id of Object.keys(CAREERS))assert.ok(CAREER_MOTION[careerArt(id)],id);
 assert.equal(new Set(Object.values(CLASS_MOTION).map(p=>p.label)).size,15);
});
test('every age and role has finite positive playback duration',()=>{
 const profiles=[0,18,72,168,300,600,800,950].map(age=>motionProfile(age));
 profiles.push(...Object.values(CLASS_MOTION),...Object.values(CAREER_MOTION));
 for(const profile of profiles)assert.ok(Number.isFinite(profile.period)&&profile.period>0);
 assert.equal(motionProfile(0,'knight','doc').kind,'infant');
});
