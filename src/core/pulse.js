// The world keeps turning (owner's vision): after and between the hand-written calendar, a seeded pulse of world news
// that never runs out — gate breaks elsewhere, tower records, hunters who fall and new names who rise, anniversaries.
// And illness: the one civilian death that comes with warning and a choice, never out of nowhere (spec §2).
import { ch, pk, ri, rnd } from "./rng.js";
import { stream, log, ageY, yearsAfterRift, monthOfYear } from "./state.js";
import { openEvent } from "./events.js";
import { monthly, hooks } from "./registry.js";
import { die } from "./body.js";
import { COUNTRIES } from "../data/world.js";
import { TOWERS } from "../data/towers.js";
import { NAMES } from "../data/families.js";

const news = (s, text) => log(s, "ข่าวโลก", text, "");
const CITIES = Object.values(COUNTRIES).flatMap((c) => c.cities);
const RANK = "FEDCBAS";

function pulse(s) {
  if (s.ev) return;
  const y = yearsAfterRift(s), R = stream(s, "pulse");
  if (monthOfYear(s) === 1 && y % 10 === 0 && s.c.annivY !== y) {
    s.c.annivY = y;
    return news(s, `ครบรอบ ${y} ปีวันฟ้าแตก ทั้งสองประเทศยืนสงบนิ่งหนึ่งนาทีพร้อมกัน`);
  }
  if (!ch(R, 1 / 18)) return; // about two pieces of world news a year
  const roll = rnd(R);
  if (roll < 0.45) {
    const c = pk(R, CITIES.filter((x) => x.id !== s.city)), r = Math.min(6, ri(R, 0, 4) + (ch(R, 0.15) ? 2 : 0));
    const dead = r >= 3 ? ri(R, 3, 12 * r) : 0;
    const end = dead ? ` มีผู้เสียชีวิต ${dead} คน` : " สมาคมคุมไว้ได้ทันก่อนลามออกนอกเขต";
    return news(s, `เกตแรงก์ ${RANK[r]} แตกที่${c.n}` + end);
  }
  if (roll < 0.65) {
    const t = pk(R, Object.keys(TOWERS)), cur = s.world.records[t] ?? 40;
    if (cur >= 60) return news(s, `ทีมใหญ่จากหลายประเทศพยายามทำลายสถิติ ${TOWERS[t].short} แต่ถอยกลับมาที่ชั้นเดิม`);
    s.world.records[t] = cur + 1;
    const hero = s.world.roster.filter((n) => n.alive && n.rank >= 5);
    return news(s, `${hero.length ? pk(R, hero).n : "ทีมนิรนาม"} ทำลายสถิติ ${TOWERS[t].short} ขึ้นถึงชั้น ${cur + 1}`);
  }
  if (roll < 0.85) {
    // a hunter of the roster falls; someone new takes the place (you are not the only story)
    const live = s.world.roster.filter((n) => n.alive && !n.holds && n.id !== "unmeasured");
    if (!live.length) return;
    const n = pk(R, live);
    n.alive = false;
    const country = pk(R, ["th", "kr"]), sex = ri(R, 0, 1) ? "f" : "m";
    s.c.npcGen = (s.c.npcGen ?? 0) + 1;
    s.world.roster.push({ id: "gen" + s.c.npcGen + "_" + y, n: pk(R, NAMES[country][sex]), country, rank: ri(R, 2, 5),
      cls: n.cls, fame: 20, alive: true });
    return news(s,
      `${n.n} ฮันเตอร์แรงก์ ${RANK[n.rank] ?? "?"} ไม่ได้กลับออกมาจากเกต สื่อเริ่มพูดถึงชื่อใหม่ในรุ่นถัดไปแทน`);
  }
  const lines = ["ราคาหินมานาขึ้นลงตามข่าวลือเรื่องเกตใหม่ ตลาดผันผวนทั้งเดือน",
    "สภาถกเถียงร่างกฎหมายจดทะเบียนพลังพิเศษเป็นรอบที่เท่าไรแล้วไม่มีใครจำได้",
    "นักวิจัยประกาศว่าพบรูปแบบใหม่ของการเกิดเกต แต่ยังไม่มีใครเข้าใจว่ามันแปลว่าอะไร",
    "เด็กรุ่นใหม่ตื่นพลังเร็วขึ้นเฉลี่ยครึ่งปี ไม่มีใครอธิบายได้ว่าทำไม",
    "กิลด์ใหญ่สองแห่งควบรวมกิจการ ข่าวลือว่ามีเงินจากองค์กรใต้ดินอยู่เบื้องหลัง"];
  news(s, pk(R, lines));
}

// ---- Illness: a check-up gives warning; treating it costs money and usually works; ignoring it shortens the life.
function illness(s) {
  if (s.ev || s.dead) return;
  const a = ageY(s);
  if (s.c.illDueM != null && s.ageM >= s.c.illDueM) return die(s, "โรคร้ายที่ไม่ได้รักษา");
  if (a < 35 || s.c.illDueM != null || (s.c.ill ?? 0) >= 2) return;
  const p = a < 50 ? 0.00012 : a < 65 ? 0.0004 : 0.0008; // per month: rare in midlife, common late
  if (!ch(stream(s, "ill"), p * (s.c.nearRift ? 1.3 : 1))) return;
  s.c.ill = (s.c.ill ?? 0) + 1;
  const cost = 3000 + a * 100;
  openEvent(s, { id: "illness", tag: "ร่างกาย", important: true,
    t: "หมอเรียกคุณกลับไปฟังผลตรวจอีกรอบ เสียงเขาเบากว่าทุกครั้ง: เป็นโรคร้าย ถ้ารักษาตอนนี้ยังมีโอกาสดี",
    o: [
      { l: `รักษาเต็มที่ ₿${cost.toLocaleString("en-US")}`, need: { gold: cost }, s: "wil", diff: 10,
        y: { m: "การรักษายาวนานและเหนื่อย แต่หมอบอกว่าหายแล้ว", gold: -cost, goldLabel: "ค่ารักษาโรคร้าย", hp: -15 },
        n: { m: "รักษาจนหมดทาง หมอบอกว่าเหลือเวลาไม่มาก", gold: -cost, goldLabel: "ค่ารักษาโรคร้าย",
          act: "illShort" } },
      { l: "รักษาตามกำลัง", s: "luk", diff: 12, y: { m: "อาการทรงตัวอย่างน่าประหลาดใจ", hp: -20, mind: -5 },
        n: { m: "อาการแย่ลงช้าๆ", act: "illShort", mind: -8 } },
      { l: "ใช้ชีวิตที่เหลือตามใจ", y: { m: "คุณเลิกนับวัน แล้วเริ่มนับสิ่งที่อยากทำ", act: "illShort", mind: 6 } },
    ] });
}
hooks.act.illShort = (s) => { s.c.illDueM = s.ageM + ri(stream(s, "ill"), 12, 48); };

monthly.push(pulse, illness);
