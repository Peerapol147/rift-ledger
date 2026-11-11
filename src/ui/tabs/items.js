import * as C from "../../core/index.js";
import { ITEMS, RARITY } from "../../data/index.js";
import { esc, btn, money } from "../dom.js";

const KINDS = { "": "ทั้งหมด", weapon: "อาวุธ", armor: "เกราะ", charm: "เครื่องประดับ", potion: "ยา", material: "วัตถุดิบ", book: "หนังสือสกิล", relic: "ของวิเศษ" };
const SORTS = { rarity: "ความหายาก", name: "ชื่อ", new: "ได้มาล่าสุด" };

const delta = (d) => Object.entries(d).filter(([, v]) => v).map(([k, v]) =>
  `<span class="${v > 0 ? "up" : "dn"}">${{ atk: "โจมตี", def: "ป้องกัน", hp: "พลังชีวิต" }[k]} ${v > 0 ? "↑" : "↓"}${Math.abs(v)}</span>`).join(" ");

export function itemsTab(s, ui) {
  const f = ui.itemFilter;
  const list = C.sortFilter(s.items, f);
  const eq = new Set(Object.values(s.equip));
  const rows = list.map((it) => {
    const d = ITEMS[it.id], r = RARITY[d.rarity];
    const acts = [
      d.slot && !eq.has(it.uid) ? btn("equip:" + it.uid, "สวม", 'class="sm"') : "",
      d.use && d.use !== "revive" ? btn("use:" + it.uid, "ใช้", 'class="sm"') : "",
      btn("lock:" + it.uid, it.lock ? "🔒" : "🔓", 'class="sm" title="ล็อกกันขาย"'),
      !it.lock && !eq.has(it.uid) ? btn("sell:" + it.uid, "ขาย " + money(d.price * 0.5), 'class="sm"') : "",
    ].join("");
    return `<div class="item" style="--rc:${r.c}"><span><b>${esc(d.n)}</b> ${eq.has(it.uid) ? "(สวมอยู่)" : ""}
      <small class="dim">${r.n} · ได้จาก ${esc(it.from)}</small> ${d.slot ? delta(C.compare(s, it.uid)) : ""}</span><span>${acts}</span></div>`;
  }).join("") || `<div class="dim">ไม่มีของที่ตรงเงื่อนไข</div>`;
  const kindSel = Object.entries(KINDS).map(([k, n]) => `<option value="${k}" ${f.kind === k || (!f.kind && !k) ? "selected" : ""}>${n}</option>`).join("");
  const sortSel = Object.entries(SORTS).map(([k, n]) => `<option value="${k}" ${f.sort === k ? "selected" : ""}>${n}</option>`).join("");
  const junk = RARITY.slice(1, 3).map((r, i) => `<option value="${i + 1}">ต่ำกว่า ${r.n}</option>`).join("");
  const loads = Object.keys(s.loadouts ?? {}).map((n) => btn("loadUse:" + n, "ใช้ชุด " + esc(n), 'class="sm"')).join("");
  return `<h3>กระเป๋า ${s.items.length}/${C.bagCap(s)}</h3>
    <div class="row"><select data-c="kind">${kindSel}</select><select data-c="sort">${sortSel}</select>
      <input data-c="q" placeholder="ค้นหา" value="${esc(f.q)}" style="flex:1;min-width:120px"></div>
    <div style="margin-top:8px">${rows}</div>
    <h4>ขายของขยะอัตโนมัติ (ไม่แตะของที่ล็อกหรือสวมอยู่)</h4>
    <div class="row"><select data-c="junk">${junk}</select>${btn("junk", "ขายเลย", 'class="sm"')}</div>
    <h4>ชุดอุปกรณ์</h4><div class="row">${btn("loadSave", "บันทึกชุดปัจจุบัน", 'class="sm"')}${loads}</div>`;
}
