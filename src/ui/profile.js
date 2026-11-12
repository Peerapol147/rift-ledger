// An original character dossier, illustrated with this project's existing sprites.
import { profileStyle } from './profile-style.js';
import { PORTRAITS } from './portraits.js';
import { careerArt, classArt } from './art.js';
import { motionProfile } from '../character-motion.js';
import { CLASSES } from '../data/classes.js';
import { makeHeroArt } from '../hero-art.js';
import { civilianArt } from '../civilian-art.js';
import { esc } from './dom.js';
import toddler from '../../art/civilian-ages/toddler.png';
import primary from '../../art/civilian-ages/primary.png';
import junior from '../../art/civilian-ages/junior.png';
import adult from '../../art/civilian-ages/senior.png';
const MARKS = {
  shield:'M12 3 21 7v6c0 5-9 10-9 10S3 18 3 13V7Z M12 7v11 M7 11h10',
  blade:'M5 21 19 3l2 2L7 23 M4 16l7 6 M3 23l2-2',
  care:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z',
  compass:'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M16 7l-3 8-6 2 3-8Z',
  gem:'M3 9 8 3h8l5 6-9 13Z M3 9h18 M8 3l4 19 4-19',
  document:'M5 3h10l4 4v15H5Z M14 3v5h5 M8 12h8 M8 16h8',
  scale:'M12 3v18 M6 21h12 M3 7h18 M6 7 2 15h8Z M18 7l-4 8h8Z',
  box:'M3 7l9-4 9 4v13l-9 3-9-3Z M3 7l9 4 9-4 M12 11v12',
  quill:'M4 21 18 3l3 1-2 8-7 4Z M8 16l9-9 M3 23h12',
  book:'M12 6C8 3 4 3 2 4v16c4-1 7-1 10 2 3-3 6-3 10-2V4c-2-1-6-1-10 2Z M12 6v16',
  bowl:'M3 12h18c0 7-5 9-9 9s-9-2-9-9Z M8 8V3 M12 8V2 M16 8V3 M7 23h10',
  star:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
};
const emblem = mark => `<svg viewBox="0 0 24 26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="${MARKS[mark] || MARKS.star}"/></svg>`;
// Reuse the original code-native swaddled infant; the stage uses this same artwork before age one.
const youngPortrait = ageM => {
  const art=makeHeroArt(ageM), rects=[];
  art.rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(art.palette[c])rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${art.palette[c]}"/>`);}));
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 ${art.rows.length}" shape-rendering="crispEdges">${rects.join('')}</svg>`);
};
const infant = youngPortrait(0), little = youngPortrait(12);
export function profileVisual(s) {
  const style=profileStyle(s), age=s.ageM;
  const motion=motionProfile(age,s.hunter?classArt(s.hunter.cls):null,s.job?careerArt(s.job.id):null);
  const art=age<12?infant:age<36?little:s.hunter?PORTRAITS[CLASSES[s.hunter.cls]?.art]
    :s.job?PORTRAITS['career-'+careerArt(s.job.id)]:({toddler,primary,junior,senior:adult})[civilianArt(age)?.id];
  return `<div class="profile-art grade-${style.grade}" style="--profile:${style.color};--motion-time:${motion.period}s;--motion-turn:${motion.amount}deg" data-motion="${motion.kind}">
    <div class="profile-orbit" aria-hidden="true"></div><div class="profile-sigil">${emblem(style.mark)}</div>
    <span class="profile-caption">${esc(style.label)}</span>
    ${art?`<img title="${esc(motion.label)}" class="profile-sprite ${age<12?'infant':age<36?'toddler':''}" src="${art}" alt="ภาพประกอบ${esc(style.label)}" draggable="false">`:''}
    <div class="rank-medallion"><small>${age<36?'ช่วงวัย':s.hunter?'แรงก์':s.job?'ระดับงาน':'ชีวิต'}</small><b>${esc(style.badge)}</b></div>
    <div class="profile-rail" aria-hidden="true"><i></i><span>◆</span><i></i></div>
  </div>`;
}
