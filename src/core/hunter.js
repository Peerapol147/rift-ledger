// Hunter progression: XP and levels, class skills, training near the hidden ceiling, rank re-evaluation, burnout.
import { ch } from "./rng.js";
import { stream, log } from "./state.js";
import { openEvent, EVENT_INDEX, hooks } from "./events.js";
import { monthly, lastly } from "./registry.js";
import { LV_CAP, canRankUp, rankUp, ceilingHint } from "./awaken.js";
import { gateOffers, gateOp, towerOp, GATE_LV } from "./hunt.js";
import { estimateRisk } from "./ops.js";
import { COUNTRIES } from "../data/world.js";
import { CLASSES } from "../data/classes.js";
import { SKILLS } from "../data/skills.js";

// Hunting is possible for awakened people who have not retired from it and are not on a break.
export const canHunt = (s) => !!s.hunter && !s.flags.stoppedHunting && s.ageM >= (s.c.huntBreakUntil ?? 0);

const CLIMB_SLOW = 0.8;
// XP is worth more at higher ranks so each rank-up takes a similar, slowly rising number of gates
// (about 40 at F up to 115 at A). Without it F→E took 29 gates and A→S 192, so low ranks always reached their
// ceiling and high ranks never did.
const RANK_XP = [0.3, 0.7, 0.9, 1.0, 1.9, 2.2, 2.2, 2.2];

export const xpNeed = (lv) => Math.round(40 * Math.pow(lv, 1.5));

export function learnUpTo(s) {
  const h = s.hunter;
  for (const [lv, id] of CLASSES[h.cls].skills) {
    if (lv > h.lv || h.skills.includes(id)) continue;
    h.skills.push(id);
    log(s, "สกิล", `คุณได้สกิลใหม่: ${SKILLS[id].n}`, "imp");
  }
}

export function gainXp(s, n) {
  const h = s.hunter;
  if (!h) return;
  const cap = LV_CAP[h.rank];
  // every rank climbed makes the next one slower
  h.xp += n * RANK_XP[h.rank] * Math.pow(CLIMB_SLOW, h.rank - (h.rank0 ?? h.rank));
  while (h.lv < cap && h.xp >= xpNeed(h.lv)) {
    h.xp -= xpNeed(h.lv);
    h.lv++;
  }
  if (h.lv >= cap) {
    // a hunter stuck at their cap still grows a little: every 600 xp past it is a fraction of a main stat
    h.over = (h.over ?? 0) + h.xp;
    h.xp = 0;
    const main = CLASSES[h.cls].main;
    while (h.over >= 600) { h.over -= 600; h.past = (h.past ?? 0) + 1; s.st[main] += 0.5 / (1 + h.past * 0.15); }
  }
  learnUpTo(s);
}

// 1 far from the hidden ceiling, down to 0.2 right under it.
export function trainFactor(s) {
  const h = s.hunter;
  return Math.max(0.2, 1 - h.lv / LV_CAP[h.ceil]);
}

function hunterMonth(s) {
  const h = s.hunter;
  if (!h) return;
  if (s.focus === "train") {
    const main = CLASSES[h.cls].main;
    s.st[main] += 0.25 * trainFactor(s);
    // a month of hard training is worth about a third of a gate at your rank, so a careful hunter who trains
    // instead of taking every gate still climbs, only slower
    gainXp(s, GATE_LV[h.rank] * 10 * trainFactor(s));
  }
  if (canRankUp(s) && !s.c.rankEvalOpen && s.ageM >= (s.c.rankEvalAt ?? 0)) {
    s.c.rankEvalOpen = 1;
    return openEvent(s, EVENT_INDEX.get("rankEval"));
  }
  const hint = ceilingHint(s);
  if (hint && !s.c.ceilHinted) { s.c.ceilHinted = 1; log(s, "ฮันเตอร์", hint, ""); }
  if (s.mind < 20 && ch(stream(s, "burn"), 0.03)) return openEvent(s, EVENT_INDEX.get("burnout"));
}

// The routine monthly gate pick waits until no story, team or secret event wants the month.
function huntMonth(s) {
  if (s.focus !== "hunt" || !canHunt(s)) return;
  if (s.hp < 50) {
    if (!s.c.restNoted) log(s, "ร่างกาย", "ร่างกายยังไม่พร้อมลงเกต คุณพักฟื้นจนกว่าจะหายดี", "");
    s.c.restNoted = 1;
    return;
  }
  s.c.restNoted = 0;
  openGateChoice(s);
}

// Boss offers always carry some danger so autopilot leaves them to the player.
const dangerOf = (s, d) => (d.boss ? Math.max(0.05, estimateRisk(s, d)) : 0);

export function openGateChoice(s) {
  if (s.party) return hooks.partyGate?.(s);
  const defs = gateOffers(s).map((g) => gateOp(s, g));
  const tower = COUNTRIES[s.country].tower;
  const next = (s.c.floor ?? 0) + 1;
  if (s.hunter.rank >= 1 && next <= 50) defs.push(towerOp(s, tower, next));
  // with friends underground, an unregistered gate one rank up: double pay, more bosses, no association watching
  if (!s.flags.patronState && (s.fac?.under ?? 0) >= (hooks.guildPerk?.(s) === "shady" ? 10 : 20)) {
    const g = { ...gateOffers(s)[0] };
    g.rank = Math.min(6, g.rank + 1);
    g.lv = GATE_LV[g.rank];
    g.boss = ch(stream(s, "gate"), 0.25);
    const d = gateOp(s, g);
    defs.push({ ...d, illegal: true, t: "เกตเถื่อน · " + d.t, rewards: { ...d.rewards, gold: d.rewards.gold * 2 } });
  }
  // a guild member gets the guild's own contract: your rank, better pay, standing on a win
  if (s.guild && s.guild.role !== "master") {
    const rank = s.hunter.rank;
    const d = gateOp(s, { ...gateOffers(s)[0], rank, lv: GATE_LV[Math.min(6, rank)], boss: false });
    const gold = Math.round(d.rewards.gold * 1.3);
    defs.push({ ...d, guildJob: true, t: "งานกิลด์ · " + d.t, rewards: { ...d.rewards, gold } });
  }
  s.offers = defs;
  const info = (d) => {
    const lv = Math.max(...d.foes.map((f) => f.lv));
    return `ศัตรู Lv.${lv} · ค่าตอบแทน ₿${d.rewards.gold.toLocaleString("en-US")}`;
  };
  const label = (d) => (d.kind === "tower" ? d.t.split(" · ")[0] : d.t) + (d.boss ? " · มีบอส" : "");
  openEvent(s, {
    id: "gateChoice",
    tag: "เกต",
    t: "สมาคมส่งรายการเกตที่เปิดรับฮันเตอร์เดือนนี้",
    o: [
      ...defs.map((d, i) => ({ l: label(d), d: info(d), danger: dangerOf(s, d), y: { act: "gate" + i } })),
      { l: "พักเดือนนี้", y: { mind: 2 } },
    ],
  });
}

hooks.act.rankUp = (s) => { s.c.rankEvalOpen = 0; rankUp(s); };
hooks.act.stopHunting = (s) => { s.focus = "work"; s.flags.stoppedHunting = true; };
hooks.act.huntBreak = (s) => { s.focus = "rest"; s.c.huntBreakUntil = s.ageM + 12; };
hooks.act.hideRank = (s) => { s.flags.hiddenRank = true; };

monthly.push(hunterMonth);
lastly.push(huntMonth);
hooks.act.rankEvalLater = (s) => { s.c.rankEvalAt = s.ageM + 12; };
hooks.learn = learnUpTo;
