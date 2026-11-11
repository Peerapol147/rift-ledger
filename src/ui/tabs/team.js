import { esc } from "../dom.js";

export function teamTab(s) {
  const rel = [
    s.c.married ? "แต่งงานแล้ว" : null,
    s.c.firstLove ? "เคยมีรักแรก" : null,
    s.c.partyContacts ? "มีเบอร์ติดต่อปาร์ตี้ชั่วคราว" : null,
    s.c.lentFriend ? "เคยให้เพื่อนยืมเงิน" : null,
  ].filter(Boolean);
  return `<h3>ทีม</h3><p class="dim">ยังไม่มีลูกทีมประจำ ระบบทีมเต็มรูปแบบ (จ้าง ความภักดี เติบโต) จะเปิดในอัปเดตถัดไป</p>
    <h3>ความสัมพันธ์</h3>${rel.length ? rel.map((r) => `<div>${esc(r)}</div>`).join("") : `<div class="dim">ยังไม่มีเรื่องที่บันทึกไว้</div>`}`;
}
