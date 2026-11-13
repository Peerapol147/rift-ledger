// Presentation-only chrome for the owner-approved Hunter interface. No gameplay mutations.
import * as C from '../core/index.js';
import { COUNTRIES, cityOf } from '../data/world.js';
import { esc, money, bar } from './dom.js';

const PATHS = {
  log: '<path d="M8 3h8l3 3v15H5V3h3Zm0 5h8M8 12h8M8 16h5"/>',
  me: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  items: '<path d="M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2"/>',
  team: '<circle cx="9" cy="8" r="3"/><circle cx="18" cy="9" r="2"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m1-7a5 5 0 0 1 5 5v2"/>',
  work: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V3h8v4M2 12h20m-12 0v4h4v-4"/>',
  world: '<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/>',
  book: '<path d="M12 5C7 2 3 3 2 4v16c3-2 7-1 10 1 3-2 7-3 10-1V4c-3-2-7-1-10 1Zm0 0v16"/>',
  plan: '<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h3"/>',
  settings: '<path d="m9 3 1-2h4l1 2 3 2 3 1v4l-2 2 2 2v4l-3 1-3 2-1 2h-4l-1-2-3-2-3-1v-4l2-2-2-2V6l3-1 3-2Z"/><circle cx="12" cy="12" r="3"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  arrow: '<path d="m8 4 8 8-8 8"/>',
};
export const icon = (name) => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"`
  + ` stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] ?? PATHS.log}</svg>`;

export function interfaceStatus(s, ui) {
  if (ui.settings) return { text: 'ตั้งค่า', kind: 'paused' };
  if (ui.paused) return { text: 'หยุดแล้ว', kind: 'paused' };
  if (s.ev && C.autoDecide(s, ui.policy) < 0) return { text: 'รอคุณเลือก', kind: 'waiting' };
  return s.op ? { text: 'กำลังปฏิบัติการ', kind: 'running' } : { text: 'กำลังใช้ชีวิต', kind: 'running' };
}
export function hunterHeader(s, ui) {
  const state = interfaceStatus(s, ui);
  return `<a class="brand" href="#game" aria-label="Rift Ledger"><span class="rift-mark" aria-hidden="true">ϟ</span>`
    + `<span>RIFT LEDGER<small>บันทึกหลังรอยแยก</small></span></a>`
    + `<div class="world-stamp">${esc(C.dateText(s))}<span>${esc(COUNTRIES[s.country].n)} · ${esc(cityOf(s.city).n)}</span></div>`
    + `<div class="system-status ${state.kind}" role="status"><i aria-hidden="true"></i>${state.text}</div>`
    + `<div class="mobile-identity"><b>${esc(s.name)}</b><span>อายุ ${C.ageY(s)} ปี</span><strong>${money(s.gold)}</strong>`
    + `<div><span>สุขภาพ ${Math.round(s.hp)}/100</span>${bar('hp', s.hp, 100)}</div>`
    + `<div><span>สุขภาพจิต ${Math.round(s.mind)}/100</span>${bar('mind', s.mind, 100)}</div></div>`;
}
