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

export function sceneOf(s, stageName) {
  if (stageName === "kid") return "home";
  if (s.op) return s.op.def.kind === "tower" ? "tower" : s.op.def.kind === "job" ? CAREER_SCENE[s.job?.id] ?? "city" : "rift";
  if (s.ev?.tag === "เกตแตก" || s.ev?.tag === "เหตุการณ์โลก") return "rift";
  if (s.hunter && !s.flags.stoppedHunting) return { train: "arena", rest: "home", hunt: "guild" }[s.focus] ?? "city";
  return CAREER_SCENE[s.job?.id] ?? "street";
}
