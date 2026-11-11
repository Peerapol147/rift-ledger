import * as C from "../../core/index.js";
import { STATS, CLASSES, SKILLS, ROLES, RANKS } from "../../data/index.js";
import { esc } from "../dom.js";

import { INJURY } from "../../data/injuries.js";

export function meTab(s) {
  const stats = Object.entries(STATS).map(([k, n]) => `<tr><td>${n}</td><td class="n">${s.st[k].toFixed(1)}</td></tr>`).join("");
  const inj = s.injuries.length
    ? s.injuries.map((i) => `<div>${esc(INJURY[i.id] ?? i.id)} <span class="dim">${i.untilM == null ? "ถาวร" : `อีก ${i.untilM - s.ageM} เดือน`}</span></div>`).join("")
    : `<div class="dim">ไม่มี</div>`;
  let power = "";
  if (s.hunter) {
    const h = s.hunter, c = CLASSES[h.cls], p = C.heroPower(s);
    const skills = h.skills.map((id) => `<div><b>${esc(SKILLS[id].n)}</b> ${h.slots.includes(id) ? "✓" : ""} <span class="dim">${esc(SKILLS[id].d)}</span></div>`).join("");
    const hint = C.ceilingHint(s);
    power = `<h3>พลัง</h3>
      <div class="kv"><span>คลาส</span><b>${esc(c.n)}</b></div><div class="dim">${esc(c.d)}</div>
      <div class="kv"><span>บทบาท</span><b>${ROLES[c.role]}</b></div>
      <div class="kv"><span>แรงก์</span><b>${RANKS[h.rank]}${s.flags.hiddenRank ? " (ในบัตร: ซ่อนไว้)" : ""}</b></div>
      <div class="kv"><span>เลเวล</span><b>${Number(h.lv)} / ${C.LV_CAP[h.rank]}</b></div>
      <div class="kv"><span>โจมตี · ป้องกัน · พลังชีวิต</span><b class="num">${Math.round(p.atk)} · ${Math.round(p.def)} · ${Math.round(p.hp)}</b></div>
      ${hint ? `<p class="dim" style="margin-top:6px">${esc(hint)}</p>` : ""}
      <h4>สกิล (ช่อง ${h.slots.length}/${C.slotsFor(h.rank)})</h4>${skills}`;
  }
  const fam = s.heir ? `<h3>ครอบครัว</h3><div class="kv"><span>รุ่นที่</span><b>${Number(s.gen) || 2}</b></div>
    <div class="kv"><span>${s.heir.rel === "หลาน" ? "หลานของ" : "ลูกของ"}</span><b>${esc(s.heir.of)}</b></div>
    ${s.heir.paid ? "" : `<p class="dim">มรดกของครอบครัวรอคุณอยู่จนอายุ 18 ของบางส่วนเก็บไว้ในบ้าน</p>`}` : "";
  return `${fam}<h3>ค่าสถานะ</h3><table>${stats}</table>
    <h3>ร่างกาย</h3><div class="kv"><span>อายุขัยโดยประมาณ</span><b>${C.lifespan(s)} ปี</b></div><h4>บาดแผล</h4>${inj}${power}`;
}
