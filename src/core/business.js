// Civilian businesses: monthly profit from story-earned ownership, staff who raise it, embezzlement when loyalty fails.
import { pk, ri, ch } from "./rng.js";
import { stream, log } from "./state.js";
import { openEvent } from "./events.js";
import { addLedger } from "./money.js";
import { monthly, hooks } from "./registry.js";
import { NAMES } from "../data/families.js";
import { BUSINESSES, STAFF_MAX, STAFF_WAGE, STAFF_BONUS } from "../data/business.js";

export const businesses = (s) => Object.keys(BUSINESSES).filter((f) => s.flags[f]);

export function staffOffers(s) {
  const y = Math.floor(s.ageM / 12);
  if (s.staffOffers?.y === y) return s.staffOffers.list;
  const R = stream(s, "staff"), list = [];
  for (let i = 0, n = ri(R, 1, 3); i < n; i++) {
    s.c.mid = (s.c.mid ?? 0) + 1;
    list.push({ id: "w" + s.c.mid, n: pk(R, NAMES[s.country][ri(R, 0, 1) ? "f" : "m"]), loyalty: 55, skill: ri(R, 1,
      3) });
  }
  s.staffOffers = { y, list };
  return list;
}

export function hireStaff(s, w) {
  s.staff ??= [];
  if (!businesses(s).length || s.staff.length >= STAFF_MAX) return false;
  s.staff.push(w);
  s.staffOffers.list = s.staffOffers.list.filter((x) => x !== w);
  log(s, "งาน", `${w.n} มาทำงานในกิจการของคุณ`, "imp");
  return true;
}

export const fireStaff = (s, id) => { s.staff = (s.staff ?? []).filter((w) => w.id !== id); };

function businessMonth(s) {
  const owned = businesses(s);
  if (!owned.length) return;
  const staff = s.staff ?? [];
  const boost = 1 + staff.reduce((a, w) => a + STAFF_BONUS * (w.skill / 2), 0);
  for (const f of owned) addLedger(s, `กำไรกิจการ: ${BUSINESSES[f].n}`, Math.round(BUSINESSES[f].base * boost));
  if (staff.length) addLedger(s, "ค่าจ้างลูกน้อง", -STAFF_WAGE * staff.length);
  for (const w of staff) w.loyalty = Math.min(100, w.loyalty + 0.5);
  const thief = staff.find((w) => w.loyalty < 20);
  if (thief && !s.ev && ch(stream(s, "staff"), 0.3)) {
    s.evMember = thief.id;
    openEvent(s, {
      id: "staffEmbezzle", tag: "งาน", important: true, t: `บัญชีของกิจการไม่ตรง ตัวเลขหายไปตรงช่วงที่ ${thief.n} ดูแล`,
      o: [
        { l: "แจ้งความ", s: "int", diff: 16, y: { m: "หลักฐานชัด เงินบางส่วนกลับมา", act: "staffFire" },
          n: { m: "หลักฐานไม่พอ", act: "staffSteal" } },
        { l: "ให้ออกเงียบๆ", y: { m: "คุณยอมเสียเงินแลกกับความสงบ", act: "staffSteal" } },
      ],
    });
  }
}

hooks.act.staffFire = (s) => fireStaff(s, s.evMember);
hooks.act.staffSteal = (s) => { addLedger(s, "ลูกน้องยักยอก", -Math.round(Math.max(0, s.gold) * 0.15)); fireStaff(s,
  s.evMember); };
// Opening most businesses means leaving the old job.
for (const f of Object.keys(BUSINESSES)) hooks.act["open:" + f] = (s) => { s.flags[f] = true; s.job = null; };

monthly.push(businessMonth);
