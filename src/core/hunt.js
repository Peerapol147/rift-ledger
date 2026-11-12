// Gates and towers turned into operations (OpDef) for core/ops.js. Spec §3.4–3.5.
import { pk, ri, ch } from "./rng.js";
import { stream, ageY } from "./state.js";
import { openEvent, EVENT_INDEX } from "./events.js";
import { monthly } from "./registry.js";
import { cityOf } from "../data/world.js";
import { GATES } from "../data/gates.js";
import { TOWERS, TOWER_DECISIONS } from "../data/towers.js";
import { KIND_POWER, MONSTERS } from "../data/monsters.js";

export const GATE_LV = [6, 14, 24, 34, 46, 60, 78, 100];

export function foe(name, lv, el, boss = false) {
  const p = KIND_POWER[boss ? "boss" : MONSTERS[name]?.kind ?? "beast"];
  const r = (x) => Math.round(x * p);
  return { n: name, lv, el, boss, hp: r(20 + lv * 7), atk: r(3 + lv * 1.1), def: r(lv * 0.4) };
}

export function genFloor(tower, floor) {
  const b = tower.bands.find((x) => floor >= x.from && floor <= x.to);
  const src = b ?? tower.chapters.find((x) => floor >= x.from && floor <= x.to);
  const lv = Math.round(4 + floor * 1.5);
  return { floor, lv, t: src.t, mon: src.mon, bossName: src.boss, boss: floor % 5 === 0, filler: !b,
    decisions: b?.decisions };
}

export function gateOffers(s) {
  const R = stream(s, "gate");
  const out = [];
  const lv = s.hunter?.lv ?? 1;
  // Gates the hunter can survive: their rank, but no higher than their level supports yet.
  const byLevel = GATE_LV.findLastIndex((g, r) => r < 7 && g <= lv * 1.3 + 6);
  const rank = Math.min(s.hunter?.rank ?? 0, Math.max(0, byLevel));
  // a rookie's first three gates never hold a boss (playtest: too many hunters died in their first week)
  for (let i = 0; i < 3; i++) {
    const r = Math.max(0, Math.min(6, rank + ri(R, -1, 1)));
    const theme = pk(R, GATES.filter((g) => r >= g.ranks[0] && r <= g.ranks[1])) ?? GATES[0];
    const boss = ch(R, 0.12) && (s.c.gateRuns ?? 0) >= 3;
    out.push({ id: theme.id, rank: r, lv: GATE_LV[r] + ri(R, -2, 2), el: theme.el, boss });
  }
  return out;
}

// rank F and E gates are small jobs (balance: F–E hunters out-earned an ordinary job)
export const gatePay = (rank) => Math.round(108 * Math.pow(2.6, rank) * (rank <= 1 ? 0.75 : 1));

export function gateOp(s, g) {
  const theme = GATES.find((x) => x.id === g.id);
  const R = stream(s, "gate");
  const foes = [0, 1].map(() => foe(pk(R, theme.mon), g.lv, g.el));
  const isBoss = !!g.boss;
  if (isBoss) foes.push(foe(theme.boss, g.lv + 3, g.el, true));
  return {
    id: "gate:" + g.id, kind: "gate", t: `${theme.n} (เกตแรงก์ ${"FEDCBAS"[g.rank]})`, rank: g.rank,
    foes, decisions: theme.decisions, boss: isBoss, rewards: { gold: gatePay(g.rank), items: [] },
  };
}

// A floor pays like a gate of the rank its monsters match, plus a fifth for the climb.
// (a smooth curve: the floor's level placed between gate ranks, so no flat steps or drops)
export function towerPay(lv) {
  const i = Math.max(0, Math.min(GATE_LV.length - 2, GATE_LV.findLastIndex((g) => g <= lv)));
  const rf = i + Math.max(0, Math.min(1, (lv - GATE_LV[i]) / (GATE_LV[i + 1] - GATE_LV[i])));
  return Math.round(108 * Math.pow(2.6, rf) * 1.2);
}

export function towerOp(s, towerId, floor) {
  const T = TOWERS[towerId];
  const f = genFloor(T, floor);
  const R = stream(s, "tower");
  const foes = [foe(pk(R, f.mon), f.lv, T.el), foe(pk(R, f.mon), f.lv, T.el)];
  if (f.boss) foes.push(foe(f.bossName, f.lv + 4, T.el, true));
  return {
    id: `tower:${towerId}:${floor}`, kind: "tower", t: `${T.n} ชั้น ${floor} · ${f.t}`, tower: towerId, floor,
    foes, decisions: f.decisions ?? TOWER_DECISIONS, boss: f.boss, rewards: { gold: towerPay(f.lv), items: [] },
  };
}

// Monthly: a nearby gate may break. Civilians face the street event, hunters get the call.
export function breakCheck(s) {
  if (ageY(s) < 18) return;
  const R = stream(s, "break");
  if (!ch(R, cityOf(s.city).gateRate * 0.08)) return;
  const ev = EVENT_INDEX.get(s.hunter ? "hunterBreakCall" : "adultBreakNear");
  if (ev) openEvent(s, ev);
}

monthly.push(breakCheck);
