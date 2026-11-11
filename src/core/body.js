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
  const healing = s.injuries.some((i) => i.untilM != null) ? 1 : 3;
  s.hp = clamp(s.hp + healing * step, 0, 100);
  if (s.mind < 70) changeMind(s, 0.5 * step);
}

export function yearEnd(s) {
  const a = ageY(s);
  if (a >= lifespan(s)) return die(s, "อายุขัย");
  if (a >= 55) s.hp = Math.max(1, s.hp - (a - 54) * 0.4);
}

hooks.die = die;
hooks.injure = injure;
hooks.changeMind = changeMind;
