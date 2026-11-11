// Saves and the cross-life collection book. Pure: takes a storage adapter { get, set, del }. Spec §10 and §13.
const SLOT = (i) => `riftledger.slot.v2.${i}`;
const BOOK = "riftledger.book.v2";
const REQUIRED = ["seed", "name", "ageM", "st", "log", "world", "r"];

export const serialize = (s) => JSON.stringify(s);

// Top-level numbers the UI prints; anything that is not a finite number becomes 0 (or its numeric value).
const NUMS = ["ageM", "gold", "fame", "debt", "hp", "mind", "lifeY", "mon0"];
const TONES = new Set(["", "imp", "bad", "leg"]);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function deserialize(str) {
  try {
    const s = JSON.parse(str);
    if (!s || s.v !== 2 || REQUIRED.some((k) => !(k in s))) return null;
    if (typeof s.name !== "string" || typeof s.seed !== "string") return null;
    for (const k of NUMS) s[k] = num(s[k]);
    for (const k of Object.keys(s.st ?? {})) s.st[k] = num(s.st[k]);
    if (s.hunter) for (const k of ["rank", "lv", "xp", "ceil"]) s.hunter[k] = num(s.hunter[k]);
    for (const k of Object.keys(s.world?.records ?? {})) s.world.records[k] = num(s.world.records[k]);
    for (const k of Object.keys(s.c ?? {})) s.c[k] = num(s.c[k]);
    for (const g of s.goals ?? []) g.target = num(g.target);
    for (const l of s.log ?? []) if (!TONES.has(l.tone)) l.tone = "";
    // item lists: only real records with a plain uid; plus is a whole number 0..5
    const okItem = (i) => i && typeof i === "object" && /^i\d+$/.test(String(i.uid)) && typeof i.id === "string";
    const clean = (list) => (Array.isArray(list) ? list.filter(okItem) : []);
    s.items = clean(s.items);
    if (s.store) s.store = { home: clean(s.store.home), vault: clean(s.store.vault),
      vaultCountry: typeof s.store.vaultCountry === "string" ? s.store.vaultCountry : null };
    for (const i of [...s.items, ...(s.store?.home ?? []), ...(s.store?.vault ?? [])]) {
      if ("plus" in i) i.plus = Math.max(0, Math.min(5, Math.floor(num(i.plus))));
    }
    if ("enemies" in s) s.enemies = Array.isArray(s.enemies) ? s.enemies.filter((e) => typeof e?.n === "string") : [];
    return s;
  } catch {
    return null;
  }
}

export function slots(store, n = 3) {
  const load = (i) => deserialize(store.get(SLOT(i)) ?? "");
  return {
    list: () => Array.from({ length: n }, (_, i) => {
      const s = load(i);
      return s && { name: s.name, ageM: s.ageM, dead: !!s.dead };
    }),
    load,
    save: (i, s) => store.set(SLOT(i), serialize(s)),
    del: (i) => store.del(SLOT(i)),
    exportStr: (i) => store.get(SLOT(i)),
    importStr(i, str) {
      if (!deserialize(str)) return false;
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
