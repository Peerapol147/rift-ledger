// One list of people the world, the team and the stories all point at, with stable ids, and how this life stands
// with each of them. Spec: docs/superpowers/specs/2026-11-13-lives-that-remember-design.md §5.2.
import { worldMonth } from "./state.js";
import { hooks } from "./registry.js";

const clamp = (v) => Math.max(-100, Math.min(100, Math.round(Number(v) || 0)));
// a stable number from a string, for estimated birth months of imported people (no RNG stream is touched)
const hash = (str) => { let h = 7; for (const ch of str) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };

export function ensurePerson(s, input, sourceKey) {
  const people = (s.world.people ??= {});
  const found = Object.values(people).find((p) => p.src === sourceKey);
  if (found) return found.id;
  s.world.nextPersonId ??= 1;
  const id = "p" + s.world.nextPersonId++;
  people[id] = {
    id, name: input.name, country: input.country ?? null, city: input.city ?? null, sex: input.sex ?? null,
    bornWorldM: input.bornWorldM ?? null, diedWorldM: input.diedWorldM ?? null, goneWorldM: null,
    job: input.job ?? null, hunter: input.hunter ?? null, tags: [...(input.tags ?? [])], src: sourceKey,
  };
  return id;
}

export const personById = (s, id) => s.world.people?.[id] ?? null;
export const personAlive = (s, id) => { const p = personById(s, id); return !!p && p.diedWorldM == null; };
export function personPresent(s, id, city) {
  const p = personById(s, id);
  return !!p && p.diedWorldM == null && p.goneWorldM == null && (city == null || p.city === city);
}
export function setPersonStatus(s, id, patch) {
  const p = personById(s, id);
  if (p) Object.assign(p, patch);
}

export function relationOf(s, id) {
  s.relations ??= {};
  return (s.relations[id] ??= { trust: 0, owe: 0, tags: [], memories: [] });
}
export function changeRelation(s, id, { trust = 0, owe = 0, tag } = {}) {
  const r = relationOf(s, id);
  r.trust = clamp(r.trust + trust);
  r.owe = clamp(r.owe + owe);
  if (tag && !r.tags.includes(tag)) r.tags.push(tag);
}
export function remember(s, id, mem) {
  const r = relationOf(s, id);
  if (r.memories.some((m) => m.id === mem.id)) return false;
  r.memories.push({ id: mem.id, text: mem.text, worldM: mem.worldM ?? worldMonth(s) });
  if (r.memories.length > 24) r.memories.splice(0, r.memories.length - 24);
  return true;
}
export const trustWord = (t) => (t >= 60 ? "ไว้ใจคุณมาก" : t >= 20 ? "ไว้ใจคุณ"
  : t > -20 ? "รู้จักกัน" : "ไม่ไว้ใจคุณ");

// The world's notable hunters, listed once each; a roster death is a death in the list.
export function syncRosterPeople(s) {
  for (const n of s.world.roster ?? []) {
    const key = "legacy-roster:" + n.id;
    n.personId ??= ensurePerson(s, { name: n.n, country: n.country, hunter: { rank: n.rank, cls: n.cls },
      bornWorldM: -(20 + (hash(key) % 25)) * 12, tags: ["estimatedAge"] }, key);
    const p = personById(s, n.personId);
    if (!n.alive && p.diedWorldM == null) p.diedWorldM = worldMonth(s);
  }
}

export function listMember(s, m) {
  m.personId ??= ensurePerson(s, { name: m.n, country: s.country, city: s.city,
    hunter: { rank: m.rank, cls: m.cls }, bornWorldM: worldMonth(s) - (20 + (hash(m.id) % 15)) * 12,
    tags: ["team", "estimatedAge"] }, `team:${s.lifeId}:${m.id}`);
  return m.personId;
}

hooks.migratePeople = (s) => {
  syncRosterPeople(s);
  for (const m of s.team ?? []) {
    listMember(s, m);
    if (!m.alive) setPersonStatus(s, m.personId, { diedWorldM: personById(s, m.personId).diedWorldM ?? worldMonth(s) });
  }
};
