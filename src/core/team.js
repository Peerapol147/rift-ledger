// The player's team: hired NPC hunters with rank, class, role, loyalty and wounds. Spec §8.
import { addEnemy } from "./legacy.js";
import { pk, ri, ch } from "./rng.js";
import { stream, log } from "./state.js";
import { openEvent, EVENT_INDEX } from "./events.js";
import { addLedger } from "./money.js";
import { monthly, books, gearHooks, afterOpHooks, hooks } from "./registry.js";
import { CLASSES } from "../data/classes.js";
import { NAMES } from "../data/families.js";
import { HIRE_FEE, WAGE_SHARE, MOODS, TEAM_MAX } from "../data/team.js";
import { TEAM_STORIES } from "../data/team-stories.js";
import { FOUND } from "../data/guilds.js";

const COMMON = Object.keys(CLASSES).filter((c) => CLASSES[c].rarity <= 2);

function member(s, R, rank) {
  s.c.mid = (s.c.mid ?? 0) + 1;
  const cls = pk(R, COMMON), sex = ri(R, 0, 1) ? "f" : "m";
  return {
    id: "m" + s.c.mid, n: pk(R, NAMES[s.country][sex]), rank, cls, role: CLASSES[cls].role,
    lv: ri(R, 3, 8) + rank * 8, loyalty: 55, alive: true, hurtUntilM: 0, story: 0, tpl: ri(R, 0, 7),
  };
}

export const feeOf = (m) => HIRE_FEE[m.rank];
// founding a guild makes room for a bigger team
export const teamMax = (s) => (s.guild?.role === "master" ? FOUND.teamMax : TEAM_MAX);
export const moodWord = (v) => (MOODS.find(([min]) => (Number(v) || 0) >= min) ?? MOODS.at(-1))[1];
const present = (s) => s.team.filter((m) => m.alive && m.hurtUntilM <= s.ageM);

// 0–3 offers a year, ranks around the player's own.
export function recruitOffers(s) {
  const y = Math.floor(s.ageM / 12);
  if (s.recruits?.y === y) return s.recruits.list;
  const R = stream(s, "recruit"), base = s.hunter?.rank ?? 0, list = [];
  for (let i = 0, n = ri(R, 1, 3); i < n; i++) list.push(member(s, R, Math.max(0, Math.min(6, base + ri(R, -1, 1)))));
  s.recruits = { y, list };
  return list;
}

export function hire(s, m) {
  if (s.party || s.team.filter((x) => x.alive).length >= teamMax(s) || s.gold < feeOf(m)) return false;
  addLedger(s, "ค่าจ้างลูกทีมแรกเข้า", -feeOf(m));
  s.team.push(m);
  if (s.recruits) s.recruits.list = s.recruits.list.filter((x) => x !== m);
  log(s, "ทีม", `${m.n} (${CLASSES[m.cls].n}) เข้าร่วมทีมของคุณ`, "imp");
  return true;
}

export function dismiss(s, id) {
  const m = s.team.find((x) => x.id === id);
  if (!m) return;
  s.team = s.team.filter((x) => x !== m);
  log(s, "ทีม", `${m.n} ออกจากทีม`, "");
}

export const teamRoles = (s) => new Set(present(s).map((m) => m.role));

// Each present member adds a third of a hunter of their rank and level.
export function teamPower(s) {
  const p = { atk: 0, def: 0, hp: 0 };
  for (const m of present(s)) {
    const k = 0.5 * (1 + m.rank * 0.15);
    p.atk += (5 + 12 + m.lv * 2.2) * k;
    p.def += (2 + 6 + m.lv * 0.8) * k;
    p.hp += (80 + 30 + m.lv * 10) * 0.5;
  }
  return p;
}

// The member left behind: the least loyal one present. Dies on a boss op, otherwise hurt for half a year.
export function loseAlly(s, boss) {
  const m = present(s).sort((a, b) => a.loyalty - b.loyalty)[0];
  if (!m) return null;
  if (boss) {
    m.alive = false;
    log(s, "ทีม", `${m.n} ไม่ได้กลับออกมาจากเกต`, "bad");
    for (const x of present(s)) x.loyalty = clampL(x.loyalty - 8);
  } else {
    m.hurtUntilM = s.ageM + 6;
    m.loyalty = clampL(m.loyalty - 10);
    log(s, "ทีม", `${m.n} บาดเจ็บหนักเพราะถูกทิ้งไว้ข้างหลัง`, "bad");
  }
  return m;
}

const clampL = (v) => Math.max(0, Math.min(100, Number(v) || 0));

function teamWages(s) {
  for (const m of s.team.filter((x) => x.alive)) {
    addLedger(s, "ค่าจ้างลูกทีม", -Math.round(feeOf(m) * WAGE_SHARE));
    if (s.gold < 0) m.loyalty -= 5;
    m.loyalty = clampL(m.loyalty + (m.loyalty < 50 ? 0.5 : 0));
  }
  for (const m of s.team) if (m.sworn) m.loyalty = Math.max(m.loyalty, 60);
}

function teamMonth(s) {
  const low = s.team.find((m) => m.alive && m.loyalty < 20);
  if (low && !s.ev) {
    const betray = ch(stream(s, "loyal"), 0.4);
    const ev = EVENT_INDEX.get(betray ? "teamLowBetray" : "teamLowLeave");
    openEvent(s, { ...ev, t: ev.t.replaceAll("{m}", () => low.n), member: low.id });
  }
}

hooks.act.teamGo = (s) => dismiss(s, s.evMember);
hooks.act.teamStay = (s) => { const m = s.team.find((x) => x.id === s.evMember); if (m) m.loyalty = 45; };
hooks.act.teamBetray = (s) => {
  const m = s.team.find((x) => x.id === s.evMember);
  if (!m) return;
  addLedger(s, "ลูกทีมขโมยของ", -Math.round(Math.max(0, s.gold) * 0.3));
  const it = s.items.find((i) => !i.lock && !Object.values(s.equip).includes(i.uid));
  if (it) s.items = s.items.filter((x) => x !== it);
  addEnemy(s, m.n, "ลูกทีมที่ขโมยของแล้วหนีไป");
  dismiss(s, m.id);
};
hooks.loseAlly = loseAlly;

// Teammate stories: one chapter at a time, 10–18 months apart, each about one member's own life.
const evMember = (s) => s.team.find((x) => x.id === s.evMember);
hooks.ally = (s, n) => { const m = evMember(s); if (m) m.loyalty = Math.max(0, Math.min(100, m.loyalty + n)); };
// A teammate who will never betray: joins at full loyalty (hunters), or a lifelong friend (civilians).
hooks.act.loyalAlly = (s) => {
  if (!s.hunter || s.party || s.team.filter((x) => x.alive).length >= teamMax(s)) return;
  const m = member(s, stream(s, "recruit"), Math.max(0, s.hunter.rank - 1));
  m.loyalty = 100;
  m.sworn = true;
  s.team.push(m);
  log(s, "ทีม", `${m.n} ขอเข้าทีมของคุณ และสาบานว่าจะไม่ทิ้งคุณ`, "leg");
};
hooks.act.allyLeave = (s) => { const m = evMember(s); if (m) dismiss(s, m.id); };

// Copy a chapter with {m} replaced by the member's name in every string (names are never parsed as code or JSON).
const named = (v, n) => (typeof v === "string" ? v.replaceAll("{m}", () => n)
  : Array.isArray(v) ? v.map((x) => named(x, n)) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, named(x, n)])) : v);

function teamStoryMonth(s) {
  if (s.ev) return;
  for (const m of s.team) {
    if (!m.alive || m.story >= 3) continue;
    m.next ??= s.ageM + ri(stream(s, "tstory"), 10, 18);
    if (s.ageM < m.next) continue;
    const chapter = named(TEAM_STORIES[m.tpl % TEAM_STORIES.length][m.story], m.n);
    m.story++;
    m.next = s.ageM + ri(stream(s, "tstory"), 10, 18);
    openEvent(s, { ...chapter, id: `tm:${m.id}:${m.story}`, important: true, member: m.id });
    return;
  }
}

gearHooks.push(teamPower);
afterOpHooks.push((s, o, r) => {
  if (o.def.kind === "job") return;
  const d = r === "won" ? 3 : r === "fled" ? -1 : -4;
  for (const m of present(s)) m.loyalty = Math.max(0, Math.min(100, m.loyalty + d));
});
books.push(teamWages);
monthly.push(teamMonth, teamStoryMonth);
