// Hunter classes for round 1. English names, Thai descriptions. rarity: 0 Common .. 4 Mythic. Spec §5.3.
export const RARITY = [
  { n: "Common", c: "#b9c6d6", w: 70 },
  { n: "Rare", c: "#62e0a1", w: 22 },
  { n: "Advanced", c: "#7fb8ff", w: 7 },
  { n: "Legendary", c: "#ffd76a", w: 0.9 },
  { n: "Mythic", c: "#c86bff", w: 0.1 },
];

export const ROLES = {
  vanguard: "แนวหน้า",
  striker: "ทำดาเมจ",
  support: "ซัพพอร์ต",
  scout: "สอดแนม",
  artisan: "สายช่าง",
};

const cls = (n, role, rarity, main, art, skills, d) => ({ n, role, rarity, main, art, skills, d });

export const CLASSES = {
  knight: cls("Knight", "vanguard", 0, "str", "class-knight", [[1, "guard"], [10, "taunt"], [25, "ironWall"]],
    "ยืนหน้าสุดของทีม รับแรงกระแทกแทนคนอื่น"),
  shield: cls("Shield Bearer", "vanguard", 0, "wil", "class-shieldm", [[1, "guard"], [12, "reflect"]],
    "โล่หนักที่ทำให้มอนสเตอร์ลืมว่ามีคนอื่นอยู่ข้างหลัง"),
  sword: cls("Swordsman", "striker", 0, "str", "class-duel", [[1, "slash"], [15, "bloodlust"]],
    "ดาบเล่มเดียวกับร่างกายที่ฝึกมาจนชิน"),
  fmage: cls("Fire Mage", "striker", 0, "int", "class-fmage", [[1, "fireball"], [18, "flameStorm"]],
    "เผาทุกอย่างที่ขวางหน้า รวมถึงงบซ่อมแซมของสมาคม"),
  archer: cls("Archer", "striker", 0, "agi", "class-bowst", [[1, "aimedShot"], [14, "volley"]],
    "ยิงจากที่ไกล ไม่ค่อยต้องเห็นเลือดใกล้ๆ"),
  healer: cls("Healer", "support", 0, "wil", "class-priest", [[1, "heal"], [16, "purify"]],
    "งานที่โรงพยาบาลฮันเตอร์ทุกแห่งแย่งตัว"),
  trapper: cls("Trapper", "scout", 0, "agi", "class-trap", [[1, "detect"], [12, "snare"]],
    "รู้ว่าพื้นตรงไหนเหยียบได้ และตรงไหนไม่ควรเหยียบ"),
  sharp: cls("Sharpshooter", "scout", 1, "agi", "class-sharp", [[1, "detect"], [10, "aimedShot"], [22, "weakPoint"]],
    "มองเห็นจุดอ่อนก่อนมอนสเตอร์จะรู้ตัว"),
  smith: cls("Blacksmith", "artisan", 0, "str", "class-bsmith", [[1, "forge"], [20, "manaTemper"]],
    "ตีอาวุธจากวัตถุดิบในเกต ไม่ต้องลงไปเสี่ยงเองก็ได้"),
  appraiser: cls("Appraiser", "artisan", 0, "int", "class-audit", [[1, "appraise"], [15, "detect"]],
    "มองของแล้วรู้ราคา มองคนแล้วรู้ว่าโกหก"),
  barrier: cls("Barrier Maker", "artisan", 1, "wil", "class-seal", [[1, "barrier"], [18, "sealGate"]],
    "สร้างกำแพงมานา งานที่เมืองต้องการทุกครั้งที่เกตแตก"),
  mblade: cls("Magic Swordsman", "striker", 2, "int", "class-mblade",
    [[1, "slash"], [8, "fireball"], [20, "spellBlade"]],
    "ดาบกับเวทในร่างเดียว สมาคมจับตามองคนแบบนี้เสมอ"),
  necro: cls("Necromancer", "striker", 2, "wil", "class-necro", [[1, "raiseDead"], [20, "deathPact"]],
    "ปลุกสิ่งที่ตายแล้วให้สู้แทน ไม่ใช่ทุกคนจะยอมเข้าทีมด้วย"),
  saint: cls("Saint", "support", 3, "wil", "class-saint", [[1, "heal"], [10, "purify"], [30, "resurrect"]],
    "แสงที่โบสถ์ทั่วโลกอยากได้ไปยืนบนแท่นบูชา"),
  sovereign: cls("Abyss Sovereign", "striker", 4, "wil", "class-demon", [[1, "abyssCall"], [30, "worldEater"]],
    "พลังที่แท่นวัดมานาไม่เคยมีหน่วยวัดรองรับ"),
};
