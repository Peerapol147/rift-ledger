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

export function autoDecide(s, policy) {
  const ev = s.ev;
  if (!ev || policy === "stop" || ev.noAuto) return -1;
  if (policy === "important" && ev.important) return -1;
  if (ev.milestone) return -1;
  const open = ev.opts
    .map((opt, i) => ({ opt, i, v: optionView(s, opt) }))
    .filter((x) => x.v.visible && !x.v.locked);
  if (!open.length || open.every((x) => x.v.risk > 0)) return -1;
  let best = -1, bv = -Infinity;
  for (const x of open) {
    if (x.v.risk > 0) continue;
    const sc = score(s, x.opt, x.v);
    if (sc > bv) { bv = sc; best = x.i; }
  }
  return bv < -500 ? -1 : best;
}
