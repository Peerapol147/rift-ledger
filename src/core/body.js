// Health, mental health, injuries, lifespan and death.
import { log, ageY } from "./state.js";
import { hooks } from "./registry.js";

const RANK_LIFE = [0, 1, 2, 4, 6, 10, 15, 25];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

import { deathHooks } from "./registry.js";
export { deathHooks };

export function die(s, cause) {
  if (s.dead) return;
  if (deathHooks.some((f) => f(s, cause))) return;
  s.dead = { cause, ageY: ageY(s) };
  s.ev = null;
  s.op = null;
  log(s, "จบชีวิต", `${s.name} จากไปเมื่ออายุ ${ageY(s)} ปี (${cause})`, "leg");
}

export function injure(s, id, months) {
  s.injuries.push({ id, untilM: months == null ? null : s.ageM + months });
}

export const changeMind = (s, d) => { s.mind = clamp(s.mind + d, 0, 100); };

export function lifespan(s) {
  const rank = s.hunter ? s.hunter.rank : -1;
  const perm = s.injuries.filter((i) => i.untilM == null).length;
  return s.lifeY + (rank >= 0 ? RANK_LIFE[rank] : 0) - perm * 2;
}

export function bodyMonth(s, step) {
  s.injuries = s.injuries.filter((i) => i.untilM == null || i.untilM > s.ageM);
  // awakened bodies mend far faster; an open wound halves it
  const base = s.hunter ? 10 : 3;
  const healing = s.injuries.some((i) => i.untilM != null) ? base / 2 : base;
  s.hp = clamp(s.hp + healing * step, 0, 100);
  // what weighs on you every month, and what holds you up (playtest: mind sat at 100 for nearly every life)
  let d = s.mind < 50 ? 0.3 : 0; // people bounce back a little on their own, but only from low
  if ((s.debt ?? 0) > 0) d -= 0.4;
  d -= 0.4 * s.injuries.filter((i) => i.untilM != null).length;
  if (s.home && s.home.city === s.city) d += 0.3;
  if (s.c.married) d += 0.3;
  changeMind(s, d * step);
}

export function yearEnd(s) {
  const a = ageY(s);
  if (a >= lifespan(s)) return die(s, "อายุขัย");
  if (a >= 55) s.hp = Math.max(1, s.hp - (a - 54) * 0.4);
}

hooks.die = die;
hooks.injure = injure;
hooks.changeMind = changeMind;
