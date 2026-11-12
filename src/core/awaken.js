// Awakening, rank, hidden ceiling and class. Spec §5. Never log rarity or ceiling.
import { ch, wp, mk, shuf } from "./rng.js";
import { stream, ageY, log } from "./state.js";
import { hooks, resolvers } from "./events.js";
import { monthly } from "./registry.js";
import { RANKS, RANK_W, EX_P, AWAKEN_RATE, CEIL_W } from "../data/world.js";
import { CLASSES, RARITY } from "../data/classes.js";
import { SKILLS as SK } from "../data/skills.js";

export const LV_CAP = [10, 20, 30, 40, 55, 70, 90, 120];
const LATE_P = 0.00008;
const APT_W = [3, 2, 1.2];

export const rankName = (rank) => RANKS[rank];
export const slotsFor = (rank) => 4 + [3, 5, 6].filter((x) => rank >= x).length;

export function rollRank(r) {
  if (ch(r, EX_P)) return 7;
  return wp(r, RANK_W.map((w, i) => ({ i, w }))).i;
}

export function rollCeil(r, rank) {
  if (rank === 7) return 7;
  const add = wp(r, CEIL_W.map((w, i) => ({ i, w }))).i;
  return Math.min(6, rank + add);
}

// Three classes this seed leans toward. Fixed per seed, independent of play.
export const aptitude = (s) => shuf(mk(s.seed, "apt"), Object.keys(CLASSES)).slice(0, 3);

export function rollClass(s, rank = s.hunter?.rank ?? 0) {
  const r = stream(s, "cls");
  // Legendary classes are unique in the world; Mythic ones only answer an EX awakening.
  const taken = new Set(s.world.roster.filter((n) => CLASSES[n.cls]?.rarity === 3).map((n) => n.cls));
  const tierOk = (i) => (i === 4 ? rank === 7 : true) && avail(i, taken).length;
  const tiers = RARITY.map((t, i) => ({ i, w: rank === 7 && i === 4 ? 30 : t.w })).filter((t) => tierOk(t.i));
  const tier = wp(r, tiers).i;
  const apt = aptitude(s);
  const pool = avail(tier, taken).map((id) => {
    const a = apt.indexOf(id);
    const fit = 1 + Math.max(0, s.st[CLASSES[id].main] - 8) * 0.08;
    return { id, w: (a >= 0 ? APT_W[a] : 1) * fit };
  });
  return wp(r, pool).id;
}

const avail = (tier, taken) => Object.keys(CLASSES).filter((id) => CLASSES[id].rarity === tier && !taken.has(id));

const startSkills = (cls) => CLASSES[cls].skills.filter(([lv]) => lv <= 1).map(([, id]) => id);

function awaken(s, cause) {
  const r = stream(s, "rank");
  const rank = rollRank(r);
  const cls = rollClass(s, rank);
  const skills = startSkills(cls);
  s.hunter = {
    // power comes with the rank: a C awakens as strong as a D at its peak (balance pass: high ranks never caught up)
    rank, rank0: rank, ceil: rollCeil(r, rank), cls, lv: rank > 0 ? LV_CAP[Math.min(6, rank - 1)] : 1, xp: 0,
    skills, slots: skills.slice(0, slotsFor(rank)), ex: rank === 7, broke: 0,
  };
  hooks.learn?.(s);
  const rare = CLASSES[cls].rarity >= 2 || rank >= 5;
  const how = {
    screen: "แท่นวัดมานาสว่างขึ้นใต้ฝ่ามือ",
    event: "บางอย่างในตัวคุณแตกออก",
    late: "เช้าวันหนึ่งโลกดูชัดผิดปกติ",
  }[cause];
  log(s, "ตื่นพลัง", `${how} คุณคือผู้ปลุกพลัง แรงก์ ${RANKS[rank]} คลาส ${CLASSES[cls].n}`, "leg");
  if (rare) log(s, "ตื่นพลัง", "ผู้ประเมินของสมาคมเงียบไปนานผิดปกติ ก่อนจะยกหูโทรศัพท์", "imp");
}

export function awakenCheck(s, cause) {
  if (s.hunter) return false;
  if (cause === "event") { awaken(s, cause); return true; }
  const r = stream(s, "awaken");
  const boost = Math.min(0.03, ((s.c.nearRift ?? 0) + (s.c.trainHard ?? 0)) * 0.01);
  const p = cause === "screen" ? AWAKEN_RATE - 0.03 + boost : LATE_P;
  if (!ch(r, p)) return false;
  awaken(s, cause);
  return true;
}

export function canRankUp(s) {
  const h = s.hunter;
  return !!h && h.rank < 7 && h.lv >= LV_CAP[h.rank] && h.rank < h.ceil;
}

export function rankUp(s) {
  if (!canRankUp(s)) return false;
  const h = s.hunter;
  h.rank++;
  log(s, "แรงก์", `สมาคมประเมินคุณใหม่ ตอนนี้คุณคือฮันเตอร์แรงก์ ${RANKS[h.rank]}`, "leg");
  return true;
}

export function ceilingHint(s) {
  const h = s.hunter;
  if (!h || h.rank !== h.ceil || h.lv < LV_CAP[h.rank] * 0.9) return null;
  return "ช่วงนี้ฝึกเท่าไรก็รู้สึกเหมือนชนกำแพงที่มองไม่เห็น";
}

hooks.act.awakenEvent = (s) => awakenCheck(s, "event");

hooks.act.awakenScreen = (s) => {
  if (!awakenCheck(s, "screen")) log(s, "หมุดหมาย", "แสงบนแท่นดับลงอย่างเงียบๆ คุณยังเป็นคนธรรมดา", "");
};

monthly.push((s) => {
  const a = ageY(s);
  if (!s.hunter && a >= 25 && a <= 45 && awakenCheck(s, "late")) s.c.lateAwake = 1;
});

resolvers.role = (s) => CLASSES[s.hunter?.cls]?.role ?? null;
resolvers.skillName = (id) => SK[id]?.n ?? id;
resolvers.clsName = (id) => CLASSES[id]?.n ?? id;

