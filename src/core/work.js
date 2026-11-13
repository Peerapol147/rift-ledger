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

export const jobOffers = (s) => (ageY(s) < 18 ? [] : Object.keys(CAREERS).filter((id) => canHire(s, id)));

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

export function canPromote(s) {
  const j = s.job;
  if (!j || j.tier >= 4) return false;
  return j.xp >= 12 * (j.tier + 1) && meets(s, CAREERS[j.id].need[j.tier + 1]);
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
  j.xp += s.focus === "work" ? 1 + main / 40 : 0.3;
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
  const offers = jobOffers(s).slice(0, 5);
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
hooks.act.retire = (s) => { quitJob(s); s.flags.retired = true; };
hooks.act.openJobChoice = openJobChoice;
hooks.act.quitJob = quitJob;
resolvers.jobName = (id) => CAREERS[id]?.n ?? id;

monthly.push((s) => {
  workMonth(s);
  if (s.job && s.mind < 20 && ch(stream(s, "work"), 0.03)) quitJob(s);
  const free = !s.hunter || s.flags.stoppedHunting;
  if (!s.job && free && !s.flags.retired && ageY(s) >= 23 && s.ageM % 12 === 0) openJobChoice(s);
});
