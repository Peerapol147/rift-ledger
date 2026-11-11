// Collection-book unlocks. need: [kind, id] pairs, any of which unlocks. Spec §10 (bonus total ≤ 10%).
const fam = (id, country, n, d, gold, st) => ({ id, country, n, d, gold, st, w: 2 });

export const UNLOCK_FAMILIES = [
  { need: [["cal", "cal24"]], family: fam("th_subway", "th", "ครอบครัวผู้รอดจากรถไฟใต้ดิน",
    "พ่อแม่เคยหลบเกตแตกปีที่ 24 อยู่ใต้ดินสามวัน ไม่เคยกลัวอะไรอีกเลยนับจากนั้น", 2500, { wil: 2 }) },
  { need: [["cal", "cal27"]], family: fam("kr_harbor", "kr", "ครอบครัวชาวประมงปูซาน",
    "เรือของพ่อรอดจากวันเกตแตกที่ท่าเรือ คนในครอบครัวแบกของหนักเก่งทุกคน", 3000, { str: 2 }) },
  { need: [["flag", "legendCraft"], ["flag", "ownForge"]], family: fam("th_smith", "th", "ตระกูลช่างตีเหล็ก",
    "เสียงค้อนดังในบ้านนี้ทุกเช้า ตั้งแต่ก่อนที่คุณจะจำความได้", 8000, { str: 1, int: 1 }) },
  { need: [["secret", "apprentice"], ["secret", "seven"]], family: fam("kr_guild", "kr", "ตระกูลผู้ก่อตั้งกิลด์",
    "ปู่ของคุณตั้งกิลด์ในปีแรกหลังฟ้าแตก ทุกคนในบ้านถูกคาดหวังให้ลงเกต", 30000, { cha: 2 }) },
];

export const STAT_BONUS = [
  { stat: "str", pct: 2, n: "เคยล้มต่อหน้าบอส", need: [["death", "boss"]] },
  { stat: "wil", pct: 2, n: "เคยอยู่ถึงอายุแปดสิบ", need: [["death", "old80"]] },
  { stat: "agi", pct: 2, n: "เคยตื่นพลังมาแล้วสามคลาส", need: [["count", "cls:3"]] },
  { stat: "cha", pct: 2, n: "เคยเป็นเจ้าของกิจการ", need: [["flag", "business"]] },
  { stat: "luk", pct: 2, n: "เคยได้ของที่พาคนกลับจากความตาย", need: [["flag", "gotToken"]] },
  { stat: "int", pct: 2, n: "เคยตามเรื่องแปลกในชีวิตไปจนสุดทาง", need: [["count", "secret:1"]] },
];
export const BONUS_CAP = 10;
