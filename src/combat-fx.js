import {MONSTERS} from './data/monsters.js';
const spectral=['#101c32','#21364e','#365a72','#548b99','#8bbebc','#c4dfd5','#e4eee2'];
const physical=['#24252b','#41454c','#6b7079','#8b9295','#b4b7ac','#d5d4b8','#efe8ce'];
// Presentation only: names/kinds choose a contact cue, never power or hidden affinity.
export function monsterStrike(name) {
 const beast=MONSTERS[name]?.kind==='beast', spirit=MONSTERS[name]?.kind==='spirit';
 return {name:beast?'melee/claw-swipe':'impacts/blunt-hit',offset:beast?38:0,
  options:{flip:true,light:.22,palette:spirit?spectral:physical,
   warm:spirit?'#8bbebc':'#c4bda8',dust:spirit?'#548b99':'#8b9295',clod:spirit?'#21364e':'#41454c',
   sparks:spirit?spectral.slice(-4):physical.slice(-4)}};
}
export function admitEffect(active,next) {
 let same=0;
 const kept=active.slice().reverse().filter(f=>f.name!==next.name||++same<2).reverse();
 return [...kept.slice(-3),next];
}
