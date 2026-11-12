// Careers: who can be hired, monthly pay and work XP, promotion. Spec §6.1.
import { stream, ageY, log } from "./state.js";
import { ch } from "./rng.js";
import { val, hooks, resolvers, openEvent } from "./events.js";
import { addLedger } from "./money.js";
import { monthly } from "./registry.js";
import { CAREERS } from "../data/careers.js";

const meets = (s, need) => Object.entries(need ?? {}).every(([k, min]) => val(s, k) >= min);

export function canHire(s, id) {
  const c = CAREERS[id];
  if (c.hunterOnly && !s.hunter) return false;
  if (c.civOnly && s.hunter) return false;
  if (c.needAny && !c.needAny.some((n) => meets(s, n))) return false;
  return meets(s, c.need0 ?? {});
}

// A full-time student is not on the job market until the course ends (spec §4.1: study on, or work).
export const studying = (s) => (s.c.studyEndM ?? 0) > s.ageM;
export const jobOffers = (s) => (ageY(s) < 18 || studying(s) ? []
  : Object.keys(CAREERS).filter((id) => canHire(s, id)));

export function takeJob(s, id) {
  s.job = { id, tier: 0, xp: 0 };
  log(s, "งาน", `คุณเริ่มงานเป็น${CAREERS[id].tiers[0]} (${CAREERS[id].n})`, "imp");
}

export function quitJob(s) {
  if (!s.job) return;
  s.lastTitle = `${CAREERS[s.job.id].tiers[s.job.tier]} (${CAREERS[s.job.id].n})`;
  log(s, "งาน", `คุณลาออกจากงาน${CAREERS[s.job.id].n}`, "");
  s.job = null;
}

export const jobTitle = (s) => (s.job ? CAREERS[s.job.id].tiers[s.job.tier] : null);

// Work needed for the next step up. A month of work is worth 1 to 1.6, so even the gifted take about two years
// to the first promotion, nine to run a department and fifteen to the top (it used to be two years to a department).
const PROMOTE_XP = [30, 54, 84, 120];

export function canPromote(s) {
  const j = s.job;
  if (!j || j.tier >= 4) return false;
  return j.xp >= PROMOTE_XP[j.tier] && meets(s, CAREERS[j.id].need[j.tier + 1]);
}

export function promote(s) {
  if (!canPromote(s)) return false;
  const j = s.job;
  j.xp = 0;
  j.tier++;
  log(s, "งาน", `คุณได้เลื่อนตำแหน่งเป็น${CAREERS[j.id].tiers[j.tier]}`, "leg");
  return true;
}

export function workMonth(s) {
  const j = s.job;
  if (!j) return;
  const c = CAREERS[j.id];
  const main = Math.max(...Object.keys(c.need[1]).map((k) => s.st[k] ?? 0));
  j.xp += s.focus === "work" ? 1 + Math.min(60, main) / 100 : 0.3;
  // a hunter who spends the month in gates only works part-time
  const partTime = s.hunter && s.focus === "hunt";
  const pay = partTime ? Math.round(c.pay[j.tier] / 2) : c.pay[j.tier];
  addLedger(s, partTime ? "เงินเดือน (พาร์ทไทม์)" : "เงินเดือน", pay);
  if (c.risk && ch(stream(s, "work"), c.risk)) {
    s.hp -= 25;
    log(s, "งาน", "อุบัติเหตุระหว่างทำงาน คุณต้องพักรักษาตัว", "bad");
    hooks.injure(s, "workHurt", 3);
    if (s.hp <= 0) hooks.die(s, "อุบัติเหตุจากงาน");
  }
  promote(s);
}

export function openJobChoice(s) {
  if (studying(s)) return; // ms22 finds a student still in class: the job hunt waits for graduation
  const offers = jobOffers(s); // every career that would take you (the first five used to hide the other seven)
  openEvent(s, {
    id: "jobChoice",
    tag: "งาน",
    important: true,
    t: "มีที่ตอบรับใบสมัครของคุณ จะเริ่มงานที่ไหน?",
    o: [
      ...offers.map((id) => ({ l: CAREERS[id].n, d: CAREERS[id].d, y: { act: "job:" + id } })),
      { l: "ยังไม่ตัดสินใจ", y: { m: "คุณขอเวลาคิดอีกหน่อย" } },
    ],
  });
}

for (const id of Object.keys(CAREERS)) hooks.act["job:" + id] = (s) => takeJob(s, id);
hooks.act.jobHunt = openJobChoice;
for (const y of [2, 4, 6]) hooks.act["study" + y] = (s) => { s.c.studyEndM = s.ageM + y * 12; };
hooks.act.retire = (s) => { quitJob(s); s.flags.retired = true; };
hooks.act.openJobChoice = openJobChoice;
resolvers.jobName = (id) => CAREERS[id]?.n ?? id;

monthly.push((s) => {
  workMonth(s);
  if (s.job && s.mind < 20 && ch(stream(s, "work"), 0.03)) quitJob(s);
  const free = !s.hunter || s.flags.stoppedHunting;
  // the day the course ends, the applications go out
  if (s.c.studyEndM === s.ageM && !s.job && free) return openJobChoice(s);
  if (!s.job && free && !s.flags.retired && !studying(s) && ageY(s) >= 23 && s.ageM % 12 === 0) openJobChoice(s);
});
