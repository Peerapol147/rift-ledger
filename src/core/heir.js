// The next generation: when a life with children ends, play on as the heir, born the month the parent died, in the
// same world (records, roster, the calendar so far). The estate waits in trust until 18. Spec §6.9.
import { pk, wp } from "./rng.js";
import { stream, log, ageY, newLife, yearsAfterRift, monthOfYear } from "./state.js";
import { addLedger } from "./money.js";
import { openEvent } from "./events.js";
import { monthly, hooks } from "./registry.js";
import { legacyOf, addEnemy } from "./legacy.js";
import { storeOf } from "./storage.js";
import { schoolStart } from "./spend.js";
import { ITEMS } from "../data/items.js";
import { NAMES, FAMILIES } from "../data/families.js";
import { COUNTRIES } from "../data/world.js";
import { CALENDAR } from "../data/calendar.js";

export const HEIR_TAX = 0.2;
// 20% on the first ₿50,000, 60% on the rest: a family keeps a start, not a fortune that compounds every generation
export const estateAfterTax = (g) => Math.round(Math.min(g, 50000) * (1 - HEIR_TAX) + Math.max(0, g - 50000) * 0.4);
export const canHeir = (s) => !!s.dead && (s.c.kids ?? 0) > 0;
// a parent who died old leaves a grandchild
export const heirWord = (s) => (ageY(s) >= 55 ? "หลาน" : "ลูก");

export function newHeir(P, seed) {
  const s = newLife(seed);
  const R = stream(s, "heir");
  s.country = P.country;
  s.city = P.city;
  s.name = pk(R, NAMES[P.country][s.sex]);
  // the family's stat leaning follows the new family
  const old = FAMILIES.find((f) => f.id === s.family);
  const fam = P.unlockFamily ?? FAMILIES.find((f) => f.id === P.family && f.country === P.country)
    ?? wp(R, FAMILIES.filter((f) => f.country === P.country));
  for (const [k, v] of Object.entries(old?.st ?? {})) s.st[k] -= v;
  for (const [k, v] of Object.entries(fam.st)) s.st[k] += v;
  s.family = fam.id;
  s.born = { ...s.st }; // the birth roll against this family; schooling below counts as what came after
  if (P.unlockFamily) s.unlockFamily = { ...P.unlockFamily };
  s.mon0 = (P.mon0 ?? 0) + P.ageM;
  s.world = JSON.parse(JSON.stringify(P.world));
  // whatever the calendar held before this birth is old news, not something to live through again
  const y = yearsAfterRift(s), m = monthOfYear(s);
  for (const e of CALENDAR) if (e.year < y || (e.year === y && e.month <= m)) s.world.done[e.id] = 1;
  s.gen = (P.gen ?? 1) + 1;
  const L = legacyOf(P), rel = heirWord(P);
  s.heir = {
    of: P.name, rel, gold: estateAfterTax(Math.max(0, P.gold - (P.debt ?? 0))),
    guild: L.guild, enemies: L.enemies.slice(0, 3), paid: 0, guildDone: 0, grudgeDone: 0,
  };
  // what the parent bought for the family: the schooling, the home (no estate tax on it), the fund's grant
  schoolStart(P, s);
  if (P.home?.city === s.city) s.home = { city: s.city, at: 0, from: P.name };
  if (P.flags?.fund) s.c.fundGrant = 1;
  // the parent's things wait in the family home, best first, as many as it holds
  const all = [...P.items, ...P.store?.home ?? [], ...P.store?.vault ?? [], ...P.store?.guild ?? []]
    .filter((i) => i.id !== "phoenixToken" && ITEMS[i.id])
    .sort((a, b) => ITEMS[b.id].price * (1 + (b.plus ?? 0)) - ITEMS[a.id].price * (1 + (a.plus ?? 0)));
  const st = storeOf(s);
  for (const it of all.slice(0, 30)) {
    s.c.uid = (s.c.uid ?? 0) + 1;
    st.home.push({ uid: "i" + s.c.uid, id: it.id, from: `มรดกจาก${P.name}`, lock: false, m: 0, plus: it.plus ?? 0 });
  }
  s.log = [];
  log(s, "ชะตา", `${s.name} ลืมตาดูโลกที่${COUNTRIES[s.country].n} · ${rel}ของ${P.name} `
    + `ผู้จากไปในเดือนเดียวกัน`, "imp");
  return s;
}

monthly.push((s) => {
  const h = s.heir;
  if (!h || s.ev) return;
  const a = ageY(s);
  if (!h.paid && a >= 18) {
    h.paid = 1;
    if (h.gold > 0) addLedger(s, "มรดกจากครอบครัว", h.gold);
    log(s, "มรดก", `ทนายของครอบครัวส่งมอบมรดกของ${h.of} ที่ดูแลไว้ให้จนคุณอายุครบ 18`, "imp");
    return;
  }
  if (h.guild && !h.guildDone && a >= 20) {
    h.guildDone = 1;
    if (!s.hunter) { // a civilian cannot lead hunters: the officers buy it
      addLedger(s, "ขายกิลด์ของครอบครัว", 30000);
      log(s, "มรดก", `แกนนำของ${h.guild}ขอซื้อกิลด์ต่อจากครอบครัวคุณ และสัญญาว่าจะรักษาชื่อไว้`, "imp");
      return;
    }
    openEvent(s, { id: "heirGuild", tag: "มรดก", important: true,
      t: `${h.guild} ที่${h.of}ก่อตั้งไว้ยังเปิดอยู่ คนในกิลด์ถามว่าคุณจะรับช่วงต่อไหม`,
      o: [
        { l: "รับช่วงต่อ", y: { m: "ป้ายชื่อหน้าตึกยังเหมือนเดิม แต่หัวหน้าคนใหม่คือคุณ", act: "heirGuild" } },
        { l: "ขายกิลด์ให้แกนนำ", y: { m: "พวกเขาจ่ายเงินก้อนหนึ่งและสัญญาว่าจะรักษาชื่อไว้", gold: 30000,
          goldLabel: "ขายกิลด์ของครอบครัว" } },
      ] });
    return;
  }
  if (h.enemies?.length && !h.grudgeDone && a >= 22) {
    h.grudgeDone = 1;
    const foe = h.enemies[0];
    openEvent(s, { id: "heirGrudge", tag: "มรดก", important: true,
      t: `คนแปลกหน้าดักรอคุณหน้าบ้าน เขาบอกว่า${foe}ยังจำสิ่งที่${h.of}ทำไว้ได้ และหนี้นั้นตกทอดมาถึงคุณ`,
      o: [
        { l: "ขอโทษแทนครอบครัว", y: { m: "เขาถุยน้ำลายแล้วเดินจากไป เรื่องจบแค่นั้น", mind: -4 } },
        { l: "ยืนยันว่าไม่เกี่ยว", s: "wil", diff: 14, y: { m: "เขาชั่งใจอยู่นาน แล้วถอยไป", st: { wil: 0.5 } },
          n: { m: "คุณรู้ว่าเรื่องนี้ยังไม่จบ", act: "heirFoe" } },
      ] });
  }
});

hooks.act.heirGuild = (s) => {
  if (!s.heir?.guild) return;
  // in someone else's team, or already leading your own guild: the officers buy the family guild instead
  if (!s.hunter || s.party || s.guild?.role === "master") {
    addLedger(s, "ขายกิลด์ของครอบครัว", 30000);
    return log(s, "มรดก", `คุณรับช่วงต่อไม่ได้ แกนนำของ${s.heir.guild}จึงขอซื้อไว้และรักษาชื่อเดิม`, "imp");
  }
  if (s.guild) hooks.leaveGuild?.(s);
  s.guild = { id: "own", n: s.heir.guild, role: "master", standing: 80, since: s.ageM };
};
hooks.act.heirFoe = (s) => addEnemy(s, s.heir?.enemies?.[0], "ศัตรูที่ตกทอดมาจากครอบครัว");
