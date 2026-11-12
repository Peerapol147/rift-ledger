// The six stats and the monthly plans per stage of life. Spec §17.
export const STATS = { str: "กาย", agi: "ไว", int: "ปัญญา", wil: "จิต", cha: "เสน่ห์", luk: "โชค" };
export const STAT_IDS = Object.keys(STATS);

// Monthly plans. st = gain per month. gold = pocket money per month (kids only). mind = change per month: grown-up
// work, study and hunting wear you down a little every month, and only rest and people bring it back.
const plan = (n, st, extra = {}) => ({ n, st, ...extra });
export const FOCUS = {
  kid: {
    play: plan("วิ่งเล่น", { agi: 0.12, luk: 0.06, cha: 0.06 }),
    study: plan("ตั้งใจเรียน", { int: 0.18, wil: 0.05 }),
    sport: plan("ออกกำลัง", { str: 0.16, agi: 0.07 }),
    chores: plan("ช่วยงานบ้าน", { wil: 0.1, cha: 0.06 }, { gold: 8 }),
  },
  teen: {
    study: plan("อ่านหนังสือ", { int: 0.2, wil: 0.05 }, { mind: -0.3 }),
    train: plan("ฝึกร่างกาย", { str: 0.15, agi: 0.1 }, { mind: -0.3 }),
    work: plan("ทำงานพิเศษ", { cha: 0.06, wil: 0.06 }, { gold: 60, mind: -0.4 }),
    social: plan("ออกไปกับเพื่อน", { cha: 0.16, luk: 0.04 }, { mind: 1 }),
  },
  adult: {
    work: plan("ทำงาน", { wil: 0.03 }, { mind: -0.7 }),
    train: plan("ฝึกฝน", { str: 0.06, agi: 0.06 }, { mind: -0.6 }),
    hunt: plan("ล่าเกต", {}, { hunter: true, mind: -0.9 }),
    study: plan("เรียนเพิ่ม", { int: 0.08 }, { mind: -0.5 }),
    rest: plan("พักผ่อน", {}, { mind: 3, hp: 3 }),
    social: plan("สร้างสายสัมพันธ์", { cha: 0.08 }, { mind: 1 }),
  },
  old: {
    rest: plan("พักผ่อน", {}, { mind: 3, hp: 2 }),
    social: plan("พบปะผู้คน", { cha: 0.03 }, { mind: 2 }),
    work: plan("ทำงานต่อ", {}, { mind: -0.5 }),
  },
};
