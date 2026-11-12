import * as C from "../../core/index.js";
import { STATS, CLASSES, SKILLS, ROLES, RANKS } from "../../data/index.js";
import { esc } from "../dom.js";

import { INJURY } from "../../data/injuries.js";

export function meTab(s) {
  // where each stat came from: a 4–7 roll at birth, the family's bonus, and everything since (training, events)
  const so = C.statOrigin(s), hasBorn = Object.values(so).some((o) => o.born != null);
  const sign = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);
  const stats = Object.entries(STATS).map(([k, n]) => {
    const o = so[k], since = o.born == null ? null : Math.floor(s.st[k]) - o.born;
    const why = o.born == null ? "" : `<td class="n dim">${o.roll}</td><td class="n dim">${sign(o.fam)}</td><td class="n dim">${sign(since)}</td>`;
    return `<tr><td>${n}</td>${why}<td class="n">${Math.floor(s.st[k])}</td></tr>`;
  }).join("");
  const statHead = hasBorn ? `<tr class="dim"><td></td><td class="n">สุ่มตอนเกิด</td><td class="n">ครอบครัว</td>`
    + `<td class="n">ฝึก/เหตุการณ์</td><td class="n">ตอนนี้</td></tr>` : "";
  const statNote = hasBorn ? `<p class="dim">ทุกค่าเริ่มจากการสุ่ม 4–7 ตอนเกิด บวกโบนัสตามครอบครัวที่เกิดมา`
    + ` หลังจากนั้นขึ้นลงตามการฝึก แผนรายเดือน และทางที่คุณเลือก</p>` : "";
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
  const home = C.ageY(s) >= 18 ? `<div class="kv"><span>ที่อยู่</span><b>${C.ownsHere(s) ? "บ้านของตัวเอง"
    : s.home ? "เช่า (บ้านของคุณอยู่อีกเมือง)" : "ห้องเช่า"}</b></div>` : "";
  const mentor = s.ageM < (s.c.mentorUntil ?? 0) ? `<div class="kv"><span>ครูฝึก</span><b>อีก ${s.c.mentorUntil - s.ageM} เดือน</b></div>` : "";
  return `${fam}${home}${mentor}<h3>ค่าสถานะ</h3><table>${statHead}${stats}</table>${statNote}
    <h3>ร่างกาย</h3>${C.ageY(s) >= 18 ? `<div class="kv"><span>อายุขัยโดยประมาณ</span><b>${C.lifespan(s)} ปี</b></div>` : ""}<h4>บาดแผล</h4>${inj}${power}`;
}
