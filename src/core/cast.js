// The main cast in the list of people: created once per world, repaired into older saves.
// Spec: docs/superpowers/specs/2026-11-13-main-cast-design.md.
import { CAST, HOLDERS } from "../data/cast.js";
import { ensurePerson, personById } from "./people.js";
import { stream, worldMonth, log } from "./state.js";
import { ri, rnd } from "./rng.js";
import { monthly } from "./registry.js";
import { GUILDS } from "../data/guilds.js";
import { hooks } from "./registry.js";

const KEY = (id) => "cast:" + id;
export const castId = (p) => p?.cast ?? null;
export function castPerson(s, id) {
  return Object.values(s.world?.people ?? {}).find((p) => p.cast === id) ?? null;
}

export function addCast(s) {
  for (const [id, d] of Object.entries(CAST)) {
    const pid = ensurePerson(s, { name: d.name, country: d.country, city: d.city, sex: d.sex,
      bornWorldM: d.bornY * 12, tags: ["cast", d.role] }, KEY(id));
    const p = personById(s, pid);
    if (p.cast) continue; // already set up: never reset a life in progress
    Object.assign(p, { cast: id, rank: d.rank, ceiling: d.ceiling, cls: d.cls, guild: d.guild, family: d.family,
      hunter: d.awakenAt ? null : { rank: d.rank, cls: d.cls }, ties: {}, retired: !!d.retired,
      doneWM: worldMonth(s) });
  }
  // the calendar's record holders are these people now
  for (const [rosterId, id] of Object.entries(HOLDERS)) {
    const n = s.world.roster?.find((x) => x.id === rosterId), p = castPerson(s, id);
    if (!n || !p) continue;
    Object.assign(n, { n: p.name, rank: p.rank, cls: p.cls, personId: p.id, cast: id });
  }
}
hooks.addCast = addCast;

const trustOf = (s, id) => s.relations?.[id]?.trust ?? 0; // read only: no empty records

// ---- Their own lives (spec §5–§6). Every roll is on the person's own stream, one month at a time, so a batch of
// years gives exactly what month-by-month play gives, and other systems' streams are never touched.
const PROMOTE = 0.2, SPITE = 0.35, HURT = 0.08, MOVE = 0.03;
const GATE_DEATH = (rank) => (rank >= 6 ? 0.003 : 0.01);

function news(s, text) { log(s, "ข่าวโลก", text, ""); }
function syncRoster(s, p) {
  const n = s.world.roster?.find((x) => x.personId === p.id);
  if (n) Object.assign(n, { rank: p.rank, alive: p.diedWorldM == null });
}
function die(s, p, m, cause) {
  p.diedWorldM = m; p.diedCause = cause;
  syncRoster(s, p);
  const age = Math.floor((m - p.bornWorldM) / 12);
  news(s, cause === "gate" ? `${p.name} ไม่ได้กลับออกมาจากเกต` : `${p.name} จากไปอย่างสงบในวัย ${age} ปี`);
}

function step(s, p, m) {
  const d = CAST[p.cast], R = stream(s, "cast:" + p.cast), age = m - p.bornWorldM;
  p.retireAtY ??= 55 + ri(R, 0, 10);
  p.lifeMaxY ??= 70 + ri(R, 0, 20);
  if (age === p.lifeMaxY * 12) return die(s, p, m, "age");
  if (d.awakenAt && !p.hunter && age === d.awakenAt * 12) {
    p.hunter = { rank: 0, cls: p.cls }; p.rank = 0;
    const homes = (GUILDS[p.country] ?? []).filter((g) => g.tier !== "shadow");
    p.guild = homes[ri(R, 0, homes.length - 1)]?.id ?? null;
  }
  if (!p.hunter || p.retired) return;
  if (age === p.retireAtY * 12) { p.retired = true; news(s, `${p.name} ประกาศเกษียณจากการล่า`); return; }
  if (age >= 18 * 12 && (age - 18 * 12) % 24 === 0) {
    const t = trustOf(s, p.id);
    const up = rnd(R), hurt = rnd(R), move = rnd(R), pick = rnd(R); // always four draws: same stream either way
    if (up < (t <= -40 ? SPITE : PROMOTE) && p.rank < p.ceiling) {
      p.rank++; p.hunter.rank = p.rank; syncRoster(s, p);
    }
    if (hurt < HURT) p.hurtUntilWM = m + 6 + Math.floor(pick * 13);
    if (move < MOVE && p.guild) {
      const list = GUILDS[p.country] ?? [], tiers = ["shadow", "major", "legend"];
      const here = tiers.indexOf(list.find((g) => g.id === p.guild)?.tier);
      const near = list.filter((g) => g.id !== p.guild && Math.abs(tiers.indexOf(g.tier) - here) <= 1);
      if (near.length) p.guild = near[Math.floor(pick * near.length)].id;
    }
  }
  if (age > 0 && age % 12 === 0) {
    const roll = rnd(R);
    let chance = GATE_DEATH(p.rank);
    if (p.city === s.city && trustOf(s, p.id) >= 40) chance /= 2; // you were there, you warned them
    if (m <= (p.savedUntilWM ?? -Infinity)) chance = 0; // someone pulled them out of a gate not long ago
    if (roll < chance) die(s, p, m, "gate");
  }
}

export function updatePeople(s) {
  const now = worldMonth(s);
  const cast = Object.values(s.world?.people ?? {}).filter((x) => x.cast).sort((a, b) => a.cast.localeCompare(b.cast));
  for (const p of cast) {
    for (let m = (p.doneWM ?? now) + 1; m <= now && p.diedWorldM == null; m++) step(s, p, m);
    p.doneWM = Math.max(p.doneWM ?? now, now);
  }
}
monthly.unshift(updatePeople); // first in the month; it never opens an event
