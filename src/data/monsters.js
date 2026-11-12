// Every creature the game can name. Pure data: build.mjs and the sim read it too.
// art = art/monsters/<folder>/<file>.png. borrow: wears the closest picture with a name tint. fly: hovers.
export const KINDS = {beast: "สัตว์กลายพันธุ์", construct: "เศษเมืองมีชีวิต", spirit: "เงาและวิญญาณ", boss: "เจ้าถิ่น"};

// Combat strength per kind, multiplied by level in core/hunt.js.
// balance pass: boss 2.2 made every boss a 40% death at any rank
export const KIND_POWER = { beast: 1, construct: 1.15, spirit: 1.05, boss: 1.65 };

const own = (art, kind, fly = 0) => ({ art, kind, fly });
const as = (art, kind, fly = 0) => ({ art, kind, fly, borrow: 1 });

export const MONSTERS = {
  "สุนัขท่อระบาย": own("beast/sewer-hound", "beast"),
  "หอยทากกรด": own("beast/acid-snail", "beast"),
  "ปลาบิน": own("beast/flying-fish", "beast", 1),
  "ค้างคาวสัญญาณ": own("beast/signal-bat", "beast", 1),
  "กบกระจก": own("beast/glass-frog", "beast"),
  "เถาวัลย์กินเรือ": own("beast/ship-eating-vine", "beast"),
  "ปูเกราะตู้สินค้า": own("beast/container-crab", "beast"),
  "นกล่อฟ้า": own("beast/sky-lure-bird", "beast", 1),
  "แพะหินปูน": as("beast/sewer-hound", "beast"),
  "ปลาไร้น้ำ": own("beast/waterless-fish", "beast", 1),
  "ตัวกินสายไฟ": own("construct/wire-eater", "construct"),
  "มนุษย์คอนกรีต": own("construct/concrete-humanoid", "construct"),
  "แมงมุมเสาไฟ": own("construct/streetlight-spider", "construct"),
  "หุ่นไร้คนขับ": own("construct/driverless-machine", "construct"),
  "ตะขาบรางรถไฟ": own("construct/rail-centipede", "construct"),
  "หมุดย้ำเดินได้": as("construct/wire-eater", "construct"),
  "ตะกรันมีชีวิต": as("construct/concrete-humanoid", "construct"),
  "ห้องสมุดหิว": as("spirit/floating-eyes", "construct", 1),
  "ฝูงตาลอย": own("spirit/floating-eyes", "spirit", 1),
  "เจ้าของบ้านเก่า": own("spirit/old-house-owner", "spirit", 1),
  "เงาใต้ท่าเทียบ": own("spirit/pier-shadow", "spirit", 1),
  "ผู้โดยสารคนสุดท้าย": own("spirit/last-passenger", "spirit", 1),
  "ผู้เฝ้าท่าข้ามฟาก": as("spirit/old-house-owner", "spirit", 1),
  "เงาสะท้อนผิดจังหวะ": as("spirit/floating-eyes", "spirit", 1),
  "อาจารย์ที่ยังสอนอยู่": own("spirit/teacher-still-teaching", "spirit", 1),
  "ของในตู้ที่สอง": as("spirit/floating-eyes", "spirit", 1),
  "ตัวคุณจากอีกฝั่ง": as("spirit/old-house-owner", "spirit", 1),
  "แม่พิมพ์เนื้อ": own("boss/flesh-matriarch", "boss"),
  "ราชาลานจอด": own("boss/parking-king", "boss"),
  "นาฬิกาที่กิน": own("boss/time-eater", "boss"),
  "คณะนักร้องไร้ปาก": own("boss/voiceless-choir", "boss", 1),
  "เจ้าเมืองเงาน้ำ": own("boss/water-shadow-lord", "boss"),
  "ยักษ์นั่งร้าน": own("boss/scaffold-giant", "boss"),
  "เทพลิฟต์ค้าง": own("boss/stalled-elevator-god", "boss"),
  "ผู้จัดการความตาย": own("boss/death-manager", "boss"),
  "มังกรสายเคเบิล": own("boss/cable-dragon", "boss"),
  "สิ่งที่อยู่ชั้นบนสุด": own("boss/thing-on-top-floor", "boss", 1),
  "มารดาแห่งรอยร้าว": own("boss/rift-mother", "boss"),
  "เสียงตามสาย": as("boss/voiceless-choir", "boss", 1),
  "องครักษ์เจ็ดตระกูล": as("boss/parking-king", "boss"),
  "ผู้สอบบัญชีชั้นล่าง": as("boss/death-manager", "boss"),
  "เจ้าหนี้แห่งวันฟ้าแตก": as("boss/time-eater", "boss"),
  "ผู้จัดการคลินิก": as("boss/death-manager", "boss"),
  "ผู้ลงนามคนแรก": as("boss/thing-on-top-floor", "boss", 1),
  // tower floors 21–50: the dead worlds' heroes and rulers (own art requested in art/requests.json)
  "ผู้ประกาศข่าวภาคค่ำ": as("boss/voiceless-choir", "boss", 1),
  "นายกเทศมนตรีคนสุดท้าย": as("boss/death-manager", "boss"),
  "ผู้เฝ้าประภาคารแห้ง": as("boss/stalled-elevator-god", "boss", 1),
  "ราชินีน้ำขึ้นครั้งสุดท้าย": as("boss/water-shadow-lord", "boss"),
  "แม่ทัพเกลือ": as("boss/scaffold-giant", "boss"),
  "ผู้ตรวจหน้ากากขาว": as("boss/death-manager", "boss"),
  "ผู้เผยแผ่วิถีมาร": as("boss/voiceless-choir", "boss", 1),
};

const hash = (name) => {
  let h = 2166136261;
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const POOL = (boss) => Object.values(MONSTERS).filter((m) => !m.borrow && (m.kind === "boss") === !!boss);

// A name the table has never heard of still gets a body, picked by its name.
export function monsterOf(name, boss) {
  if (MONSTERS[name]) return MONSTERS[name];
  const pool = POOL(boss);
  return { ...pool[hash(name || "") % pool.length], borrow: 1 };
}

export function tintOf(name) {
  const h = hash(name);
  return [64 + (h & 127), 64 + ((h >>> 8) & 127), 64 + ((h >>> 16) & 127)];
}
