import { esc, tag, btn } from "../dom.js";

export function logTab(s, ui) {
  const rows = s.log.filter((l) => !ui.onlyImp || l.tone);
  let year = null, out = "";
  for (let i = rows.length - 1; i >= 0 && i >= rows.length - 250; i--) {
    const l = rows[i], y = Math.floor(l.m / 12);
    if (y !== year) { year = y; out += `<div class="yr">อายุ ${y}</div>`; }
    out += `<div class="l ${l.tone}">${tag(l.tag)}<span>${esc(l.text)}</span></div>`;
  }
  return `<div class="row" style="justify-content:flex-end;margin:0">${btn("onlyImp", ui.onlyImp ? "แสดงทั้งหมด" : "เฉพาะเรื่องสำคัญ", 'class="sm"')}</div>${out}`;
}
