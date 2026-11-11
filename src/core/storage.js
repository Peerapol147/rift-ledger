// Storage beyond the bag: a home store that moves with you, and a rented bank vault bound to its country. Spec §9.2.
import { addLedger } from "./money.js";
import { books, onNewLife } from "./registry.js";
import { bagCap } from "./items.js";

export const STORES = { home: { n: "บ้าน", cap: 30 }, vault: { n: "ตู้นิรภัยธนาคาร", cap: 40, rent: 150 } };
export const SHIP_FEE = 40;

onNewLife.push((s) => { s.store = { home: [], vault: [], vaultCountry: null }; });
// old saves have no store yet
export const storeOf = (s) => (s.store ??= { home: [], vault: [], vaultCountry: null });
export const storeOpen = (s, where) => where === "home" || (storeOf(s).vaultCountry ?? s.country) === s.country;

export function stash(s, uid, where) {
  const st = storeOf(s), list = st[where], it = s.items.find((i) => i.uid === uid);
  // the Phoenix Token only works on you, so it never leaves the bag
  if (!list || !it || it.id === "phoenixToken" || Object.values(s.equip).includes(uid)) return false;
  if (list.length >= STORES[where].cap || !storeOpen(s, where)) return false;
  s.items = s.items.filter((i) => i !== it);
  list.push(it);
  if (where === "vault") st.vaultCountry = s.country;
  return true;
}

export function take(s, uid, where) {
  const st = storeOf(s), list = st[where], it = list?.find((i) => i.uid === uid);
  if (!it || s.items.length >= bagCap(s) || !storeOpen(s, where)) return false;
  st[where] = list.filter((i) => i !== it);
  s.items.push(it);
  if (where === "vault" && !st.vault.length) st.vaultCountry = null;
  return true;
}

books.push((s, step = 1) => {
  if (s.store?.vault?.length) addLedger(s, "ค่าเช่าตู้นิรภัย", -STORES.vault.rent * step);
});
