// The main cast in the list of people: created once per world, repaired into older saves.
// Spec: docs/superpowers/specs/2026-11-13-main-cast-design.md.
import { CAST, HOLDERS } from "../data/cast.js";
import { ensurePerson, personById } from "./people.js";
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
      hunter: d.awakenAt ? null : { rank: d.rank, cls: d.cls }, ties: {} });
  }
  // the calendar's record holders are these people now
  for (const [rosterId, id] of Object.entries(HOLDERS)) {
    const n = s.world.roster?.find((x) => x.id === rosterId), p = castPerson(s, id);
    if (!n || !p) continue;
    Object.assign(n, { n: p.name, rank: p.rank, cls: p.cls, personId: p.id, cast: id });
  }
}
hooks.addCast = addCast;
