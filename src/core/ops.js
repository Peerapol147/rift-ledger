// Operations: one engine for gates, towers and civilian big jobs. prep → auto rounds → decision points. Spec §7.
import { ch, rnd, wp, mk } from "./rng.js";
import { stream, ageY, log } from "./state.js";
import { optionView, hooks, countUnseen } from "./events.js";
import { addLedger } from "./money.js";
import { die, injure } from "./body.js";
import { gainXp } from "./hunter.js";
import { recordFloor } from "./world.js";
import { tick, monthly } from "./clock.js";
import { CLASSES } from "../data/classes.js";
import { SKILLS } from "../data/skills.js";
import { CAREERS, BIG_JOBS } from "../data/careers.js";

const MAX_ROUNDS = 12;
const OP_XP = 25; // XP multiplier: a hunter reaches their rank cap in roughly 80 cleared gates
const BOSS_DEATH = 0.5; // chance that losing to a boss is fatal; otherwise a permanent wound
const PLAN = { push: { atk: 1.15, def: 0.9 }, careful: { atk: 0.95, def: 1.1 }, retreat: { atk: 0.9, def: 1.15 } };
export const gearHooks = []; // fn(s) -> { atk, def, hp } added to hero power (items)
export const afterOpHooks = []; // fn(s, op, result) after rewards are paid

export function heroPower(s) {
  const h = s.hunter;
  const main = h ? s.st[CLASSES[h.cls].main] : Math.max(s.st.str, s.st.agi);
  const lv = h?.lv ?? 1;
  const rankMul = h ? 1 + h.rank * 0.15 : 0.6;
  const decline = Math.max(0.5, 1 - Math.max(0, ageY(s) - 45) * 0.01);
  const p = {
    atk: (5 + main * 1.2 + lv * 2.2) * rankMul * decline,
    def: (2 + (s.st.str + s.st.wil) / 4 + lv * 0.8) * rankMul * decline,
    hp: (80 + s.st.wil * 3 + lv * 10) * decline,
  };
  for (const g of gearHooks) { const b = g(s); p.atk += b.atk ?? 0; p.def += b.def ?? 0; p.hp += b.hp ?? 0; }
  return p;
}

// Danger of a boss operation before it starts: share of 16 quick simulated fights (no decisions) that are lost.
// Ordinary operations are 0 because losing one only injures. Shown as risk on offers.
export function estimateRisk(s, def) {
  if (!def.boss) return 0;
  const R = mk(s.seed + ":" + s.ageM, def.id);
  const hero = heroPower(s);
  let lost = 0;
  for (let i = 0; i < 16; i++) {
    const o = { prep: defaultPrep(s), round: 0, maxHp: hero.hp, hp: (hero.hp * Math.max(20, s.hp)) / 100,
      foes: def.foes.map((f) => ({ ...f, cur: f.hp })) };
    for (; o.round < MAX_ROUNDS; o.round++) {
      heroTurn(s, o, R);
      if (o.foes.every((f) => f.cur <= 0)) break;
      foeTurn(s, o, R);
      if (o.hp <= o.maxHp * 0.15) { lost++; break; } // margin for hp lost in decisions
    }
  }
  return (lost / 16) * BOSS_DEATH;
}

export function skillDamage(sk, atk, target) {
  const mul = sk.trigger.when === "vsEl" && sk.trigger.el === target.el ? sk.eff.mul ?? 1 : 1;
  return Math.max(1, atk * (sk.eff.dmg ?? 0) * mul - target.def * 0.5);
}

export function startOp(s, def, prep) {
  const hero = heroPower(s);
  s.op = {
    def, prep, round: 0, d: 0, loot: 0, score: 0, lostAlly: 0, maxHp: hero.hp, done: null,
    hp: (hero.hp * Math.max(20, s.hp)) / 100, foes: def.foes.map((f) => ({ ...f, cur: f.hp })),
  };
  log(s, def.kind === "job" ? "งานใหญ่" : "เกต", `เริ่ม: ${def.t}`, "imp");
}

const DECISION_ROUNDS = [2, 5, 8];

function openDecision(s) {
  const o = s.op, d = o.def.decisions[o.d++];
  const tag = o.def.kind === "job" ? "งานใหญ่" : "เกต";
  s.ev = { id: "opDecision", tag, t: d.t, opts: d.o, op: true, important: !!o.def.boss || o.def.kind === "break" };
}

function heroTurn(s, o, R) {
  const hero = heroPower(s), plan = PLAN[o.prep.plan] ?? PLAN.careful;
  const target = o.foes.find((f) => f.cur > 0);
  if (!target) return;
  let dmg = Math.max(1, hero.atk * plan.atk - target.def * 0.5);
  for (const id of o.prep.skills) {
    const sk = SKILLS[id];
    if (!sk || sk.kind !== "active") continue;
    const t = sk.trigger;
    if (t.when === "every" && o.round % t.every === 0) dmg = Math.max(dmg, skillDamage(sk, hero.atk, target));
    if (t.when === "vsEl" && t.el === target.el) dmg = Math.max(dmg, skillDamage(sk, hero.atk, target));
    if (t.when === "lowAlly" && o.hp < o.maxHp * 0.4 && sk.eff.heal) {
      o.hp = Math.min(o.maxHp, o.hp + hero.atk * sk.eff.heal);
    }
  }
  target.cur -= dmg * (0.85 + rnd(R) * 0.3);
}

function foeTurn(s, o, R) {
  const hero = heroPower(s), plan = PLAN[o.prep.plan] ?? PLAN.careful;
  let defBonus = 0;
  for (const id of o.prep.skills) defBonus += SKILLS[id]?.eff.def ?? 0;
  const def = hero.def * plan.def * (1 + defBonus);
  for (const f of o.foes) if (f.cur > 0) o.hp -= Math.max(1, f.atk - def * 0.5) * (0.85 + rnd(R) * 0.3);
}

export function stepOp(s) {
  const o = s.op;
  if (!o) return "none";
  if (o.done) return endOp(s);
  if (s.ev) return "decision";
  o.round++;
  if (DECISION_ROUNDS.includes(o.round) && o.d < o.def.decisions.length && (o.round < 8 || o.def.boss)) {
    openDecision(s);
    return "decision";
  }
  const R = stream(s, "op");
  if (o.def.kind === "job") {
    if (o.round > 6) o.done = o.score >= 1 ? "won" : "fled";
  } else {
    heroTurn(s, o, R);
    if (o.foes.every((f) => f.cur <= 0)) o.done = "won";
    else foeTurn(s, o, R);
    if (!o.done && o.hp <= 0) o.done = "lost";
    else if (!o.done && o.prep.plan === "retreat" && !o.def.boss && o.hp < o.maxHp * 0.5) o.done = "fled";
    else if (!o.done && o.round >= MAX_ROUNDS) o.done = "fled";
  }
  return o.done ? endOp(s) : "running";
}

export function decide(s, i) {
  const o = s.op, opt = s.ev?.opts[i];
  if (!o || !opt) return;
  const v = optionView(s, opt);
  if (!v.visible || v.locked) return;
  countUnseen(s, s.ev.opts);
  const ok = v.odds == null || ch(stream(s, "op"), v.odds / 100);
  const out = ok ? opt.y : opt.n ?? {};
  s.ev = null;
  log(s, "เกต", `${opt.l}${out.m ? " → " + out.m : ""}`, ok ? "imp" : "bad");
  if (out.hp) o.hp += (out.hp / 100) * o.maxHp;
  if (out.mind) hooks.changeMind(s, out.mind);
  if (out.fame) s.fame = Math.max(0, s.fame + out.fame);
  o.loot += out.loot ?? 0;
  o.score += out.score ?? 0;
  if (opt.lose?.ally) o.lostAlly++;
  if (!ok && opt.risk) injure(s, "graveWound", o.def.boss ? null : 6);
  if (out.flee) o.done = o.done ?? "fled";
  if (o.hp <= 0) o.done = "lost";
}

function endOp(s) {
  const o = s.op, def = o.def, r = o.done;
  s.op = null;
  s.hp = Math.max(1, Math.round((Math.max(0, o.hp) / o.maxHp) * 100));
  if (r === "lost") {
    if ((def.boss || def.kind === "break") && ch(stream(s, "op"), BOSS_DEATH)) {
      die(s, `พ่ายแก่ ${def.foes.find((f) => f.boss)?.n ?? def.t}`);
      return r;
    }
    if (def.boss) injure(s, "bossScar", null);
    injure(s, "beaten", 3);
    if (s.hunter && def.kind !== "job") gainXp(s, def.foes.reduce((a, f) => a + f.lv, 0) * 0.2 * OP_XP);
    log(s, "เกต", "คุณถูกลากออกมาโดยทีมกู้ภัยของสมาคม", "bad");
    return r;
  }
  const share = r === "won" ? 1 : 0.3;
  const gold = Math.round(def.rewards.gold * share * (1 + o.loot * 0.4 + Math.max(0, o.score) * 0.2));
  addLedger(s, def.kind === "job" ? "ค่าตอบแทนงานใหญ่" : "ค่าตอบแทนเกต", gold);
  const foeXp = def.foes.reduce((a, f) => a + f.lv * (f.boss ? 4 : 1.5), 0);
  if (s.hunter && def.kind !== "job") gainXp(s, foeXp * share * OP_XP);
  if (def.kind === "job" && s.job) s.job.xp += 4 * share;
  if (r === "won" && def.kind === "tower") {
    s.c.floor = Math.max(s.c.floor ?? 0, def.floor);
    recordFloor(s, def.tower, def.floor, true);
  }
  for (const f of afterOpHooks) f(s, o, r);
  log(s, "เกต", r === "won" ? `สำเร็จ ได้ ₿${gold}` : `ถอยออกมา ได้ ₿${gold}`, r === "won" ? "imp" : "");
  return r;
}

export function defaultPrep(s) {
  return { plan: s.prefs?.plan ?? "careful", skills: s.hunter?.slots ?? [], quick: [], team: [] };
}

export function jobOp(s, job) {
  const c = CAREERS[s.job?.id];
  return {
    id: "job:" + job.id, kind: "job", t: job.t, foes: [], decisions: job.decisions, boss: false,
    rewards: { gold: Math.round(job.pay * (1 + (s.job?.tier ?? 0) * 0.5)), items: [] }, career: c?.n,
  };
}

// One step of the life loop: run an operation if one is going, else tick the month.
export function advance(s) {
  if (s.dead || s.ev) return;
  if (s.op) return void stepOp(s);
  tick(s);
}

for (const i of [0, 1, 2, 3]) {
  hooks.act["gate" + i] = (s) => s.offers?.[i] && startOp(s, s.offers[i], defaultPrep(s));
}
hooks.decide = decide;

monthly.push((s) => {
  if (!s.job || s.hunter) return;
  const jobs = BIG_JOBS.filter((j) => j.who.includes(s.job.id));
  if (!jobs.length || !ch(stream(s, "bigjob"), 0.02)) return;
  const job = wp(stream(s, "bigjob"), jobs);
  s.ev = {
    id: "bigJobOffer", tag: "งานใหญ่", important: true, t: job.t,
    opts: [{ l: "รับงาน", y: { act: "bigJob:" + job.id } }, { l: "ปฏิเสธ", y: { m: "คุณส่งต่อให้เพื่อนร่วมงาน" } }],
  };
});
for (const j of BIG_JOBS) hooks.act["bigJob:" + j.id] = (s) => startOp(s, jobOp(s, j), defaultPrep(s));
