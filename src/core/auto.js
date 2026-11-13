// Autopilot. Returns the option index to pick, or -1 to wait for the player. Spec §11.4 and §17.
// stop: always wait. important: wait on important, long-term trade-offs and all-risky choices.
// skip: wait only on milestones / world calendar and all-risky choices.
import { optionView } from "./events.js";

function score(s, opt, v) {
  let sc = v.odds ?? 90;
  if ((opt.y?.mind ?? 0) < 0) sc -= 20;
  if ((opt.y?.hp ?? 0) < 0) sc -= 20;
  if (opt.y?.gold < 0 && s.gold + opt.y.gold < 0) sc -= 1000;
  return sc;
}

// Routine picks the autopilot always handles: the monthly gate list and the party's monthly call.
const ROUTINE = new Set(["gateChoice", "partyGate"]);
// importantOnce events (a debt collector at the door) stop only the first time.
// A choice worth the player's own hand: a stat check, or an outcome that lasts (counters, flags, factions,
// a follow-up, an act, an injury, a teammate). Pure money or mood stays with the autopilot.
const LASTING = ["c", "flags", "fac", "act", "next", "injury", "ally"];
const matters = (ev) => ev.opts.length > 1 && ev.opts.some((o) => o.s
  || [o.y, o.n].some((out) => out && LASTING.some((k) => out[k] != null)));

// An option is dangerous if it can kill, can take all remaining health, or can leave a permanent injury.
function dangerous(s, opt, v) {
  if (v.risk > 0) return true;
  return [opt.y, opt.n].some((o) => (o?.hp ?? 0) <= -s.hp || (o?.injury && o.injury[1] == null));
}

export function autoDecide(s, policy) {
  const ev = s.ev;
  if (!ev || policy === "stop" || ev.noAuto) return -1;
  // a story choice that changes the road, makes a promise or spends business money is the player's own
  if (ev.opts?.some((o) => o.noAuto && optionView(s, o).visible)) return -1;
  if (ev.op && s.op?.def.boss) return -1; // the player always fights bosses by hand
  const repeatVisit = ev.importantOnce && (s.c["ev:" + ev.id] ?? 0) > 0;
  if (policy === "important" && !repeatVisit && (ev.important || (!ROUTINE.has(ev.id) && matters(ev)))) return -1;
  if (ev.milestone) return -1;
  const open = ev.opts
    .map((opt, i) => ({ opt, i, v: optionView(s, opt) }))
    .filter((x) => x.v.visible && !x.v.locked);
  for (const x of open) x.bad = dangerous(s, x.opt, x.v);
  if (!open.length || open.every((x) => x.bad)) return -1;
  let best = -1, bv = -Infinity;
  for (const x of open) {
    if (x.bad) continue;
    const sc = score(s, x.opt, x.v);
    if (sc > bv) { bv = sc; best = x.i; }
  }
  return bv < -500 ? -1 : best;
}
