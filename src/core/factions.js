// Faction standing: set at birth, moved by outcomes (fac: { id: n }) and by mapped counters/flags (FAC_FROM).
import { onNewLife, hooks, monthly, books, afterOpHooks } from "./registry.js";
import { ch } from "./rng.js";
import { stream, log } from "./state.js";
import { addLedger } from "./money.js";
import { openEvent } from "./events.js";
import { FACTIONS, FAC_WORDS, FAC_FROM, FAC_ARCS, FAC_HI } from "../data/factions.js";
import { ITEMS, RARITY_ITEMS } from "../data/items.js";
import { giveItem } from "./items.js";
import { changeMind } from "./body.js";
import { pk } from "./rng.js";
import { ageY } from "./state.js";

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

// Clean, registered work is how the association comes to trust a hunter: a little with every legal win.
afterOpHooks.push((s, o, r) => {
  if (r === "won" && !o.def.illegal && (o.def.kind === "gate" || o.def.kind === "tower")) moveFac(s, { assoc: 0.5 });
});
// Fighting a gate break in front of everyone shows your real rank; the association dislikes being lied to.
hooks.act.breakHelp = (s) => {
  if (!s.flags.hiddenRank) return;
  s.flags.hiddenRank = false;
  moveFac(s, { assoc: -5 });
  log(s, "ฮันเตอร์", "ทุกคนเห็นพลังจริงของคุณ แรงก์ที่ซ่อนไว้ไม่เป็นความลับอีกต่อไป", "bad");
};
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

// ---- Long-term arcs: once per life each, a faction that trusts you makes an offer; one that turns on you, trouble.
monthly.push((s) => {
  if (s.ev || ageY(s) < 18) return;
  for (const [k, arc] of Object.entries(FAC_ARCS)) {
    const v = s.fac?.[k] ?? 0;
    for (const [side, ok] of [["hi", v >= FAC_HI], ["bad", v <= arc.lo]]) {
      const e = arc[side], key = `fac${side}:${k}`;
      if (!ok || s.c[key] || (e.hunter && !s.hunter) || (s.hunter?.rank ?? -1) < (e.minRank ?? -1)) continue;
      s.c[key] = 1;
      openEvent(s, { id: key, tag: "ฝ่ายต่างๆ", important: true, t: e.t, o: e.o });
      return;
    }
  }
});

// Perks while the faction still likes you (the flag stays; the money stops if standing falls below 20).
books.push((s, step = 1) => {
  const f = s.fac ?? {};
  // a seat on a board is a side income, about a part-time job (a full-time salary is ~300 a month): at 800–1,000
  // it paid three times a career and made low-rank hunters out-earn every civilian
  if (s.flags.patronAssoc && (f.assoc ?? 0) >= 20) addLedger(s, "เบี้ยกรรมการสมาคม", 150 * step);
  if (s.flags.patronState && (f.state ?? 0) >= 20) addLedger(s, "เงินเดือนที่ปรึกษารัฐ", 200 * step);
  if (s.flags.patronChurch && (f.church ?? 0) >= 20) changeMind(s, 2 * step);
});

// Once a year the underground's back door has one good thing at a friend's price.
monthly.push((s) => {
  if (s.ev || !s.flags.patronUnder || (s.fac?.under ?? 0) < 20 || s.ageM % 12 !== 9) return;
  // a civilian is offered what a civilian can use: charms, books and the like, never weapons or armour
  const pool = RARITY_ITEMS(2).filter((k) => s.hunter || !["weapon", "armor"].includes(ITEMS[k].kind));
  if (!pool.length) return;
  const id = pk(stream(s, "under"), pool), d = ITEMS[id], price = Math.round(d.price * 0.6);
  s.underOffer = id;
  openEvent(s, { id: "underShop", tag: "ฝ่ายต่างๆ", t: `ข้อความจากเบอร์แปลก: ปีนี้มี ${d.n} ราคา ₿${price} สนใจไหม`,
    o: [{ l: "ซื้อ", need: { gold: price }, y: { m: "ของถูกส่งมาในกล่องไม่มีชื่อผู้ส่ง", gold: -price,
      goldLabel: "ของจากตลาดมืด", act: "underBuy", fac: { assoc: -2 } } },
    { l: "ไม่เอา", y: { m: "ข้อความนั้นลบตัวเองไปในหนึ่งนาที" } }] });
});
hooks.act.underBuy = (s) => { if (ITEMS[s.underOffer]) giveItem(s, s.underOffer, "ตลาดมืด"); };
hooks.act.facTaxFine = (s) => {
  addLedger(s, "ค่าปรับภาษีย้อนหลัง", -Math.round(Math.max(0, s.gold) * 0.1));
  moveFac(s, { state: 15 });
};
// Research grant: money, and for a hunter, a straight answer about how far they can still grow.
hooks.act.facResearchGrant = (s) => {
  addLedger(s, "ทุนวิจัย", 3000);
  const h = s.hunter;
  if (!h) return;
  const left = Math.max(0, h.ceil - h.rank);
  const text = left ? "ผลตรวจบอกว่ามานาของคุณยังมีที่ว่างให้เติบโต" : "ผลตรวจบอกว่ามานาของคุณใกล้เต็มภาชนะแล้ว";
  log(s, "นักวิจัย", text, "imp");
};
