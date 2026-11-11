// Items: provenance, equip, locks, selling, comparing, loadouts, auto-junk, loot and the revival token. Spec §9.
import { wp, ri } from "./rng.js";
import { stream, log } from "./state.js";
import { addLedger } from "./money.js";
import { deathHooks } from "./body.js";
import { gearHooks, afterOpHooks } from "./ops.js";
import { ITEMS, LOOT_TABLE } from "../data/items.js";

export const bagCap = () => 20;
const inst = (s, uid) => s.items.find((i) => i.uid === uid);

export function giveItem(s, id, from) {
  s.c.uid = (s.c.uid ?? 0) + 1;
  const uid = "i" + s.c.uid;
  s.items.push({ uid, id, from, lock: false, m: s.ageM });
  return uid;
}

const equipped = (s, uid) => Object.values(s.equip).includes(uid);

export function equip(s, uid) {
  const it = inst(s, uid), def = it && ITEMS[it.id];
  if (!def?.slot) return false;
  s.equip[def.slot] = uid;
  return true;
}

export function lockItem(s, uid, on) {
  const it = inst(s, uid);
  if (it) it.lock = !!on;
}

export function sellItem(s, uid) {
  const it = inst(s, uid);
  if (!it || it.lock || equipped(s, uid)) return false;
  s.items = s.items.filter((i) => i.uid !== uid);
  addLedger(s, "ขายของ", Math.round(ITEMS[it.id].price * 0.5));
  return true;
}

export function compare(s, uid) {
  const def = ITEMS[inst(s, uid)?.id];
  const cur = ITEMS[inst(s, s.equip[def?.slot])?.id];
  const out = {};
  for (const k of ["atk", "def", "hp"]) out[k] = (def?.stats?.[k] ?? 0) - (cur?.stats?.[k] ?? 0);
  return out;
}

const SORTS = {
  rarity: (a, b) => ITEMS[b.id].rarity - ITEMS[a.id].rarity || ITEMS[b.id].price - ITEMS[a.id].price,
  name: (a, b) => ITEMS[a.id].n.localeCompare(ITEMS[b.id].n),
  new: (a, b) => b.m - a.m,
};

export function sortFilter(items, { kind, minRarity = 0, q = "", sort = "rarity" } = {}) {
  const ql = q.toLowerCase();
  return items
    .filter((i) => (!kind || ITEMS[i.id].kind === kind) && ITEMS[i.id].rarity >= minRarity)
    .filter((i) => !ql || ITEMS[i.id].n.toLowerCase().includes(ql))
    .sort(SORTS[sort] ?? SORTS.rarity);
}

export function saveLoadout(s, name) {
  s.loadouts ??= {};
  s.loadouts[name] = { ...s.equip };
}

export function useLoadout(s, name) {
  const l = s.loadouts?.[name];
  if (!l) return false;
  s.equip = Object.fromEntries(Object.entries(l).filter(([, uid]) => inst(s, uid)));
  return true;
}

export function autoJunk(s, { belowRarity }) {
  const junk = s.items.filter((i) => !i.lock && !equipped(s, i.uid) && ITEMS[i.id].rarity < belowRarity);
  for (const i of junk) sellItem(s, i.uid);
  return junk.length;
}

export function useItem(s, uid) {
  const it = inst(s, uid), def = it && ITEMS[it.id];
  if (!def?.use || def.use === "revive") return false;
  if (def.use === "heal") s.hp = Math.min(100, s.hp + def.amount);
  if (def.use === "learn" && s.hunter && !s.hunter.skills.includes(def.skill)) s.hunter.skills.push(def.skill);
  s.items = s.items.filter((i) => i.uid !== uid);
  return true;
}

gearHooks.push((s) => {
  const out = { atk: 0, def: 0, hp: 0 };
  for (const uid of Object.values(s.equip)) {
    const st = ITEMS[inst(s, uid)?.id]?.stats ?? {};
    for (const k in out) out[k] += st[k] ?? 0;
  }
  return out;
});

afterOpHooks.push((s, o, r) => {
  if (r !== "won" || o.def.kind === "job") return;
  const R = stream(s, "loot");
  const rolls = 1 + o.loot + (o.def.boss ? 1 : 0);
  for (let i = 0; i < rolls && s.items.length < bagCap(); i++) {
    if (ri(R, 0, 1)) giveItem(s, wp(R, LOOT_TABLE).id, o.def.t);
  }
});

deathHooks.push((s, cause) => {
  if (cause === "อายุขัย") return false; // a token pulls you back from a wound, not from the end of a life
  const tok = s.items.find((i) => i.id === "phoenixToken");
  if (!tok) return false;
  s.items = s.items.filter((i) => i !== tok);
  s.hp = 30;
  s.ev = null;
  s.op = null;
  log(s, "รอดตาย", "Phoenix Token แตกเป็นผุยผง คุณลืมตาขึ้นอีกครั้ง", "leg");
  return true;
});
