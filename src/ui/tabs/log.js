import { esc, tag, btn } from "../dom.js";
import { yearSummary } from "../../core/goals.js";

export function logTab(s, ui) {
  const rows = s.log.filter((l) => !ui.onlyImp || l.tone);
  let year = null, out = "";
  for (let i = rows.length - 1; i >= 0 && i >= rows.length - 250; i--) {
    const l = rows[i], y = Math.floor(l.m / 12);
    if (y !== year) { year = y; out += `<div class="yr">อายุ ${y}</div>`; }
    out += `<div class="l ${l.tone}">${tag(l.tag)}<span>${esc(l.text)}</span></div>`;
  }
  const ys = s.ageM >= 12 ? yearSummary(s, Math.floor(s.ageM / 12) - 1) : null;
  const sum = ys?.lines.length
    ? `<div class="ysum"><b>สรุปปีที่แล้ว (อายุ ${ys.year})</b>${ys.lines.slice(-8).map((t) => `<div class="l">${esc(t)}</div>`).join("")}</div>`
    : "";
  return `${sum}<div class="row" style="justify-content:flex-end;margin:0">${btn("onlyImp", ui.onlyImp ? "แสดงทั้งหมด" : "เฉพาะเรื่องสำคัญ", 'class="sm"')}</div>${out}`;
}
