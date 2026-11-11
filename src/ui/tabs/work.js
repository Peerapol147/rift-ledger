import * as C from "../../core/index.js";
import { CAREERS, COUNTRIES, cityOf, STATS } from "../../data/index.js";
import { esc, btn, money } from "../dom.js";

const ledgerRow = (e) => `<tr><td>${esc(e.label)}</td><td class="n ${e.amt < 0 ? "bad" : "good"}">${money(e.amt)}</td></tr>`;

export function workTab(s) {
  let job = `<p class="dim">ยังไม่มีงานประจำ</p>`;
  if (s.job) {
    const c = CAREERS[s.job.id], next = c.need[s.job.tier + 1];
    const ladder = c.tiers.map((t, i) => (i === s.job.tier ? `<b>${esc(t)}</b>` : `<span class="dim">${esc(t)}</span>`)).join(" › ");
    const needs = next ? Object.entries(next).map(([k, v]) => `${STATS[k]} ${Math.floor(s.st[k])}/${v}`).join(" · ") : "ตำแหน่งสูงสุดแล้ว";
    job = `<div><b>${esc(c.n)}</b> · เงินเดือน ${money(c.pay[s.job.tier])}</div><div style="margin-top:4px">${ladder}</div>
      <div class="dim">ผลงาน ${Math.floor(s.job.xp)}/${12 * (s.job.tier + 1)} · ขั้นถัดไปต้องการ ${needs}</div>
      <div class="row">${btn("quitJob", "ลาออก", 'class="sm"')}</div>`;
  } else if (C.ageY(s) >= 18) job += `<div class="row">${btn("jobHunt", "หางาน", 'class="sm"')}</div>`;
  const m = C.monthSummary(s);
  const cities = Object.values(COUNTRIES).flatMap((c) => c.cities).filter((c) => c.id !== s.city)
    .map((c) => btn("move:" + c.id, `${esc(c.n)} (${money(c.cost * 3)})`, 'class="sm"')).join("");
  return `<h3>งาน</h3>${job}
    <h3>เดือนนี้</h3><table>${[...m.in, ...m.out].map(ledgerRow).join("") || `<tr><td class="dim">ยังไม่มีรายการ</td></tr>`}
      <tr><td><b>สุทธิ</b></td><td class="n"><b>${money(m.net)}</b></td></tr></table>
    <h3>หนี้</h3><div class="kv"><span>ยอดหนี้ (ดอกเบี้ย 1%/เดือน)</span><b>${money(s.debt)}</b></div>
      <div class="kv"><span>วงเงินกู้</span><b>${money(C.debtCap(s))}</b></div>
      <div class="row">${btn("borrow", "กู้ ₿1,000", 'class="sm"')}${btn("repay", "ชำระ ₿1,000", 'class="sm"')}</div>
    <h3>รายการย้อนหลัง</h3><table>${s.ledger.slice(-30).reverse().map(ledgerRow).join("")}</table>
    <h3>ย้ายที่อยู่</h3><div class="dim">ตอนนี้อยู่ ${esc(cityOf(s.city).n)} · ย้ายข้ามประเทศ ตำแหน่งงานลดลงและต้องสอบใบอนุญาตใหม่</div>
    <div class="row">${cities}</div>`;
}
