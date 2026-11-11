// Hunter progression: XP and levels, class skills, training near the hidden ceiling, rank re-evaluation, burnout.
import { ch } from "./rng.js";
import { stream, log } from "./state.js";
import { openEvent, EVENT_INDEX, hooks } from "./events.js";
import { monthly, lastly } from "./registry.js";
import { LV_CAP, canRankUp, rankUp, ceilingHint } from "./awaken.js";
import { gateOffers, gateOp, towerOp } from "./hunt.js";
import { estimateRisk } from "./ops.js";
import { COUNTRIES } from "../data/world.js";
import { CLASSES } from "../data/classes.js";
import { SKILLS } from "../data/skills.js";

// Hunting is possible for awakened people who have not retired from it and are not on a break.
export const canHunt = (s) => !!s.hunter && !s.flags.stoppedHunting && s.ageM >= (s.c.huntBreakUntil ?? 0);

const CLIMB_SLOW = 0.3;

export const xpNeed = (lv) => Math.round(40 * Math.pow(lv, 1.5));

function learnUpTo(s) {
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
  h.xp += n * Math.pow(CLIMB_SLOW, h.rank - (h.rank0 ?? h.rank)); // every rank climbed makes the next one slower
  while (h.lv < cap && h.xp >= xpNeed(h.lv)) {
    h.xp -= xpNeed(h.lv);
    h.lv++;
  }
  if (h.lv >= cap) h.xp = 0;
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
    gainXp(s, 6 * trainFactor(s));
  }
  if (canRankUp(s) && !s.c.rankEvalOpen) {
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
