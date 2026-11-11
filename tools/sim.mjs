// Plays many lives on autopilot with a player policy and checks the spec §14 balance targets.
// node tools/sim.mjs [lives=300] [--policy careful|normal|reckless]
import { execFileSync } from "node:child_process";
import { newLife, advance, choose, optionView, stageOf, setFocus, focusList, ageY, canHunt } from "../src/core/index.js";
import { mk, rnd } from "../src/core/rng.js";
import * as D from "../src/data/index.js";
import { ALL_EVENTS } from "../src/data/events/index.js";

const args = process.argv.slice(2);
const N = +args.find((a) => /^\d+$/.test(a)) || 300;
const POLICY = args.includes("--policy") ? args[args.indexOf("--policy") + 1] : "normal";
if (!["careful", "normal", "reckless"].includes(POLICY)) throw new Error(`unknown --policy ${POLICY}`);
const HUNT_P = { careful: 0.4, normal: 0.6, reckless: 0.85 }[POLICY];
const PLAN = { careful: "retreat", normal: "careful", reckless: "push" }[POLICY];
let hardFail = false;
const fail = (msg) => { console.log("FAIL " + msg); hardFail = true; };

// ---- Static checks
function staticChecks() {
  const evIds = new Set([...ALL_EVENTS, ...D.MILESTONES].map((e) => e.id));
  const ids = new Set([...Object.keys(D.CLASSES), ...Object.keys(D.CAREERS)]);
  const story = Object.values(D.STORIES).flatMap((c) => c.chapters);
  const allEv = [...ALL_EVENTS, ...D.MILESTONES, ...D.CALENDAR.flatMap((c) => Object.values(c.views ?? {})), ...story];
  const roles = new Set(Object.keys(D.ROLES));
  for (const [id, c] of Object.entries(D.STORIES)) for (const w of c.who) if (!ids.has(w) && !roles.has(w)) fail(`story ${id}: unknown who ${w}`);
  const bands = Object.values(D.TOWERS).flatMap((t) => t.bands.flatMap((b) => b.decisions ?? []));
  const decisions = [...D.GATES.flatMap((g) => g.decisions), ...D.TOWER_DECISIONS, ...bands, ...D.BIG_JOBS.flatMap((j) => j.decisions)];
  for (const e of [...allEv, ...decisions]) {
    const opts = e.o;
    if (/\{(?!name\})/.test(e.t ?? "")) fail(`unfilled token in event text "${e.t}"`);
    if (!opts.some((o) => !o.need)) fail(`no free option: ${e.id ?? e.t}`);
    for (const o of opts) {
      for (const out of [o.y, o.n]) {
        if (out?.next && !evIds.has(out.next[0])) fail(`missing next ${out.next[0]}`);
        for (const t of [out?.m ?? "", o.l]) if (/\{(?!name\})/.test(t)) fail(`unfilled token in "${t}"`);
      }
      for (const k of Object.keys(o.need ?? {})) {
        const [kind, id] = k.split(":");
        if (kind === "skill" && !D.SKILLS[id]) fail(`unknown skill ${id}`);
        if ((kind === "job" || kind === "cls") && !ids.has(id)) fail(`unknown id ${id}`);
      }
    }
  }
  for (const e of allEv) for (const w of e.who ?? []) if (!ids.has(w)) fail(`unknown who ${w}`);
  const mons = [...D.GATES.flatMap((g) => [...g.mon, g.boss]),
    ...Object.values(D.TOWERS).flatMap((t) => [...t.bands, ...t.chapters].flatMap((b) => [...b.mon, b.boss]))];
  for (const m of mons) if (!D.MONSTERS[m]) fail(`unknown monster ${m}`);
  for (const c of Object.values(D.CLASSES)) for (const [, sk] of c.skills) if (!D.SKILLS[sk]) fail(`unknown skill ${sk}`);
  try { execFileSync("node", ["tools/linelen.mjs"], { stdio: "pipe" }); } catch (e) { fail("lines over 120:\n" + e.stdout); }
}

// ---- Player policy
function pick(s) {
  const open = s.ev.opts.map((o, i) => ({ o, i, v: optionView(s, o) })).filter((x) => x.v.visible && !x.v.locked);
  // The badge shows danger on gate offers; a player reads it as lower odds of coming home.
  const odds = (x) => x.v.odds ?? (x.v.risk ? (1 - x.v.risk) * 100 : 90);
  const reward = (x) => (x.o.y?.loot ?? 0) * 30 + (x.o.y?.gold ?? 0) / 50 + (x.o.y?.fame ?? 0) * 3 + odds(x) / 10;
  const by = {
    careful: (a, b) => a.v.risk - b.v.risk || odds(b) - odds(a),
    normal: (a, b) => odds(b) - odds(a),
    reckless: (a, b) => reward(b) - reward(a),
  }[POLICY];
  // A reckless player still walks away from near-certain death.
  const pool = POLICY === "reckless" && open.some((x) => x.v.risk <= 0.3) ? open.filter((x) => x.v.risk <= 0.3) : open;
  return pool.sort(by)[0]?.i ?? 0;
}

function chooseFocus(s, R) {
  const st = stageOf(s), ids = focusList(s).map((f) => f.id);
  if (st === "kid") return setFocus(s, ids[Math.floor(rnd(R) * ids.length)]);
  if (st === "teen") return setFocus(s, rnd(R) < 0.5 ? "study" : "train");
  if (st === "old") return setFocus(s, "rest");
  if (canHunt(s)) return setFocus(s, rnd(R) < HUNT_P ? "hunt" : rnd(R) < 0.5 ? "train" : "rest");
  setFocus(s, s.job ? "work" : "study");
}

export function playLife(seed) {
  const s = newLife(seed), R = mk(seed, "simfocus");
  s.prefs = { plan: PLAN };
  for (let n = 0; n < 60000 && !s.dead; n++) {
    if (s.ev) choose(s, pick(s));
    else { if (!s.op && s.ageM % 3 === 0) chooseFocus(s, R); advance(s); }
  }
  return s;
}

// ---- Metrics
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
const pct = (n, d) => (d ? (100 * n) / d : 0);
function row(name, value, ok, hard = false) {
  console.log(`${ok ? "PASS" : hard ? "FAIL" : "WARN"}  ${name.padEnd(42)} ${value}`);
  if (!ok && hard) hardFail = true;
}

if (process.argv[1]?.endsWith("sim.mjs")) {
staticChecks();
const lives = [];
const t0 = Date.now();
for (let i = 0; i < N; i++) lives.push(playLife(`sim${i}`));
const hunters = lives.filter((s) => s.hunter), civs = lives.filter((s) => !s.hunter);
console.log(`\n${N} lives · policy ${POLICY} · ${((Date.now() - t0) / 1000).toFixed(1)}s · hunters ${hunters.length}`);

const aw = pct(hunters.length, N);
row("awaken 23–27%", aw.toFixed(1) + "%", aw >= 23 && aw <= 27, N >= 1000);
const r0 = Array(8).fill(0);
for (const s of hunters) r0[s.hunter.rank0]++;
// within 3 standard errors of the spec's weights for this many hunters
const rankOk = [40, 20, 15, 10, 9, 5, 1].every((w, i) =>
  Math.abs(pct(r0[i], hunters.length) - w) <= 3 * Math.sqrt((w * (100 - w)) / Math.max(1, hunters.length)) + 0.5);
row("start rank F/E/D/C/B/A/S", r0.slice(0, 7).map((n) => pct(n, hunters.length).toFixed(0)).join("/"), rankOk, hunters.length >= 700);
const early = hunters.filter((s) => s.dead.cause !== "อายุขัย" && s.dead.ageY < 50).length;
const earlyP = pct(early, hunters.length);
const target = { careful: [0, 8], normal: [5, 20], reckless: [20, 30] }[POLICY];
row(`hunter death <50 (${target[0]}–${target[1]}%)`, earlyP.toFixed(1) + "%", earlyP >= target[0] && earlyP <= target[1]);
const old = pct(civs.filter((s) => s.dead.cause === "อายุขัย").length, civs.length);
row("civilians die of old age ≥85%", old.toFixed(1) + "%", old >= 85);
const perYear = (s) => (s.c.earned ?? 0) / Math.max(1, ageY(s) - 18);
const hi = med(hunters.filter((s) => s.hunter.rank >= 3).map(perYear));
const cv = med(civs.map(perYear));
const lo = med(hunters.filter((s) => s.hunter.rank <= 1).map(perYear));
row("income/yr C+ > civ > F–E", `${hi.toFixed(0)} > ${cv.toFixed(0)} > ${lo.toFixed(0)}`, hi > cv && cv > lo);
// Among hunters who had room to grow (ceiling above start rank), how many got all the way up.
const room = hunters.filter((s) => s.hunter.ceil > s.hunter.rank0);
const ceil = pct(room.filter((s) => s.hunter.rank === s.hunter.ceil).length, room.length);
row("hunters with room who reach ceiling 30–50%", ceil.toFixed(1) + "%", ceil >= 30 && ceil <= 50);
const same = [0, 1, 2].every((i) => JSON.stringify(playLife("det" + i)) === JSON.stringify(playLife("det" + i)));
row("determinism", same ? "same" : "DIFFERENT", same, true);
const causes = {};
for (const s of lives) causes[s.dead.cause] = (causes[s.dead.cause] ?? 0) + 1;
console.log("deaths", JSON.stringify(causes));
console.log("median age", med(lives.map((s) => s.dead.ageY)), "· median floor", med(hunters.map((s) => s.c.floor ?? 0)));
process.exitCode = hardFail ? 1 : 0;
}
