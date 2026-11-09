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

export const FOCUS = {
  k: { play: { n: "วิ่งเล่น", st: { luk: 0.1, agi: 0.17, cha: 0.08 } }, study: { n: "ตั้งใจเรียน", st: { int: 0.28, wil: 0.08 } }, sport: { n: "ออกกำลัง", st: { str: 0.26, agi: 0.1 } }, help: { n: "ช่วยงานบ้าน", st: { cha: 0.16, wil: 0.14 }, pay: 4 } },
  h: { hunt: { n: "ล่ารอยแยก" }, tower: { n: "ไต่หอ" }, train: { n: "ฝึกฝน" }, guild: { n: "งานกิลด์" }, craft: { n: "ฝึกตีเหล็ก" }, rest: { n: "พักฟื้น" } },
  c: { work: { n: "ทำงาน" }, study: { n: "พัฒนาตัวเอง" }, craft: { n: "งานช่างเสริม" }, rest: { n: "อยู่กับครอบครัว" } },
};

// Seed offers four trades, and the household you grew up in adds one it knows.
const careerOffer = (R, fam) => { const a = shuf(R("car"), Object.keys(CAREERS)).slice(0, 4), f = shuf(R("fjob"), fam.job || []).find((x) => !a.includes(x)); return f ? [...a, f] : a; };
export const perkText = (m) => Object.entries(m).map(([k, v]) => `${D.MOD_N[k] || STATS[k] || k} ${v > 0 ? "+" : ""}${v}${k === "life" ? " ปี" : STATS[k] ? "" : "%"}`).join(" · ");
export const halve = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v / 2]));
// who = career and class ids that may see an event or option. Unset means everyone.
export const fits = (s, who) => !who || who.includes(s.cls) || who.includes(s.career) || who.includes(s.pastJob);

// ---- World and life generation: one named stream per thing, so choices can't reshuffle the world.
export function newLife(seed, name, legacy) {
  seed = String(seed);
  const R = (l) => mk(seed, l), w = R("w"), fam = pk(R("fam"), D.FAMILIES);
  const lat = R("lat"), latent = [], n = ri(lat, 2, 3);
  while (latent.length < n) { const x = wp(lat, LATENTS), i = LATENTS.indexOf(x); if (!latent.includes(i)) latent.push(i); }
  const hasLate = latent.some((i) => LATENTS[i].late);
  const y0 = 2041 + ri(w, 0, 18), specials = shuf(R("sp"), SPECIALS.map((x) => x.id)).filter((x) => x !== "late" && x !== "twoworld").slice(0, 5);
  if (hasLate) specials.push("late", "twoworld");
  const t = R("tower"), bosses = shuf(R("boss"), BOSS), els = Object.keys(ELEMENTS), tower = [];
  for (let f = 1; f <= 100; f++) {
    const b = f % 10 === 0;
    tower.push({ t: b ? "boss" : f % 5 === 0 ? "elite" : wp(t, [{ v: "fight", w: 6 }, { v: "rest", w: 1 }, { v: "cache", w: 1.3 }, { v: "test", w: 1.5 }]).v, el: pk(t, els), mod: pk(t, D.FLOOR_MODS), name: b ? bosses[(f / 10 - 1) % bosses.length] : pk(t, MON) });
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
  if (s.cls) add(`คลาส: ${CLASSES[s.cls].n}`, CLASSES[s.cls].m);
  if (s.spc) add(`คลาสพิเศษ: ${spc(s.spc).n}`, spc(s.spc).m);
  if (s.career) add(`อาชีพ: ${CAREERS[s.career].n}`, CAREERS[s.career].m);
  if (s.pastJob) add(`อาชีพเดิม: ${CAREERS[s.pastJob].n}`, halve(CAREERS[s.pastJob].m));
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
  return Math.round(clamp(50 + (stat(s, k) - expected) * 2.2 + d * 2 + (stat(s, "luk") - expected) * 0.25, 5, 95));
}

// ---- One combat formula. Hunts, tower, quests, tournaments all call fight().
export const sk = (s, id) => { const [f, e, g] = id.split("_"), F = FORMS[f], x = s.sk.find((a) => a.id === id), m = x ? x.m : 0; return { id, k: F.k, el: e, g: +g, n: F.n + ELEMENTS[e].n, gn: SKILL_GRADES[+g].n, m, p: SKILL_GRADES[+g].p * F.p * (0.55 + (0.45 * m) / 100) * (s.w.aff.includes(e) ? 1.25 : 1) }; };
export const gearOf = (s, id) => (id == null ? null : s.gear.find((g) => g.id === id));
export const gearName = (g) => `${g.base}${g.affix != null ? AFFIX[g.affix].n : ""} ${GRADES[g.g].n}${g.plus ? ` +${g.plus}` : ""}`;
export const gearPw = (g) => GRADES[g.g].p * QUAL[g.q].p * (1 + g.plus * 0.1) * (g.slot === "weapon" ? WEAPONS[g.t].atk : g.slot === "charm" ? 0.4 : 1);
export function derive(s) {
  const cl = s.cls ? CLASSES[s.cls] : null, main = cl ? cl.main : "str", eq = s.eq.map((id) => sk(s, id)), sum = (k) => eq.filter((x) => x.k === k).reduce((a, x) => a + x.p, 0);
  const w = gearOf(s, s.wear.weapon), a = gearOf(s, s.wear.armor), c = gearOf(s, s.wear.charm), lv = s.hunter ? s.lv : 0;
  const atk = (8 + stat(s, main) * 1.1 + lv * 2.4 + (w ? gearPw(w) : 0) + (c ? gearPw(c) * 0.5 : 0)) * (1 + sum("atk") + mod(s, "atk") / 100);
  const def = (3 + stat(s, "str") * 0.35 + lv * 1.2 + (a ? gearPw(a) * 0.6 : 0)) * (1 + sum("guard") + mod(s, "def") / 100);
  const maxHp = (60 + stat(s, "str") * 6 + lv * 16 + (a ? gearPw(a) * 2 : 0)) * (1 + mod(s, "hp") / 100);
  return { atk, def, maxHp, hp: maxHp * (0.55 + s.health / 220), crit: clamp(0.05 + stat(s, "luk") * 0.0012 + (mod(s, "crit") + (w ? WEAPONS[w.t].crit : 0)) / 100, 0.02, 0.6), dodge: clamp(0.03 + stat(s, "agi") * 0.0008 + sum("step") + mod(s, "dodge") / 100, 0, 0.45), heal: sum("heal") * (1 + mod(s, "heal") / 100), skills: eq.filter((x) => x.k === "atk"), wfx: w ? WEAPONS[w.t].fx : "impacts/blunt-hit", power: Math.round(atk * Math.sqrt(maxHp) * 0.1 + def) };
}
export const enemy = (o) => { const L = o.lv, m = o.m || 1; return { n: o.n, boss: o.boss, el: o.el, lv: L, atk: (14 + L * 3.6 + L * L * 0.045) * m, def: (3 + L * 1.7 + L * L * 0.02) * m, hp: (90 + L * 22 + L * L * 0.5) * m, crit: 0.05, dodge: 0.03 }; };
function simulate(a, b, r, rec) {
  let ha = a.hp, hb = b.hp, healed = false; const R = [];
  const hit = (x, y, who, sk) => { if (rnd(r) < y.dodge) { rec && R.push({ who, miss: 1 }); return 0; } let p = x.atk * (x.atk / (x.atk + y.def * 1.2)) * (0.85 + rnd(r) * 0.3); const c = rnd(r) < x.crit; if (c) p *= 1.6; if (sk && ELEMENTS[sk.el].beat === y.el) p *= 1.25; p = Math.max(x.atk * 0.08, p); rec && R.push({ who, dmg: Math.round(p), crit: c, sk: sk?.n, el: sk?.el }); return p; };
  for (let i = 0; i < 12 && ha > 0 && hb > 0; i++) {
    hb -= hit(a, b, "p", a.skills?.length ? a.skills[i % a.skills.length] : null); if (hb <= 0) break;
    ha -= hit(b, a, "e");
    if (!healed && a.heal > 0 && ha > 0 && ha < a.maxHp * 0.4) { healed = true; const h = a.maxHp * Math.min(0.5, a.heal * 1.2); ha += h; rec && R.push({ who: "p", heal: Math.round(h) }); }
  }
  const sa = Math.max(0, ha) / a.hp, sb = Math.max(0, hb) / b.hp;
  return { win: hb <= 0 || (ha > 0 && sa > sb), share: Math.min(1, sa), rounds: R };
}
export function fight(s, foe) { const r = simulate(derive(s), foe, s.r, true); s.c.fights = (s.c.fights || 0) + 1; return { ...r, foe: { n: foe.n, boss: foe.boss, el: foe.el }, wfx: derive(s).wfx }; }
export function winOdds(s, foe) { const a = derive(s), r = { s: hash(s.ageM + foe.n) }; let w = 0; for (let i = 0; i < 60; i++) if (simulate(a, foe, r).win) w++; return Math.round((w / 60) * 100); }
const afterFight = (s, res) => { if (res.win) s.health = clamp(s.health - (1 - res.share) * 13, 1, 100); };

// ---- Effects: a single table so event data stays tiny.
const H = {
  gold: (s, v) => { const g = v * tier(s) * (v > 0 ? 1 + mod(s, "gold") / 100 : 1); s.gold += g; if (v > 0) emit("coin"); },
  xp: (s, v) => gainXp(s, v * huntXp(s)), hp: (s, v) => hurt(s, v), fame: (s, v) => { s.fame += v * (v > 0 ? 1 + mod(s, "fame") / 100 : 1); }, karma: (s, v) => (s.karma = clamp(s.karma + v, -100, 100)),
  sta: (s, v) => { for (const k in v) s.st[k] += v[k]; }, mat: (s, v) => { for (let i = 0; i < v; i++) dropMat(s); }, pot: (s, v) => (s.pot += v), stone: (s, v) => (s.stone += v), skill: (s, v) => { for (let i = 0; i < v; i++) learn(s); }, gear: (s, v) => { for (let i = 0; i < v; i++) dropGear(s); },
  flag: (s, v) => (s.flags[v] = 1), next: (s, [id, m]) => s.q.push({ id, at: s.ageM + m, ctx: s.ctx }), rel: (s, v) => { const n = s.npcs[s.ctx?.ni]; if (n) n.rel = clamp(n.rel + v, -100, 100); }, c: (s, v) => { for (const k in v) s.c[k] = (s.c[k] || 0) + v[k]; }, main: (s, v) => (s.main += v), floor: (s, v) => setFloor(s, s.floor + v),
  marry: (s) => { s.spouse = s.ctx.ni; s.npcs[s.spouse].rel = 100; emit("love"); }, child: (s) => { s.kids.push(pk(s.r, D.GIVEN)); emit("love"); }, cxp: (s, v) => (s.cxp += v), rankUp: (s) => rankUp(s), crUp: (s) => { s.cr++; s.main = 0; s.cxp = 0; emit("rank"); log(s, `เลื่อนตำแหน่งเป็น ${CAREERS[s.career].t[s.cr]}`, "อาชีพ", "imp"); }, awaken: (s) => awaken(s), career: (s, v) => { if (s.career && s.career !== v) s.pastJob = s.career; s.career = v; s.cr = 0; s.cxp = 0; s.main = 0; s.focus = "work"; s.nextMain = s.ageM + 4; log(s, `เริ่มต้นอาชีพ ${CAREERS[v].n} ตำแหน่ง ${CAREERS[v].t[0]}`, "อาชีพ", "imp"); }, setSpc: (s, v) => { s.spc = v; const x = spc(v); gainSkill(s, 3, x.el); emit("awaken"); log(s, `เปลี่ยนสู่คลาสพิเศษ: ${x.n}`, "คลาสพิเศษ", "leg"); }, guildRep: (s, v) => { if (s.guild) s.guild.rep = Math.max(0, s.guild.rep + v); }, spcFail: (s) => (s.spcCd = s.ageM + 12), examFail: (s) => (s.nextExam = s.ageM + 8),
};
export function apply(s, e) { for (const k in e) if (k !== "m") H[k]?.(s, e[k]); }
function hurt(s, v) { s.health = clamp(s.health + v * (v > 0 ? 1 + mod(s, "heal") / 200 : 1 - clamp(mod(s, "safe"), 0, 60) / 100), 0, 100); if (s.health <= 0) { s.health = 1; if (s.ageM > 192 && ch(s.r, 0.3)) die(s, "บาดแผลสาหัส"); } }
export const huntXp = (s) => (15 + s.lv * 5) * (1 + mod(s, "xp") / 100);
export const xpNeed = (l) => Math.round(30 + 8 * l + 0.25 * l * l);
function gainXp(s, v) { if (!s.hunter) { s.cxp += v * 0.02; return; } const cap = LVCAP[s.rank]; if (s.lv >= cap) return; s.xp += v; while (s.lv < cap && s.xp >= xpNeed(s.lv)) { s.xp -= xpNeed(s.lv); s.lv++; const m = CLASSES[s.cls].main; for (const k in STATS) s.st[k] += k === m ? 2.3 : k === "luk" ? 0.35 : 0.9; emit("levelup"); log(s, line(s, "lvup", { lv: s.lv }), "เติบโต", "good"); } if (s.lv >= cap) s.xp = 0; }
const matGrade = (s) => clamp(Math.floor(s.lv / 18), 0, 5);
function dropMat(s) { const k = pk(s.r, ["ore", "hide", "core"]) + matGrade(s); s.mat[k] = (s.mat[k] || 0) + 1; }
function learn(s, ceil) { const g = wp(s.r, [0, 1, 2, 3, 4].filter((x) => x <= (ceil ?? s.rank)).map((x) => ({ x, w: [34, 28, 14, 5, 1.5][x] }))).x; return gainSkill(s, g); }
export function gainSkill(s, g, el) { const els = [...s.w.aff, ...(s.cls ? CLASSES[s.cls].els : [])]; el = el || (ch(s.r, 0.6) ? pk(s.r, els) : pk(s.r, Object.keys(ELEMENTS))); const f = pk(s.r, Object.keys(FORMS)), id = `${f}_${el}_${g}`, x = s.sk.find((a) => a.id === id); if (x) x.m = Math.min(100, x.m + 25); else s.sk.push({ id, m: 10 }); autoEq(s); emit("skill"); log(s, `คุณจับทางวิชา${sk(s, id).n}ได้ เป็นวิชาระดับ${SKILL_GRADES[g].n}`, "วิชา", g >= 3 ? "leg" : "good"); return id; }
export function autoEq(s) { const lim = { atk: 3, guard: 1, step: 1, heal: 1 }, all = s.sk.map((x) => sk(s, x.id)).sort((a, b) => b.p - a.p); s.eq = []; for (const x of all) if (lim[x.k]-- > 0) s.eq.push(x.id); }
export function toggleSkill(s, id) { if (s.eq.includes(id)) { s.eq = s.eq.filter((x) => x !== id); return; } const k = sk(s, id).k, on = s.eq.filter((x) => sk(s, x).k === k); if (on.length >= (k === "atk" ? 3 : 1)) s.eq = s.eq.filter((x) => x !== on[0]); s.eq.push(id); }
export function mkGear(s, slot, t, g, q) { const base = slot === "weapon" ? WEAPONS[t].n : slot === "armor" ? ARMORS[t] : CHARMS[t], affix = slot === "charm" || ch(s.r, 0.3 + q * 0.14) ? ri(s.r, 0, AFFIX.length - 1) : null, x = { id: s.gid++, slot, t, g, q, plus: 0, base, affix }; s.gear.push(x); return x; }
function dropGear(s) { const slot = pk(s.r, ["weapon", "weapon", "armor", "charm"]), n = slot === "weapon" ? WEAPONS.length : 4, x = mkGear(s, slot, ri(s.r, 0, n - 1), matGrade(s), wp(s.r, [0, 1, 2, 3, 4].map((v) => ({ v, w: [22, 45, 22, 9, 2][v] }))).v); emit("loot"); log(s, `${gearName(x)} คุณภาพ${QUAL[x.q].n} ติดมือคุณกลับมา`, "ของ", x.q >= 3 ? "leg" : "good"); autoWear(s, x); }
const autoWear = (s, g) => { const c = gearOf(s, s.wear[g.slot]); if (!c || gearPw(g) > gearPw(c)) s.wear[g.slot] = g.id; };

function awaken(s) {
  s.hunter = true; s.rev = s.latent.length; s.lv = 1; s.xp = 0; if (s.career) { s.lateAw = 1; s.pastJob = s.career; }
  const stats = Object.entries(CLASSES).map(([id, c]) => ({ id, w: 2 + Math.max(0, s.st[c.main] - 8) * 0.8 })), rc = mk(s.seed, "cls"); s.cls = wp(rc, stats).id;
  s.rank = s.w.pot > 83 ? 2 : s.w.pot > 62 ? 1 : 0; const c = CLASSES[s.cls];
  gainSkill(s, 0, c.els[0]); gainSkill(s, 1, c.els[0]); s.focus = "hunt"; s.nextMain = s.ageM + 3; s.career = null;
  mkWeaponStart(s); emit("awaken"); log(s, `พลังที่หลับอยู่ตื่นขึ้นแล้ว ผลตรวจของสมาคมระบุว่าคุณคือ${c.n} แรงก์ ${RANKS[s.rank]}`, "ปลุกพลัง", "leg");
}
function mkWeaponStart(s) { const g = mkGear(s, "weapon", CLASSES[s.cls].wp, 0, 1); s.wear.weapon = g.id; }
function rankUp(s) { s.rank++; s.main = 0; emit("rank"); log(s, `สมาคมบันทึกชื่อคุณเป็นฮันเตอร์แรงก์ ${RANKS[s.rank]}`, "แรงก์", "leg"); if (s.rank >= 2) learn(s); }
function setFloor(s, f) { s.floor = Math.max(s.floor, f); s.c.floorMax = s.floor; }

// ---- Events
function pickNpc(s, best) { const a = s.npcs.map((n, i) => ({ n, i })).filter((x) => x.n.alive && x.i !== s.w.rival); return best ? a.sort((x, y) => y.n.rel - x.n.rel)[0].i : pk(s.r, a).i; }
function toOpt(x) { const [l, st, d, y, n, foe, who] = x, o = { l, y, n, who }; if (st === "fight") o.fight = { m: 1 + d, ...foe }; else if (st) { o.s = st; o.d = d; } return o; }
function open(s, def, tag, ctx) {
  ctx = ctx || { z: pk(s.r, ZONES), mon: pk(s.r, MON) };
  if (ctx.ni == null) { ctx.ni = pickNpc(s, def.if?.rel); ctx.npc = s.npcs[ctx.ni].n; } ctx.rival = s.npcs[s.w.rival].n;
  s.ev = { t: fill(def.t, ctx), tag, ctx, o: def.o.map((x) => (Array.isArray(x) ? toOpt(x) : x)).filter((o) => fits(s, o.who)) };
  for (const o of s.ev.o) if (o.fight && !o.fight.lv) Object.assign(o.fight, { lv: Math.max(1, s.lv + 1), n: o.fight.n || pk(s.r, MON), el: o.fight.el || pk(s.r, Object.keys(ELEMENTS)) });
  emit("event");
}
export const optOdds = (s, o) => (o.p != null ? o.p : o.fight ? winOdds(s, enemy(o.fight)) : o.s ? odds(s, o.s, o.d) : null);
export function choose(s, i) {
  const ev = s.ev, o = ev.o[i]; s.ev = null; s.ctx = ev.ctx; let ok = true, roll = "";
  if (o.fight) { const res = fight(s, enemy(o.fight)); ok = res.win; afterFight(s, res); emit("fight", res); roll = ok ? "ชนะ" : "แพ้"; if (ok && o.fight.boss) s.c.boss = (s.c.boss || 0) + 1; if (!ok && (o.fight.boss || ev.tag === "โลก") && !s.dead) deathRoll(s, o.fight); }
  else { const p = optOdds(s, o); if (p != null) { ok = ch(s.r, p / 100); roll = ok ? "สำเร็จ" : "พลาด"; } }
  const out = ok ? o.y : o.n || {};
  const m = text(s, out.m);
  log(s, [ev.t, line(s, "pick", { l: o.l.replace(/^บททดสอบ: /, "รับบททดสอบ") }), m && (ok || /แต่|ทว่า/.test(m) ? m : "แต่" + m)].filter(Boolean).join(" "), ev.tag, ok ? "imp" : "bad", roll);
  if (!s.dead) apply(s, out);
}
function deathRoll(s, f) { const a = derive(s), e = enemy(f), p = clamp((0.05 * e.atk) / a.atk, 0.03, 0.14); if (ch(s.r, p)) { if (s.token > 0) { s.token--; log(s, "แผ่นย้ายชีพแตกออก คุณลืมตาอีกครั้ง", "รอดตาย", "leg"); emit("heal"); } else die(s, `พ่ายแก่ ${f.n}`); } }
export function autoChoice(s) { let best = 0, bv = -1e9; s.ev.o.forEach((o, i) => { const p = optOdds(s, o); const v = p == null ? 52 : o.fight && p < 50 ? p - 25 : p; if (v > bv) { bv = v; best = i; } }); return best; }
export function die(s, cause) {
  const a = age(s); s.dead = { cause, age: a, title: lifeTitle(s), score: score(s) }; emit("death");
  log(s, `${s.name} จากไปเมื่ออายุ ${a} ปี (${cause})`, "จบชีวิต", "leg");
}
export const score = (s) => Math.round(s.fame * 3 + s.floor * 12 + (s.hunter ? s.rank * 120 + s.lv * 5 : s.cr * 300) + Math.max(0, s.gold) / 400 + Math.abs(s.karma) * 2 + (s.guild?.own ? s.guild.rep : 0) + age(s));
function lifeTitle(s) {
  if (s.floor >= 90) return "ผู้แตะชั้นบนสุด"; if (s.spc) return spc(s.spc).n; if (s.guild?.own && s.guild.rep > 150) return "ผู้ก่อตั้งกิลด์ในตำนาน"; if (s.hunter && s.rank >= 5) return "ฮันเตอร์ที่เมืองจำ"; if (s.karma <= -60) return "ชื่อที่ถูกสาปแช่ง";
  if (!s.hunter && s.cr >= 4) return CAREERS[s.career].t[4]; if (s.karma >= 85) return "คนดีที่ไม่มีใครรู้จัก"; if (!s.hunter && s.career) return `${CAREERS[s.career].t[s.cr]} แห่งยุคฟ้าแตก`; if (s.gold > 100000) return "มหาเศรษฐีหลังแนวกั้น"; if (s.hunter) return `ฮันเตอร์แรงก์ ${RANKS[s.rank]}`; return "คนหนึ่งในเมือง";
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
    if (f === "work") { s.gold += wage(salary); s.cxp += (1 + stat(s, c.st) / 45) * (1 + mod(s, "cxp") / 100); s.st[c.st] += 0.05; brew(s); if (!old && c.risk && ch(s.r, c.risk[0])) { hurt(s, -ri(s.r, 6, 16)); log(s, c.risk[1], "อาชีพ", "bad"); } }
    else if (f === "study") { s.st[c.st] += 0.2; s.st.int += 0.08; s.gold += wage(c.pay * 0.25); s.cxp += 0.5; }
    else if (f === "craft") { s.craft = clamp(s.craft + 0.45 * (1 + mod(s, "craft") / 100), 0, 100); s.gold += wage(c.pay * 0.4); if (ch(s.r, 0.25)) dropCiv(s); }
    else { hurt(s, 1.2); const n = s.npcs[s.spouse ?? pickNpc(s)]; if (n) n.rel = clamp(n.rel + 0.8, -100, 100); s.gold += wage(c.pay * 0.15); }
    return;
  }
  if (s.health < 22 && f !== "rest") { hurt(s, 4); s.gold -= 40; if (!s.sick) { s.sick = 1; log(s, line(s, "hosp"), "ฟื้นฟู", "bad"); } return; }
  if (s.sick && s.health >= 45) { s.sick = 0; log(s, line(s, "healed"), "ฟื้นฟู", "good"); }
  if (f === "hunt") hunt(s); else if (f === "tower") climb(s);
  else if (f === "train") { const m = CLASSES[s.cls].main; s.st[m] += 0.28; s.st.wil += 0.12; gainXp(s, huntXp(s) * 0.35); trainSkill(s, 4); }
  else if (f === "guild") guildWork(s);
  else if (f === "craft") { s.craft = clamp(s.craft + 0.7 * (1 + mod(s, "craft") / 100), 0, 100); s.gold += 60 * tier(s); gainXp(s, huntXp(s) * 0.15); }
  else hurt(s, 6);
}
const brew = (s) => { const b = mod(s, "brew"); if (b && s.pot < 9 && ch(s.r, b / 100)) { s.pot++; log(s, "ปรุงยาไว้ใช้เองได้อีกขวด", "ฟื้นฟู"); } };
const dropCiv = (s) => { const k = pk(s.r, ["ore", "hide", "core"]) + "0"; s.mat[k] = (s.mat[k] || 0) + 1; };
const trainSkill = (s, v) => { for (const id of s.eq) { const x = s.sk.find((a) => a.id === id); if (x) x.m = Math.min(100, x.m + v * (x.m < 50 ? 1 : 0.5)); } };
function hunt(s) {
  const foe = enemy({ lv: Math.max(1, s.lv + ri(s.r, -3, 0)), m: 0.92 + rnd(s.r) * 0.14, n: pk(s.r, MON), el: pk(s.r, Object.keys(ELEMENTS)) }), res = fight(s, foe); s.c.hunts = (s.c.hunts || 0) + 1; afterFight(s, res); emit("minor", res);
  if (res.win) { const g = (40 + s.lv * 22) * (1 + mod(s, "gold") / 100); s.gold += g; gainXp(s, huntXp(s)); dropMat(s); if (ch(s.r, 0.45 + mod(s, "mat") / 100)) dropMat(s); brew(s); trainSkill(s, 1.2); if (ch(s.r, 0.03)) learn(s); if (ch(s.r, 0.05)) dropGear(s); const y = (s.ty ||= { n: 0, f: {} }); y.n++; y.f[foe.n] = (y.f[foe.n] || 0) + 1; }
  else { hurt(s, -ri(s.r, 8, 16)); log(s, line(s, "lose", { mon: foe.n }), "ล่า", "bad"); if (s.health < 30 && ch(s.r, 0.12)) die(s, `พ่ายแก่ ${foe.n} ในรอยแยก`); }
}
export const floorFoe = (s, f) => { const F = s.w.tower[f - 1]; return { lv: Math.round(2 + f * 1.2), m: (F.t === "boss" ? 1.4 : F.t === "elite" ? 1.18 : 0.96) * F.mod.m, n: F.name, el: F.el, boss: F.t === "boss" }; };
function climb(s) {
  for (let i = 0; i < 2; i++) {
    const f = s.floor + 1; if (f > 100) { log(s, "ไม่มีชั้นให้ไต่อีกแล้ว คุณยืนอยู่บนหลังคาของโลก", "หอ", "leg"); s.focus = "hunt"; return; }
    const F = s.w.tower[f - 1], rew = { floor: 1, gold: 60 + f * 8, xp: 1.2, mat: 2 };
    if (F.t === "boss" || F.t === "elite") {
      open(s, { t: `ชั้น ${f}: ${F.t === "boss" ? "บอสประจำช่วง" : "ผู้คุมชั้น"} "${F.name}" รออยู่ · ${F.mod.n} · ธาตุ${ELEMENTS[F.el].n}`, o: [{ l: "เข้าสู้", fight: floorFoe(s, f), y: { m: `ล้ม ${F.name} ได้`, ...rew, ...(F.t === "boss" ? { skill: 1, gear: 1, fame: 5, xp: 3 } : { gear: f % 15 === 0 ? 1 : 0 }), fame: F.t === "boss" ? 5 : 1 }, n: { m: "ถูกเหวี่ยงลงมาจากชั้น", hp: F.t === "boss" ? -30 : -18, towerOut: 1 } }, { l: "ถอยลงไปเตรียมตัว", y: { m: "คุณจำรูปแบบการโจมตีไว้", towerOut: 1 } }] }, "หอ"); return;
    }
    if (F.t === "rest") { hurt(s, 20); apply(s, { floor: 1 }); log(s, `เจอห้องพักที่ชั้น ${f} คุณได้นั่งพักหายใจ`, "หอ", "good"); emit("heal"); }
    else if (F.t === "cache") { apply(s, { floor: 1, mat: 2, gold: 50 + f * 14 }); if (ch(s.r, 0.3)) dropGear(s); log(s, `มีหีบถูกลืมไว้ที่ชั้น ${f}`, "หอ", "good"); emit("loot"); }
    else if (F.t === "test") { const k = pk(s.r, Object.keys(STATS)); if (ch(s.r, odds(s, k, 2) / 100)) { apply(s, { floor: 1, xp: 1.5, sta: { [k]: 1 } }); log(s, `ผ่านบททดสอบ${STATS[k]}ที่ชั้น ${f}`, "หอ", "good"); } else { hurt(s, -10); log(s, `ชั้น ${f}: ไม่ผ่านบททดสอบ${STATS[k]} วันหน้าค่อยลองใหม่`, "หอ", "bad"); return; } }
    else { const foe = enemy(floorFoe(s, f)), res = fight(s, foe); afterFight(s, res); emit("minor", res); if (res.win) { apply(s, rew); log(s, `ล้ม${foe.n}แล้วผ่านชั้น ${f} ไปได้`, "หอ"); } else { hurt(s, -14); log(s, `${foe.n}ที่ชั้น ${f} ไล่คุณกลับลงมา`, "หอ", "bad"); return; } }
  }
}
function npcMonth(s) { for (const n of s.npcs) { if (!n.alive) continue; if (n.hun && ch(s.r, 0.03)) n.lv++; if (n.hun && ch(s.r, 0.014 + n.lv * 0.0002)) n.floor = Math.min(100, n.floor + 1); if (ch(s.r, 0.0009)) { n.alive = false; if (n.rel >= 30 || s.spouse === s.npcs.indexOf(n)) log(s, `${n.n} จากไปแล้ว ข่าวมาถึงคุณช้าเกินไป`, "ผู้คน", "bad"); } } if (s.npcs.filter((n) => n.alive).length < 18) { const hun = ch(s.r, 0.67); s.npcs.push({ n: `${pk(s.r, D.GIVEN)} ${pk(s.r, D.SUR)}`, job: hun ? "ฮันเตอร์" : CAREERS[pk(s.r, Object.keys(CAREERS))].n, hun, lv: ri(s.r, 1, hun ? Math.max(8, s.lv) : 1), floor: 0, rel: ri(s.r, -6, 20), alive: true, el: pk(s.r, Object.keys(ELEMENTS)) }); } }
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
function aging(s) { const L = lifespan(s), a = s.ageM / 12; if (a >= L) return die(s, "อายุขัย"); if (a > L * 0.78) { s.health -= 0.25; if (s.health <= 12 && ch(s.r, 0.08)) die(s, "ความชราและโรคภัย"); } }

function schedule(s) {
  const d = s.q.findIndex((x) => x.at <= s.ageM); if (d >= 0) { const q = s.q.splice(d, 1)[0], def = EVENTS.find((e) => e.id === q.id); if (def) return open(s, def, def.tag || "ชะตา", q.ctx); }
  if (!s.hunter && !s.career && s.ageM >= s.w.awakenAge * 12) return openAwaken(s);
  if (!s.hunter && s.w.lateAge && s.ageM >= s.w.lateAge && !s.flags.lateDone) return openLate(s);
  for (const c of s.w.cal) {
    if (!c.ann && s.ageM >= c.at - 12) { c.ann = 1; const W = WORLD.find((x) => x.id === c.id); log(s, `สมาคมติดประกาศล่วงหน้าราวหนึ่งปี: ${W.n} ${fill(W.d, c)}`, "โลก", "imp"); }
    if (!c.done && s.ageM >= c.at) { c.done = 1; return openWorld(s, c); }
  }
  if (stage(s) === "k") return randomEvent(s, 0.16);
  if (s.hunter && s.ageM >= s.spcCd && !s.spc) { const ready = s.w.specials.map(spc).filter((x) => met(s, x)); if (ready.length) return openSpecial(s, ready.slice(0, 3)); }
  if (s.ageM >= s.nextExam && examReady(s)) return openExam(s);
  if (s.ageM >= s.nextMain) return openMain(s);
  randomEvent(s, 0.11);
}
function randomEvent(s, p) {
  if (!ch(s.r, p)) return; const k = stage(s);
  const list = EVENTS.filter((e, i) => e.k !== "x" && (e.k === k || (e.k === "a" && k !== "k")) && (!e.arc || s.w.arcs.includes(e.arc)) && !(e.arc && s.seen[i] != null) && (s.seen[i] == null || s.ageM - s.seen[i] > 50) && met(s, e) && fits(s, e.who));
  if (!list.length) return; const e = wp(s.r, list); s.seen[EVENTS.indexOf(e)] = s.ageM; open(s, e, e.tag || (e.arc ? "ชะตา" : k === "h" ? "ฮันเตอร์" : "ชีวิต"));
}
function openAwaken(s) {
  const p = Math.round(clamp(s.w.pot + mod(s, "awaken") + (stat(s, "wil") - 10) * 0.25, 8, 94));
  open(s, { t: "ถึงวันตรวจปลุกพลังประจำปี แถวยาวรอบอาคารสมาคม เครื่องวัดมานาส่องแสงเย็นบนฝ่ามือคุณ", o: [{ l: "วางมือลงบนเครื่องวัด", p, y: { m: "เข็มสะบัดจนสุดหน้าปัด", awaken: 1 }, n: { m: "เข็มไม่ขยับ ไม่มีใครมองคุณอีก โลกนี้ยังต้องการคนอีกหลายแบบ", careerPick: 1 } }] }, "ปลุกพลัง");
}
H.careerPick = (s) => openCareer(s);
H.towerOut = (s) => { s.focus = "hunt"; log(s, "กลับไปล่ารอยแยกเพื่อเก็บประสบการณ์ก่อนขึ้นหออีกครั้ง", "หอ"); };
function openCareer(s) { open(s, { t: s.career ? "ใบสมัครงานใหม่วางอยู่ตรงหน้า ประสบการณ์เก่าติดตัวไปได้ครึ่งเดียว คุณจะไปทางไหน?" : "คุณไม่ใช่ฮันเตอร์ แต่ค่าเช่าไม่รอใคร เส้นทางไหนที่เปิดให้คุณ?", o: s.w.careers.filter((id) => id !== s.career).map((id) => { const c = CAREERS[id]; return { l: `${c.n} · ถนัด${STATS[c.st]}`, note: `${c.d} ·${perkText(c.m)} · เริ่มต้น ₡${fmt(c.pay)}/เดือน${c.risk ? " · งานเสี่ยงบาดเจ็บ" : ""}`, y: { m: "ตกลงเริ่มงาน", career: id } }; }) }, "อาชีพ"); }
function openLate(s) { s.flags.lateDone = 1; open(s, { t: "มือคุณส่องแสงกลางดึก ทั้งที่อายุป่านนี้แล้ว พลังที่หลับมาตลอดชีวิตกำลังตื่น", o: [{ l: "รับมัน", y: { m: "ชีวิตครึ่งหลังเริ่มขึ้น", awaken: 1, fame: 8 } }, { l: "ปิดบังไว้ เป็นคนธรรมดาต่อ", y: { m: "มือคุณดับลงตลอดกาล", karma: 3 } }] }, "ปลุกพลัง"); }
function openWorld(s, c) {
  const W = WORLD.find((x) => x.id === c.id);
  if (stage(s) === "k") { log(s, line(s, "kidW", { w: W.n }), "โลก", "imp"); return; }
  if (W.price) { s.w.price = W.price; s.w.priceT = 6; }
  emit("surge"); open(s, s.hunter ? W.h : W.c, "โลก", { z: c.z, mon: pk(s.r, MON) });
}
// When several paths are ready the player picks one, so a row earlier in the list can't shut out the rest.
function openSpecial(s, L) { s.spcCd = s.ageM + 4; const x0 = L[0]; open(s, { t: `${L.length > 1 ? "หลายทางเปิดพร้อมกัน เลือกได้ทางเดียว" : x0.n}: ${x0.q}`, o: [...L.map((x) => ({ l: L.length > 1 ? `บททดสอบ: ${x.n}` : "ก้าวเข้าสู่บททดสอบ", note: L.length > 1 ? x.d : undefined, fight: { lv: s.lv + 3, m: 1.3, n: `เงาของ${x.n}`, el: x.el }, y: { m: "ขีดจำกัดเดิมแตกออก", setSpc: x.id }, n: { m: "ยังไม่ใช่เวลาของคุณ", hp: -18, spcFail: 1 } })), { l: "ปฏิเสธไปก่อน", y: { m: "มันจะกลับมาอีก", spcFail: 1 } }] }, "คลาสพิเศษ"); }
const examNeed = (s) => (s.hunter ? 3 + s.rank * 3 : 3 + s.cr * 3);
export const examInfo = (s) => ({ need: examNeed(s), have: s.main, ready: examReady(s) });
function examReady(s) { if (s.hunter) return s.rank < RANKS.length - 1 && s.lv >= LVCAP[s.rank] - 2 && s.main >= examNeed(s); return s.career && !retired(s) && s.cr < 4 && s.cxp >= 90 * Math.pow(s.cr + 1, D.CIV_ECON.promo) && s.main >= examNeed(s); }
function openExam(s) {
  if (s.hunter) { const R = RANKS[s.rank + 1]; open(s, { t: line(s, "exam", { R }), o: [{ l: "เข้าสอบ", fight: { lv: s.lv + 2, m: 1.1 + s.rank * 0.03 + Math.max(0, s.rank + 1 - s.w.ceil) * 0.5, n: `ผู้คุมสอบแรงก์ ${R}`, el: pk(s.r, Object.keys(ELEMENTS)) }, y: { m: "ใบอนุญาตใหม่ยังอุ่นอยู่เลย", rankUp: 1 }, n: { m: "@examFail", hp: -14, examFail: 1 } }, { l: "ขอเลื่อนสอบ", y: { m: "@examDelay", examFail: 1 } }] }, "แรงก์"); return; }
  const c = CAREERS[s.career]; open(s, { t: `มีตำแหน่ง ${c.t[s.cr + 1]} ว่าง คุณถูกเสนอชื่อเข้าประเมิน`, o: [{ l: "เข้าประเมิน", s: c.st, d: -s.cr * 5, y: { m: "ผ่านประเมินฉลุย", crUp: 1, fame: 2 }, n: { m: "คนอื่นได้ไปก่อน", examFail: 1 } }] }, "อาชีพ");
}
function openMain(s) {
  s.nextMain = s.ageM + ri(s.r, 3, 6); const z = pk(s.r, ZONES), mon = pk(s.r, MON), ctx = { z, mon };
  if (s.hunter) {
    const t = pk(s.r, [...D.MAIN_H, ...CLASSES[s.cls].job.map(([n, st, d]) => ({ n, st, d, kind: st ? undefined : "fight" }))]), y = { m: "@mainOk", gold: 170 * (1 + mod(s, "quest") / 100), xp: 2, main: 1, mat: 2, fame: 1, c: { quests: 1 } }, o = t.kind === "fight" ? { l: "รับงาน", fight: { lv: s.lv + 1, m: 1 + t.d, n: mon, el: pk(s.r, Object.keys(ELEMENTS)) }, y, n: { m: "งานล้มเหลว", hp: -14 } } : { l: "รับงาน", s: t.st, d: t.d, y, n: { m: "@mainFail", gold: -40 } };
    return open(s, { t: raw(s, "mainT").replace("{n}", t.n), o: [o, { l: "ส่งต่อทีมอื่น", y: { m: "@mainSkip" } }] }, "เควสหลัก", ctx);
  }
  if (!s.career || retired(s)) return; const c = CAREERS[s.career], [jobText, jobSt, jobD] = pk(s.r, c.job);
  open(s, { t: `งานหลัก #${(s.c.quests || 0) + 1}: ${jobText}`, o: [{ l: "รับผิดชอบเต็มที่", s: jobSt || c.st, d: jobD, y: { m: "งานเรียบร้อย หัวหน้าจำชื่อคุณได้", gold: 90, main: 1, cxp: 8, fame: 1, c: { quests: 1 } }, n: { m: "งานพลาด ถูกหักเงิน", gold: -30 } }, { l: "ทำแค่พอผ่าน", y: { m: "ไม่มีใครพูดอะไร", gold: 20, cxp: 2 } }] }, "เควสหลัก", ctx);
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
export const SHOP = [{ id: "pot", n: "ยารักษาบาดแผล", d: "ฟื้นสุขภาพ 35 อัตโนมัติ", price: (s) => 60 * tier(s) }, { id: "stone", n: "หินกันแตก", d: "ป้องกันอาวุธแตกที่ +10 ขึ้นไป", price: () => 900 }, { id: "token", n: "แผ่นย้ายชีพ", d: "รอดจากความตายได้ 1 ครั้ง", price: (s) => 2500 * tier(s) }, { id: "book", n: "ตำราสมาคม", d: "สุ่มวิชาตามแรงก์", price: (s) => 500 * tier(s) * tier(s), hunter: 1 }, { id: "anvil", n: "อัปเกรดทั่งตี", d: "ปลดล็อกวัตถุดิบขั้นถัดไป", price: (s) => anvilCost(s.anvil) }];
export function buy(s, id) { const x = SHOP.find((a) => a.id === id); if (id === "anvil" && s.anvil >= 5) return; if (x.hunter && !s.hunter) return; if (!pay(s, x.price(s), x.n)) return; if (id === "anvil") { s.anvil++; emit("rank"); } else if (id === "book") learn(s); else { s[id]++; emit("coin"); } log(s, `ซื้อ ${x.n}`, "ตลาด"); }
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
