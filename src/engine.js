// Rules only, no DOM: runs in the browser and in tools/sim.mjs. Everything in `s` is plain JSON.
import { mk, rnd, ri, pk, ch, wp, shuf, hash } from "./rng.js";
import * as D from "./data.js";
const { STATS, RANKS, LVCAP, RANK_LIFE, ELEMENTS, FORMS, SKILL_GRADES, CLASSES, SPECIALS, LATENTS, CAREERS, WEAPONS, ARMORS, CHARMS, GRADES, QUAL, AFFIX, ENH_ODDS, MON, BOSS, ZONES, EVENTS, WORLD, HALLS, GUILD_ROLES } = D;

export const fxOut = [];
const emit = (n, a) => fxOut.push({ n, a });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fill = (t, c) => t.replace(/(ที่|ใน|จาก|ของ|ล่า|ฝูง|ผ่าน|กับ|ให้|ถึง|สู่|แห่ง) (?=\{(?:z|mon)\})/g, "$1").replace(/\{(\w+)\}/g, (_, k) => c[k] ?? "");
// Narration rotates through D.LINES without touching the seeded RNG, so a seed still plays the same.
const raw = (s, k) => { const a = D.LINES[k], m = (s.lineN ||= {}); m[k] = (m[k] ?? s.seed.length + k.length) + 1; return a[m[k] % a.length]; };
const line = (s, k, c = {}) => fill(raw(s, k), c);
const text = (s, m) => (m?.[0] === "@" ? line(s, m.slice(1)) : m || "");
export const fmt = (n) => Math.round(n).toLocaleString("en-US");
export const log = (s, t, tag = "", cls = "", r = "") => { s.log.push({ y: Math.floor(s.ageM / 12), t, tag, cls, r }); if (s.log.length > 600) s.log.splice(0, 80); };

// Stat drills. Gains shrink as a stat grows, and the month earns no hunt income, so drilling is a real trade against levelling.
const TRAIN = { body: [["str", 0.34], ["agi", 0.14]], mind: [["int", 0.32], ["wil", 0.16]], soc: [["cha", 0.3], ["luk", 0.1]] };
function drill(s, f) { for (const [k, v] of TRAIN[f]) s.st[k] += v * clamp(1.3 - s.st[k] / 90, 0.35, 1.1); if (f === "body") hurt(s, -1.5); }
export const FOCUS = {
  k: { play: { n: "วิ่งเล่น", st: { luk: 0.1, agi: 0.17, cha: 0.08 } }, study: { n: "ตั้งใจเรียน", st: { int: 0.28, wil: 0.08 } }, sport: { n: "ออกกำลัง", st: { str: 0.26, agi: 0.1 } }, help: { n: "ช่วยงานบ้าน", st: { cha: 0.16, wil: 0.14 }, pay: 4 } },
  h: { hunt: { n: "ล่ารอยแยก" }, tower: { n: "ไต่หอ" }, train: { n: "ฝึกฝน" }, body: { n: "ฝึกกาย" }, mind: { n: "ฝึกปัญญา" }, soc: { n: "สร้างชื่อ" }, guild: { n: "งานกิลด์" }, craft: { n: "ฝึกตีเหล็ก" }, rest: { n: "พักฟื้น" } },
  c: { work: { n: "ทำงาน" }, study: { n: "พัฒนาตัวเอง" }, body: { n: "ออกกำลัง" }, soc: { n: "สร้างสายสัมพันธ์" }, craft: { n: "งานช่างเสริม" }, rest: { n: "อยู่กับครอบครัว" } },
};

// Seed offers four trades, and the household you grew up in adds one it knows.
const careerOffer = (R, fam) => { const a = shuf(R("car"), Object.keys(CAREERS)).slice(0, 4), f = shuf(R("fjob"), fam.job || []).find((x) => !a.includes(x)); return f ? [...a, f] : a; };
export const perkText = (m) => Object.entries(m).map(([k, v]) => `${D.MOD_N[k] || STATS[k] || k} ${v > 0 ? "+" : ""}${v}${k === "life" ? " ปี" : STATS[k] ? "" : "%"}`).join(" · ");
export const halve = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v / 2]));
// who = career and class ids that may see an event or option. Unset means everyone.
export const fits = (s, who) => !who || who.includes(s.cls) || who.includes(s.career) || who.includes(s.pastJob) || who.includes(D.FAMILIES[s.fam].id) || (s.paths || []).some((p) => who.includes(p)) || (s.hunter && who.includes(placeOf(s).id));
// Where a hunter is staying. Older saves have no s.at and start at the home rifts.
export const placeOf = (s) => D.PLACES[s.at || 0];
// A place far below your level stops paying full rate, so moving on matters.
export const placePay = (s, P = placeOf(s)) => P.pay * (s.lv > P.lv + 30 ? 0.75 : 1);

// ---- World and life generation: one named stream per thing, so choices can't reshuffle the world.
export function newLife(seed, name, legacy) {
  seed = String(seed);
  const R = (l) => mk(seed, l), w = R("w"), fam = wp(R("fam"), D.FAMILIES);
  const lat = R("lat"), latent = [], n = ri(lat, 2, 3);
  while (latent.length < n) { const x = wp(lat, LATENTS), i = LATENTS.indexOf(x); if (!latent.includes(i)) latent.push(i); }
  const hasLate = latent.some((i) => LATENTS[i].late);
  const y0 = 2041 + ri(w, 0, 18), specials = shuf(R("sp"), SPECIALS.map((x) => x.id)).filter((x) => x !== "late" && x !== "twoworld").slice(0, 3);
  if (hasLate) specials.push("late", "twoworld");
  const t = R("tower"), bosses = shuf(R("boss"), BOSS), els = Object.keys(ELEMENTS), tower = [];
  for (let f = 1; f <= 100; f++) {
    const b = f % 10 === 0;
    tower.push({ t: b ? "boss" : f % 5 === 0 ? "elite" : wp(t, FLOOR_T).v, el: pk(t, els), mod: pk(t, D.FLOOR_MODS), name: b ? bosses[(f / 10 - 1) % bosses.length] : pk(t, MON) });
  }
  const c = R("cal"), cal = []; for (let a = 12 * ri(c, 2, 5); a < 12 * 160; a += ri(c, 14, 40)) cal.push({ at: a, id: wp(c, WORLD).id, z: pk(c, ZONES) });
  const nr = R("npc"), npcs = [];
  for (let i = 0; i < 24; i++) { const hun = i % 3 !== 2; npcs.push({ n: `${pk(nr, D.GIVEN)} ${pk(nr, D.SUR)}`, job: hun ? "ฮันเตอร์" : CAREERS[pk(nr, Object.keys(CAREERS))].n, hun, lv: ri(nr, 1, hun ? 22 : 1), floor: 0, rel: ri(nr, -6, 28), alive: true, el: pk(nr, els) }); }
  const g = R("gu"), guilds = shuf(g, D.GUILDS).slice(0, 6).map(([n, m, req]) => ({ n, m, req }));
  const pot = ri(w, 10, 88), ceil = pot >= 84 ? 6 : pot >= 70 ? 5 : pot >= 52 ? 4 : pot >= 35 ? 3 : 2;
  const s = {
    v: 1, seed, name, y0, mon0: ri(w, 0, 11), ageM: 0, fam: D.FAMILIES.indexOf(fam), st: { str: 5, agi: 5, int: 5, wil: 5, cha: 5, luk: 5 }, latent, rev: 0, r: R("run"),
    hunter: false, cls: null, spc: null, rank: 0, lv: 1, xp: 0, career: null, pastJob: null, cr: 0, cxp: 0, cMonths: 0, lateAw: 0, health: 100, gold: fam.gold + (legacy?.gold || 0), fame: 0, karma: 0, floor: 0, main: 0,
    sk: [], eq: [], gear: [], wear: { weapon: null, armor: null, charm: null }, gid: 1, mat: {}, pot: 1, stone: 0, token: 0, craft: fam.craft || 0, anvil: 0, guild: null, npcs, spouse: null, kids: [], c: {}, flags: {}, q: [], seen: {}, focus: "play", ev: null, dead: null, log: [], nextMain: 16 * 12, nextExam: 0, spcCd: 0, snap: null,
    w: { awakenAge: ri(w, 16, 19), pot, ceil, lateAge: hasLate ? 12 * ri(w, 30, 44) : 0, aff: shuf(R("aff"), els).slice(0, 2), specials, arcs: shuf(R("arc"), [...new Set(EVENTS.filter((e) => e.arc).map((e) => e.arc))]).slice(0, 8), careers: careerOffer(R, fam), tower, cal, guilds, price: 1, priceT: 0, rival: 0, life: ri(w, 66, 84) },
  };
  for (const k in fam.st) s.st[k] += fam.st[k];
  s.fame = fam.fame || 0; s.karma = fam.karma || 0;
  if (fam.gear) { const g = mkGear(s, ...fam.gear); s.wear[g.slot] = g.id; log(s, `ของที่บ้านมอบให้ตั้งแต่เด็ก: ${gearName(g)}`, "ชะตา", "good"); }
  if (legacy?.gear) { s.gear.push({ ...legacy.gear, id: s.gid++ }); log(s, `มรดกจากรุ่นก่อน: ${gearName(s.gear[0])}`, "มรดก", "good"); }
  if (legacy?.from) log(s, `ทายาทของ ${legacy.from}`, "มรดก", "good");
  log(s, `${name} ลืมตาดูโลกปี ${y0} · ${fam.n}: ${fam.d}`, "ชะตา", "imp");
  s.snap = snap(s); return s;
}
const snap = (s) => ({ gold: s.gold, lv: s.lv, fame: s.fame });
export const dateText = (s) => { const m = s.mon0 + s.ageM; return `ปี ${s.y0 + Math.floor(m / 12)} เดือน ${(m % 12) + 1}`; };
export const age = (s) => Math.floor(s.ageM / 12);
export const stage = (s) => (s.ageM < s.w.awakenAge * 12 && !s.career && !s.hunter ? "k" : s.hunter ? "h" : "c");

// ---- One source list drives every bonus, and the UI shows it as the breakdown.
export function sources(s) {
  const o = [], add = (n, m) => m && o.push({ n, m });
  s.latent.forEach((i, x) => add(x < s.rev ? `พลังแฝง: ${LATENTS[i].n}` : "พลังแฝงที่ยังไม่ตื่น", LATENTS[i].m));
  add(`ที่มา: ${D.FAMILIES[s.fam].n}`, D.FAMILIES[s.fam].m);
  if (s.cls) add(`คลาส: ${CLASSES[s.cls].n}`, CLASSES[s.cls].m);
  if (s.spc) add(`คลาสพิเศษ: ${spc(s.spc).n}`, spc(s.spc).m);
  if (s.career) add(`อาชีพ: ${CAREERS[s.career].n}`, CAREERS[s.career].m);
  if (s.pastJob) add(`อาชีพเดิม: ${CAREERS[s.pastJob].n}`, halve(CAREERS[s.pastJob].m));
  (s.paths || []).forEach((id) => add(`วัยเด็ก: ${D.PATHS[id].n}`, D.PATHS[id].m));
  (s.perks || []).forEach((id) => { const p = D.perkOf(id); add(`สายฝึก: ${p.n}`, p.m); });
  for (const f in s.disc || {}) { const n = discLv(s, f), X = D.DISC[f]; if (n) add(`วิถี${X.n} บทที่ ${n}`, discM(X, n)); }
  for (const k in s.wear) { const g = gearOf(s, s.wear[k]); if (g && g.affix != null) add(`อุปกรณ์: ${gearName(g)}`, AFFIX[g.affix].m); }
  if (s.guild) { if (s.guild.own) for (const k in HALLS) add(`${HALLS[k].n} Lv.${s.guild.hall[k]}`, s.guild.hall[k] && { [HALLS[k].m]: HALLS[k].v * s.guild.hall[k] }); else add(`กิลด์: ${s.guild.n}`, s.guild.m); }
  return o;
}
const spc = (id) => SPECIALS.find((x) => x.id === id);
export const mod = (s, k) => sources(s).reduce((a, x) => a + (x.m[k] || 0), 0);
export const stat = (s, k) => s.st[k] + mod(s, k);
export const breakdown = (s, k) => [{ n: "ฐาน (เติบโต/ฝึก)", v: Math.floor(s.st[k]) }, ...sources(s).filter((x) => x.m[k]).map((x) => ({ n: x.n, v: x.m[k] }))];
const tier = (s) => (s.hunter ? 1 + s.rank * 1.1 : 1 + s.cr * 0.5);
export const lifespan = (s) => s.w.life + (s.hunter ? RANK_LIFE[s.rank] : 0) + mod(s, "life");

const V = { age: (s) => s.ageM / 12, level: (s) => s.lv, rank: (s) => s.rank, floor: (s) => s.floor, gold: (s) => s.gold, fame: (s) => s.fame, karma: (s) => s.karma, craft: (s) => s.craft, guild: (s) => (s.guild ? 1 : 0), own: (s) => (s.guild?.own ? 1 : 0), mems: (s) => s.guild?.mem?.length || 0, sk: (s) => s.sk.length, els: (s) => new Set(s.sk.map((x) => x.id.split("_")[1])).size, kids: (s) => s.kids.length, spouse: (s) => (s.spouse != null ? 1 : 0), hunter: (s) => +s.hunter, luk: (s) => stat(s, "luk"), rel: (s) => Math.max(...s.npcs.map((n) => (n.alive ? n.rel : -99))), lateAw: (s) => s.lateAw, cyears: (s) => s.cMonths / 12, cr: (s) => s.cr };
export const val = (s, k) => (V[k] ? V[k](s) : s.c[k] || 0);
export const met = (s, d) => Object.entries(d.if || d.need || {}).every(([k, v]) => val(s, k) >= v) && Object.entries(d.max || {}).every(([k, v]) => val(s, k) <= v);
export const NEED_LABEL = { hunts: "ล่ารอยแยก", boss: "ล้มบอส", crafts: "สร้างอาวุธ", enh: "ตีบวกสูงสุด", karma: "กรรม", level: "เลเวล", guild: "สังกัดกิลด์", saved: "ช่วยชีวิต", own: "มีกิลด์ของตัวเอง", mems: "สมาชิกกิลด์", floor: "ชั้นหอ", lateAw: "ตื่นพลังช้า", els: "ธาตุที่รู้", sk: "จำนวนวิชา", cyears: "ปีที่เป็นคนธรรมดา", lucky: "ทอยชะตา" };

// One stat test for the whole game. Compared to what's expected at your stage of life, so odds stay meaningful.
export function odds(s, k, d = 0) {
  const expected = s.ageM < 192 ? 6 + (s.ageM / 12) * 0.75 : s.hunter ? 12 + s.lv * 1.35 : 16 + s.cr * 7;
  // A hunter's stats spread apart with level, so the gap counts for less or every check lands on 5% or 95%.
  const spread = s.hunter ? 1 + s.lv / 25 : 1;
  return Math.round(clamp(50 + ((stat(s, k) - expected) * 2.2 + (stat(s, "luk") - expected) * 0.25) / spread + d * 2, 5, 95));
}

// ---- One combat formula. Hunts, tower, quests, tournaments all call fight().
export const sk = (s, id) => { const [f, e, g] = id.split("_"), F = FORMS[f], G = SKILL_GRADES[+g], x = s.sk.find((a) => a.id === id), m = x ? x.m : 0, max = G.p * F.p * (s.w.aff.includes(e) ? 1.25 : 1); return { id, k: F.k, el: e, g: +g, n: F.n + ELEMENTS[e].n, gn: G.n, gc: G.c, gd: G.d, m, max, p: max * (0.55 + (0.45 * m) / 100) }; };
// Top rarities lift the ceilings too, or a divine dodge or heal would do no more than a legendary one.
export const skCap = { step: (g) => 0.45 + SKILL_GRADES[g].up * 0.03, heal: (g) => 0.5 + SKILL_GRADES[g].up * 0.1 };
export const gearOf = (s, id) => (id == null ? null : s.gear.find((g) => g.id === id));
export const gearName = (g) => `${g.base}${g.affix != null ? AFFIX[g.affix].n : ""} ${GRADES[g.g].n}${g.plus ? ` +${g.plus}` : ""}`;
export const gearPw = (g) => GRADES[g.g].p * QUAL[g.q].p * (1 + g.plus * 0.1) * (g.slot === "weapon" ? WEAPONS[g.t].atk : g.slot === "charm" ? 0.4 : 1);
export function derive(s) {
  const cl = s.cls ? CLASSES[s.cls] : null, main = cl ? cl.main : "str", eq = s.eq.map((id) => sk(s, id)), sum = (k) => eq.filter((x) => x.k === k).reduce((a, x) => a + x.p, 0);
  const w = gearOf(s, s.wear.weapon), a = gearOf(s, s.wear.armor), c = gearOf(s, s.wear.charm), lv = s.hunter ? s.lv : 0;
  const atk = (8 + stat(s, main) * 1.1 + lv * 2.4 + (w ? gearPw(w) : 0) + (c ? gearPw(c) * 0.5 : 0)) * (1 + sum("atk") + mod(s, "atk") / 100);
  // Toughness leans on the class's main stat too, or strength classes get attack, armour and health from one number.
  const body = stat(s, "str") * 0.7 + stat(s, main) * 0.3;
  const def = (3 + body * 0.33 + lv * 1.2 + (a ? gearPw(a) * 0.6 : 0)) * (1 + sum("guard") + mod(s, "def") / 100);
  const maxHp = (60 + body * 5.5 + lv * 16 + (a ? gearPw(a) * 2 : 0)) * (1 + mod(s, "hp") / 100);
  return { atk, def, maxHp, hp: maxHp * (0.55 + s.health / 220), crit: clamp(0.05 + stat(s, "luk") * 0.0012 + (mod(s, "crit") + (w ? WEAPONS[w.t].crit : 0)) / 100, 0.02, 0.6), dodge: clamp(0.03 + stat(s, "agi") * 0.0008 + sum("step") + mod(s, "dodge") / 100, 0, skCap.step(eq.find((x) => x.k === "step")?.g ?? 0)), heal: sum("heal") * (1 + mod(s, "heal") / 100), healCap: skCap.heal(eq.find((x) => x.k === "heal")?.g ?? 0), acc: clamp(mod(s, "acc") / 100, 0, 0.3), mag: mod(s, "mag") / 100, skills: eq.filter((x) => x.k === "atk"), wfx: w ? WEAPONS[w.t].fx : "impacts/blunt-hit", power: Math.round(atk * Math.sqrt(maxHp) * 0.1 + def) };
}
export const enemy = (o) => { const L = o.lv, m = o.m || 1; return { n: o.n, boss: o.boss, el: o.el, lv: L, atk: (14 + L * 3.6 + L * L * 0.045) * m, def: (3 + L * 1.7 + L * L * 0.02) * m, hp: (90 + L * 22 + L * L * 0.5) * m, crit: 0.05, dodge: 0.03 }; };
// acc: fewer misses and less armour in the way. mag: skill blows land harder.
function simulate(a, b, r, rec) {
  let ha = a.hp, hb = b.hp, healed = false; const R = [];
  const hit = (x, y, who, sk) => { const ac = x.acc || 0; if (rnd(r) < y.dodge - ac) { rec && R.push({ who, miss: 1 }); return 0; } let p = x.atk * (x.atk / (x.atk + y.def * 1.2 * (1 - ac))) * (0.85 + rnd(r) * 0.3); const c = rnd(r) < x.crit; if (c) p *= 1.6; if (sk) p *= 1 + (x.mag || 0); if (sk && ELEMENTS[sk.el].beat === y.el) p *= 1.25; p = Math.max(x.atk * 0.08, p); rec && R.push({ who, dmg: Math.round(p), crit: c, sk: sk?.n, el: sk?.el }); return p; };
  for (let i = 0; i < 12 && ha > 0 && hb > 0; i++) {
    hb -= hit(a, b, "p", a.skills?.length ? a.skills[i % a.skills.length] : null); if (hb <= 0) break;
    ha -= hit(b, a, "e");
    if (!healed && a.heal > 0 && ha > 0 && ha < a.maxHp * 0.4) { healed = true; const h = a.maxHp * Math.min(a.healCap, a.heal * 1.2); ha += h; rec && R.push({ who: "p", heal: Math.round(h) }); }
  }
  const sa = Math.max(0, ha) / a.hp, sb = Math.max(0, hb) / b.hp;
  return { win: hb <= 0 || (ha > 0 && sa > sb), share: Math.min(1, sa), rounds: R };
}
export function fight(s, foe) { const r = simulate(derive(s), foe, s.r, true); s.c.fights = (s.c.fights || 0) + 1; return { ...r, foe: { n: foe.n, boss: foe.boss, el: foe.el }, wfx: derive(s).wfx }; }
export function winOdds(s, foe) { const a = derive(s), r = { s: hash(s.ageM + foe.n) }; let w = 0; for (let i = 0; i < 60; i++) if (simulate(a, foe, r).win) w++; return Math.round((w / 60) * 100); }
// The stat a test "asks for": at this value the chance is NEED_P%. Below it you can still try, at worse odds. Shown to the player beside their own number.
export const NEED_P = 75;
// A passed stat test trains the stat it used: a little, and less as the stat grows (same curve as drills).
export const growOf = (s, k) => Math.round(8 * clamp(1.3 - s.st[k] / 90, 0.35, 1.1)) / 100;
export function needOf(s, k, d = 0) {
  const e = s.ageM < 192 ? 6 + (s.ageM / 12) * 0.75 : s.hunter ? 12 + s.lv * 1.35 : 16 + s.cr * 7, sp = s.hunter ? 1 + s.lv / 25 : 1, t = (NEED_P - 50 - d * 2) * sp;
  return Math.max(1, Math.ceil(e + (k === "luk" ? t / 2.45 : (t - (stat(s, "luk") - e) * 0.25) / 2.2)));
}
const afterFight = (s, res) => { if (res.win) s.health = clamp(s.health - (1 - res.share) * 13, 1, 100); };

// ---- Effects: a single table so event data stays tiny.
const H = {
  gold: (s, v) => { const g = v * tier(s) * (v > 0 ? 1 + mod(s, "gold") / 100 : 1); s.gold += g; if (v > 0) emit("coin"); },
  xp: (s, v) => gainXp(s, v * huntXp(s)), hp: (s, v) => hurt(s, v), fame: (s, v) => { s.fame += v * (v > 0 ? 1 + mod(s, "fame") / 100 : 1); }, karma: (s, v) => (s.karma = clamp(s.karma + v * (v * s.karma > 0 ? 1 - Math.abs(s.karma) / 130 : 1), -100, 100)), // the further along a path, the harder each step
  sta: (s, v) => { for (const k in v) s.st[k] += v[k]; }, mat: (s, v) => { for (let i = 0; i < v; i++) dropMat(s); }, pot: (s, v) => (s.pot += v), stone: (s, v) => (s.stone += v), skill: (s, v) => { for (let i = 0; i < v; i++) learn(s); }, gear: (s, v) => { for (let i = 0; i < v; i++) dropGear(s); },
  path: (s, v) => { (s.paths ||= []).push(v); const p = D.PATHS[v]; if (!s.w.careers.includes(p.job)) s.w.careers.push(p.job); log(s, `วัยเด็กของคุณเดินไปทาง "${p.n}"`, "สายทาง", "imp"); },
  perk: (s, v) => { (s.perks ||= []).push(v); emit("skill"); log(s, `ทางฝึก "${D.perkOf(v).n}" ฝังลงในร่างของคุณ`, "ปั้นสเตตัส", "leg"); }, flag: (s, v) => (s.flags[v] = 1), next: (s, [id, m]) => s.q.push({ id, at: s.ageM + m, ctx: s.ctx }), rel: (s, v) => { const n = s.npcs[s.ctx?.ni]; if (n) n.rel = clamp(n.rel + v, -100, 100); }, c: (s, v) => { for (const k in v) s.c[k] = (s.c[k] || 0) + v[k]; }, main: (s, v) => (s.main += v), floor: (s, v) => setFloor(s, s.floor + v),
  marry: (s) => { s.spouse = s.ctx.ni; s.npcs[s.spouse].rel = 100; emit("love"); }, child: (s) => { s.kids.push(pk(s.r, D.GIVEN)); emit("love"); }, cxp: (s, v) => (s.cxp += v), rankUp: (s) => rankUp(s), crUp: (s) => { s.cr++; s.main = 0; s.cxp = 0; emit("rank"); log(s, `เลื่อนตำแหน่งเป็น ${CAREERS[s.career].t[s.cr]}`, "อาชีพ", "imp"); }, awaken: (s) => awaken(s), career: (s, v) => { if (s.career && s.career !== v) s.pastJob = s.career; s.career = v; s.cr = 0; s.cxp = 0; s.main = 0; s.focus = "work"; s.nextMain = s.ageM + 4; log(s, `เริ่มต้นอาชีพ ${CAREERS[v].n} ตำแหน่ง ${CAREERS[v].t[0]}`, "อาชีพ", "imp"); }, setSpc: (s, v) => { s.spc = v; const x = spc(v); gainSkill(s, 3, x.el); emit("awaken"); log(s, `เปลี่ยนสู่คลาสพิเศษ: ${x.n}`, "คลาสพิเศษ", "leg"); }, guildRep: (s, v) => { if (s.guild) s.guild.rep = Math.max(0, s.guild.rep + v); }, spcFail: (s, v) => { s.spcCd = s.ageM + 12; if (typeof v !== "string") return; const k = "sf_" + v; s.c[k] = (s.c[k] || 0) + 1; if (s.c[k] >= SPC_TRIES) { s.w.specials = s.w.specials.filter((x) => x !== v); log(s, `ทางสู่${spc(v).n}ปิดลงแล้ว ชีวิตนี้คงไม่ได้เดินทางนั้น`, "คลาสพิเศษ", "bad"); } }, examFail: (s, v) => (s.nextExam = s.ageM + (v > 1 ? v : 8)), // a postponed exam comes back in v months, a failed one in 8
};
export function apply(s, e) { for (const k in e) if (k !== "m") H[k]?.(s, e[k]); }
function hurt(s, v) { s.health = clamp(s.health + v * (v > 0 ? 1 + mod(s, "heal") / 200 : 1 - clamp(mod(s, "safe"), 0, 60) / 100), 0, 100); if (s.health <= 0) { s.health = 1; if (s.ageM > 192 && ch(s.r, 0.3)) fatal(s, "บาดแผลสาหัส"); } }
export const huntXp = (s) => (15 + s.lv * 5) * (1 + mod(s, "xp") / 100);
export const xpNeed = (l) => Math.round(30 + 8 * l + 0.25 * l * l);
// EXP earned at the level cap is banked (up to two levels' worth) and flows in after the next rank-up, so the wait isn't wasted.
const bankXp = (s, v) => (s.bank = Math.min((s.bank || 0) + v, xpNeed(s.lv) * 2));
function gainXp(s, v) { if (!s.hunter) { s.cxp += v * 0.02; return; } const cap = LVCAP[s.rank]; if (s.lv >= cap) return bankXp(s, v); s.xp += v; while (s.lv < cap && s.xp >= xpNeed(s.lv)) { s.xp -= xpNeed(s.lv); s.lv++; const m = CLASSES[s.cls].main; for (const k in STATS) s.st[k] += k === m ? 2.3 : k === "luk" ? 0.35 : 0.9; emit("levelup"); log(s, line(s, "lvup", { lv: s.lv }), "เติบโต", "good"); } if (s.lv >= cap) { bankXp(s, s.xp); s.xp = 0; } }
const matGrade = (s) => clamp(Math.floor(s.lv / 18), 0, 5);
function dropMat(s) { const k = pk(s.r, ["ore", "hide", "core"]) + matGrade(s); s.mat[k] = (s.mat[k] || 0) + 1; }
function learn(s) { const g = wp(s.r, SKILL_GRADES.map((G, x) => ({ x, w: G.w, r: G.r })).filter((o) => o.r <= s.rank)).x; return gainSkill(s, g); }
export function gainSkill(s, g, el) { const els = [...s.w.aff, ...(s.cls ? CLASSES[s.cls].els : [])]; el = el || (ch(s.r, 0.6) ? pk(s.r, els) : pk(s.r, Object.keys(ELEMENTS))); const f = pk(s.r, Object.keys(FORMS)), id = `${f}_${el}_${g}`, x = s.sk.find((a) => a.id === id); if (x) x.m = Math.min(100, x.m + 25); else s.sk.push({ id, m: 10 }); if (s.eqManual) fillSlot(s, id); else autoEq(s); emit("skill"); log(s, `คุณจับทางวิชา${sk(s, id).n}ได้ เป็นวิชาระดับ${SKILL_GRADES[g].n}`, "วิชา", g >= 3 ? "leg" : "good"); return id; }
export function autoEq(s) { const lim = { atk: 3, guard: 1, step: 1, heal: 1 }, all = s.sk.map((x) => sk(s, x.id)).sort((a, b) => b.p - a.p); s.eq = []; for (const x of all) if (lim[x.k]-- > 0) s.eq.push(x.id); }
const fillSlot = (s, id) => { const k = sk(s, id).k; if (!s.eq.includes(id) && s.eq.filter((x) => sk(s, x).k === k).length < (k === "atk" ? 3 : 1)) s.eq.push(id); };
export function toggleSkill(s, id) { s.eqManual = 1; if (s.eq.includes(id)) { s.eq = s.eq.filter((x) => x !== id); return; } const k = sk(s, id).k, on = s.eq.filter((x) => sk(s, x).k === k); if (on.length >= (k === "atk" ? 3 : 1)) s.eq = s.eq.filter((x) => x !== on[0]); s.eq.push(id); }
export function mkGear(s, slot, t, g, q) { const base = slot === "weapon" ? WEAPONS[t].n : slot === "armor" ? ARMORS[t] : CHARMS[t], affix = slot === "charm" || ch(s.r, 0.3 + q * 0.14) ? ri(s.r, 0, AFFIX.length - 1) : null, x = { id: s.gid++, slot, t, g, q, plus: 0, base, affix }; s.gear.push(x); return x; }
// up: chance the quality rolls one step higher (deep tower runs pass it in).
function dropGear(s, up = 0) { const slot = pk(s.r, ["weapon", "weapon", "armor", "charm"]), n = slot === "weapon" ? WEAPONS.length : 4, q0 = wp(s.r, [0, 1, 2, 3, 4].map((v) => ({ v, w: [22, 45, 22, 9, 2][v] }))).v, x = mkGear(s, slot, ri(s.r, 0, n - 1), matGrade(s), up && ch(s.r, up) ? Math.min(4, q0 + 1) : q0); emit("loot"); log(s, `${gearName(x)} คุณภาพ${QUAL[x.q].n} ติดมือคุณกลับมา`, "ของ", x.q >= 3 ? "leg" : "good"); autoWear(s, x); }
const autoWear = (s, g) => { const c = gearOf(s, s.wear[g.slot]); if (!c || gearPw(g) > gearPw(c)) s.wear[g.slot] = g.id; };

function awaken(s) {
  s.hunter = true; s.rev = s.latent.length; s.lv = 1; s.xp = 0; if (s.career) { s.lateAw = 1; s.pastJob = s.career; }
  const stats = Object.entries(CLASSES).map(([id, c]) => ({ id, w: (2 + Math.max(0, s.st[c.main] - 8) * 0.8) * (c.w || 1) })), rc = mk(s.seed, "cls"); s.cls = wp(rc, stats).id;
  s.rank = s.w.pot > 83 ? 2 : s.w.pot > 62 ? 1 : 0; const c = CLASSES[s.cls];
  gainSkill(s, 0, c.els[0]); gainSkill(s, 1, c.els[0]); s.focus = "hunt"; s.nextMain = s.ageM + 3; s.career = null;
  mkWeaponStart(s); emit("awaken"); log(s, `พลังที่หลับอยู่ตื่นขึ้นแล้ว ผลตรวจของสมาคมระบุว่าคุณคือ${c.n} แรงก์ ${RANKS[s.rank]}`, "ปลุกพลัง", "leg");
}
function mkWeaponStart(s) { const g = mkGear(s, "weapon", CLASSES[s.cls].wp, 0, 1), old = gearOf(s, s.wear.weapon); if (!old || gearPw(g) > gearPw(old)) s.wear.weapon = g.id; }
function rankUp(s) { s.rank++; s.main = 0; emit("rank"); log(s, `สมาคมบันทึกชื่อคุณเป็นฮันเตอร์แรงก์ ${RANKS[s.rank]}`, "แรงก์", "leg"); if (s.rank >= 2) learn(s); if (s.bank) { const b = s.bank; s.bank = 0; log(s, "ประสบการณ์ที่สะสมไว้ระหว่างรอสอบไหลเข้าตัวทีเดียว", "เติบโต", "good"); gainXp(s, b); } }
function setFloor(s, f) { s.floor = Math.max(s.floor, f); s.c.floorMax = s.floor; }

// ---- Events
function pickNpc(s, best) { const a = s.npcs.map((n, i) => ({ n, i })).filter((x) => x.n.alive && x.i !== s.w.rival); return best ? a.sort((x, y) => y.n.rel - x.n.rel)[0].i : pk(s.r, a).i; }
// need = {stat: min}: the option only appears once your total stat reaches it, so training opens routes others never see.
const meets = (s, need) => !need || Object.entries(need).every(([k, v]) => stat(s, k) >= v);
function toOpt(x) { const [l, st, d, y, n, foe, who, need] = x, o = { l, y, n, who, need }; if (st === "fight") o.fight = { m: 1 + d, ...foe }; else if (st) { o.s = st; o.d = d; } return o; }
const here = (s) => (s.hunter && s.at ? placeOf(s).n : pk(s.r, ZONES));
function open(s, def, tag, ctx) {
  ctx = ctx || { z: here(s), mon: pk(s.r, MON) };
  if (ctx.ni == null) { ctx.ni = pickNpc(s, def.if?.rel); ctx.npc = s.npcs[ctx.ni].n; } ctx.rival = s.npcs[s.w.rival].n;
  s.ev = { t: fill(def.t, ctx), lt: def.lt, tag, ctx, o: def.o.map((x) => (Array.isArray(x) ? toOpt(x) : x)).filter((o) => fits(s, o.who) && meets(s, o.need)) };
  for (const o of s.ev.o) if (o.fight && !o.fight.lv) Object.assign(o.fight, { lv: Math.max(1, s.lv + 1), n: o.fight.n || pk(s.r, MON), el: o.fight.el || pk(s.r, Object.keys(ELEMENTS)) });
  emit("event");
}
// Other ways through (◇ approaches, ◆ stat routes) top out below a sure thing, and leaning on the same stat again and again lets people read you.
export const habitHit = (s, o) => ((o.ap || o.need) && o.s && s.habit && s.habit.k === o.s ? s.habit.n : 0);
const altCap = (s, o) => (o.ap || o.need ? Math.max(60, 85 - habitHit(s, o) * 8) : 100);
export const optOdds = (s, o) => (o.p != null ? o.p : o.fight ? winOdds(s, enemy(o.fight)) : o.s ? Math.min(altCap(s, o), odds(s, o.s, o.d)) : null);
// Each stat solves things in its own style, so the way you pick changes what you walk away with.
const STYLE = { str: { gold: 40, hp: -4 }, agi: { mat: 1 }, int: { xp: 0.4 }, wil: { hp: 4 }, cha: { fame: 2 }, luk: { gold: 25 } };
const styled = (y, k) => { const o = { ...y }; for (const [a, v] of Object.entries(STYLE[k])) o[a] = (o[a] || 0) + v; return o; };
// What a choice changed, as short "+2 ปัญญา · −₡300" text for the log line.
const SNAP = { gold: "₡", health: "สุขภาพ", fame: "ชื่อเสียง", karma: "กรรม", lv: "Lv", craft: "ฝีมือช่าง" };
const pickSnap = (s) => ({ ...Object.fromEntries(Object.keys(STATS).map((k) => [k, s.st[k]])), ...Object.fromEntries(Object.keys(SNAP).map((k) => [k, s[k] || 0])), sk: s.sk.length, gear: s.gear.length });
function diffText(a, b) {
  const out = [], num = (v) => (Math.abs(v) >= 10 ? fmtN(Math.round(Math.abs(v))) : (Math.round(Math.abs(v) * 10) / 10).toString()), sg = (v) => (v > 0 ? "+" : "−");
  for (const k in a) { const d = b[k] - a[k]; if (Math.abs(d) < 0.05) continue;
    if (k === "gold") out.push(`${sg(d)}₡${num(d)}`); else if (k === "sk") out.push(`วิชาใหม่ ${d}`); else if (k === "gear") { if (d > 0) out.push(`อุปกรณ์ใหม่ ${d}`); } else out.push(`${STATS[k] || SNAP[k]} ${sg(d)}${num(d)}`); }
  return out.join(" · ");
}
const fmtN = (v) => v.toLocaleString("en-US");
export function choose(s, i) {
  const before = pickSnap(s);
  const ev = s.ev, o = ev.o[i]; s.ev = null; s.ctx = ev.ctx; let ok = true, roll = "";
  if (o.fight) { const res = fight(s, enemy(o.fight)); ok = res.win; afterFight(s, res); emit("fight", res); roll = ok ? "ชนะ" : "แพ้"; if (ok && o.fight.boss) s.c.boss = (s.c.boss || 0) + 1; if (!ok && (o.fight.boss || ev.tag === "โลก") && !s.dead) deathRoll(s, o.fight); }
  else { const p = optOdds(s, o); if (p != null) { ok = ch(s.r, p / 100); roll = ok ? "สำเร็จ" : "พลาด"; } }
  if (ok && o.s && !o.fight) s.st[o.s] += growOf(s, o.s);
  if (o.ap || o.need) s.habit = s.habit?.k === o.s ? { k: o.s, n: s.habit.n + 1 } : { k: o.s, n: 1 }; else if (o.s || o.fight) s.habit = null;
  const out = ok ? o.y : o.n || {};
  const m = text(s, out.m);
  log(s, [ev.lt || ev.t, line(s, "pick", { l: o.l.replace(/^บททดสอบ: /, "รับบททดสอบ") }), m && (ok || /แต่|ทว่า/.test(m) ? m : "แต่" + m)].filter(Boolean).join(" "), ev.tag, ok ? "imp" : "bad", roll);
  const entry = s.log[s.log.length - 1];
  if (!s.dead) apply(s, out);
  entry.d = diffText(before, pickSnap(s));
}
function deathRoll(s, f, x = 1) { const a = derive(s), e = enemy(f), p = clamp((0.05 * e.atk) / a.atk, 0.03, 0.14) * x; if (ch(s.r, p)) fatal(s, `พ่ายแก่ ${f.n}`); }
// Every combat or injury death comes through here, so the token covers them all. Old age does not.
function fatal(s, cause) { if (s.token > 0) { s.token--; log(s, "แผ่นย้ายชีพแตกออก คุณลืมตาอีกครั้ง", "รอดตาย", "leg"); emit("heal"); } else die(s, cause); }
export function autoChoice(s) { let best = 0, bv = -1e9; s.ev.o.forEach((o, i) => { const p = optOdds(s, o); const v = p == null ? 52 : o.fight && p < 50 ? p - 25 : p; if (v > bv) { bv = v; best = i; } }); return best; }
export function die(s, cause) {
  const a = age(s); s.dead = { cause, age: a, title: lifeTitle(s), score: score(s) }; emit("death");
  log(s, `${s.name} จากไปเมื่ออายุ ${a} ปี (${cause})`, "จบชีวิต", "leg");
}
export const score = (s) => Math.round(s.fame * 3 + s.floor * 12 + (s.hunter ? s.rank * 120 + s.lv * 5 : s.cr * 300) + Math.max(0, s.gold) / 400 + Math.abs(s.karma) * 2 + (s.guild?.own ? s.guild.rep : 0) + age(s));
function lifeTitle(s) {
  if (s.floor >= 90) return "ผู้แตะชั้นบนสุด"; if (s.spc) return spc(s.spc).n; if (s.guild?.own && s.guild.rep > 150) return "ผู้ก่อตั้งกิลด์ในตำนาน"; if (s.hunter && s.rank >= 5) return "ฮันเตอร์ที่เมืองจำ"; if (s.karma <= -60) return "ชื่อที่ถูกสาปแช่ง";
  if (!s.hunter && s.cr >= 4) return CAREERS[s.career].t[4]; if (s.karma >= 85 && s.fame < 40) return "คนดีที่ไม่มีใครรู้จัก"; if (!s.hunter && s.career) return `${CAREERS[s.career].t[s.cr]} แห่งยุคฟ้าแตก`; if (s.gold > 100000) return "มหาเศรษฐีหลังแนวกั้น"; if (s.hunter) return `ฮันเตอร์แรงก์ ${RANKS[s.rank]}`; return "คนหนึ่งในเมือง";
}

// ---- The monthly clock
export function tick(s) {
  if (s.dead || s.ev) return;
  const step = s.ageM < 180 ? 3 : 1, st = stage(s); s.ageM += step;
  if (s.w.priceT > 0 && (s.w.priceT -= step) <= 0) { s.w.price = 1; log(s, line(s, "price"), "โลก"); }
  if (st !== "k") living(s, step);
  doFocus(s, st, step); if (s.dead) return;
  if (s.guild) guildMonth(s);
  npcMonth(s);
  news(s, step);
  if (s.ageM % 12 < step) yearEnd(s);
  if (s.ageM === 144 || (s.ageM > 144 && s.rev === 0)) { s.rev = 1; log(s, `คุณเริ่มรู้สึกถึงบางอย่างในตัว: ${LATENTS[s.latent[0]].n}`, "พลังแฝง", "imp"); }
  aging(s); if (s.dead || s.ev) return;
  schedule(s);
}
function living(s, step) { const cost = (s.hunter ? 120 + s.lv * 3 : 130 + s.cr * (s.career ? CAREERS[s.career].pay : 0) * D.CIV_ECON.life) * s.w.price + s.kids.length * 40; s.gold -= cost * step; const debtCap = -cost * 24; if (s.gold < 0 && s.gold > debtCap) s.gold = Math.max(s.gold * 1.01, debtCap); if (s.health < 45 && s.pot > 0) { s.pot--; hurt(s, 35); emit("heal"); log(s, "ดื่มยารักษาบาดแผล", "ฟื้นฟู"); } s.health = clamp(s.health + 0.8 * (1 + mod(s, "heal") / 100), 0, 100); if (!s.hunter) s.cMonths += step; }
const retired = (s) => !s.hunter && age(s) >= D.CIV_ECON.retire;
function doFocus(s, st, step) {
  const f = s.focus;
  if (st === "k") { const x = FOCUS.k[f] || FOCUS.k.play; for (const k in x.st) s.st[k] += x.st[k] * step * 0.55; for (const k in s.st) s.st[k] += 0.035 * step; if (x.pay) s.gold += x.pay * step; return; }
  if (st === "c") {
    const c = s.career ? CAREERS[s.career] : null; if (!c) return;
    const old = retired(s), salary = c.pay * (1 + s.cr * D.CIV_ECON.raise) * (1 + mod(s, "gold") / 100), wage = (v) => (old ? 0 : v);
    if (old) { s.gold += salary * D.CIV_ECON.pension; if (!s.flags.retired) { s.flags.retired = 1; s.focus = "rest"; log(s, `เกษียณจากตำแหน่ง ${c.t[s.cr]} รับบำนาญรายเดือน`, "อาชีพ", "imp"); } }
    if (f === "work") { s.gold += wage(salary); s.cxp += (stat(s, c.st) / 24) * (1 + mod(s, "cxp") / 100); s.st[c.st] += 0.05; brew(s); if (!old && c.risk && ch(s.r, c.risk[0])) { hurt(s, -ri(s.r, 6, 16)); log(s, c.risk[1], "อาชีพ", "bad"); } }
    else if (f === "study") { s.st[c.st] += 0.2; s.st.int += 0.08; s.gold += wage(c.pay * 0.25); s.cxp += 0.5; }
    else if (f === "craft") { s.craft = clamp(s.craft + 0.45 * (1 + mod(s, "craft") / 100), 0, 100); s.gold += wage(c.pay * 0.4); if (ch(s.r, 0.25)) dropCiv(s); }
    else if (TRAIN[f]) { drill(s, f); s.gold += wage(c.pay * 0.12); }
    else { hurt(s, 1.2); const n = s.npcs[s.spouse ?? pickNpc(s)]; if (n) n.rel = clamp(n.rel + 0.8, -100, 100); s.gold += wage(c.pay * 0.15); }
    return;
  }
  if (s.health < 22 && f !== "rest") { hurt(s, 4); s.gold -= 40; if (!s.sick) { s.sick = 1; log(s, line(s, "hosp"), "ฟื้นฟู", "bad"); } return; }
  if (s.sick && s.health >= 45) { s.sick = 0; log(s, line(s, "healed"), "ฟื้นฟู", "good"); }
  if (f === "hunt") hunt(s); else if (f === "tower") climb(s);
  else if (f === "train") { const m = CLASSES[s.cls].main; s.st[m] += 0.28; s.st.wil += 0.12; gainXp(s, huntXp(s) * 0.35); trainSkill(s, 4); }
  else if (TRAIN[f]) { drill(s, f); gainXp(s, huntXp(s) * 0.1); }
  else if (f === "guild") guildWork(s);
  else if (f === "craft") { s.craft = clamp(s.craft + 0.7 * (1 + mod(s, "craft") / 100), 0, 100); s.gold += 60 * tier(s); gainXp(s, huntXp(s) * 0.15); }
  else hurt(s, 6);
}
const brew = (s) => { const b = mod(s, "brew"); if (b && s.pot < 9 && ch(s.r, b / 100)) { s.pot++; log(s, "ปรุงยาไว้ใช้เองได้อีกขวด", "ฟื้นฟู"); } };
const dropCiv = (s) => { const k = pk(s.r, ["ore", "hide", "core"]) + "0"; s.mat[k] = (s.mat[k] || 0) + 1; };
const trainSkill = (s, v) => { for (const id of s.eq) { const x = s.sk.find((a) => a.id === id); if (x) x.m = Math.min(100, x.m + v * (x.m < 50 ? 1 : 0.5)); } };
function hunt(s) {
  // The place sets a danger floor, the local monsters and the element they lean to; coming under-levelled is the risk you pay for its rewards.
  const P = placeOf(s), pay = placePay(s, P);
  const foe = enemy({ lv: Math.max(1, s.lv + ri(s.r, -3, 0), P.lv - 4 + ri(s.r, 0, 3)), m: (0.92 + rnd(s.r) * 0.14) * P.m, n: pk(s.r, P.mon && ch(s.r, 0.7) ? P.mon : MON), el: P.el && ch(s.r, 0.6) ? P.el : pk(s.r, Object.keys(ELEMENTS)) }), res = fight(s, foe); s.c.hunts = (s.c.hunts || 0) + 1; afterFight(s, res); emit("minor", res);
  if (res.win) { const g = (40 + s.lv * 22) * pay * (1 + mod(s, "gold") / 100); s.gold += g; gainXp(s, huntXp(s) * pay); dropMat(s); if (ch(s.r, 0.45 + (mod(s, "mat") + P.mat) / 100)) dropMat(s); brew(s); trainSkill(s, 1.2); if (ch(s.r, 0.03)) learn(s); if (ch(s.r, 0.05)) dropGear(s); const y = (s.ty ||= { n: 0, f: {} }); y.n++; y.f[foe.n] = (y.f[foe.n] || 0) + 1; }
  else { hurt(s, -ri(s.r, 8, 16)); log(s, line(s, "lose", { mon: foe.n }), "ล่า", "bad"); if (s.health < 30 && ch(s.r, 0.12)) fatal(s, `พ่ายแก่ ${foe.n} ในรอยแยก`); }
}
// ---- Tower runs: one floor at a time, then you choose to push on or walk out with the bag.
// A run starts at the last boss checkpoint. Each floor cleared in the same run makes the next foes stronger (DIVE.press)
// and the drops richer and better; losing a fight drops half the bag. Past floor 100 the tower keeps going, built from the seed.
const FLOOR_T = [{ v: "fight", w: 6 }, { v: "rest", w: 1 }, { v: "cache", w: 1.3 }, { v: "test", w: 1.5 }];
// re: pay share on floors cleared in an earlier run; xp: EXP per floor in hunt-months; risk: death-roll scale on a non-boss loss
// (without it auto play backs out safely and far fewer hunters die young, which pushed EX rank from 10% to 16%); gear0/gear: base and per-floor gear chance; up: per-floor quality lift.
export const DIVE = { press: 0.03, gold: 0.05, re: 0.25, xp: 1.2, risk: 1.3, gear0: 0.04, gear: 0.02, gearMax: 0.4, up: 0.02, upMax: 0.4 };
export const floorAt = (s, f) => s.w.tower[f - 1] || deepFloor(s, f);
function deepFloor(s, f) { const r = mk(s.seed, "deep" + f), b = f % 10 === 0; return { t: b ? "boss" : f % 5 === 0 ? "elite" : wp(r, FLOOR_T).v, el: pk(r, Object.keys(ELEMENTS)), mod: pk(r, D.FLOOR_MODS), name: b ? pk(r, BOSS) : pk(r, MON) }; }
export const diveGate = (s) => Math.floor(s.floor / 10) * 10 + 1;
const FIGHT_T = { fight: 1, elite: 1, boss: 1 };
export const FLOOR_KIND = { fight: "ห้องมอนสเตอร์", elite: "ผู้คุมชั้น", boss: "บอสประจำช่วง", rest: "ห้องพัก", cache: "ห้องเก็บของ", test: "ห้องทดสอบ" };
export const floorFoe = (s, f) => { const F = floorAt(s, f), n = s.run?.f === f ? s.run.n : 0; return { lv: Math.round(2 + f * 1.2), m: (F.t === "boss" ? 1.4 : F.t === "elite" ? 1.18 : 0.96) * F.mod.m * (1 + n * DIVE.press), n: F.name, el: F.el, boss: F.t === "boss" }; };
export const bagText = (b) => [`₡${fmt(b.gold)}`, b.mat && `วัตถุดิบ ${b.mat}`, b.gear && `อุปกรณ์ ${b.gear}`, b.stone && `หินกันแตก ${b.stone}`].filter(Boolean).join(" · ");
function climb(s) { if (s.run) diveCash(s); s.run = { f: diveGate(s), from: diveGate(s), n: 0, bag: { gold: 0, mat: 0, gear: 0, stone: 0 } }; diveAsk(s); }
function diveAsk(s) {
  const R = s.run, f = R.f, F = floorAt(s, f), fresh = f > s.floor, nm = FIGHT_T[F.t] ? ` "${F.name}"` : "", go = { l: R.n ? `ไปต่อชั้น ${f}` : `เข้าหอที่ชั้น ${f}`, y: { m: "", dive: 1 }, n: { m: "", diveLose: 1 } };
  if (FIGHT_T[F.t]) { go.fight = floorFoe(s, f); go.y.m = `ล้ม ${F.name} ได้`; go.n.m = `${F.name}ไล่คุณกลับลงมา`; }
  else if (F.t === "test") { go.s = pk(s.r, Object.keys(STATS)); go.d = 2 + Math.floor(f / 30); go.l += ` (ทดสอบ${STATS[go.s]})`; go.y.m = "ผ่านบททดสอบ"; go.n = { m: "ไม่ผ่านบททดสอบ ประตูชั้นถัดไปไม่ยอมเปิด คุณจึงลงมาพร้อมของที่มี", hp: -10, diveOut: 1 }; }
  else go.y.m = F.t === "rest" ? "ได้นั่งพักหายใจ" : "มีหีบถูกลืมไว้";
  go.note = `${FLOOR_KIND[F.t]} · ${F.mod.n} · ธาตุ${ELEMENTS[F.el].n}${fresh ? " · ชั้นที่ยังไม่เคยผ่าน" : ""}${R.n ? ` · ศัตรูแรงขึ้น +${Math.round(R.n * DIVE.press * 100)}%` : ""}`;
  const head = R.n ? `ผ่านชั้น ${f - 1} แล้ว (รอบนี้ ${R.n} ชั้น) · ในถุง ${bagText(R.bag)} · สุขภาพ ${Math.round(s.health)}%` : `ประตูหอเปิดที่จุดเช็คพอยต์ชั้น ${f}`;
  open(s, { lt: `หอชั้น ${f} ${FLOOR_KIND[F.t]}${nm}:`, t: `${head} · ข้างหน้าคือชั้น ${f}: ${FLOOR_KIND[F.t]}${nm} จะไปต่อไหม?`, o: [go, { l: R.n ? "กลับออกไปพร้อมของ" : "เดือนนี้ยังไม่เข้า", note: R.n ? "เก็บของทั้งถุง รอบหน้าเริ่มใหม่ที่จุดเช็คพอยต์" : "", y: { m: R.n ? "คุณเดินลงมาพร้อมถุงที่หนักขึ้น" : "คุณกลับไปเตรียมตัวก่อน", diveOut: 1 } }] }, "หอ");
}
// Clearing a floor: EXP and the record come now, loot goes into the bag. Floors already cleared in earlier runs pay less.
H.dive = (s) => {
  const R = s.run; if (!R) return; const f = R.f, F = floorAt(s, f), n = R.n, b = R.bag, fresh = f > s.floor, k = fresh ? 1 : DIVE.re;
  setFloor(s, f); gainXp(s, huntXp(s) * (F.t === "boss" ? 2.5 * DIVE.xp : DIVE.xp) * k); trainSkill(s, 1.2);
  b.gold += (30 + f * 4) * (F.t === "cache" ? 2.5 : 1) * (1 + n * DIVE.gold) * k * tier(s) * (1 + mod(s, "gold") / 100);
  b.mat += (ch(s.r, Math.min(0.9, 0.4 + n * 0.04) * (fresh ? 1 : 0.6)) ? 1 : 0) + (F.t === "cache" ? 2 : 0);
  const gp = Math.min(DIVE.gearMax, DIVE.gear0 + n * DIVE.gear) + (F.t === "elite" ? 0.35 : F.t === "cache" ? 0.3 : 0);
  if (F.t === "boss") b.gear++; else if (ch(s.r, gp * k)) b.gear++;
  if (ch(s.r, (0.06 + n * 0.015) * k) || F.t === "boss") b.stone++;
  if (F.t === "rest") { hurt(s, 25); emit("heal"); } else if (F.t === "cache") emit("loot");
  if (F.t === "test" && fresh) s.st[pk(s.r, Object.keys(STATS))] += 1; // only the first clear: re-clears would hand out a free stat every run
  if (F.t === "boss") { if (fresh) learn(s); s.fame += 5; } else if (F.t === "elite" && fresh) s.fame += 1;
  R.f++; R.n++; s.c.diveBest = Math.max(s.c.diveBest || 0, R.n);
  diveAsk(s);
};
// Bosses already roll for death in choose(); any other tower loss can kill too, so going deep is a real gamble.
H.diveLose = (s) => { const R = s.run; if (!R) return; const b = R.bag, boss = floorAt(s, R.f).t === "boss"; hurt(s, boss ? -26 : -14); if (!boss && DIVE.risk && !s.dead) deathRoll(s, floorFoe(s, R.f), DIVE.risk); if (s.dead) return; for (const k in b) b[k] = k === "gold" ? b[k] / 2 : Math.floor(b[k] / 2); log(s, `ถุงขาดระหว่างหนีลงมา ของหายไปครึ่งหนึ่ง`, "หอ", "bad"); diveCash(s); };
H.diveOut = (s) => diveCash(s);
function diveCash(s) {
  const R = s.run; s.run = null; if (!R || !R.n) return; const b = R.bag, up = Math.min(DIVE.upMax, R.n * DIVE.up);
  s.gold += b.gold; for (let i = 0; i < b.mat; i++) dropMat(s); for (let i = 0; i < b.gear; i++) dropGear(s, up); s.stone += b.stone; if (b.gold) emit("coin");
  log(s, `จบรอบไต่หอ ชั้น ${R.from}–${R.from + R.n - 1} (${R.n} ชั้น) · ได้ ${bagText(b)}${up && b.gear ? ` · ของดีขึ้น ${Math.round(up * 100)}%` : ""}`, "หอ", R.n >= 8 ? "leg" : "good");
}
function npcMonth(s) { for (const n of s.npcs) { if (!n.alive) continue; if (n.hun && ch(s.r, 0.03)) n.lv++; if (n.hun && ch(s.r, 0.014 + n.lv * 0.0002)) n.floor = Math.min(100, n.floor + 1); if (ch(s.r, 0.0009)) { const i = s.npcs.indexOf(n); if (i === s.w.rival || i === s.spouse) continue; n.alive = false; if (s.guild?.mem) s.guild.mem = s.guild.mem.filter((x) => x !== i); if (n.rel >= 30) log(s, `${n.n} จากไปแล้ว ข่าวมาถึงคุณช้าเกินไป`, "ผู้คน", "bad"); } } if (s.npcs.filter((n) => n.alive).length < 18) { const hun = ch(s.r, 0.67); s.npcs.push({ n: `${pk(s.r, D.GIVEN)} ${pk(s.r, D.SUR)}`, job: hun ? "ฮันเตอร์" : CAREERS[pk(s.r, Object.keys(CAREERS))].n, hun, lv: ri(s.r, 1, hun ? Math.max(8, s.lv) : 1), floor: 0, rel: ri(s.r, -6, 20), alive: true, el: pk(s.r, Object.keys(ELEMENTS)) }); } }
function yearEnd(s) {
  const a = s.snap, gd = s.gold - a.gold, y = s.ty;
  if (age(s) >= 16) {
    const b = [];
    if (y?.n) b.push(line(s, "yrHunt", { n: y.n, mon: Object.entries(y.f).sort((p, q) => q[1] - p[1])[0][0] }));
    if (s.lv > a.lv) b.push(line(s, "yrLv", { v: s.lv - a.lv }));
    if (gd >= 50) b.push(line(s, "yrUp", { v: fmt(gd) })); else if (gd <= -50) b.push(line(s, "yrDown", { v: fmt(-gd) }));
    if (s.fame >= a.fame + 5) b.push(line(s, "yrFame"));
    log(s, b.join(" ") || line(s, "yrFlat"), "สิ้นปี", "sum");
  }
  s.ty = null; s.snap = snap(s);
}
// World news: about three a year that touch your life a little (a death in the family, a neighbour turned S-rank, a cult raid).
function news(s, step) {
  if (s.ageM < 36 || !ch(s.r, step === 3 ? 0.55 : 0.24)) return;
  const k = stage(s), seen = (s.newsSeen ||= {});
  const list = D.NEWS.filter((n) => (!n.k || n.k === k) && !(n.once && s.c[n.once]) && !(n.not && fits(s, n.not)) && met(s, n) && (seen[n.id] == null || s.ageM - seen[n.id] > 30));
  if (!list.length) return;
  const n = wp(s.r, list); seen[n.id] = s.ageM;
  const ni = pickNpc(s), ctx = { z: here(s), mon: pk(s.r, MON), nb: `${pk(s.r, D.GIVEN)} ${pk(s.r, D.SUR)}`, ni, npc: s.npcs[ni]?.n, rival: s.npcs[s.w.rival]?.n };
  s.ctx = ctx; log(s, fill(n.t, ctx), n.tag || "ข่าว", n.cls || "");
  if (n.e) apply(s, n.e);
  if (n.once) s.c[n.once] = 1;
}
function aging(s) { const L = lifespan(s), a = s.ageM / 12; if (a >= L) return die(s, "อายุขัย"); if (a > L * 0.78) { s.health -= 0.25; if (s.health <= 12 && ch(s.r, 0.08)) die(s, "ความชราและโรคภัย"); } }

function schedule(s) {
  const d = s.q.findIndex((x) => x.at <= s.ageM); if (d >= 0) { const q = s.q.splice(d, 1)[0], def = EVENTS.find((e) => e.id === q.id); if (def) { open(s, def, def.tag || "ชะตา", q.ctx); return addApproach(s); } }
  if (!s.hunter && !s.career && s.ageM >= s.w.awakenAge * 12) return openAwaken(s);
  if (!s.hunter && s.w.lateAge && s.ageM >= s.w.lateAge && !s.flags.lateDone) return openLate(s);
  for (const c of s.w.cal) {
    if (!c.ann && s.ageM >= c.at - 12) { c.ann = 1; const W = WORLD.find((x) => x.id === c.id); log(s, `สมาคมติดประกาศล่วงหน้าราวหนึ่งปี: ${W.n} ${fill(W.d, c)}`, "โลก", "imp"); }
    if (!c.done && s.ageM >= c.at) { c.done = 1; return openWorld(s, c); }
  }
  if (breakthrough(s)) return;
  if (stage(s) === "k") { const x = D.CROSS[s.cross || 0]; if (x && s.ageM >= x.age * 12) return openCross(s, x); }
  if (stage(s) === "k") return randomEvent(s, 0.3);
  if (s.hunter && s.ageM >= s.spcCd && !s.spc) { const ready = s.w.specials.map(spc).filter((x) => met(s, x) && (age(s) < SPC_AGE || x.id === "late")); if (ready.length) return openSpecial(s, ready.slice(0, 3)); }
  if (s.ageM >= s.nextExam && examReady(s)) return openExam(s);
  if (s.ageM >= s.nextMain) return openMain(s);
  if ((s.hunter || (s.career && !retired(s))) && s.ageM >= (s.nextDisc ?? 0) - (WAY_F.has(s.focus) ? 3 : 0) && openDisc(s)) return;
  randomEvent(s, 0.17);
}
function openCross(s, x) {
  s.cross = (s.cross || 0) + 1;
  open(s, { t: x.t, o: x.o.map(([id, l, st, d, ok, bad, who]) => { const p = D.PATHS[id], base = { l, who, note: `${p.d} · ${perkText(p.m)}` }; return st ? { ...base, s: st, d, y: { m: ok, path: id, sta: { [p.st]: 1.2 } }, n: { m: bad, path: id, sta: { [p.st]: 0.4 }, hp: -3 } } : { ...base, y: { m: ok, path: id, sta: { [p.st]: 1 }, karma: 3 } }; }) }, "สายทาง");
}
// Approach options: an event with a stat test gets up to two more ways to the same result, tested on your best other stats. Same rewards, other stat, so every build has a way through.
const AP_N = { str: "ใช้กำลังเข้าจัดการ", agi: "ใช้ความว่องไวแก้สถานการณ์", int: "คิดหาทางอ้อมที่ฉลาดกว่า", wil: "ตั้งสติและอดทนจนถึงที่สุด", cha: "พูดคุยให้อีกฝ่ายยอมถอย", luk: "ปล่อยให้ดวงเป็นคนตัดสิน" };
function addApproach(s) {
  const ev = s.ev; if (!ev || ev.o.length >= 4) return;
  const base = ev.o.find((o) => o.s && !o.fight); if (!base) return;
  // Only ways that beat the obvious one are offered: a worse chance for the same reward is not a choice.
  const bp = odds(s, base.s, base.d), ks = Object.keys(STATS).filter((k) => k !== base.s && !ev.o.some((o) => o.s === k) && optOdds(s, { s: k, d: base.d, ap: 1 }) > bp).sort((a, b) => odds(s, b, base.d) - odds(s, a, base.d)).slice(0, Math.min(2, 4 - ev.o.length));
  for (const k of ks) ev.o.push({ l: AP_N[k], s: k, d: base.d, ap: 1, y: { ...styled(base.y, k), m: "วิธีที่คุณเลือกได้ผลเกินคาด", sta: { ...(base.y.sta || {}), [k]: ((base.y.sta || {})[k] || 0) + 0.4 } }, n: { ...(base.n || {}), m: "วิธีของคุณไม่เข้ากับสถานการณ์นี้" } });
}
const BT_LINE = { str: "กล้ามเนื้อของคุณจำท่าเองได้แล้ว", agi: "เท้าของคุณเริ่มรู้ทางก่อนสมอง", int: "ความคิดของคุณเริ่มวิ่งนำคำถาม", wil: "ใจของคุณนิ่งจนเสียงรอบตัวเงียบลง", cha: "คนรอบตัวเริ่มหยุดฟังก่อนคุณพูด", luk: "สิ่งเล็กๆ เริ่มเรียงตัวเข้าข้างคุณ" };
// One breakthrough per month: a trained base stat crossing a tier asks the player to commit to one of two paths.
function breakthrough(s) {
  const bt = (s.bt ||= {});
  for (const k in STATS) {
    const t = bt[k] || 0, at = D.PERK_AT(k);
    if (t >= at.length || s.st[k] < at[t]) continue;
    bt[k] = t + 1;
    open(s, { t: `${STATS[k]}ของคุณทะลุ ${at[t]}: ${BT_LINE[k]} ถึงเวลาเลือกว่าจะปั้นมันไปทางไหน`, o: [0, 1].map((a) => { const p = D.perkOf(`${k}_${a}_${t}`); return { l: p.n, note: `${p.d} · ${perkText(p.m)}`, y: { m: "ทางฝึกนี้เป็นของคุณแล้ว", perk: `${k}_${a}_${t}` } }; }) }, "ปั้นสเตตัส");
    return true;
  }
}
// ---- Ways (วิถี). The story that grows the fighting side your class or trade leans on: three ways per job, read off its main stat, bonuses and weapon, so new classes need no rows.
const DISC_ST = { str: ["body", "hp"], agi: ["dodge", "acc"], int: ["mag", "wit"], wil: ["hp", "mag"], cha: ["wit", "mag"], luk: ["crit", "dodge"] };
const DISC_M = { def: "body", safe: "body", hp: "hp", heal: "hp", life: "hp", crit: "crit", dodge: "dodge", xp: "wit", quest: "wit", gold: "wit", cxp: "wit", craft: "wit" };
const DISC_WP = { 1: "crit", 3: "body", 4: "body", 5: "acc", 6: "acc", 7: "mag", 8: "crit", 10: "dodge" };
export const DISC_CAP = [5, 3, 2]; // chapters open on the main, second and third way
const WAY_F = new Set(["train", "body", "mind", "study"]); // months spent training bring the next lesson sooner
export const discLv = (s, f) => Math.floor((s.disc?.[f] || 0) + 1e-6);
const discM = (X, n) => Object.fromEntries(Object.entries(X.m).map(([k, v]) => [k, Math.round(v * n * 10) / 10]));
export function discOf(s) {
  const job = s.hunter ? CLASSES[s.cls] : CAREERS[s.career]; if (!job) return [];
  const w = {}, add = (k, v) => k && (w[k] = (w[k] || 0) + v), [a, b] = DISC_ST[job.main || job.st];
  add(a, 4); add(b, 2); for (const k in job.m) if (job.m[k] > 0) add(DISC_M[k], 1.5); if (s.hunter) add(DISC_WP[job.wp], 1.6);
  return Object.keys(D.DISC).filter((k) => s.hunter || k !== "mag").sort((x, y) => (w[y] || 0) - (w[x] || 0)).slice(0, 3);
}
// For the UI: the three ways of the current job, then anything learned in an earlier job.
export const discList = (s) => { const fit = discOf(s); return [...fit, ...Object.keys(s.disc || {}).filter((f) => !fit.includes(f) && discLv(s, f))].map((f) => { const X = D.DISC[f], i = fit.indexOf(f), lv = discLv(s, f); return { n: `วิถี${X.n} · บทที่ ${lv}/${i < 0 ? lv : DISC_CAP[i]}`, d: `${X.d} · บทละ ${perkText(X.m)}`, m: lv ? discM(X, lv) : {} }; }); };
H.disc = (s, [f, v]) => {
  const d = (s.disc ||= {}), a = discLv(s, f), cap = DISC_CAP[discOf(s).indexOf(f)] ?? 5, X = D.DISC[f];
  d[f] = Math.min(cap, (d[f] || 0) + v); const b = discLv(s, f);
  if (b > a) { emit("skill"); log(s, `วิถี${X.n}จบบทที่ ${b} "${D.DISC_T[b - 1]}" · ${perkText(discM(X, b))}${b === 5 ? " ไม่มีบทต่อไปให้เรียนแล้ว ที่เหลือคือของคุณเอง" : ""}`, "วิถี", "leg"); if (b === 5) s.fame += 5; }
};
// A chapter opens only when your standing has caught up with it (rank or position), like a ceiling that lifts as you rise.
function openDisc(s) {
  if (s.nextDisc == null) { s.nextDisc = s.ageM + ri(s.r, 4, 8); return false; }
  s.nextDisc = s.ageM + ri(s.r, 14, 22);
  const rk = s.hunter ? s.rank : s.cr, fs = discOf(s).map((f, i) => ({ f, w: 3 - i, lv: discLv(s, f), cap: DISC_CAP[i] })).filter((x) => x.lv < x.cap && x.lv <= rk);
  if (!fs.length) return false;
  const { f, lv } = wp(s.r, fs), X = D.DISC[f], [t, l, ok, bad] = X.ch[lv], M = (s.discM ||= {});
  if (M[f] == null || !s.npcs[M[f]]?.alive) M[f] = pickNpc(s); // one teacher per way for as long as they live
  const g = gearOf(s, s.wear.weapon), cost = 50 * (lv + 1), again = (s.disc?.[f] || 0) > lv + 0.01;
  const o = [{ l, s: X.st, d: -4 - lv * 4, note: `จบบทได้ ${perkText(X.m)}`, y: { m: ok, disc: [f, 1], sta: { [X.st]: 0.3 }, rel: 4 }, n: { m: bad, disc: [f, 0.3], hp: -3 } }];
  if (s.gold >= cost * tier(s) * 3) o.push({ l: "จ่ายค่าครูให้สอนตัวต่อตัว", note: `₡${fmt(cost * tier(s))} · ได้ผลแน่นอนแต่ช้ากว่า`, y: { m: "บทเรียนเดินช้า แต่ไม่มีก้าวไหนเสียเปล่า", gold: -cost, disc: [f, 0.5], rel: 2 } });
  o.push({ l: "ขอผ่านไปก่อน", y: { m: "บทเรียนนี้จะรอคุณอยู่" } });
  open(s, { t: `วิถี${X.n} บทที่ ${lv + 1} "${D.DISC_T[lv]}" · ${again ? "คุณกลับมาแก้มือ: " : ""}${t}`, lt: `วิถี${X.n} บทที่ ${lv + 1}:`, o }, "วิถี", { z: here(s), mon: pk(s.r, MON), tool: g ? WEAPONS[g.t].n : "ของใกล้มือ", ni: M[f], npc: s.npcs[M[f]].n });
  return true; // no ◇ approaches here: a way is tested on its own stat, or bought slowly from the teacher
}
function randomEvent(s, p) {
  const arrived = s.arrive; s.arrive = 0;
  if (!ch(s.r, arrived ? 0.7 : p)) return; const k = stage(s);
  let list = EVENTS.filter((e, i) => e.k !== "x" && (e.k === k || (e.k === "a" && k !== "k")) && (!e.arc || s.w.arcs.includes(e.arc)) && !(e.arc && s.seen[i] != null) && (s.seen[i] == null || s.ageM - s.seen[i] > 50) && met(s, e) && fits(s, e.who));
  // The month you arrive somewhere, that place's own events come first.
  const local = arrived && list.filter((e) => e.who?.includes(placeOf(s).id)); if (local?.length) list = local;
  if (!list.length) return; const e = wp(s.r, list); s.seen[EVENTS.indexOf(e)] = s.ageM; open(s, e, e.tag || (e.arc ? "ชะตา" : k === "h" ? "ฮันเตอร์" : "ชีวิต")); addApproach(s);
}
function openAwaken(s) {
  const p = Math.round(clamp(s.w.pot + mod(s, "awaken") + (stat(s, "wil") - 10) * 0.25, 8, 94));
  open(s, { t: "ถึงวันตรวจปลุกพลังประจำปี แถวยาวรอบอาคารสมาคม เครื่องวัดมานาส่องแสงเย็นบนฝ่ามือคุณ", o: [{ l: "วางมือลงบนเครื่องวัด", p, y: { m: "เข็มสะบัดจนสุดหน้าปัด", awaken: 1 }, n: { m: "เข็มไม่ขยับ ไม่มีใครมองคุณอีก โลกนี้ยังต้องการคนอีกหลายแบบ", careerPick: 1 } }] }, "ปลุกพลัง");
}
H.careerPick = (s) => openCareer(s);
function openCareer(s) { open(s, { t: s.career ? "ใบสมัครงานใหม่วางอยู่ตรงหน้า ประสบการณ์เก่าติดตัวไปได้ครึ่งเดียว คุณจะไปทางไหน?" : "คุณไม่ใช่ฮันเตอร์ แต่ค่าเช่าไม่รอใคร เส้นทางไหนที่เปิดให้คุณ?", o: s.w.careers.filter((id) => id !== s.career).map((id) => { const c = CAREERS[id]; return { l: `${c.n} · ถนัด${STATS[c.st]}`, note: `${c.d} ·${perkText(c.m)} · เริ่มต้น ₡${fmt(c.pay)}/เดือน${c.risk ? " · งานเสี่ยงบาดเจ็บ" : ""}`, y: { m: "ตกลงเริ่มงาน", career: id } }; }) }, "อาชีพ"); }
function openLate(s) { s.flags.lateDone = 1; open(s, { t: "มือคุณส่องแสงกลางดึก ทั้งที่อายุป่านนี้แล้ว พลังที่หลับมาตลอดชีวิตกำลังตื่น", o: [{ l: "รับมัน", y: { m: "ชีวิตครึ่งหลังเริ่มขึ้น", awaken: 1, fame: 8 } }, { l: "ปิดบังไว้ เป็นคนธรรมดาต่อ", y: { m: "มือคุณดับลงตลอดกาล", karma: 3 } }] }, "ปลุกพลัง"); }
function openWorld(s, c) {
  const W = WORLD.find((x) => x.id === c.id);
  if (stage(s) === "k") { log(s, line(s, "kidW", { w: W.n }), "โลก", "imp"); return; }
  if (W.price) { s.w.price = W.price; s.w.priceT = 6; }
  emit("surge"); open(s, s.hunter ? W.h : W.c, "โลก", { z: c.z, mon: pk(s.r, MON) });
}
// When several paths are ready the player picks one, so a row earlier in the list can't shut out the rest.
// A special class is a rare break past your limits: the trial is hard, and each path closes for good after SPC_TRIES failed trials (refusing costs nothing).
// Limits break in your prime: paths open only before SPC_AGE, except the late awakener's own path.
const SPC_TRIES = 2;
export const SPC_AGE = 55;
function openSpecial(s, L) { s.spcCd = s.ageM + 4; const x0 = L[0]; open(s, { t: `${L.length > 1 ? "หลายทางเปิดพร้อมกัน เลือกได้ทางเดียว" : x0.n}: ${x0.q}`, o: [...L.map((x) => ({ l: L.length > 1 ? `บททดสอบ: ${x.n}` : "ก้าวเข้าสู่บททดสอบ", note: `${L.length > 1 ? x.d + " · " : ""}พลาดได้อีก ${SPC_TRIES - (s.c["sf_" + x.id] || 0)} ครั้งก่อนทางนี้ปิด`, fight: { lv: s.lv + 5, m: 1.4, n: `เงาของ${x.n}`, el: x.el }, y: { m: "ขีดจำกัดเดิมแตกออก", setSpc: x.id }, n: { m: "ยังไม่ใช่เวลาของคุณ", hp: -18, spcFail: x.id } })), { l: "ปฏิเสธไปก่อน", y: { m: "มันจะกลับมาอีก", spcFail: 1 } }] }, "คลาสพิเศษ"); }
const examNeed = (s) => (s.hunter ? 3 + s.rank * 3 : 3 + s.cr * 3);
export const examInfo = (s) => ({ need: examNeed(s), have: s.main, ready: examReady(s) });
function examReady(s) { if (s.hunter) return s.rank < RANKS.length - 1 && s.lv >= LVCAP[s.rank] - 2 && s.main >= examNeed(s); return s.career && !retired(s) && s.cr < 4 && s.cxp >= 90 * Math.pow(s.cr + 1, D.CIV_ECON.promo) && s.main >= examNeed(s); }
function openExam(s) {
  if (s.hunter) { const R = RANKS[s.rank + 1]; open(s, { t: line(s, "exam", { R }), o: [{ l: "เข้าสอบ", fight: { lv: s.lv + 2, m: 1.1 + s.rank * 0.03 + Math.max(0, s.rank + 1 - s.w.ceil) * 0.9, n: `ผู้คุมสอบแรงก์ ${R}`, el: pk(s.r, Object.keys(ELEMENTS)) }, y: { m: "ใบอนุญาตใหม่ยังอุ่นอยู่เลย", rankUp: 1 }, n: { m: "@examFail", hp: -14, examFail: 1 } }, { l: "ขอเลื่อนสอบ", y: { m: "@examDelay", examFail: 3 } }] }, "แรงก์"); return; }
  const c = CAREERS[s.career]; open(s, { t: `มีตำแหน่ง ${c.t[s.cr + 1]} ว่าง คุณถูกเสนอชื่อเข้าประเมิน`, o: [{ l: "เข้าประเมิน", s: c.st, d: -s.cr * 5, y: { m: "ผ่านประเมินฉลุย", crUp: 1, fame: 2 }, n: { m: "คนอื่นได้ไปก่อน", examFail: 1 } }] }, "อาชีพ");
}
const ROUTE = { str: "ใช้กำลังฝ่าตรงๆ", agi: "ใช้ความเร็วลัดผ่าน", int: "วางแผนเจาะจุดอ่อน", wil: "ข่มสถานการณ์ด้วยใจนิ่ง", cha: "เจรจาให้ปัญหาจบเอง", luk: "เสี่ยงดวงตามสัญชาตญาณ" };
// A contract can be solved by any stat you have clearly invested in: easier odds, +15% pay and a little growth in that stat. Two routes at most, best stats first.
// A route is only shown when it beats the plain way's odds (baseP), so ◆ is never the worse pick.
function routes(s, y, nOut, skip, baseP) {
  const need = (k) => (s.hunter ? Math.round(k === "luk" ? 8 + 0.4 * s.lv : 12 + 0.8 * s.lv) : Math.round(14 + 6 * s.cr));
  return Object.keys(STATS).filter((k) => k !== skip && stat(s, k) >= need(k) && optOdds(s, { s: k, d: 3, need: 1 }) > baseP).sort((a, b) => stat(s, b) - need(b) - (stat(s, a) - need(a))).slice(0, 2)
    .map((k) => ({ l: ROUTE[k], s: k, d: 3, need: { [k]: need(k) }, y: { ...styled(y, k), gold: (y.gold + (STYLE[k].gold || 0)) * 1.15, sta: { [k]: 0.5 } }, n: nOut }));
}
// Once you are level-ready for the exam, the association sends contracts faster so the wait is short.
const capWait = (s) => s.hunter && s.lv >= LVCAP[s.rank] - 2 && s.main < examNeed(s);
function openMain(s) {
  s.nextMain = s.ageM + (capWait(s) ? ri(s.r, 1, 2) : ri(s.r, 3, 6)); const z = here(s), mon = pk(s.r, MON), ctx = { z, mon };
  if (s.hunter) {
    const t = pk(s.r, [...D.MAIN_H, ...CLASSES[s.cls].job.map(([n, st, d]) => ({ n, st, d, kind: st ? undefined : "fight" }))]), y = { m: "@mainOk", gold: 170 * (1 + mod(s, "quest") / 100), xp: 2, main: 1, mat: 2, fame: 1, c: { quests: 1 } }, o = t.kind === "fight" ? { l: "รับงาน", fight: { lv: s.lv + 1, m: 1 + t.d, n: mon, el: pk(s.r, Object.keys(ELEMENTS)) }, y, n: { m: "งานล้มเหลว", hp: -14 } } : { l: "รับงาน", s: t.st, d: t.d, y, n: { m: "@mainFail", gold: -40 } };
    return open(s, { t: raw(s, "mainT").replace("{n}", t.n), o: [o, ...routes(s, y, { m: "@mainFail", hp: -8 }, t.st, optOdds(s, o)), { l: "ส่งต่อทีมอื่น", y: { m: "@mainSkip" } }] }, "เควสหลัก", ctx);
  }
  if (!s.career || retired(s)) return; const c = CAREERS[s.career], [jobText, jobSt, jobD] = pk(s.r, c.job);
  const cy = { m: "งานเรียบร้อย หัวหน้าจำชื่อคุณได้", gold: 90, main: 1, cxp: 8, fame: 1, c: { quests: 1 } };
  open(s, { t: `งานหลัก #${(s.c.quests || 0) + 1}: ${jobText}`, o: [{ l: "รับผิดชอบเต็มที่", s: jobSt || c.st, d: jobD, y: cy, n: { m: "งานพลาด ถูกหักเงิน", gold: -30 } }, ...routes(s, cy, { m: "งานพลาด ถูกหักเงิน", gold: -45 }, jobSt || c.st, odds(s, jobSt || c.st, jobD)), { l: "ทำแค่พอผ่าน", y: { m: "ไม่มีใครพูดอะไร", gold: 20, cxp: 2 } }] }, "เควสหลัก", ctx);
}

// ---- Player actions: same rules for manual and auto play.
const need = (s, cond, msg) => { if (!cond) { log(s, msg, "ระบบ", "bad"); return false; } return true; };
const pay = (s, v, why) => { if (s.gold < v) { log(s, `เงินไม่พอสำหรับ${why} (₡${fmt(v)})`, "ระบบ", "bad"); return false; } s.gold -= v; return true; };
export const recipeCost = (g) => ({ gold: Math.round(100 * Math.pow(4.2, g)), ore: 3, hide: 2, core: 1 });
export const anvilCost = (a) => Math.round(400 * Math.pow(5, a));
export const craftOdds = (s, g) => Math.round(clamp(62 + s.craft * 0.4 + mod(s, "craft") * 0.2 + stat(s, "int") * 0.08 - g * 11, 8, 98));
export function craft(s, slot, t, g) {
  if (!need(s, s.anvil >= g, `ทั่งยังไม่ถึงขั้น${GRADES[g].n}`)) return; const c = recipeCost(g); for (const k of ["ore", "hide", "core"]) if (!need(s, (s.mat[k + g] || 0) >= c[k], `${D.MATS[k]}ขั้น${GRADES[g].n}ไม่พอ`)) return;
  if (!pay(s, c.gold, "ค่าตี")) return; for (const k of ["ore", "hide", "core"]) s.mat[k + g] -= c[k]; s.c.crafts = (s.c.crafts || 0) + 1; s.craft = clamp(s.craft + 1.5, 0, 100);
  if (!ch(s.r, craftOdds(s, g) / 100)) { emit("break"); return log(s, "เหล็กแตกกลางเตา วัตถุดิบสูญไป", "ตีเหล็ก", "bad"); }
  const luck = s.craft + mod(s, "craft") * 0.5, q = wp(s.r, [0, 1, 2, 3, 4].map((v) => ({ v, w: [24, 50, 18 + luck * 0.3, 5 + luck * 0.2, 0.7 + luck * 0.08][v] }))).v, x = mkGear(s, slot, t, g, q); emit("loot"); log(s, `ตีสำเร็จ: ${gearName(x)} (${QUAL[q].n})`, "ตีเหล็ก", q >= 3 ? "leg" : "good"); autoWear(s, x);
}
export const enhCost = (g) => Math.round(70 * Math.pow(g.plus + 1, 1.6) * (g.g + 1) ** 2);
export const enhOdds = (s, g) => Math.round(clamp(ENH_ODDS[g.plus] + mod(s, "enh"), 1, 100));
export function enhance(s, id, useStone) {
  const g = gearOf(s, id); if (!g || g.plus >= 15) return; if (!pay(s, enhCost(g), "ตีบวก")) return; s.c.tries = (s.c.tries || 0) + 1;
  if (ch(s.r, enhOdds(s, g) / 100)) { g.plus++; s.c.enh = Math.max(s.c.enh || 0, g.plus); emit("enh_ok", g.plus); return log(s, `ตีบวกสำเร็จ: ${gearName(g)}`, "ตีบวก", g.plus >= 9 ? "leg" : "good"); }
  if (g.plus < 5) { emit("enh_fail"); return log(s, `ตีบวกไม่ติด ${gearName(g)} ยังอยู่เท่าเดิม`, "ตีบวก", "bad"); }
  if (g.plus < 10 || (useStone && s.stone > 0)) { if (g.plus >= 10) s.stone--; g.plus--; emit("enh_fail"); return log(s, `ตีบวกล้มเหลว ระดับลดลงเป็น +${g.plus}`, "ตีบวก", "bad"); }
  s.gear = s.gear.filter((x) => x !== g); for (const k in s.wear) if (s.wear[k] === id) s.wear[k] = null; emit("break"); log(s, `${gearName(g)} แตกเป็นเสี่ยงๆ`, "ตีบวก", "bad");
}
export const equip = (s, id) => { const g = gearOf(s, id); if (g) s.wear[g.slot] = id; };
export function sell(s, id) { const g = gearOf(s, id); if (!g) return; const v = gearPw(g) * 18; s.gold += v; s.gear = s.gear.filter((x) => x !== g); for (const k in s.wear) if (s.wear[k] === id) s.wear[k] = null; emit("coin"); log(s, `ขาย ${gearName(g)} +₡${fmt(v)}`, "ตลาด"); }
export const SHOP = [{ id: "pot", n: "ยารักษาบาดแผล", d: "ฟื้นสุขภาพ 35 อัตโนมัติ", price: (s) => 60 * tier(s) }, { id: "stone", n: "หินกันแตก", d: "ป้องกันอาวุธแตกที่ +10 ขึ้นไป", price: () => 900 }, { id: "token", n: "แผ่นย้ายชีพ", d: "รอดตายจากการต่อสู้หรือบาดแผล 1 ครั้ง (ไม่ช่วยเรื่องอายุขัย)", price: (s) => 2500 * tier(s) }, { id: "book", n: "ตำราสมาคม", d: "สุ่มวิชาตามแรงก์", price: (s) => 500 * tier(s) * tier(s), hunter: 1 }, { id: "anvil", n: "อัปเกรดทั่งตี", d: "ปลดล็อกวัตถุดิบขั้นถัดไป", price: (s) => anvilCost(s.anvil) }];
export function buy(s, id) { const x = SHOP.find((a) => a.id === id); if (id === "anvil" && s.anvil >= 5) return; if (x.hunter && !s.hunter) return; if (!pay(s, x.price(s), x.n)) return; if (id === "anvil") { s.anvil++; emit("rank"); } else if (id === "book") learn(s); else { s[id]++; emit("coin"); } log(s, `ซื้อ ${x.n}`, "ตลาด"); }
// Travel: a one-way fare moves where you hunt and which local events can find you. Going home is free.
export function travel(s, i) {
  const P = D.PLACES[i]; if (!P || !s.hunter || (s.at || 0) === i) return; if (!pay(s, P.fare, `ค่าเดินทางไป${P.n}`)) return;
  s.at = i; s.arrive = 1; emit("quest");
  log(s, `เดินทางไป${P.n}: ${P.d}${s.lv < P.lv ? " · ที่นี่อันตรายเกินเลเวลของคุณ" : ""}`, "เดินทาง", s.lv < P.lv ? "bad" : "imp");
}
// Auto play runs the month the way a careful player would: rest when hurt, return to the old plan once healed, and hunt where your level belongs.
export function autoPlan(s) {
  if (s.ev || s.dead || stage(s) === "k" || retired(s)) return;
  if (s.health < 40 && s.focus !== "rest") { s.autoBack = s.focus; s.focus = "rest"; return; }
  if (s.focus === "rest" && s.health >= 85) { s.focus = s.autoBack || (s.hunter ? "hunt" : "work"); s.autoBack = null; }
  if (s.hunter && s.focus === "hunt") { const cur = s.at || 0, i = D.PLACES.reduce((b, p, j) => (p.lv <= s.lv && s.gold > p.fare * 3 ? j : b), 0); if (i !== cur && (i > cur || placeOf(s).lv > s.lv)) travel(s, i); }
}
export const foundCost = 12000;
export function foundGuild(s, n) { if (!need(s, s.hunter && s.rank >= 2, "ต้องเป็นฮันเตอร์แรงก์ C ขึ้นไป")) return; if (!need(s, !s.guild, "ต้องออกจากกิลด์เดิมก่อน")) return; if (!pay(s, foundCost, "ค่าจดทะเบียน")) return; s.guild = { own: 1, n, rep: 10, funds: 2000, mem: [], hall: { forge: 0, train: 0, watch: 0 }, loy: 70 }; s.fame += 8; emit("rank"); log(s, `ก่อตั้งกิลด์ "${n}"`, "กิลด์", "leg"); }
export function joinGuild(s, i) { const g = s.w.guilds[i]; if (!need(s, s.hunter && !s.guild, "ต้องเป็นฮันเตอร์ที่ยังไม่มีกิลด์")) return; if (!need(s, s.rank >= g.req, `ต้องมีแรงก์ ${RANKS[g.req]} ขึ้นไป`)) return; s.guild = { n: g.n, m: g.m, rep: 0, gi: i }; emit("quest"); log(s, `เข้าร่วมกิลด์ ${g.n}`, "กิลด์", "imp"); }
export function leaveGuild(s) { if (s.guild?.own) s.gold += s.guild.funds * 0.5; log(s, `ออกจากกิลด์ ${s.guild.n}`, "กิลด์", "bad"); s.guild = null; }
export const recruitCost = (s, i) => Math.round(200 + s.npcs[i].lv * 60);
export function recruit(s, i) { const g = s.guild, n = s.npcs[i], c = recruitCost(s, i); if (!g?.own || g.mem.includes(i) || !n.hun || !n.alive) return; if (!need(s, g.funds >= c, "คลังกิลด์ไม่พอ")) return; if (!need(s, n.rel + stat(s, "cha") * 0.5 + g.rep * 0.2 >= 25, `${n.n} ยังไม่เชื่อใจคุณพอ`)) return; g.funds -= c; g.mem.push(i); emit("quest"); log(s, `${n.n} เข้าร่วมกิลด์`, "กิลด์", "good"); }
export const hallCost = (g, k) => Math.round(1500 * Math.pow(2.4, g.hall[k]));
export function upgradeHall(s, k) { const g = s.guild, c = hallCost(g, k); if (!g?.own || g.hall[k] >= 5) return; if (!need(s, g.funds >= c, "คลังกิลด์ไม่พอ")) return; g.funds -= c; g.hall[k]++; emit("rank"); log(s, `อัปเกรด ${HALLS[k].n} เป็น Lv.${g.hall[k]}`, "กิลด์", "good"); }
export function donate(s, v) { const g = s.guild; if (!g?.own || !pay(s, v, "บริจาค")) return; g.funds += v; g.loy = clamp(g.loy + 2, 0, 100); emit("coin"); }
export const guildRole = (g) => GUILD_ROLES[g.rep >= 280 ? 3 : g.rep >= 120 ? 2 : g.rep >= 40 ? 1 : 0];
function guildWork(s) { const g = s.guild; if (!g) { hunt(s); return; } if (g.own) { g.rep += 1.6; g.loy = clamp(g.loy + 3, 0, 100); g.funds += 150 * tier(s); } else { g.rep += 2.5; s.gold += 80 * tier(s); } gainXp(s, huntXp(s) * 0.5); }
function guildMonth(s) {
  const g = s.guild; if (!g.own) { s.gold += 15 * (1 + g.rep / 30) * tier(s); return; }
  const inc = g.mem.reduce((a, i) => a + s.npcs[i].lv * 7, 0) * (1 + g.rep / 200), up = g.mem.length * 35 + 60; g.funds += inc - up; g.loy = clamp(g.loy + (g.funds > 0 ? 0.25 : -2.5), 0, 100); g.rep += g.mem.length * 0.05;
  if (g.mem.length && g.loy < 25 && ch(s.r, 0.12)) { const i = g.mem.splice(ri(s.r, 0, g.mem.length - 1), 1)[0]; log(s, `${s.npcs[i].n} ลาออกจากกิลด์เพราะเงินเดือนค้าง`, "กิลด์", "bad"); }
}
