// Frame styling uses only the player's known rank and current occupation, never rarity or ceiling.
import { CLASSES, ROLES } from '../data/classes.js';
import { CAREERS } from '../data/careers.js';
const COLORS = ['#b5c6d7','#83c9ac','#6ecbd4','#86adff','#c2a0ff','#eeaa76','#f5d580','#eca7dd'];
const JOBS = {
  office:['#b6a5db','document'], shop:['#e4bd7c','scale'], doc:['#87d6bb','care'], hdoc:['#87d6bb','care'],
  porter:['#d9a079','box'], press:['#88bdde','quill'], police:['#8daeff','shield'], teach:['#d8ba8d','book'],
  agency:['#b4a8e0','scale'], appraise:['#7fd2ce','gem'], rescue:['#efb18b','care'], cook:['#e6bd91','bowl'],
};
const ROLE_MARK = {vanguard:'shield',striker:'blade',support:'care',scout:'compass',artisan:'gem'};
export function profileStyle(s) {
  const age = Math.max(0, Number(s.ageM) || 0);
  if (age < 36) return {color:'#9bd0c6',mark:'star',label:age<12?'ทารก':'วัยเตาะแตะ',badge:age<12?'แรกวัย':'ก้าวแรก',grade:'young'};
  if (s.hunter) {
    const h=s.hunter, rank=Math.max(0,Math.min(7,h.rank)), hidden=!!s.flags?.hiddenRank;
    return {color:hidden?COLORS[0]:COLORS[rank],mark:ROLE_MARK[CLASSES[h.cls]?.role] || 'shield',
      label:ROLES[CLASSES[h.cls]?.role] || 'ฮันเตอร์',badge:hidden?'—':['F','E','D','C','B','A','S','EX'][rank],
      grade:hidden?'base':rank>=5?'crown':rank>=3?'crest':'base'};
  }
  const job=JOBS[s.job?.id], tier=Math.max(0,Math.min(4,s.job?.tier || 0));
  return {color:job?.[0] || '#9dbdc9',mark:job?.[1] || 'star',label:CAREERS[s.job?.id]?.n || (age<156?'วัยเด็ก':'เส้นทางชีวิต'),
    badge:job?['I','II','III','IV','V'][tier]:'✦',grade:job&&tier>=3?'crest':'base'};
}
