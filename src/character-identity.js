import {lifeStage} from './hero-art.js';
export function characterKey(ageM=0,classId=null,career=null,sex='m') {
 const age=Math.max(0,Number(ageM)||0), suffix=sex==='f'?'f':'m';
 const identity=age<36?'age-'+lifeStage(age/12):classId?'class-'+classId
  :career?'career-'+career:'age-'+lifeStage(age/12);
 return identity+'-'+suffix;
}
export function frameIndex(time,period,calm=false,busy=false) {
 if(calm||busy||!Number.isFinite(time)||time<0||!(period>0))return 0;
 return Math.floor((time%period)/period*4)%4;
}
