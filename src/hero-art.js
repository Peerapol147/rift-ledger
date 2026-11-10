import { CHILD_ART } from "./child-art.js";
// Original code-native art. Shared grid, outline and palette across life stages.
const CHILD = ["........nnn.........","......nnhhhnn.......",".....nhhhhHhhn......","....nhHHhhhhhhhn....","....nhhhhhhhhhhn....","...nhhhhsSSshhhn....","....nhhssSSSshn.....","....nsssnSsnssn.....",".....nsSSSSSsn......","......nssSssn.......",".......nssnn........",".....nncttcann......","....ncCcttcacn......","...ncCCcttcacn......","...ncCcntncabn......","...nssnctncbbn......","...nSsnccncbbn......","....nnnccnnnn.......","......nddDdn........","......nddDdn........","......ndnndn........",".....nddnnddn.......",".....nwwnnwwn.......",".....nnnnnnnn......."];
const BASE = {"n":"#202333","h":"#493642","H":"#73505a","s":"#dda17f","S":"#ffd0a3","c":"#277d83","C":"#52b3ac","t":"#f3dfb3","a":"#bf854d","b":"#835638","d":"#34455f","D":"#526c87","w":"#eee4cf"};
export const AGE_STAGES = ['infant', 'child', 'teen', 'adult', 'middle', 'elder', 'old'];
export const lifeStage = (age) => age < 3 ? 'infant' : age < 13 ? 'child' : age < 18 ? 'teen' : age < 45 ? 'adult' : age < 60 ? 'middle' : age < 75 ? 'elder' : 'old';
// Standing height in stage pixels by age, so every model grows and shrinks like a person: fast as a toddler, a spurt in the teens, a slow settle after 60.
const HT = [[0, 18], [1, 22], [3, 28], [6, 34], [10, 40], [13, 46], [16, 52], [19, 56], [45, 56], [60, 54], [75, 51], [99, 48]];
export function heightAt(ageM = 0) {
  const a = Math.max(0, Number(ageM) || 0) / 12;
  for (let i = 1; i < HT.length; i++) if (a <= HT[i][0]) { const [a0, h0] = HT[i - 1], [a1, h1] = HT[i]; return Math.round(h0 + (h1 - h0) * (a - a0) / (a1 - a0)); }
  return HT[HT.length - 1][1];
}
export const CAREER_ART = ['doc', 'smith', 'cop', 'cook'];
export function makeHeroArt(ageM = 0, career = null, tint = '#277d83') {
  const age = Math.max(0, Number(ageM) || 0) / 12;
  const life = lifeStage(age);
  if (!career && age >= 3 && age < 18) {
    const source = CHILD_ART.rows;
    // Same face and costume grow smoothly before awakening.
    const height = age < 7 ? 32 + Math.floor((age - 3) * 2) : age < 13 ? 40 + Math.floor((age - 7) / 2) : 46;
    const head = 14, torso = source.slice(head);
    const rows = [...source.slice(0, head), ...Array.from({length:height-head}, (_,i) => torso[Math.min(torso.length-1, Math.floor(i*torso.length/(height-head)))])];
    return {rows, palette:CHILD_ART.palette, life, job:null, preclass:true};
  }
  const pal = {...BASE};
  let rows = [...CHILD];
  if (life === 'infant') rows = [...rows.slice(0, 11), '......nttttn........', '.....nttttttn.......', '.....nttttttn.......', '......nttttn........', '.......nnnn.........'];
  if (life === 'teen') rows.splice(19, 0, rows[19], rows[19]);
  if (life !== 'infant' && life !== 'child' && life !== 'teen') {
    rows.splice(17, 0, rows[16], rows[16]);
    rows.splice(21, 0, rows[20], rows[20], rows[20]);
  }
  // Hair greys in steps: streaks at 45, grey at 60, white at 75. Older bodies lose a row and stoop.
  if (life === 'middle') { pal.H = '#9c9aa3'; }
  if (life === 'elder') { pal.h = '#8d8c96'; pal.H = '#d4d0c8'; rows.splice(18, 1); }
  if (life === 'old') { pal.h = '#cfcac0'; pal.H = '#f3efe6'; pal.s = '#c99878'; rows.splice(18, 2); }
  // Childhood has no speculative profession. Active jobs dress teens and older.
  const job = age >= 13 && CAREER_ART.includes(career) ? career : null;
  if (!job && age >= 18) { pal.c = tint; pal.C = '#8fc9c2'; }
  const grid = rows.map(r => r.split(''));
  const put = (x, y, text) => { if (grid[y]) [...text].forEach((v,i) => { if (x+i < 20) grid[y][x+i] = v; }); };
  if (job === 'doc') {
    Object.assign(pal, {c:'#d6e5e3', C:'#ffffff', t:'#51a6a7', a:'#526878', b:'#91b9b6', r:'#dc786a'});
    put(5, 5, 'tttttttt'); put(9, 5, 'r');
    put(7, 13, 'n'); put(7, 14, 'n'); put(8, 15, 'nn');
    put(12, 16, 'trt'); put(12, 17, 'ttt');
  } else if (job === 'smith') {
    Object.assign(pal, {c:'#95543d', C:'#cb8050', t:'#e7ba79', a:'#4c3432', b:'#684438', m:'#a2b6c3'});
    put(7, 13, 'aaaa'); put(7, 14, 'abba'); put(7, 15, 'abba'); put(7, 16, 'abba'); put(7, 17, 'aaaa');
    put(15, 12, 'nnnn'); put(15, 13, 'nmmn'); put(15, 14, 'nnnn'); put(16, 15, 'a'); put(16, 16, 'a'); put(15, 17, 'ss');
  } else if (job === 'cook') {
    Object.assign(pal, {c:'#e8dfcb', C:'#fff5df', t:'#aa584b', a:'#477d73', b:'#31594f', m:'#879ba8'});
    put(6,0,'nnnnnn'); put(4,1,'nnwwwwwwnn'); put(4,2,'nwwwwwwwwn');
    put(5,3,'nwwwwwwn'); put(5,4,'naaaaaan');
    put(7,13,'aaaa'); put(7,14,'abba'); put(7,15,'abba'); put(7,16,'abba'); put(7,17,'aaaa');
    put(14,15,'nnnnn'); put(14,16,'nmmmn'); put(15,17,'nnn'); put(13,15,'s');
  } else if (job === 'cop') {
    Object.assign(pal, {c:'#354b75', C:'#607da3', t:'#88a7b9', a:'#d4ab60', b:'#273449'});
    put(5, 2, 'nnnnnnnn'); put(4, 3, 'nccccccccn'); put(4, 4, 'nnnnannnnn');
    put(6, 13, 'a'); put(6, 14, 'a'); put(7, 17, 'nnann');
    put(14, 14, 'nn'); put(14, 15, 'bn');
  }
  if (life === 'old') { pal.k = '#7a5a3a'; for (let y = 12; y < grid.length; y++) grid[y][15] = 'k'; grid[12][14] = 'k'; }
  return {rows:grid.map(r=>r.join('')), palette:pal, life, job};
}
