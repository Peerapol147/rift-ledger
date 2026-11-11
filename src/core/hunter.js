// Hunter progression: XP and levels, class skills, training near the hidden ceiling, rank re-evaluation, burnout.
import { ch } from "./rng.js";
import { stream, log } from "./state.js";
import { openEvent, EVENT_INDEX, hooks } from "./events.js";
import { monthly } from "./clock.js";
import { LV_CAP, canRankUp, rankUp, ceilingHint } from "./awaken.js";
import { gateOffers } from "./hunt.js";
import { CLASSES } from "../data/classes.js";
import { SKILLS } from "../data/skills.js";

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
  h.xp += n;
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
  if (s.focus === "hunt") openGateChoice(s);
}

export function openGateChoice(s) {
  const offers = gateOffers(s);
  s.offers = offers;
  openEvent(s, {
    id: "gateChoice",
    tag: "เกต",
    t: "สมาคมส่งรายการเกตที่เปิดรับฮันเตอร์เดือนนี้",
    o: [
      ...offers.map((g, i) => ({ l: `เกตแรงก์ ${"FEDCBAS"[g.rank]} · Lv.${g.lv}`, y: { act: "gate" + i } })),
      { l: "พักเดือนนี้", y: { mind: 2 } },
    ],
  });
}

hooks.act.rankUp = (s) => { s.c.rankEvalOpen = 0; rankUp(s); };
hooks.act.stopHunting = (s) => { s.focus = "work"; s.flags.stoppedHunting = true; };
hooks.act.hideRank = (s) => { s.flags.hiddenRank = true; };

monthly.push(hunterMonth);
