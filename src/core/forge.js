// The smith: +1..+5 on gear. Each plus adds 10% of the item's base stats; a failure only costs the fee. Spec §9.1.
import { ch } from "./rng.js";
import { stream, log } from "./state.js";
import { addLedger } from "./money.js";
import { hooks } from "./registry.js";
import { ITEMS } from "../data/items.js";

export const MAX_PLUS = 5;
export const plusMul = (it) => 1 + (it?.plus ?? 0) * 0.1;
export const forgeCost = (s, it) =>
  Math.round(ITEMS[it.id].price * 0.4 * ((it.plus ?? 0) + 1) * (s.flags.ownForge ? 0.7 : 1));
export const forgeOdds = (it) => 1 - (it.plus ?? 0) * 0.15;

// A lucky smith: +1 on the equipped weapon, free.
hooks.act.forgeBless = (s) => {
  const it = s.items.find((i) => i.uid === s.equip.weapon);
  if (it && (it.plus ?? 0) < MAX_PLUS) it.plus = (it.plus ?? 0) + 1;
};

// -> "ok" | "fail" | null (cannot forge)
export function forge(s, uid) {
  const it = s.items.find((i) => i.uid === uid), d = it && ITEMS[it.id];
  if (!d?.slot || (it.plus ?? 0) >= MAX_PLUS) return null;
  const cost = forgeCost(s, it);
  if (s.gold < cost) return null;
  addLedger(s, "ค่าตีบวก", -cost);
  const ok = ch(stream(s, "forge"), forgeOdds(it));
  if (ok) it.plus = (it.plus ?? 0) + 1;
  log(s, "ช่าง", ok ? `${d.n} +${it.plus} สำเร็จ` : `ตีบวก ${d.n} ไม่สำเร็จ`, ok ? "imp" : "");
  return ok ? "ok" : "fail";
}
