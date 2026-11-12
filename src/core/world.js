// The world around the player: notable NPCs per seed, the fixed calendar, tower records, moving. Spec §3 and §4.1.
import { pk, ri, wp, ch } from "./rng.js";
import { stream, log, onNewLife, yearsAfterRift, monthOfYear, ageY } from "./state.js";
import { openEvent, EVENT_INDEX } from "./events.js";
import { addLedger } from "./money.js";
import { SHIP_FEE } from "./storage.js";
import { monthly, hooks } from "./registry.js";
import { COUNTRIES, cityOf, WORLD } from "../data/world.js";
import { NAMES, SURNAMES, FAMILIES } from "../data/families.js";
import { CLASSES } from "../data/classes.js";
import { CALENDAR } from "../data/calendar.js";
import { TOWERS } from "../data/towers.js";

const ROSTER_SIZE = 12;
const NPC_RANK_W = [0, 0, 1, 3, 4, 4, 2];

// A notable hunter is known by a full name (Korean family names come first), so no two of them, and never the
// player, answer to the same one.
export function npcNameFor(s, R, country, sex, taken = s.world.roster.map((n) => n.n)) {
  const full = () => {
    const given = pk(R, NAMES[country][sex]), family = pk(R, SURNAMES[country]);
    return country === "kr" ? `${family} ${given}` : `${given} ${family}`;
  };
  let name = full();
  for (let i = 0; i < 40 && taken.includes(name); i++) name = full();
  return name;
}

function npc(s, R, id, country, rank, taken, extra = {}) {
  const sex = ri(R, 0, 1) ? "f" : "m";
  const cls = extra.cls ?? pk(R, Object.keys(CLASSES).filter((c) => CLASSES[c].rarity <= 2));
  const n = npcNameFor(s, R, country, sex, taken);
  taken.push(n);
  return { id, n, country, rank, cls, fame: 20 + rank * 12, alive: true, ...extra };
}

export function initWorld(s) {
  const R = stream(s, "world");
  const legendary = Object.keys(CLASSES).filter((c) => CLASSES[c].rarity === 3);
  const taken = [];
  const roster = [
    npc(s, R, "silentHolder", "th", 6, taken, { holds: "silent" }),
    npc(s, R, "drownedHolder", "kr", 6, taken, { holds: "drowned" }),
    npc(s, R, "unmeasured", ch(R, 0.5) ? "th" : "kr", 7, taken, { cls: "sovereign", title: "ผู้ที่วัดไม่ได้" }),
  ];
  if (ch(R, 0.5)) roster.push(npc(s, R, "legend1", pk(R, ["th", "kr"]), 6, taken, { cls: pk(R, legendary) }));
  while (roster.length < ROSTER_SIZE) {
    const rank = wp(R, NPC_RANK_W.map((w, i) => ({ i, w }))).i;
    roster.push(npc(s, R, "npc" + roster.length, pk(R, ["th", "kr"]), rank, taken));
  }
  s.world.roster = roster;
}

const npcName = (s, id) => s.world.roster.find((n) => n.id === id)?.n ?? "ฮันเตอร์นิรนาม";
const news = (s, text) => log(s, "ข่าวโลก", text, "");

export function recordFloor(s, tower, floor, byPlayer) {
  if (floor <= s.world.records[tower]) return false;
  s.world.records[tower] = floor;
  const who = byPlayer ? s.name : "ฮันเตอร์คนหนึ่ง";
  news(s, `${who} ทำลายสถิติ${TOWERS[tower].th} ขึ้นถึงชั้น ${floor}`);
  if (byPlayer) s.c.records = (s.c.records ?? 0) + 1;
  return true;
}

function viewFor(s, entry) {
  const v = entry.views;
  if (s.job && v[s.job.id]) return v[s.job.id];
  if (s.hunter && !s.flags.stoppedHunting && v.hunter) return v.hunter;
  return v.default;
}

function runEntry(s, e) {
  if (e.kind === "record") {
    const text = (t) => t.replace("{npc}", npcName(s, e.npc));
    if (s.world.records[e.tower] >= e.floor) return news(s, text(e.failNews));
    s.world.records[e.tower] = e.floor;
    return news(s, text(e.news));
  }
  if (e.kind === "news") return news(s, e.news);
  // entries were written for a life born in year 21; a young heir born later only hears about them
  if (s.heir && ageY(s) < 12 && !e.views?.kid) return news(s, e.news ?? e.views?.default?.t ?? "");
  if (e.country && e.country !== s.country) return news(s, e.news);
  // same country, other city: the nearby view (watching it on the news, family calling) or just the news line
  if (e.city && e.city !== s.city) {
    if (!e.views.nearby) return news(s, e.news);
    return openEvent(s, { ...e.views.nearby, id: e.id });
  }
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
  hooks.leaveHome?.(s);
  addLedger(s, "ค่าย้ายบ้าน", -to.cost * 3);
  if (country !== s.country) {
    s.flags.relicense = true;
    hooks.moveCountry?.(s);
    const n = s.store?.home?.length ?? 0;
    if (n) addLedger(s, "ค่าขนของย้ายประเทศ", -SHIP_FEE * n);
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

// The first card of a life (the UI opens it): where and when you are, what the world is, who your family is.
// Without it a new player meets "the gate siren" in the cradle with no idea what a gate is.
export function openBirth(s) {
  const c = COUNTRIES[s.country], fam = FAMILIES.find((f) => f.id === s.family);
  const year = WORLD.BIRTH_YEAR - WORLD.RIFT_YEAR;
  s.ev = {
    id: "born", tag: "ชะตา", milestone: true, noAuto: true,
    t: `ปี ${WORLD.BIRTH_YEAR} ผ่านมา ${year} ปีแล้วตั้งแต่ "วันฟ้าแตก" วันที่หอคอยห้าแห่งโผล่ขึ้นทั่วโลก `
      + `และ "เกต" เริ่มเปิดกลางเมือง มอนสเตอร์ออกมาจากเกต คนส่วนน้อยที่ "ตื่นพลัง" เรียกว่าฮันเตอร์ `
      + `เป็นคนเข้าไปปิดมัน ที่เหลือคือคนธรรมดาที่ต้องใช้ชีวิตต่อไปข้างๆ มัน\n\n`
      + `คุณเกิดที่${cityOf(s.city).n} ประเทศ${c.n} · ${fam.n}: ${fam.d}\n\n`
      + (s.named ? `พ่อแม่เรียกคุณว่า ${s.name}` : `พ่อแม่ตั้งชื่อคุณว่า ${s.name}`)
      + ` ยังไม่มีใครรู้ว่าตอนอายุ 18 คุณจะตื่นพลังหรือไม่`,
    opts: [{ l: "ลืมตาดูโลก", y: {} }],
  };
}
