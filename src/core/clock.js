// The monthly clock. One tick = 1 month (3 months in childhood).
import { stream, stageOf, ageY } from "./state.js";
import { ch, wp } from "./rng.js";
import { eligible, openEvent, EVENT_INDEX } from "./events.js";
import { addLedger } from "./money.js";
import { bodyMonth, yearEnd, changeMind } from "./body.js";
import { FOCUS } from "../data/stats.js";
import { MILESTONES } from "../data/milestones.js";
import { ALL_EVENTS } from "../data/events/index.js";

for (const m of MILESTONES) EVENT_INDEX.set(m.id, m);

import { monthly } from "./registry.js";
export { monthly };
const EVENT_CHANCE = 0.22;
const COOLDOWN = 36; // months before the same random event can come back

export function focusList(s) {
  const table = FOCUS[stageOf(s)];
  const hunting = !!s.hunter && !s.flags.stoppedHunting;
  return Object.entries(table).filter(([, f]) => !f.hunter || hunting).map(([id, f]) => ({ id, ...f }));
}

export function setFocus(s, id) {
  if (FOCUS[stageOf(s)][id]) s.focus = id;
}

function applyFocus(s, step) {
  const table = FOCUS[stageOf(s)];
  if (!table[s.focus]) s.focus = Object.keys(table)[0];
  const f = table[s.focus];
  for (const [k, v] of Object.entries(f.st)) s.st[k] += v * step;
  if (f.gold) addLedger(s, "ค่าขนม/งานพิเศษ", f.gold * step);
  if (f.mind) changeMind(s, f.mind * step);
  if (f.hp) s.hp = Math.min(100, s.hp + f.hp * step);
}

function dueEvent(s) {
  const i = s.sched.findIndex((x) => x.atM <= s.ageM);
  if (i >= 0) {
    const [due] = s.sched.splice(i, 1);
    const ev = EVENT_INDEX.get(due.id);
    if (ev) return ev;
  }
  return MILESTONES.find((m) => ageY(s) >= m.age[0] && !s.c["ev:" + m.id]);
}

function randomEvent(s) {
  const R = stream(s, "pick");
  if (!ch(R, EVENT_CHANCE)) return null;
  const fresh = (e) => s.ageM - (s.c["last:" + e.id] ?? -999) >= COOLDOWN;
  const pool = ALL_EVENTS.filter((e) => !e.k && fresh(e) && eligible(s, e));
  if (!pool.length) return null;
  return wp(R, pool, (e) => (e.w ?? 1) / (1 + (s.c["ev:" + e.id] ?? 0) * 2));
}

export function tick(s) {
  if (s.dead || s.ev || s.op) return;
  const step = stageOf(s) === "kid" ? 3 : 1;
  const yearBefore = ageY(s);
  s.ageM += step;
  applyFocus(s, step);
  bodyMonth(s, step);
  // The year rolls over first: a system that opens an event this month must not skip the old-age check.
  if (ageY(s) > yearBefore) { yearEnd(s); if (s.dead) return; }
  for (const sys of monthly) { sys(s, step); if (s.dead || s.ev || s.op) return; }
  const ev = dueEvent(s) ?? randomEvent(s);
  if (!ev) return;
  s.c["last:" + ev.id] = s.ageM;
  openEvent(s, ev);
}
