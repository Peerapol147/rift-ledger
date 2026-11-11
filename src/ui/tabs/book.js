import { CALENDAR } from "../../data/index.js";
import { esc } from "../dom.js";

export function bookTab(book) {
  const b = book.get();
  const cal = CALENDAR.map((e) => (b.seen.cal?.includes(e.id) ? `<div>ปีที่ ${e.year} · ${esc(e.news.replace("{npc} ", ""))}</div>` : `<div class="dim">???</div>`)).join("");
  return `<h3>ชีวิตที่ผ่านมา: ${Number(b.lives)}</h3>
    <h3>ฉายาที่เคยได้</h3>${b.titles.map((t) => `<div>${esc(t)}</div>`).join("") || `<div class="dim">ยังไม่มี</div>`}
    <h3>เหตุการณ์โลกที่เคยเห็น</h3><p class="dim">เหตุการณ์ที่เคยเห็นแล้ว ชีวิตถัดไปจะรู้ล่วงหน้า</p>${cal}`;
}
