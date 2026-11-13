// Saves and the cross-life collection book. Pure: takes a storage adapter { get, set, del }. Spec §10 and §13.
import { ITEMS } from "../data/items.js";
import { hooks } from "./registry.js";
const SLOT = (i) => `riftledger.slot.v2.${i}`;
const BOOK = "riftledger.book.v2";
const REQUIRED = ["seed", "name", "ageM", "st", "log", "world", "r"];

export const serialize = (s) => JSON.stringify(s);

// Top-level numbers the UI prints; anything that is not a finite number becomes 0 (or its numeric value).
const NUMS = ["ageM", "gold", "fame", "debt", "hp", "mind", "lifeY", "mon0"];
const TONES = new Set(["", "imp", "good", "bad", "leg"]);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function deserialize(str) {
  try {
    const s = JSON.parse(str);
    if (!s || s.v !== 2 || REQUIRED.some((k) => !(k in s))) return null;
    if (Number.isInteger(s.sv) && s.sv > SAVE_SV) return null; // a newer game's save: never downgrade it
    if (typeof s.name !== "string" || typeof s.seed !== "string") return null;
    for (const k of NUMS) s[k] = num(s[k]);
    for (const k of Object.keys(s.st ?? {})) s.st[k] = num(s.st[k]);
    if (s.hunter) for (const k of ["rank", "lv", "xp", "ceil"]) s.hunter[k] = num(s.hunter[k]);
    for (const k of Object.keys(s.world?.records ?? {})) s.world.records[k] = num(s.world.records[k]);
    for (const k of Object.keys(s.c ?? {})) s.c[k] = num(s.c[k]);
    for (const g of s.goals ?? []) g.target = num(g.target);
    for (const l of s.log ?? []) if (!TONES.has(l.tone)) l.tone = "";
    // item lists: only real records with a plain uid; plus is a whole number 0..5
    const okItem = (i) => i && typeof i === "object" && /^i\d+$/.test(String(i.uid)) && ITEMS[i.id] != null;
    const clean = (list) => (Array.isArray(list) ? list.filter(okItem) : []);
    s.items = clean(s.items);
    if (s.store) {
      const vc = s.store.vaultCountry;
      s.store = { home: clean(s.store.home), vault: clean(s.store.vault),
        vaultCountry: typeof vc === "string" ? vc : null, guild: clean(s.store.guild) };
    }
    const st = s.store ?? {};
    for (const i of [...s.items, ...st.home ?? [], ...st.vault ?? [], ...st.guild ?? []]) {
      if ("plus" in i) i.plus = Math.max(0, Math.min(5, Math.floor(num(i.plus))));
    }
    if (s.guild) {
      const g = s.guild, roles = ["member", "officer", "master"];
      s.guild = typeof g === "object" && typeof g.n === "string" && roles.includes(g.role)
        ? { id: String(g.id), n: g.n, role: g.role, standing: num(g.standing), since: num(g.since) } : null;
    }
    // a locker without a guild would be unreachable: its items go home
    if (!s.guild && s.store?.guild?.length) { s.store.home.push(...s.store.guild); s.store.guild = []; }
    if (s.heir) {
      const h = s.heir, str = (x) => (typeof x === "string" ? x : "");
      s.heir = { of: str(h.of), rel: h.rel === "หลาน" ? "หลาน" : "ลูก", gold: num(h.gold), guild: str(h.guild) || null,
        enemies: Array.isArray(h.enemies) ? h.enemies.filter((e) => typeof e === "string").slice(0, 3) : [],
        paid: num(h.paid), guildDone: num(h.guildDone), grudgeDone: num(h.grudgeDone) };
    }
    if ("gen" in s) s.gen = Math.max(1, num(s.gen));
    // teammates and staff: keep real records, numbers as numbers, ids plain (they go into button actions)
    const okPerson = (m) => m && typeof m === "object" && typeof m.n === "string" && /^[\w-]+$/.test(String(m.id));
    for (const k of ["team", "staff"]) {
      if (!(k in s)) continue;
      s[k] = Array.isArray(s[k]) ? s[k].filter(okPerson) : [];
      const NUMF = ["rank", "lv", "loyalty", "hurtUntilM", "story", "tpl"];
      for (const m of s[k]) for (const f of NUMF) if (f in m) m[f] = num(m[f]);
    }
    if ("enemies" in s) s.enemies = Array.isArray(s.enemies) ? s.enemies.filter((e) => typeof e?.n === "string") : [];
    return migrate(s);
  } catch {
    return null;
  }
}

// ---- Schema versions (save-systems skill: stamp a version, migrate step by step on load).
// sv 1: saves from before Phases 5–8 (no factions, stores, guild locker or enemies list). sv 2: before lives that
// remember. sv 3: today (people, relations, stories; spec 2026-11-13-lives-that-remember-design.md).
export const SAVE_SV = 3;
const FAC_IDS = ["assoc", "state", "church", "research", "under"];
const MIGRATIONS = {
  1: (s) => {
    s.fac ??= Object.fromEntries(FAC_IDS.map((k) => [k, 0]));
    s.store ??= { home: [], vault: [], vaultCountry: null, guild: [] };
    s.store.guild ??= [];
    s.enemies ??= [];
    s.secrets ??= [];
  },
  2: (s) => {
    s.familyId ??= "fam-" + s.seed;
    s.lifeId ??= s.familyId + ":" + (s.gen ?? 1);
    s.narrative ??= { v: 1, stories: {} };
    s.relations ??= {};
    s.world.people ??= {};
    s.world.nextPersonId ??= 1;
    hooks.migratePeople?.(s);
  },
};
export function migrate(s) {
  let v = Number.isInteger(s.sv) && s.sv > 0 ? s.sv : 1;
  while (v < SAVE_SV) { MIGRATIONS[v]?.(s); v++; }
  s.sv = SAVE_SV;
  // Idempotent repair on every load: members who joined without a place on the list (before the P1 review fix)
  // get one; the source key makes a second load find the same person.
  hooks.repairPeople?.(s);
  return s;
}

// What a stored string is: a save this game can play, one from a newer game (kept untouched), or unreadable.
export function inspect(str) {
  if (!str) return "empty";
  let raw;
  try { raw = JSON.parse(str); } catch { return "corrupt"; }
  if (raw && typeof raw === "object" && (raw.v > 2 || (Number.isInteger(raw.sv) && raw.sv > SAVE_SV))) {
    return "unsupported";
  }
  return deserialize(str) ? "ok" : "corrupt";
}

export function slots(store, n = 3) {
  const BAK = (i) => SLOT(i) + ".bak";
  // ok | empty | corrupt | unsupported (a newer game's save in front or behind: never loaded, never written over)
  const status = (i) => {
    const a = inspect(store.get(SLOT(i))), b = inspect(store.get(BAK(i)));
    if (a === "unsupported" || (a !== "ok" && b === "unsupported")) return "unsupported";
    if (a === "ok" || b === "ok") return "ok";
    return a === "empty" && b === "empty" ? "empty" : "corrupt";
  };
  // a slot that no longer reads (cut short, hand-edited) falls back to the save before it
  const load = (i) => (status(i) === "ok"
    ? deserialize(store.get(SLOT(i)) ?? "") ?? deserialize(store.get(BAK(i)) ?? "") : null);
  return {
    list: () => Array.from({ length: n }, (_, i) => {
      if (status(i) === "unsupported") return { locked: true };
      const s = load(i);
      return s && { name: s.name, ageM: s.ageM, dead: !!s.dead };
    }),
    status,
    load,
    save: (i, s) => {
      if (status(i) === "unsupported") return false;
      const prev = store.get(SLOT(i));
      if (prev && deserialize(prev)) store.set(BAK(i), prev);
      return store.set(SLOT(i), serialize(s)) !== false;
    },
    del: (i) => { store.del(SLOT(i)); store.del(BAK(i)); },
    exportStr: (i) => store.get(SLOT(i)),
    importStr(i, str) {
      if (status(i) === "unsupported" || !deserialize(str)) return false;
      store.set(SLOT(i), str);
      return true;
    },
  };
}

export function collection(store) {
  const empty = () => ({ titles: [], seen: {}, lives: 0 });
  const get = () => {
    let raw;
    try { raw = JSON.parse(store.get(BOOK) ?? "null") ?? {}; } catch { raw = {}; }
    const b = empty();
    if (Array.isArray(raw.titles)) b.titles = raw.titles.filter((t) => typeof t === "string");
    if (raw.seen && typeof raw.seen === "object" && !Array.isArray(raw.seen)) {
      for (const [k, v] of Object.entries(raw.seen)) {
        if (Array.isArray(v)) b.seen[k] = v.filter((x) => typeof x === "string");
      }
    }
    b.lives = Number.isFinite(Number(raw.lives)) ? Number(raw.lives) : 0;
    const L = raw.legacy;
    if (L && typeof L === "object") {
      b.legacy = { kids: Number(L.kids) || 0, assets: Number(L.assets) || 0,
        enemies: Array.isArray(L.enemies) ? L.enemies.filter((e) => typeof e === "string").slice(0, 10) : [] };
    }
    return b;
  };
  const put = (b) => store.set(BOOK, JSON.stringify(b));
  return {
    get,
    addTitle(t) { const b = get(); if (!b.titles.includes(t)) b.titles.push(t); put(b); },
    addSeen(kind, id) { const b = get(); (b.seen[kind] ??= []).includes(id) || b.seen[kind].push(id); put(b); },
    addLife() { const b = get(); b.lives++; put(b); },
    setLegacy(l) { const b = get(); b.legacy = l; put(b); },
  };
}
