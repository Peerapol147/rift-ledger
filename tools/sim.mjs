// Sweep many seeds on full auto: crashes, determinism, and how lives are distributed. node tools/sim.mjs [lives]
import { newLife, tick, choose, autoChoice, age, FOCUS, buy, craft, enhance, stage, foundGuild, joinGuild, recruit, fxOut, gearOf } from "../src/engine.js";
import { travel } from "../src/engine.js";
import { EVENTS, WORLD, NEWS, CLASSES, CAREERS, MOD_N, STATS, FAMILIES, WEAPONS, PATHS, CROSS, PLACES } from "../src/data.js";
const N = +process.argv[2] || 300;
// Static story check: every next target exists, every counter gated on is produced somewhere, no {tokens} in text the engine does not fill.
{ const ids = new Set(EVENTS.filter((e) => e.id).map((e) => e.id)), made = new Set("age level rank floor gold fame karma craft guild own mems sk els kids spouse hunter luk rel lateAw cyears hunts boss cr".split(" ")), bad = [];
  // Trade check: ids don't collide, every who is a real id, every class and career has its own lines and at least one story row.
  const jobIds = [...Object.keys(CLASSES), ...Object.keys(CAREERS)], known = new Set([...jobIds, ...FAMILIES.map((f) => f.id), ...Object.keys(PATHS), ...PLACES.map((p) => p.id)]), used = new Set(), who = (w, at) => (w || []).forEach((id) => { used.add(id); known.has(id) || bad.push(`${at}: who ${id}`); });
  if (new Set(jobIds).size !== jobIds.length) bad.push("class and career ids collide");
  EVENTS.forEach((e) => { who(e.who, e.id || e.t); e.o.forEach((x) => Array.isArray(x) && who(x[6], e.id || e.t)); });
  jobIds.forEach((id) => used.has(id) || bad.push(`${id}: no who row`));
  Object.entries(PATHS).forEach(([id, p]) => { CAREERS[p.job] || bad.push(`${id}: job`); STATS[p.st] || bad.push(`${id}: st`); Object.keys(p.m).forEach((k) => MOD_N[k] || bad.push(`${id}: bonus ${k}`)); });
  CROSS.forEach((x) => x.o.forEach((r) => PATHS[r[0]] || bad.push(`cross ${r[0]}`)));
  FAMILIES.forEach((f) => { if (!f.id?.startsWith("f_") || jobIds.includes(f.id)) bad.push(`${f.n}: bad family id`); used.has(f.id) || bad.push(`${f.id}: no who row`); f.job.forEach((j) => CAREERS[j] || bad.push(`${f.id}: job ${j}`)); Object.keys(f.m || {}).forEach((k) => MOD_N[k] || STATS[k] || bad.push(`${f.id}: unknown bonus ${k}`)); });
  for (const [id, x] of [...Object.entries(CLASSES), ...Object.entries(CAREERS)]) { if (!x.d || !(x.job?.length >= 2)) bad.push(`${id}: needs d and job lines`); Object.keys(x.m).forEach((k) => MOD_N[k] || STATS[k] || bad.push(`${id}: unknown bonus ${k}`)); if (CAREERS[id] && CAREERS[id].t.length !== 5) bad.push(`${id}: needs 5 titles`); if (CLASSES[id] && !WEAPONS[CLASSES[id].wp]) bad.push(`${id}: bad wp`); }
  FAMILIES.forEach((f) => (f.job || []).forEach((id) => CAREERS[id] || bad.push(`${f.n}: job ${id}`)));
  const walk = (o, e) => { if (!o || typeof o !== "object") return; if (o.next && !ids.has(o.next[0])) bad.push(`${e.id}: next ${o.next[0]}`); if (o.c) Object.keys(o.c).forEach((k) => made.add(k)); if (typeof o.m === "string" && /\{\w+\}/.test(o.m)) bad.push(`${e.id}: token in result text`); for (const k in o) walk(o[k], e); };
  WORLD.forEach((e) => { walk(e.h, e); walk(e.c, e); });
  NEWS.forEach((n) => { walk(n.e, n); if (n.once) made.add(n.once); });
  EVENTS.forEach((e) => { walk(e.o, e); e.o.forEach((x) => Array.isArray(x) && /\{\w+\}/.test(x[0]) && bad.push(`${e.id}: token in label`)); });
  EVENTS.forEach((e) => Object.keys({ ...e.if, ...e.max }).forEach((k) => made.has(k) || bad.push(`${e.id}: counter ${k} never set`)));
  if (ids.size !== EVENTS.filter((e) => e.id).length) bad.push("duplicate id");
  if (bad.length) throw new Error("story check\n" + bad.join("\n")); }
function play(seed) {
  const s = newLife(seed, "ทดสอบ"); let guard = 0;
  while (!s.dead && guard++ < 40000) {
    if (s.ev) { choose(s, autoChoice(s)); continue; }
    const st = stage(s);
    if (st === "k") s.focus = ["study", "sport", "play", "help"][s.ageM % 4];
    if (st === "c") { s.focus = s.ageM % 20 === 0 ? "study" : "work"; if (s.gold > 2000 && s.pot < 2) buy(s, "pot"); }
    if (st === "h") {
      s.focus = s.health < 45 ? "rest" : s.ageM % 3 === 0 ? "tower" : s.ageM % 11 === 0 ? "guild" : "hunt";
      if (s.pot < 3 && s.gold > 800) buy(s, "pot");
      // Move each year to the toughest place at or below your level, if the fare leaves money for potions.
      if (s.ageM % 12 === 0) { const i = PLACES.reduce((b, p, j) => (p.lv <= s.lv && s.gold > p.fare * 3 ? j : b), 0); travel(s, i); }
      if (!s.guild && s.rank >= 2 && s.gold > 20000) foundGuild(s, "ทดสอบ"); else if (!s.guild && s.ageM % 40 === 0) joinGuild(s, 0);
      if (s.guild?.own && s.ageM % 30 === 0) recruit(s, s.ageM % 24);
      if (s.anvil < 5 && s.gold > 15000) buy(s, "anvil");
      if (s.ageM % 9 === 0) { const g = Math.min(s.anvil, Math.floor(s.lv / 18)); craft(s, "weapon", s.ageM % 12, g); craft(s, "armor", 0, g); const w = gearOf(s, s.wear.weapon); if (w && w.plus < 8) enhance(s, w.id); }
    }
    tick(s); fxOut.length = 0;
  }
  if (!s.dead) throw new Error("no ending " + seed);
  return s;
}
const a = JSON.stringify(play("det-1")), b = JSON.stringify(play("det-1")); if (a !== b) throw new Error("not deterministic"); JSON.parse(a);
const L = []; for (let i = 0; i < N; i++) L.push(play("s" + i));
const H = L.filter((s) => s.hunter), C = L.filter((s) => !s.hunter), avg = (l, f) => (l.reduce((x, s) => x + f(s), 0) / (l.length || 1)).toFixed(1), hist = (l, f) => { const m = {}; for (const s of l) { const k = f(s); m[k] = (m[k] || 0) + 1; } return JSON.stringify(m); };
console.log(`lives ${N} | hunter ${H.length} civ ${C.length} | deterministic OK | log sample size ${L[0].log.length}`);
console.log("hunter: age", avg(H, age), "lv", avg(H, (s) => s.lv), "floor", avg(H, (s) => s.floor), "gold", avg(H, (s) => s.gold), "median/min", Math.round([...H].sort((a, b) => a.gold - b.gold)[H.length >> 1]?.gold || 0), Math.round(Math.min(...H.map((s) => s.gold))), "special%", avg(H, (s) => (s.spc ? 100 : 0)));
console.log("rank", hist(H, (s) => s.rank), "class", hist(H, (s) => s.cls));
console.log("by class lv/floor/rank/deaths<60:", Object.keys(CLASSES).map((c) => { const l = H.filter((s) => s.cls === c); return `${c} ${avg(l, (s) => s.lv)}/${avg(l, (s) => s.floor)}/${avg(l, (s) => s.rank)}/${l.filter((s) => age(s) < 60).length}of${l.length}`; }).join(" | "));
{ const med = (l, f) => [...l].map(f).sort((a, b) => a - b)[l.length >> 1] || 0, line = (l) => `avg ${avg(l, (s) => s.gold)} median ${Math.round(med(l, (s) => s.gold))} debt ${l.filter((s) => s.gold < 0).length}/${l.length} score ${avg(l, (s) => s.dead.score)}`; console.log("econ hunter:", line(H), "| civ:", line(C)); }
console.log("by career gold/cr/age:", Object.keys(CAREERS).map((c) => { const l = C.filter((s) => s.career === c); return `${c} ${Math.round(avg(l, (s) => s.gold) / 1000)}k/${avg(l, (s) => s.cr)}/${avg(l, age)}/n${l.length}`; }).join(" | "), "| changed job", C.filter((s) => s.pastJob).length, "late with old trade", H.filter((s) => s.pastJob).length);
console.log("by family n/hunter%/lv/score/gold(k)/dirty/karma:", FAMILIES.map((f, i) => { const l = L.filter((s) => s.fam === i), h = l.filter((s) => s.hunter); return `${f.id} ${l.length}/${Math.round((100 * h.length) / (l.length || 1))}%/${avg(h, (s) => s.lv)}/${avg(l, (s) => s.dead.score)}/${Math.round(avg(l, (s) => s.gold) / 1000)}k/${avg(l, (s) => s.c.dirty || 0)}/${avg(l, (s) => s.karma)}`; }).join(" | "));
console.log("special", hist(H.filter((s) => s.spc), (s) => s.spc), "guild own", H.filter((s) => s.guild?.own).length, "maxEnh", avg(H, (s) => s.c.enh || 0));
console.log("civ: age", avg(C, age), "cr", hist(C, (s) => s.cr), "gold", avg(C, (s) => s.gold), "career", hist(C, (s) => s.career));
console.log("story led", hist(H, (s) => s.c.led || 0), "quit", H.filter((s) => s.c.ledQuit > 0).length, "loophole", H.filter((s) => s.c.ledLoop).length, "| cled", hist(C, (s) => s.c.cled || 0), "| arcs/life", avg(L, (s) => s.w.arcs.length), "| no-story hunters age", H.filter((s) => !s.c.led).map((s) => Math.floor(age(s))).join(","));
console.log("place at death", hist(H, (s) => PLACES[s.at || 0].id), "| local events seen", L.reduce((a, s) => a + EVENTS.filter((e, i) => e.who?.some((w) => w.startsWith("z_")) && s.seen[i] != null).length, 0));
{ const ch = (s) => Object.values(s.disc || {}).reduce((a, v) => a + Math.floor(v + 1e-6), 0); console.log("ways: chapters hunter", avg(H, ch), "civ", avg(C, ch), "| by way", hist(L.flatMap((s) => Object.entries(s.disc || {}).filter((x) => x[1] >= 1).map((x) => x[0])), (k) => k), "| full 5", L.filter((s) => Object.values(s.disc || {}).some((v) => v >= 5)).length); }
console.log("death", hist(L, (s) => s.dead.cause.startsWith("พ่าย") ? "boss" : s.dead.cause), "title", hist(L, (s) => s.dead.title));
