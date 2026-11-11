// Preparation before a gate or tower: battle plan, active skills in limited slots, and what the team lacks.
import { slotsFor, teamRoles } from "../core/index.js";
import { SKILLS, CLASSES, ROLES } from "../data/index.js";
import { esc, btn } from "./dom.js";

const PLANS = { push: "บุก", careful: "ระวัง", retreat: "ถอยเมื่อเลือดเหลือครึ่ง" };

export function prepPanel(s) {
  const h = s.hunter;
  if (!h) return "";
  const plan = s.prefs?.plan ?? "careful";
  const plans = Object.entries(PLANS).map(([k, n]) => btn("plan:" + k, n, `class="sm ${plan === k ? "on" : ""}"`)).join("");
  const cap = slotsFor(h.rank);
  const skills = h.skills.map((id) => {
    const on = h.slots.includes(id);
    return btn("slot:" + id, (on ? "✓ " : "") + esc(SKILLS[id].n), `class="sm ${on ? "on" : ""}" title="${esc(SKILLS[id].d)}"`);
  }).join("");
  const have = teamRoles(s);
  have.add(CLASSES[h.cls].role);
  const lacking = Object.entries(ROLES).filter(([k]) => !have.has(k)).map(([, n]) => n).join(", ");
  return `<div class="prep"><b>เตรียมตัว</b>
    <div class="row"><span class="dim">แผน</span>${plans}</div>
    <div class="row"><span class="dim">สกิล ${h.slots.length}/${cap}</span>${skills}</div>
    <div class="dim" style="margin-top:4px">${lacking ? `ทีมยังขาด: ${lacking}` : "ทีมครบทุกบทบาท"}</div></div>`;
}

export function toggleSlot(s, id) {
  const h = s.hunter;
  if (!h?.skills.includes(id)) return;
  if (h.slots.includes(id)) h.slots = h.slots.filter((x) => x !== id);
  else if (h.slots.length < slotsFor(h.rank)) h.slots.push(id);
}
