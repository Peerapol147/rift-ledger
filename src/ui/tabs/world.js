import * as C from "../../core/index.js";
import { TOWERS, CALENDAR, CLASSES, RANKS, COUNTRIES } from "../../data/index.js";
import { esc } from "../dom.js";

export function worldTab(s) {
  const towers = Object.values(TOWERS).map((t) => `<div class="kv"><span>${esc(t.n)} · ${COUNTRIES[t.country].n}</span><b>ชั้น ${Number(s.world.records[t.id])}</b></div>`).join("");
  const seen = CALENDAR.filter((e) => s.world.done[e.id]).map((e) => `<div>ปีที่ ${e.year} · ${esc(e.news.replace("{npc} ", ""))}</div>`).join("");
  const roster = s.world.roster.map((n) =>
    `<tr><td>${esc(n.title ?? n.n)}</td><td>${COUNTRIES[n.country].n}</td><td>${RANKS[n.rank]}</td><td>${esc(CLASSES[n.cls]?.n ?? "")}</td></tr>`).join("");
  return `<h3>ตอนนี้</h3><div>${esc(C.dateText(s))}</div>
    <h3>สถิติหอคอย</h3>${towers}${s.c.floor ? `<div class="dim">ชั้นสูงสุดของคุณ: ${s.c.floor}</div>` : ""}
    <h3>เหตุการณ์ที่ผ่านมา</h3>${seen || `<div class="dim">ยังไม่มี</div>`}
    <h3>ฮันเตอร์ที่โลกจับตา</h3><table>${roster}</table>`;
}
