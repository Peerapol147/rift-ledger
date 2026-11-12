// The six stats and the monthly plans per stage of life. Spec §17.
export const STATS = { str: "กาย", agi: "ไว", int: "ปัญญา", wil: "จิต", cha: "เสน่ห์", luk: "โชค" };
export const STAT_IDS = Object.keys(STATS);

// Monthly plans. st = gain per month. gold = pocket money per month (kids only). mind = change per month: grown-up
// work, study and hunting wear you down a little every month, and only rest and people bring it back.
// kinds: the kinds of event the plan pulls (core/kinds.js). desc: one line the player reads under the plan buttons.
const plan = (n, st, extra = {}) => ({ n, st, ...extra });
export const FOCUS = {
  kid: {
    cuddle: plan("เล่นกับพ่อแม่", { cha: 0.12, wil: 0.04 }, { age: [0, 3], kinds: ["social"],
      desc: "เสน่ห์โตทีละน้อย เรื่องกับคนในบ้านมาบ่อยขึ้น" }),
    nap: plan("นอนกลางวัน", { str: 0.08, luk: 0.06 }, { age: [0, 3], kinds: ["body", "luck"],
      desc: "ร่างกายแข็งแรง โชคเข้าข้าง เรื่องร่างกายและเรื่องบังเอิญมาบ่อยขึ้น" }),
    play: plan("วิ่งเล่น", { agi: 0.12, luk: 0.06, cha: 0.06 }, { age: [4, 12], kinds: ["body", "luck"],
      desc: "ว่องไวและโชคดีขึ้น เรื่องผจญภัยนอกบ้านมาบ่อยขึ้น" }),
    study: plan("ตั้งใจเรียน", { int: 0.18, wil: 0.05 }, { age: [4, 12], kinds: ["study"],
      desc: "ปัญญาโตเร็ว เรื่องโรงเรียนและหนังสือมาบ่อยขึ้น" }),
    sport: plan("ออกกำลัง", { str: 0.16, agi: 0.07 }, { age: [4, 12], kinds: ["body"],
      desc: "กำลังโตเร็ว เรื่องกีฬาและร่างกายมาบ่อยขึ้น" }),
    chores: plan("ช่วยงานบ้าน", { wil: 0.1, cha: 0.06 }, { gold: 8, age: [4, 12], kinds: ["mind", "money"],
      desc: "ใจนิ่งและได้ค่าขนมเดือนละ ₿8 เรื่องเงินและงานบ้านมาบ่อยขึ้น" }),
  },
  teen: {
    study: plan("อ่านหนังสือ", { int: 0.2, wil: 0.05 }, { mind: -0.3, kinds: ["study"],
      desc: "ปัญญาโตเร็วที่สุด แต่เหนื่อยใจเล็กน้อย เรื่องการเรียนและสอบมาบ่อยขึ้น" }),
    train: plan("ฝึกร่างกาย", { str: 0.15, agi: 0.1 }, { mind: -0.3, kinds: ["body"],
      desc: "กายและความไวโต เรื่องกีฬา การฝึก และร่างกายมาบ่อยขึ้น" }),
    work: plan("ทำงานพิเศษ", { cha: 0.06, wil: 0.06 }, { gold: 60, mind: -0.4, kinds: ["money"],
      desc: "ได้เงินเดือนละ ₿60 แต่เหนื่อย เรื่องเงินและงานมาบ่อยขึ้น" }),
    social: plan("ออกไปกับเพื่อน", { cha: 0.16, luk: 0.04 }, { mind: 1, kinds: ["social", "luck"],
      desc: "เสน่ห์โตเร็ว ใจสบาย เรื่องเพื่อน ความรัก และเรื่องบังเอิญมาบ่อยขึ้น" }),
  },
  adult: {
    work: plan("ทำงาน", { wil: 0.03 }, { mind: -0.7, kinds: ["money"],
      desc: "งานก้าวหน้าและเลื่อนขั้นได้ แต่สุขภาพจิตลดทุกเดือน เรื่องงานและเงินมาบ่อยขึ้น" }),
    train: plan("ฝึกฝน", { str: 0.06, agi: 0.06 }, { mind: -0.6, kinds: ["body"],
      desc: "กายและความไวโตช้าๆ เรื่องร่างกายและการฝึกมาบ่อยขึ้น" }),
    hunt: plan("ล่าเกต", {}, { hunter: true, mind: -0.9, kinds: ["hunt"],
      desc: "ลงเกตทุกเดือน ได้ของและค่าประสบการณ์ แต่เสี่ยงและเหนื่อยใจ เรื่องฮันเตอร์มาบ่อยขึ้น" }),
    study: plan("เรียนเพิ่ม", { int: 0.08 }, { mind: -0.5, kinds: ["study"],
      desc: "ปัญญาโตช้าๆ เรื่องคอร์ส หนังสือ และความรู้มาบ่อยขึ้น" }),
    rest: plan("พักผ่อน", {}, { mind: 3, hp: 3, kinds: ["mind"],
      desc: "สุขภาพและสุขภาพจิตฟื้นทุกเดือน แต่ไม่ได้เงิน เรื่องจิตใจและชีวิตสงบมาบ่อยขึ้น" }),
    social: plan("สร้างสายสัมพันธ์", { cha: 0.08 }, { mind: 1, kinds: ["social"],
      desc: "เสน่ห์โต ใจสบาย เรื่องผู้คน ความรัก และครอบครัวมาบ่อยขึ้น" }),
  },
  old: {
    rest: plan("พักผ่อน", {}, { mind: 3, hp: 2, kinds: ["mind"],
      desc: "ร่างกายทรุดช้าลง ใจสงบ เรื่องจิตใจและความทรงจำมาบ่อยขึ้น" }),
    social: plan("พบปะผู้คน", { cha: 0.03 }, { mind: 2, kinds: ["social"],
      desc: "ใจสบาย ไม่เหงา เรื่องเพื่อนเก่าและครอบครัวมาบ่อยขึ้น" }),
    work: plan("ทำงานต่อ", {}, { mind: -0.5, kinds: ["money"],
      desc: "ยังมีรายได้ แต่เหนื่อยกว่าเดิม เรื่องงานและเงินมาบ่อยขึ้น" }),
  },
};
