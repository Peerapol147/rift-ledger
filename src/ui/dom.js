// Small DOM helpers shared by every view. Views return HTML strings; clicks are handled by one delegated listener.
export const $ = (q) => document.querySelector(q);
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (n) => "฿" + Math.round(n).toLocaleString("en-US");
export const pct = (v, max) => Math.max(0, Math.min(100, (100 * v) / Math.max(1, max)));
export const bar = (cls, v, max) => `<div class="bar ${cls}"><i style="width:${pct(v, max)}%"></i></div>`;
export const btn = (a, label, extra = "") => `<button data-a="${esc(a)}" ${extra}>${label}</button>`;

// localStorage behind try/catch: private windows and blocked storage must not break the game.
export const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

// Log tags → one colour family, used everywhere a tag is shown.
const TAG_CLASS = {
  ชีวิต: "t-life", ครอบครัว: "t-life", ความสัมพันธ์: "t-team", หมุดหมาย: "t-life", ร่างกาย: "t-life", ที่อยู่: "t-life",
  งาน: "t-work", เงิน: "t-work", งานใหญ่: "t-work",
  เกต: "t-gate", เกตแตก: "t-world", ตื่นพลัง: "t-gate", แรงก์: "t-gate", สกิล: "t-gate", ฮันเตอร์: "t-gate", ทีม: "t-team",
  ข่าวโลก: "t-world", เหตุการณ์โลก: "t-world",
};
export const tag = (t) => `<span class="tag ${TAG_CLASS[t] ?? ""}">${esc(t)}</span>`;
