// Pinned goals, alerts and summaries. Alerts speak in-world; summaries never name hidden things. Spec §11.4.
import { ageY, yearsAfterRift, monthOfYear } from "./state.js";
import { val, isKnown, needLabel } from "./events.js";
import { debtCap } from "./money.js";
import { rankName } from "./awaken.js";
import { jobTitle } from "./work.js";
import { STATS } from "../data/stats.js";
import { CALENDAR } from "../data/calendar.js";
import { CLASSES } from "../data/classes.js";

export function pinGoal(s, g) {
  if (s.goals.some((x) => x.key === g.key)) return;
  s.goals.push(g);
}

export function pinFromOption(s, opt) {
  // the same needs optionView checks, nerve's steady mind included
  const needs = opt.nerve ? { mind: 20, ...opt.need } : opt.need ?? {};
  const unmet = Object.entries(needs).find(([k, min]) => isKnown(k) && val(s, k) < min);
  if (!unmet) return false;
  const [key, target] = unmet;
  pinGoal(s, { kind: key in STATS ? "stat" : key === "gold" ? "gold" : "other", key, target });
  return true;
}

export const unpinGoal = (s, key) => { s.goals = s.goals.filter((g) => g.key !== key); };

const goalLabel = (key) => STATS[key] ?? (key === "gold" ? "เงิน" : key === "mind" ? "สุขภาพจิต" : needLabel(key, 1));

export function goalProgress(s) {
  return s.goals.map((g) => {
    const cur = Math.floor(val(s, g.key));
    return { key: g.key, label: goalLabel(g.key), cur, target: g.target, done: cur >= g.target };
  });
}

function monthsUntil(s, e) {
  return (e.year - yearsAfterRift(s)) * 12 + (e.month - monthOfYear(s));
}

export function alerts(s) {
  const out = [];
  if (s.hp < 30) out.push({ kind: "hp", text: "ร่างกายคุณใกล้ถึงขีดจำกัด" });
  if (s.mind < 25) out.push({ kind: "mind", text: "คุณนอนไม่หลับมาหลายคืนแล้ว" });
  if (s.debt > debtCap(s) * 0.8) out.push({ kind: "debt", text: "หนี้ใกล้เพดานที่ใครจะให้กู้เพิ่ม" });
  for (const e of CALENDAR) {
    const m = monthsUntil(s, e);
    if (s.flags["knowCal:" + e.id] && !s.world.done[e.id] && m >= 0 && m <= 6) {
      out.push({ kind: "calendar", text: `อีกราว ${m} เดือน: ${e.news.replace("{npc} ", "")}` });
    }
  }
  return out;
}

export function yearSummary(s, year) {
  const notable = (l) => l.tone === "imp" || l.tone === "leg" || l.tone === "bad";
  const lines = s.log.filter((l) => Math.floor(l.m / 12) === year && notable(l));
  return { year, lines: lines.map((l) => l.text) };
}

export function deathSummary(s) {
  const h = s.hunter;
  const role = h ? `ฮันเตอร์แรงก์ ${rankName(h.rank)} · ${CLASSES[h.cls].n}` : jobTitle(s) ?? s.lastTitle ?? "คนธรรมดา";
  return {
    name: s.name, ageY: ageY(s), cause: s.dead?.cause ?? "", role, gold: Math.round(s.gold), fame: s.fame,
    floor: s.c.floor ?? 0, unseen: s.c.unseen ?? 0,
  };
}
