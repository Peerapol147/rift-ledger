// Faction standing: set at birth, moved by outcomes (fac: { id: n }) and by mapped counters/flags (FAC_FROM).
import { onNewLife, hooks, monthly } from "./registry.js";
import { ch } from "./rng.js";
import { stream, log } from "./state.js";
import { addLedger } from "./money.js";
import { openEvent } from "./events.js";
import { FACTIONS, FAC_WORDS, FAC_FROM } from "../data/factions.js";

const clampF = (v) => Math.max(-100, Math.min(100, v));

onNewLife.push((s) => { s.fac = Object.fromEntries(Object.keys(FACTIONS).map((k) => [k, 0])); });

export function moveFac(s, delta) {
  s.fac ??= Object.fromEntries(Object.keys(FACTIONS).map((k) => [k, 0]));
  for (const [k, n] of Object.entries(delta ?? {})) if (k in s.fac) s.fac[k] = clampF(s.fac[k] + n);
}

export const facWord = (v) => (FAC_WORDS.find(([min]) => (Number(v) || 0) >= min) ?? FAC_WORDS.at(-1))[1];

// Association standing nudges gate pay: ±10% at ±30.
export const gatePayMul = (s) => 1 + Math.max(-0.1, Math.min(0.1, (s.fac?.assoc ?? 0) / 300));

// Called by applyOutcome before flags are set: explicit fac changes, then mapped counters raised or flags newly set.
hooks.facOutcome = (s, out) => {
  if (out.fac) moveFac(s, out.fac);
  for (const k of [...Object.keys(out.c ?? {}), ...Object.keys(out.flags ?? {})]) {
    if (FAC_FROM[k] && ((out.c?.[k] ?? 0) > 0 || (out.flags?.[k] && !s.flags[k]))) moveFac(s, FAC_FROM[k]);
  }
};

hooks.payMul = gatePayMul;
hooks.act.licPause = (s) => { s.c.huntBreakUntil = s.ageM + 3; };

// Illegal gates: the association notices, the underground approves, and sometimes you get caught.
hooks.illegalEnd = (s, def) => {
  moveFac(s, { assoc: -5, under: 3 });
  if (ch(stream(s, "illegal"), 0.15)) {
    addLedger(s, "ค่าปรับเกตเถื่อน", -2000 * ((def.rank ?? 1) + 1));
    moveFac(s, { assoc: -10 });
    log(s, "ฮันเตอร์", "สมาคมจับได้ว่าคุณเข้าเกตที่ไม่ได้ขึ้นทะเบียน", "bad");
  }
};

// A hunter the association distrusts gets their license reviewed, once.
monthly.push((s) => {
  if (!s.hunter || s.ev || s.c.licReview || (s.fac?.assoc ?? 0) > -40) return;
  s.c.licReview = 1;
  openEvent(s, {
    id: "licReview", tag: "ฮันเตอร์", important: true,
    t: "สมาคมฮันเตอร์เรียกคุณไปชี้แจง ชื่อคุณโผล่ในรายงานเรื่องเกตที่ไม่ได้ขึ้นทะเบียน",
    o: [
      { l: "ชี้แจงตามจริง", s: "cha", diff: 18, y: { m: "สมาคมให้โอกาสอีกครั้ง", fac: { assoc: 20 } },
        n: { m: "ใบอนุญาตถูกพักสามเดือน", fac: { assoc: 5 }, act: "licPause" } },
      { l: "จ่ายค่าปรับให้จบ", need: { gold: 5000 }, y: { m: "เรื่องเงียบไป", gold: -5000, goldLabel: "ค่าปรับสมาคม",
        fac: { assoc: 10 } } },
      { l: "ไม่ไปตามนัด", y: { m: "ชื่อคุณถูกขึ้นบัญชีจับตา", fac: { assoc: -15, under: 10 } } },
    ],
  });
});
