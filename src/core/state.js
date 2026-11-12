// The life state: one plain JSON object. Every random roll uses a named stream in s.r.
import { mk, ri, wp, pk } from "./rng.js";
import { WORLD, COUNTRIES, FAMILIES, NAMES, STAT_IDS } from "../data/index.js";

export const stream = (s, name) => (s.r[name] ??= mk(s.seed, name));

export const ageY = (s) => Math.floor(s.ageM / 12);

// Calendar position: years since Rift Day and month of year (1–12).
export const yearsAfterRift = (s) => WORLD.BIRTH_YEAR - WORLD.RIFT_YEAR + Math.floor(((s.mon0 ?? 0) + s.ageM) / 12);
export const monthOfYear = (s) => (((s.mon0 ?? 0) + s.ageM) % 12) + 1;

import { onNewLife } from "./registry.js";
export { onNewLife };

export function stageOf(s) {
  const a = ageY(s);
  if (a < 13) return "kid";
  if (a < 18) return "teen";
  if (a < 60) return "adult";
  return "old";
}

export function dateText(s) {
  const m = (s.mon0 ?? 0) + s.ageM;
  const year = WORLD.BIRTH_YEAR + Math.floor(m / 12);
  return `ปี ${year} (ปีที่ ${year - WORLD.RIFT_YEAR} หลังฟ้าแตก) เดือน ${(m % 12) + 1}`;
}

export function log(s, tag, text, tone = "") {
  s.log.push({ m: s.ageM, tag, text, tone });
  if (s.log.length > 600) s.log.splice(0, s.log.length - 600);
}

// o.name: the player may name the child; otherwise the family does.
export function newLife(seed, o = {}) {
  seed = String(seed);
  const s = { v: 2, sv: 2, seed, r: {} }; // sv: schema version, see SAVE_SV in save.js
  const R = stream(s, "birth");
  const country = wp(R, Object.entries(COUNTRIES).map(([id, c]) => ({ id, w: c.w }))).id;
  const family = wp(R, FAMILIES.filter((f) => f.country === country));
  const sex = ri(R, 0, 1) ? "f" : "m";
  const st = Object.fromEntries(STAT_IDS.map((k) => [k, 4 + ri(R, 0, 3) + (family.st[k] ?? 0)]));
  Object.assign(s, {
    name: pk(R, NAMES[country][sex]),
    named: !!o.name,
    sex,
    country,
    city: pk(R, COUNTRIES[country].cities).id,
    family: family.id,
    mon0: ri(R, 0, 11),
    ageM: 0,
    st,
    hp: 100,
    mind: 100,
    lifeY: 70 + ri(R, 0, 15),
    gold: 0,
    fame: 0,
    debt: 0,
    ledger: [],
    flags: {},
    c: {},
    focus: "play",
    job: null,
    hunter: null,
    injuries: [],
    team: [],
    items: [],
    equip: {},
    quick: [],
    world: { roster: [], records: { silent: 47, drowned: 44 }, done: {} },
    ev: null,
    op: null,
    sched: [],
    goals: [],
    log: [],
    dead: null,
  });
  if (o.name) s.name = String(o.name).slice(0, 24);
  log(s, "ชะตา", `${s.name} ลืมตาดูโลกที่${COUNTRIES[country].n} · ${family.n}: ${family.d}`, "imp");
  for (const f of onNewLife) f(s);
  return s;
}
