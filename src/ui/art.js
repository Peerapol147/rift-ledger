// Maps new career/class ids onto the existing art and the stage's scenes.
import { CLASSES } from "../data/classes.js";

const CAREER_ART = {
  office: "clerk", shop: "trader", doc: "doc", hdoc: "doc", porter: "porter", press: "press", police: "cop",
  teach: "teach", agency: "lawyer", appraise: "adjuster", rescue: "rescue", cook: "cook",
};
const CAREER_SCENE = {
  doc: "clinic", hdoc: "clinic", shop: "market", cook: "market", appraise: "market", porter: "ruins",
  rescue: "street", police: "street", office: "city", agency: "city", press: "city", teach: "home",
};

export const classArt = (cls) => CLASSES[cls]?.art.replace(/^class-/, "") ?? null;
export const careerArt = (id) => CAREER_ART[id] ?? null;

// Night-time words in an event's text: the stage darkens for them (a blackout, the small hours, a sleepless night).
const NIGHT = /กลางคืน|กลางดึก|คืนหนึ่ง|ไฟดับ|ตีหนึ่ง|ตีสอง|ตีสาม|ตีสี่|นอนไม่หลับ|ทั้งคืน|เที่ยงคืน|คืนนี้|คืนที่/;
export const isNight = (text) => NIGHT.test(text ?? "");

// A baby's plan is how the parents raise them; from four the child picks.
export const planTitle = (s) => (s.ageM < 48 ? "พ่อแม่เลี้ยงคุณแบบ" : "แผนเดือนนี้");

// The scenes' names for the "where" line over the stage
export const PLACE = { room: "ห้องนอน", home: "บ้าน", tower: "หอคอย", rift: "เกต", arena: "ลานฝึก", guild: "กิลด์",
  city: "ใจกลางเมือง", street: "ถนนในเมือง", clinic: "คลินิก", market: "ตลาด", ruins: "ซากเมือง" };

export function sceneOf(s, stageName) {
  // babies live indoors; a child's night-time event happens at home, not out on the street
  if (stageName === "kid") return s.ageM < 48 || isNight(s.ev?.t) ? "room" : "home";
  if (s.op) return s.op.def.kind === "tower" ? "tower" : s.op.def.kind === "job" ? CAREER_SCENE[s.job?.id] ?? "city" : "rift";
  if (s.ev?.tag === "เกตแตก" || s.ev?.tag === "เหตุการณ์โลก") return "rift";
  if (s.hunter && !s.flags.stoppedHunting) return { train: "arena", rest: "home", hunt: "guild" }[s.focus] ?? "city";
  return CAREER_SCENE[s.job?.id] ?? "street";
}
