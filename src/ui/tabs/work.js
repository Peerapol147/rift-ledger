import * as C from "../../core/index.js";
import { CAREERS, COUNTRIES, cityOf, STATS, BUSINESSES } from "../../data/index.js";
import { esc, btn, money } from "../dom.js";

// same label twice in one month reads as one line with a count
const grouped = (list) => {
  const m = new Map();
  for (const e of list) { const g = m.get(e.label) ?? { label: e.label, amt: 0, n: 0 }; g.amt += e.amt; g.n++; m.set(e.label, g); }
  return [...m.values()];
};
const ledgerRow = (e) => `<tr><td>${esc(e.label)}${e.n > 1 ? ` <span class="dim">×${e.n}</span>` : ""}</td><td class="n ${e.amt < 0 ? "bad" : "good"}">${money(e.amt)}</td></tr>`;

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
  const owned = C.businesses(s);
  let biz = "";
  if (owned.length) {
    const staff = (s.staff ?? []).map((w) => `<div class="item"><span><b>${esc(w.n)}</b> · ฝีมือ ${"★".repeat(w.skill)}
      <small class="dim">อารมณ์: ${C.moodWord(w.loyalty)}</small></span>${btn("fireStaff:" + w.id, "ให้ออก", 'class="sm"')}</div>`).join("");
    const offers = C.staffOffers(s).map((w) => `<div class="item"><span><b>${esc(w.n)}</b> · ฝีมือ ${"★".repeat(w.skill)}</span>
      ${btn("hireStaff:" + w.id, "จ้าง", 'class="sm"')}</div>`).join("");
    biz = `<h3>กิจการของคุณ</h3>${owned.map((f) => `<div>${esc(BUSINESSES[f].n)}</div>`).join("")}
      <h4>ลูกน้อง ${(s.staff ?? []).length}/4</h4>${staff || `<div class="dim">ยังไม่มี</div>`}<h4>คนที่มาสมัครปีนี้</h4>${offers || `<div class="dim">ไม่มี</div>`}`;
  }
  return `<h3>งาน</h3>${job}${biz}
    <h3>เดือนนี้</h3><table>${grouped([...m.in, ...m.out]).map(ledgerRow).join("") || `<tr><td class="dim">ยังไม่มีรายการ</td></tr>`}
      <tr><td><b>สุทธิ</b></td><td class="n"><b>${money(m.net)}</b></td></tr></table>
    <h3>หนี้</h3><div class="kv"><span>ยอดหนี้ (ดอกเบี้ย 1%/เดือน)</span><b>${money(s.debt)}</b></div>
      <div class="kv"><span>วงเงินกู้</span><b>${money(C.debtCap(s))}</b></div>
      <div class="row">${btn("borrow", "กู้ ฿1,000", 'class="sm"')}${btn("repay", "ชำระ ฿1,000", 'class="sm"')}</div>
    <h3>รายการย้อนหลัง</h3><table>${s.ledger.slice(-30).reverse().map(ledgerRow).join("")}</table>
    <h3>ย้ายที่อยู่</h3><div class="dim">ตอนนี้อยู่ ${esc(cityOf(s.city).n)} · ย้ายข้ามประเทศ ตำแหน่งงานลดลงและต้องสอบใบอนุญาตใหม่</div>
    <div class="row">${cities}</div>`;
}
