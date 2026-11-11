import * as C from "../../core/index.js";
import { CLASSES, ROLES, RANKS } from "../../data/index.js";
import { esc, btn, money } from "../dom.js";

const row = (m, s, acts) => `<div class="item"><span><b>${esc(m.n)}</b> · ${esc(CLASSES[m.cls]?.n)} · ${ROLES[m.role]}
  · แรงก์ ${RANKS[m.rank]} Lv.${Number(m.lv)}<small class="dim">${acts.mood ?? ""}</small></span><span>${acts.btns}</span></div>`;

export function teamTab(s) {
  let out = "";
  if (s.hunter) {
    const mine = s.team.filter((m) => m.alive).map((m) => row(m, s, {
      mood: `อารมณ์: ${C.moodWord(m.loyalty)}${m.hurtUntilM > s.ageM ? " · กำลังพักรักษาตัว" : ""}`,
      btns: btn("dismiss:" + m.id, "ให้ออก", 'class="sm"'),
    })).join("") || `<div class="dim">ยังไม่มีลูกทีม</div>`;
    const offers = C.recruitOffers(s).map((m) => row(m, s, {
      btns: btn("hire:" + m.id, "จ้าง " + money(C.feeOf(m)), `class="sm" ${s.gold < C.feeOf(m) ? "disabled" : ""}`),
    })).join("") || `<div class="dim">ปีนี้ไม่มีใครสมัคร</div>`;
    const fallen = s.team.filter((m) => !m.alive).map((m) => esc(m.n)).join(", ");
    out += `<h3>ลูกทีม ${s.team.filter((m) => m.alive).length}/4</h3>${mine}
      ${fallen ? `<div class="dim" style="margin-top:4px">ผู้ที่จากไป: ${fallen}</div>` : ""}
      <h3>คนที่อยากเข้าทีมปีนี้</h3>${offers}`;
  } else out += `<h3>ทีม</h3><p class="dim">ทีมฮันเตอร์เปิดเมื่อคุณตื่นพลัง ส่วนลูกน้องในกิจการจะเปิดเมื่อคุณมีกิจการของตัวเอง</p>`;
  const rel = [s.c.married && "แต่งงานแล้ว", s.c.firstLove && "เคยมีรักแรก", s.c.lentFriend && "เคยให้เพื่อนยืมเงิน"].filter(Boolean);
  return out + `<h3>ความสัมพันธ์</h3>${rel.map((r) => `<div>${esc(r)}</div>`).join("") || `<div class="dim">ยังไม่มีเรื่องที่บันทึกไว้</div>`}`;
}
