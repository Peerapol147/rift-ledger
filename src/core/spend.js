// Money as choices: things worth buying, each with a story and a catch. Backlog item 3.
// A home of your own, a mentor (who may be a fraud), a child's schooling that shapes the heir, a fund in your name,
// and paying for word on a boss before you walk in. Nothing here is charged automatically.
import { ch } from "./rng.js";
import { stream, ageY, log } from "./state.js";
import { addLedger, borrow } from "./money.js";
import { openEvent } from "./events.js";
import { monthly, hooks } from "./registry.js";
import { changeMind } from "./body.js";
import { gatePay } from "./hunt.js";
import { cityOf } from "../data/world.js";

const money = (n) => "₿" + n.toLocaleString("en-US");
const yearly = (s, key, every = 12) => s.ageM >= (s.c[key] ?? 0) && ((s.c[key] = s.ageM + every), true);

// ---- A home of your own
// A home costs about 12 years of the city's living cost and halves it while you live there. It pays back slowly,
// but it is the one thing that passes to your child whole: the estate tax takes cash, not the family home.
export const homePrice = (s) => cityOf(s.city).cost * 150;
export const ownsHere = (s) => s.home?.city === s.city;
hooks.homeShare = (s) => (ownsHere(s) ? 0.5 : 1);

monthly.push((s) => {
  if (s.ev || s.home || ageY(s) < 25 || ageY(s) > 60 || !(s.job || s.hunter)) return;
  if (!yearly(s, "homeAskAt", 36) || !ch(stream(s, "spend"), 0.6)) return;
  const p = homePrice(s), down = Math.round(p * 0.3);
  openEvent(s, {
    id: "homeOffer", tag: "เงิน", t: `นายหน้าพาคุณไปดูห้องในย่านที่คุณอยู่ ราคา ${money(p)} `
      + "ถ้าเป็นของคุณเอง ค่าเช่าที่จ่ายทุกเดือนจะหายไปครึ่งหนึ่ง",
    o: [
      { l: "ซื้อเงินสด", need: { gold: p }, y: { m: "กุญแจดอกแรกที่เป็นของคุณจริงๆ", gold: -p, goldLabel: "ซื้อบ้าน",
        mind: 6, act: "buyHome" } },
      { l: `วางดาวน์ ${money(down)} แล้วผ่อนที่เหลือ`, need: { gold: down },
        y: { m: "ธนาคารถือโฉนดไว้ก่อน แต่คุณได้นอนในห้องของตัวเอง", gold: -down, goldLabel: "เงินดาวน์บ้าน",
          mind: 4, act: "mortgageHome" } },
      { l: "เช่าต่อไปก่อน", y: { m: "ห้องเช่ายังเหมือนเดิม และเงินก้อนยังอยู่กับคุณ" } },
    ],
  });
});
hooks.act.buyHome = (s) => { s.home = { city: s.city, at: s.ageM }; };
hooks.act.mortgageHome = (s) => {
  const rest = homePrice(s) - Math.round(homePrice(s) * 0.3);
  if (!borrow(s, rest)) {
    addLedger(s, "คืนเงินดาวน์บ้าน", Math.round(homePrice(s) * 0.3));
    log(s, "เงิน", "ธนาคารไม่อนุมัติสินเชื่อ เงินดาวน์ถูกคืนมา", "bad");
    return;
  }
  s.home = { city: s.city, at: s.ageM };
};
// moving away sells the home at 90%: a buyer always knows you are in a hurry
hooks.leaveHome = (s) => {
  if (!s.home) return;
  addLedger(s, "ขายบ้านเก่า", Math.round(cityOf(s.home.city).cost * 150 * 0.9));
  log(s, "เงิน", "คุณขายบ้านหลังเก่าก่อนย้าย ได้ราคาต่ำกว่าที่ซื้อมา", "");
  s.home = null;
};

// Once in a while the home asks something of you: a roof, a neighbour, a gate warning.
monthly.push((s) => {
  if (s.ev || !ownsHere(s) || !yearly(s, "homeEvAt", 60) || !ch(stream(s, "spend"), 0.5)) return;
  const fix = cityOf(s.city).cost * 6;
  openEvent(s, {
    id: "homeRoof", tag: "ชีวิต", t: "แรงสั่นจากเกตที่แตกนอกเมืองทำให้ผนังบ้านร้าวยาวจากเพดานถึงพื้น",
    o: [
      { l: `จ้างช่างซ่อมให้ดี (${money(fix)})`, need: { gold: fix },
        y: { m: "ช่างบอกว่าบ้านหลังนี้จะอยู่ได้อีกหลายสิบปี",
        gold: -fix, goldLabel: "ซ่อมบ้าน", mind: 2 } },
      { l: "ซ่อมเองแบบพอใช้", s: "str", diff: 14, y: { m: "รอยร้าวหายไป มือคุณยังเจ็บอีกหลายวัน", st: { str: 0.3 } },
        n: { m: "ปูนที่คุณฉาบร่วงลงมาในคืนฝนตก", gold: -Math.round(fix * 1.5), goldLabel: "ซ่อมบ้านซ้ำ", mind: -3 } },
    ],
  });
});

// ---- A mentor for a hunter (who may not be what they say)
monthly.push((s) => {
  if (s.ev || !s.hunter || s.flags.stoppedHunting || ageY(s) > 50) return;
  if (!yearly(s, "mentorAskAt", 24) || !ch(stream(s, "spend"), 0.5)) return;
  const fee = gatePay(Math.min(6, s.hunter.rank)) * 8;
  s.c.mentorFake = ch(stream(s, "spend"), 0.3) ? 1 : 0;
  openEvent(s, {
    id: "mentorOffer", tag: "ฮันเตอร์", t: `ฮันเตอร์เกษียณคนหนึ่งเสนอฝึกคุณตัวต่อตัวหนึ่งปี ค่าสอน ${money(fee)} `
      + "เขาบอกว่าเคยลงเกตแรงก์สูงกว่าคุณมาแล้ว",
    o: [
      { l: "จ่ายแล้วเริ่มเลย", need: { gold: fee }, y: { gold: -fee, goldLabel: "ค่าครูฝึก", act: "mentorStart" } },
      { l: "ขอดูประวัติเขาก่อน", s: "int", diff: 15, y: { act: "mentorCheck" },
        n: { m: "เอกสารของเขาดูเรียบร้อยดี คุณตัดสินใจไม่ได้และปล่อยโอกาสไป" } },
      { l: "ฝึกเองต่อไป", y: { m: "คุณยังเชื่อในวิธีของตัวเอง" } },
    ],
  });
});
hooks.act.mentorStart = (s) => {
  if (s.c.mentorFake) {
    log(s, "ฮันเตอร์", "สามสัปดาห์ต่อมา ครูฝึกหายไปพร้อมเงิน สมาคมบอกว่าไม่เคยมีชื่อนี้ในทะเบียน", "bad");
    changeMind(s, -6);
    s.c.mentorFooled = 1;
    return;
  }
  s.c.mentorUntil = s.ageM + 12;
  log(s, "ฮันเตอร์", "ครูฝึกพาคุณทำสิ่งที่คุณไม่เคยคิดจะทำ ทุกการล่าสอนอะไรคุณมากขึ้น", "good");
};
hooks.act.mentorCheck = (s) => {
  if (s.c.mentorFake) {
    log(s, "ฮันเตอร์", "ไม่มีชื่อเขาในทะเบียนสมาคม คุณปิดประตูใส่เขาก่อนเขาจะพูดจบ", "good");
    return;
  }
  const fee = gatePay(Math.min(6, s.hunter.rank)) * 8;
  if (s.gold < fee) return log(s, "ฮันเตอร์", "ประวัติของเขาจริงทุกบรรทัด แต่เงินของคุณยังไม่พอจ้าง", "");
  addLedger(s, "ค่าครูฝึก", -fee);
  hooks.act.mentorStart(s);
};
// a real mentor makes every bit of experience count for more, hunting and training alike
hooks.mentorXp = (s) => (s.ageM < (s.c.mentorUntil ?? 0) ? 1.4 : 1);

// ---- A child's schooling: what you pay for now is who your heir starts as
monthly.push((s) => {
  if (s.ev || !(s.c.kids > 0) || s.c.kidAt == null) return;
  const kidAge = Math.floor((s.ageM - s.c.kidAt) / 12);
  if (kidAge < 8 || kidAge > 14 || s.c.kidSchool || !yearly(s, "schoolAskAt", 24)) return;
  const fee = cityOf(s.city).cost * 30;
  openEvent(s, {
    id: "kidSchool", tag: "ครอบครัว",
    t: `ลูกของคุณอายุ ${kidAge} ขวบแล้ว ครูประจำชั้นแนะนำโรงเรียนสองแห่ง ค่าเล่าเรียน ${money(fee)}`,
    o: [
      { l: "โรงเรียนวิชาการ: ทุนสอบเข้ามหาวิทยาลัย", need: { gold: fee },
        y: { m: "ลูกกลับบ้านพร้อมหนังสือกองโต", gold: -fee, goldLabel: "ค่าเรียนลูก", c: { kidSchool: 1 } } },
      { l: "โรงเรียนเตรียมฮันเตอร์: วิ่งทุกเช้า ฝึกทุกเย็น", need: { gold: fee },
        y: { m: "ลูกกลับบ้านพร้อมรอยฟกช้ำและรอยยิ้ม", gold: -fee, goldLabel: "ค่าเรียนลูก", c: { kidSchool: 2 } } },
      { l: "โรงเรียนรัฐแถวบ้าน", y: { m: "ลูกได้เพื่อนเยอะ และคุณได้เก็บเงินไว้", c: { kidSchool: 3 } } },
    ],
  });
});
// how the heir starts: applied by newHeir from the parent's choice
export function schoolStart(P, s) {
  const k = P.c?.kidSchool;
  if (k === 1) { s.st.int += 2; s.st.cha += 1; }
  if (k === 2) { s.st.str += 1.5; s.st.agi += 1.5; s.c.trainHard = (s.c.trainHard ?? 0) + 2; }
  if (k === 3) s.st.cha += 0.5;
}

// ---- A fund in your name
monthly.push((s) => {
  if (s.ev || ageY(s) < 55 || s.flags.fund || !yearly(s, "fundAskAt", 60)) return;
  const amt = Math.max(20000, Math.round(s.gold * 0.3 / 1000) * 1000);
  if (s.gold < amt) return;
  openEvent(s, {
    id: "fundOffer", tag: "ชีวิต", t: `มูลนิธิช่วยเหลือครอบครัวผู้ประสบภัยจากเกตเสนอให้ตั้งทุนในชื่อคุณ ${money(amt)}`,
    o: [
      { l: "ตั้งทุน", need: { gold: amt }, y: { m: "ชื่อของคุณอยู่บนป้ายหน้าตึกที่คุณอาจไม่ได้เห็นสร้างเสร็จ",
        gold: -amt, goldLabel: "ตั้งทุนในชื่อตัวเอง", fame: 10, mind: 10, flags: { fund: true } } },
      { l: "ยังไม่ใช่ตอนนี้", y: { m: "คุณเก็บจดหมายไว้ในลิ้นชัก" } },
    ],
  });
});
// the fund outlives you: your heir hears of it and, at 18, gets one of its grants (set by newHeir)
monthly.push((s) => {
  if (!s.c.fundGrant || s.c.fundPaid || ageY(s) < 18) return;
  s.c.fundPaid = 1;
  addLedger(s, "ทุนจากมูลนิธิของครอบครัว", 5000);
  const who = s.heir?.of ?? "บรรพบุรุษ";
  log(s, "ครอบครัว", `ทุนในชื่อ${who}ยังมอบทุนทุกปี ปีนี้ชื่อของคุณอยู่ในรายชื่อผู้ได้รับ`, "good");
});

// ---- Paying for word on a boss before you go in
// A broker sells what the last team learned: the boss hits and lasts a fifth less for you. A third of the pay.
export const intelPrice = (d) => Math.round(d.rewards.gold * 0.35);
export function withIntel(d) {
  const weak = (f) => (f.boss ? { ...f, hp: Math.round(f.hp * 0.8), atk: Math.round(f.atk * 0.8), intel: 1 } : f);
  return { ...d, intel: true, foes: d.foes.map(weak), t: d.t + " · มีข้อมูลบอส" };
}
