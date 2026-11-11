import { ageY, log } from "./state.js";
import { monthly } from "./clock.js";
import { cityOf } from "../data/world.js";
import { FAMILIES } from "../data/families.js";
// Every change to s.gold goes through addLedger, so the money tab can always say why.
const LEDGER_MONTHS = 24;

export function addLedger(s, label, amt) {
  if (!amt) return;
  s.gold += amt;
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

export const debtCap = (s) => Math.max(5000, Math.round(monthlyIncome(s) * 24));

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

function debtMonth(s) {
  if (s.debt > 0) {
    const interest = Math.ceil(s.debt * INTEREST);
    s.debt += interest;
  }
  if (s.gold >= 0) return;
  const need = -s.gold;
  if (borrow(s, need)) return;
  s.c.default = (s.c.default ?? 0) + 1;
  if (s.c.default % 6 === 1) {
    log(s, "เงิน", "คุณจ่ายบิลไม่ไหว เจ้าหนี้เริ่มโทรมาทุกวัน", "bad");
    s.sched.push({ id: "debtCollector", atM: s.ageM });
  }
}

function familyGift(s) {
  if (s.c.famGift || ageY(s) < 18) return;
  s.c.famGift = 1;
  const f = FAMILIES.find((x) => x.id === s.family);
  addLedger(s, "เงินตั้งตัวจากครอบครัว", f.gold);
}

monthly.push((s) => {
  familyGift(s);
  living(s);
  debtMonth(s);
});
