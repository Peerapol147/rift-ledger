// The world around the player: notable NPCs per seed, the fixed calendar, tower records, moving. Spec §3 and §4.1.
import { pk, ri, wp, ch } from "./rng.js";
import { stream, log, onNewLife, yearsAfterRift, monthOfYear } from "./state.js";
import { openEvent, EVENT_INDEX } from "./events.js";
import { addLedger } from "./money.js";
import { monthly } from "./clock.js";
import { COUNTRIES, cityOf } from "../data/world.js";
import { NAMES } from "../data/families.js";
import { CLASSES } from "../data/classes.js";
import { CALENDAR } from "../data/calendar.js";
import { TOWERS } from "../data/towers.js";

const ROSTER_SIZE = 12;
const NPC_RANK_W = [0, 0, 1, 3, 4, 4, 2];

function npc(R, id, country, rank, extra = {}) {
  const sex = ri(R, 0, 1) ? "f" : "m";
  const cls = extra.cls ?? pk(R, Object.keys(CLASSES).filter((c) => CLASSES[c].rarity <= 2));
  return { id, n: pk(R, NAMES[country][sex]), country, rank, cls, fame: 20 + rank * 12, alive: true, ...extra };
}

export function initWorld(s) {
  const R = stream(s, "world");
  const legendary = Object.keys(CLASSES).filter((c) => CLASSES[c].rarity === 3);
  const roster = [
    npc(R, "silentHolder", "th", 6, { holds: "silent" }),
    npc(R, "drownedHolder", "kr", 6, { holds: "drowned" }),
    npc(R, "unmeasured", ch(R, 0.5) ? "th" : "kr", 7, { cls: "sovereign", title: "ผู้ที่วัดไม่ได้" }),
  ];
  if (ch(R, 0.5)) roster.push(npc(R, "legend1", pk(R, ["th", "kr"]), 6, { cls: pk(R, legendary) }));
  while (roster.length < ROSTER_SIZE) {
    const rank = wp(R, NPC_RANK_W.map((w, i) => ({ i, w }))).i;
    roster.push(npc(R, "npc" + roster.length, pk(R, ["th", "kr"]), rank));
  }
  s.world.roster = roster;
}

const npcName = (s, id) => s.world.roster.find((n) => n.id === id)?.n ?? "ฮันเตอร์นิรนาม";
const news = (s, text) => log(s, "ข่าวโลก", text, "");

export function recordFloor(s, tower, floor, byPlayer) {
  if (floor <= s.world.records[tower]) return false;
  s.world.records[tower] = floor;
  const who = byPlayer ? s.name : "ฮันเตอร์คนหนึ่ง";
  news(s, `${who} ทำลายสถิติ ${TOWERS[tower].n} ขึ้นถึงชั้น ${floor}`);
  if (byPlayer) s.c.records = (s.c.records ?? 0) + 1;
  return true;
}

function viewFor(s, entry) {
  const v = entry.views;
  return (s.job && v[s.job.id]) ?? (s.hunter && v.hunter) ?? v.default;
}

function runEntry(s, e) {
  if (e.kind === "record") {
    const text = (t) => t.replace("{npc}", npcName(s, e.npc));
    if (s.world.records[e.tower] >= e.floor) return news(s, text(e.failNews));
    s.world.records[e.tower] = e.floor;
    return news(s, text(e.news));
  }
  if (e.country !== s.country) return news(s, e.news);
  const v = viewFor(s, e);
  openEvent(s, { ...v, id: e.id });
}

export function calendarMonth(s) {
  const y = yearsAfterRift(s), m = monthOfYear(s);
  for (const e of CALENDAR) {
    if (s.world.done[e.id] || y < e.year || (y === e.year && m < e.month)) continue;
    s.world.done[e.id] = 1;
    runEntry(s, e);
    if (s.ev) return;
  }
}

export function moveCity(s, cityId) {
  const to = cityOf(cityId);
  if (!to || to.id === s.city) return false;
  const country = Object.keys(COUNTRIES).find((k) => COUNTRIES[k].cities.includes(to));
  addLedger(s, "ค่าย้ายบ้าน", -to.cost * 3);
  if (country !== s.country) {
    s.flags.relicense = true;
    if (s.job) s.job.tier = Math.floor(s.job.tier / 2);
    s.country = country;
  }
  s.city = to.id;
  log(s, "ที่อยู่", `คุณย้ายไปอยู่${to.n}`, "imp");
  return true;
}

for (const e of CALENDAR) {
  for (const v of Object.values(e.views ?? {})) EVENT_INDEX.set(e.id, { ...v, id: e.id, k: "x" });
}

onNewLife.push(initWorld);
monthly.push(calendarMonth);
