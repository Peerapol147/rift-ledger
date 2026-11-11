// Secret quests: three per life, drawn by seed at birth. Never labelled; each step waits for the last to advance.
import { ri, shuf } from "./rng.js";
import { stream, ageY, onNewLife } from "./state.js";
import { openEvent, val } from "./events.js";
import { monthly, hooks } from "./registry.js";
import { SECRETS } from "../data/secrets.js";

onNewLife.push((s) => { s.secrets = shuf(stream(s, "secret"), Object.keys(SECRETS)).slice(0, 3); });

function started(s, q) {
  const st = q.start, a = ageY(s);
  if (a < st.age[0] || a > st.age[1]) return false;
  if (st.hunter && !s.hunter) return false;
  if (st.if && Object.entries(st.if).some(([k, v]) => val(s, k) < v)) return false;
  if (st.any && !st.any.some((cond) => Object.entries(cond).every(([k, v]) => val(s, k) >= v))) return false;
  return true;
}

export function secretMonth(s) {
  if (s.ev) return;
  for (const id of s.secrets ?? []) {
    const q = SECRETS[id], done = s.c["sq:" + id] ?? 0, opened = s.c["sqo:" + id] ?? 0;
    if (opened >= q.steps.length || opened > done) continue; // finished, or waiting on a step the player did not take
    if (opened === 0 && !started(s, q)) continue;
    const key = "sqn:" + id;
    s.c[key] ??= s.ageM + ri(stream(s, "secret"), q.gap[0], q.gap[1]);
    if (s.ageM < s.c[key]) continue;
    s.c["sqo:" + id] = opened + 1;
    s.c[key] = s.ageM + ri(stream(s, "secret"), q.gap[0], q.gap[1]);
    openEvent(s, { ...q.steps[opened], id: `sq:${id}:${opened}`, important: true });
    return;
  }
}

// Rewards
hooks.act.ceilUp = (s) => { if (s.hunter) s.hunter.ceil = Math.min(6, s.hunter.ceil + 1); };
hooks.act.subwayGift = (s) => {
  if (s.hunter) hooks.act.ceilUp(s);
  else hooks.act.awakenEvent?.(s);
};

monthly.push(secretMonth);
