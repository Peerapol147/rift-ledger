// Saves and the cross-life collection book. Pure: takes a storage adapter { get, set, del }. Spec §10 and §13.
const SLOT = (i) => `riftledger.slot.v2.${i}`;
const BOOK = "riftledger.book.v2";
const REQUIRED = ["seed", "name", "ageM", "st", "log", "world", "r"];

export const serialize = (s) => JSON.stringify(s);

export function deserialize(str) {
  try {
    const s = JSON.parse(str);
    if (!s || s.v !== 2 || REQUIRED.some((k) => !(k in s))) return null;
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
    try { return { ...empty(), ...JSON.parse(store.get(BOOK) ?? "null") }; } catch { return empty(); }
  };
  const put = (b) => store.set(BOOK, JSON.stringify(b));
  return {
    get,
    addTitle(t) { const b = get(); if (!b.titles.includes(t)) b.titles.push(t); put(b); },
    addSeen(kind, id) { const b = get(); (b.seen[kind] ??= []).includes(id) || b.seen[kind].push(id); put(b); },
    addLife() { const b = get(); b.lives++; put(b); },
  };
}
