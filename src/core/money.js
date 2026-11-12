import { ageY, log } from "./state.js";
import { monthly } from "./registry.js";
import { cityOf } from "../data/world.js";
import { FAMILIES } from "../data/families.js";
import { ITEMS } from "../data/items.js";
import { hooks } from "./registry.js";
// Every change to s.gold goes through addLedger, so the money tab can always say why.
const LEDGER_MONTHS = 24;
const NOT_EARNED = new Set(["กู้ยืม", "เงินตั้งตัวจากครอบครัว", "มรดกจากครอบครัว", "ของที่ถูกยึดชำระหนี้"]);

export function addLedger(s, label, amt) {
  if (!amt) return;
  s.gold += amt;
  if (amt > 0 && !NOT_EARNED.has(label)) s.c.earned = (s.c.earned ?? 0) + amt;
  s.ledger.push({ m: s.ageM, label, amt });
  if (s.flags.fullLedger) return;
  const cut = s.ageM - LEDGER_MONTHS;
  while (s.ledger.length && s.ledger[0].m < cut) s.ledger.shift();
}

// ---- Living cost, family support and debt. Spec §6.1.

const INTEREST = 0.01;

export function monthlyIncome(s) {
  const inc = s.ledger.filter((e) => e.m === s.ageM && e.amt > 0 && e.label !== "กู้ยืม");
  return inc.reduce((a, e) => a + e.amt, 0);
}

// Average earned income over the 12 full months before this one (loans and family money excluded).
export function trailingIncome(s) {
  const inWindow = (e) => e.m >= s.ageM - 12 && e.m < s.ageM;
  const inc = s.ledger.filter((e) => inWindow(e) && e.amt > 0 && !NOT_EARNED.has(e.label));
  return inc.reduce((a, e) => a + e.amt, 0) / 12;
}

export const debtCap = (s) => Math.max(5000, Math.round(trailingIncome(s) * 24));

export function living(s) {
  if (ageY(s) < 18) return;
  const hunter = s.hunter ? 40 + s.hunter.rank * 40 : 0;
  const kids = (s.c.kids ?? 0) * 60;
  addLedger(s, "ค่าครองชีพ", -(cityOf(s.city).cost + hunter + kids));
}

export function borrow(s, amt) {
  if (amt <= 0 || s.debt + amt > debtCap(s)) return false;
  s.debt += amt;
  addLedger(s, "กู้ยืม", amt);
  return true;
}

export function repay(s, amt) {
  amt = Math.min(amt, s.debt, Math.max(0, s.gold));
  if (amt <= 0) return false;
  s.debt -= amt;
  addLedger(s, "ชำระหนี้", -amt);
  return true;
}

export function monthSummary(s) {
  const now = s.ledger.filter((e) => e.m === s.ageM);
  const inn = now.filter((e) => e.amt > 0), out = now.filter((e) => e.amt < 0);
  return { in: inn, out, net: now.reduce((a, e) => a + e.amt, 0) };
}

const INSTALMENT = 0.05; // share of the debt repaid each month, at least 100

function payInstalment(s) {
  if (s.debt <= 0 || s.gold <= 0) return;
  const pay = Math.min(s.debt, Math.max(100, Math.ceil(s.debt * INSTALMENT)), s.gold);
  s.debt -= pay;
  addLedger(s, "ผ่อนหนี้", -pay);
}

// Default: the collector takes loose things (not locked, not worn), most valuable first, until their resale covers
// the shortfall, and credits that to you. One line in the log, not one per item.
function seize(s) {
  const worn = new Set(Object.values(s.equip));
  const loose = s.items.filter((i) => !i.lock && !worn.has(i.uid))
    .sort((a, b) => ITEMS[b.id].price - ITEMS[a.id].price);
  const taken = [];
  let got = 0;
  for (const it of loose) {
    if (got >= -s.gold) break;
    taken.push(it);
    got += Math.round(ITEMS[it.id].price * 0.5);
  }
  if (taken.length) {
    s.items = s.items.filter((i) => !taken.includes(i));
    addLedger(s, "ของที่ถูกยึดชำระหนี้", got);
    const names = taken.slice(0, 3).map((i) => ITEMS[i.id].n).join(", ") + (taken.length > 3 ? " และอื่นๆ" : "");
    log(s, "เงิน", `เจ้าหนี้ยึดของไป ${taken.length} ชิ้น (${names})`, "bad");
    hooks.changeMind?.(s, -8);
  }
  s.c.seized = (s.c.seized ?? 0) + 1;
}

function debtMonth(s) {
  if (s.debt > 0) s.debt += Math.ceil(s.debt * INTEREST);
  payInstalment(s);
  if (s.gold >= 0) return;
  const need = -s.gold;
  if (borrow(s, need)) return;
  s.c.default = (s.c.default ?? 0) + 1;
  seize(s);
  if (s.c.default % 6 === 1) {
    log(s, "เงิน", "คุณจ่ายบิลไม่ไหว เจ้าหนี้เริ่มโทรมาทุกวัน", "bad");
    s.sched.push({ id: "debtCollector", atM: s.ageM });
  }
}

function familyGift(s) {
  if (s.c.famGift || ageY(s) < 18) return;
  s.c.famGift = 1;
  const f = s.unlockFamily ?? FAMILIES.find((x) => x.id === s.family);
  addLedger(s, "เงินตั้งตัวจากครอบครัว", f.gold);
}

monthly.push((s) => {
  familyGift(s);
  living(s);
  debtMonth(s);
});
