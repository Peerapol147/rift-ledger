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

import { monthly, books, lastly } from "./registry.js";
export { monthly, books, lastly };
const EVENT_CHANCE = 0.22;
const REPEAT_CAP = 3;
// months before the same random event can come back (a life read end to end: the same scene every 5 years, four
// times over, read as a loop; 8 years and three times at most reads as a life)
const COOLDOWN = 96;

// Before three you do not plan your months: the grown-ups do, and you grow the way small children grow.
export const INFANT_AGE = 3;
const INFANT_GROWTH = { agi: 0.06, cha: 0.05, luk: 0.03, int: 0.03 };

export function focusList(s) {
  if (ageY(s) < INFANT_AGE) return [];
  const table = FOCUS[stageOf(s)];
  const hunting = !!s.hunter && !s.flags.stoppedHunting;
  return Object.entries(table).filter(([, f]) => !f.hunter || hunting).map(([id, f]) => ({ id, ...f }));
}

export function setFocus(s, id) {
  if (FOCUS[stageOf(s)][id]) s.focus = id;
}

function applyFocus(s, step) {
  if (ageY(s) < INFANT_AGE) { for (const [k, v] of Object.entries(INFANT_GROWTH)) s.st[k] += v * step; return; }
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

function randomEvent(s, step) {
  const R = stream(s, "pick");
  // the chance is per month: a 3-month childhood tick rolls for all three (playtest: childhood had 1/3 the events)
  if (!ch(R, 1 - (1 - EVENT_CHANCE) ** step)) return null;
  // a random event happens at most REPEAT_CAP times in a life (cap: n on the event overrides): variety over habit
  const fresh = (e) => s.ageM - (s.c["last:" + e.id] ?? -999) >= COOLDOWN
    && (s.c["ev:" + e.id] ?? 0) < (e.cap ?? REPEAT_CAP);
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
  for (const sys of books) { sys(s, step); if (s.dead) return; }
  for (const sys of monthly) { sys(s, step); if (s.dead || s.ev || s.op) return; }
  for (const sys of lastly) { sys(s, step); if (s.dead || s.ev || s.op) return; }
  const ev = dueEvent(s) ?? randomEvent(s, step);
  if (!ev) return;
  s.c["last:" + ev.id] = s.ageM;
  openEvent(s, ev);
}
