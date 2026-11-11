import { CALENDAR, STATS } from "../../data/index.js";
import { bookStatus } from "../../core/index.js";
import { esc } from "../dom.js";

const hidden = `<div class="dim">???</div>`;

export function bookTab(book) {
  const b = book.get(), st = bookStatus(b);
  const cal = CALENDAR.filter((e) => e.views || e.kind === "record").map((e) =>
    b.seen.cal?.includes(e.id) ? `<div>ปีที่ ${e.year} · ${esc(e.news.replace("{npc} ", ""))}</div>` : hidden).join("");
  const fams = st.families.map((f) => (f.open ? `<div><b>${esc(f.n)}</b> <span class="dim">${esc(f.d)}</span></div>` : hidden)).join("");
  const bon = st.bonuses.map((x) => (x.open ? `<div>${STATS[x.stat]} +${x.pct}% <span class="dim">${esc(x.n)}</span></div>` : hidden)).join("");
  return `<h3>ชีวิตที่ผ่านมา: ${Number(b.lives)}</h3>
    <h3>ครอบครัวที่อาจได้เกิด</h3>${fams}
    <h3>สิ่งที่ติดตัวมาจากชีวิตก่อน (รวม +${st.total}%)</h3>${bon}
    <h3>ฉายาที่เคยได้</h3>${b.titles.map((t) => `<div>${esc(t)}</div>`).join("") || `<div class="dim">ยังไม่มี</div>`}
    <h3>คลาสที่เคยตื่น</h3><div>${b.seen.cls?.length ?? 0} คลาส</div>
    <h3>เหตุการณ์โลกที่เคยเห็น</h3><p class="dim">เหตุการณ์ที่เคยเห็นแล้ว ชีวิตถัดไปจะรู้ล่วงหน้า</p>${cal}`;
}
