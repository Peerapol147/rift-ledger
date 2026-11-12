// Items: provenance, equip, locks, selling, comparing, loadouts, auto-junk, loot and the revival token. Spec §9.
import { wp, ri } from "./rng.js";
import { stream, log } from "./state.js";
import { addLedger } from "./money.js";
import { deathHooks } from "./body.js";
import { gearHooks, afterOpHooks } from "./ops.js";
import { hooks } from "./registry.js";
import { ITEMS, SETS } from "../data/items.js";
import { CLASSES } from "../data/classes.js";
import { plusMul } from "./forge.js";

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
  const a = inst(s, uid), def = ITEMS[a?.id];
  const b = inst(s, s.equip[def?.slot]), cur = ITEMS[b?.id];
  const out = {};
  // set bonuses change too when a piece goes in or out
  const now = setBonus(s), was = s.equip, slot = def?.slot;
  let after = now;
  if (slot) { s.equip = { ...was, [slot]: uid }; after = setBonus(s); s.equip = was; }
  for (const k of ["atk", "def", "hp"]) {
    out[k] = Math.round(gearValue(s, a, k) - gearValue(s, b, k) + after[k] - now[k]);
  }
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

// Story rewards: give:<itemId>. The Phoenix Token comes at most once per life.
for (const id of Object.keys(ITEMS)) {
  hooks.act["give:" + id] = (s) => {
    if (id === "phoenixToken" && s.flags.gotToken) return;
    if (id === "phoenixToken") s.flags.gotToken = true;
    giveItem(s, id, "ของจากเรื่องราวในชีวิต");
  };
}

// Gear made for your role gives +25%. Only a hunter has a role.
export const ROLE_BONUS = 1.25;
const roleMul = (s, d) => (d?.role && d.role === CLASSES[s.hunter?.cls]?.role ? ROLE_BONUS : 1);
export const gearValue = (s, it, k) => (ITEMS[it?.id]?.stats?.[k] ?? 0) * plusMul(it) * roleMul(s, ITEMS[it?.id]);

// Pieces of each tower set being worn, and the bonus they give together.
export function setBonus(s) {
  const n = {}, out = { atk: 0, def: 0, hp: 0 };
  for (const uid of Object.values(s.equip)) {
    const set = ITEMS[inst(s, uid)?.id]?.set;
    if (set) n[set] = (n[set] ?? 0) + 1;
  }
  for (const [set, c] of Object.entries(n)) {
    const b = SETS[set]?.[Math.min(3, c)];
    if (c >= 2 && b) for (const k in out) out[k] += b[k] ?? 0;
  }
  return out;
}

gearHooks.push((s) => {
  const out = { atk: 0, def: 0, hp: 0 }, set = setBonus(s);
  for (const uid of Object.values(s.equip)) for (const k in out) out[k] += gearValue(s, inst(s, uid), k);
  for (const k in out) out[k] += set[k];
  return out;
});

// Loot into a full bag: the cheapest loose thing is sold to make room, or the new find is sold on the spot.
function take(s, id, from) {
  if (s.items.length < bagCap()) return giveItem(s, id, from);
  const worn = new Set(Object.values(s.equip));
  // only plain loot is ever sold for room: never a relic (the Phoenix Token), a skill book, or anything locked or worn
  const sellable = (i) => !i.lock && !worn.has(i.uid) && !["relic", "book"].includes(ITEMS[i.id].kind);
  const cheap = s.items.filter(sellable).sort((a, b) => ITEMS[a.id].price - ITEMS[b.id].price)[0];
  if (cheap && ITEMS[cheap.id].price < ITEMS[id].price) {
    log(s, "ของ", `กระเป๋าเต็ม ขาย ${ITEMS[cheap.id].n} เพื่อเก็บ ${ITEMS[id].n}`);
    sellItem(s, cheap.uid);
    return giveItem(s, id, from);
  }
  log(s, "ของ", `กระเป๋าเต็ม ขาย ${ITEMS[id].n} ที่เพิ่งได้ทิ้งในราคาถูก`);
  addLedger(s, "ขายของที่ถือไม่ไหว", Math.round(ITEMS[id].price * 0.3)); // sold on the spot, at a dealer's price
}

afterOpHooks.push((s, o, r) => {
  if (r !== "won" || o.def.kind === "job") return;
  const R = stream(s, "loot");
  const table = lootTable(o.def), gear = table.filter((x) => ITEMS[x.id].slot);
  const rolls = 1 + o.loot;
  for (let i = 0; i < rolls; i++) if (ri(R, 0, 1)) take(s, wp(R, table).id, o.def.t);
  // a boss always leaves one piece of gear
  if (o.def.boss && gear.length) take(s, wp(R, gear).id, o.def.t);
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

// ---- Loot by danger: a gate's rank (or a tower floor) sets the tier of gear it can drop. Spec §9.1, loot pass.
const GATE_TIER = [0, 0, 1, 1, 2, 2, 3];
export const lootTier = (def) => (def.kind === "tower"
  ? (def.floor <= 10 ? 0 : def.floor <= 20 ? 1 : def.floor <= 35 ? 2 : 3)
  : GATE_TIER[Math.max(0, Math.min(6, def.rank ?? 0))]);

export function lootTable(def) {
  const t = lootTier(def);
  const out = [{ id: "manaShard", w: 10 }, { id: "beastHide", w: 8 }, { id: "healPotion", w: 5 }];
  if (t >= 1) out.push({ id: "coreStone", w: 2 });
  if (t >= 2) out.push({ id: "bookTelekinesis", w: 0.15 });
  for (const [id, d] of Object.entries(ITEMS)) {
    if (!d.slot) continue;
    if (d.set) {
      if (def.kind === "tower" && SETS[d.set]?.tower === def.tower && d.rarity <= t + 1) out.push({ id, w: 0.8 });
    }
    else if (d.rarity === t) out.push({ id, w: 0.5 });
    else if (d.rarity === t + 1) out.push({ id, w: 0.08 });
  }
  return out;
}
