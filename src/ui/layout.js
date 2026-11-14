// The always-visible parts: left card, event panel, controls and the tab bar.
import * as C from "../core/index.js";
import { STATS, RANKS, CAREERS, CLASSES, ROLES, COUNTRIES, cityOf } from "../data/index.js";
import { esc, money, bar, btn, tag } from "./dom.js";
import { prepPanel } from "./prep.js";
import { planTitle } from "./art.js";
import { SPEEDS } from "./cfg.js";
import { storyLine } from "./people.js";

export const POLICIES = { stop: "หยุดทุกตัวเลือก", important: "หยุดเฉพาะเรื่องสำคัญ", skip: "ข้ามถึงหมุดหมาย" };
const STAGE_TITLE = { kid: "เด็ก", teen: "วัยรุ่น", adult: "ผู้ใหญ่", old: "ผู้สูงวัย" };

function roleLine(s) {
  const st = C.stageOf(s);
  if (s.hunter) return `ฮันเตอร์ · ${esc(CLASSES[s.hunter.cls]?.n)} · Lv.${Number(s.hunter.lv)}`;
  if (s.job) return esc(C.jobTitle(s)) + ` · ${esc(CAREERS[s.job.id].n)}`;
  return `${STAGE_TITLE[st]}ใน${esc(cityOf(s.city).n)}`;
}

export function card(s) {
  const st = C.stageOf(s), life = C.lifespan(s);
  const stamp = s.hunter ? `<div class="stamp">${RANKS[s.hunter.rank]}</div>` : "";
  const stats = Object.entries(STATS).map(([k, n]) => `<div class="stat"><span>${n}</span><b>${Math.floor(s.st[k])}</b></div>`).join("");
  const alerts = C.alerts(s).map((a) => `<div class="alert">${esc(a.text)}</div>`).join("");
  const goals = C.goalProgress(s).map((g) =>
    `<div class="goal"><span>📌 ${esc(g.label)} <b class="num">${g.cur}/${g.target}</b>${g.done ? " ✓" : ""}</span>${btn("unpin:" + g.key, "×", 'class="sm"')}</div>`).join("");
  const main = C.focusList(s).find((f) => f.id === s.focus);
  const plans = C.focusList(s).map((f) => btn("focus:" + f.id, esc(f.n), s.focus === f.id ? 'class="on"' : "")).join("");
  const xp = s.hunter ? `<div class="kv"><span>EXP</span><b>${Math.floor(s.hunter.xp)}/${C.xpNeed(s.hunter.lv)}</b></div>${bar("xp", s.hunter.xp, C.xpNeed(s.hunter.lv))}` : "";
  return `
  <div class="who">${stamp}<div class="dim">${esc(COUNTRIES[s.country].n)} · ${esc(cityOf(s.city).n)}</div>
    <h2>${esc(s.name)}</h2><div class="role">${roleLine(s)}</div><div class="dim">${esc(C.dateText(s))}</div></div>
  <div class="kv"><span>อายุ</span><b>${C.ageY(s)} ปี</b></div>${bar("age", C.ageY(s), life)}
  <div class="kv"><span>สุขภาพ</span><b>${Math.round(s.hp)}/100</b></div>${bar("hp", s.hp, 100)}
  <div class="kv"><span>สุขภาพจิต</span><b>${Math.round(s.mind)}/100</b></div>${bar("mind", s.mind, 100)}
  ${xp}
  <div class="kv"><span>เงิน</span><b class="${s.gold < 0 ? "bad" : ""}">${money(s.gold)}</b></div>
  ${s.debt > 0 ? `<div class="kv"><span>หนี้</span><b class="bad">${money(s.debt)}</b></div>` : ""}
  ${st !== "kid" ? `<div class="kv"><span>ชื่อเสียง</span><b>${Number(s.fame)}</b></div>` : ""}
  <div class="stats">${stats}</div>${alerts}${goals}
  <h3>${planTitle(s)}</h3><div class="plan">${plans}</div>${planDesc(main)}${secondPlan(s)}`;
}

// What a choice touches if it goes well (core/events.js effectChips), small and dim under its label.
const chips = (fx) => (fx?.length ? `<small class="chips">${fx.map(esc).join(" · ")}</small>` : "");

// What the chosen plan does, in one line (data/stats.js desc).
const planDesc = (p) => (p?.desc ? `<div class="pdesc">${esc(p.desc)}</div>` : "");
// From 13: a secondary plan at half strength (core/clock.js focus2List).
function secondPlan(s) {
  const list = C.focus2List(s);
  if (!list.length) return "";
  const on = (id) => (s.focus2 === id || (!s.focus2 && id === "none") ? 'class="on"' : "");
  const btns = [btn("focus2:none", "ไม่มี", on("none")), ...list.map((f) => btn("focus2:" + f.id, esc(f.n), on(f.id)))];
  return `<h3>แผนรอง <span class="dim">(ผลครึ่งหนึ่ง)</span></h3><div class="plan">${btns.join("")}</div>`
    + (s.focus2 ? `<div class="pdesc">${esc(C.focus2Desc(s))}</div>` : "");
}

function badge(v) {
  if (v.odds == null && !v.risk) return "";
  const parts = [];
  if (v.odds != null) parts.push(`<span class="badge ${v.odds >= 70 ? "g" : v.odds >= 40 ? "m" : "b"}">${v.odds}%</span>`);
  if (v.risk > 0) parts.push(`<span class="badge b">อันตรายถึงชีวิต ${Math.round(v.risk * 100)}%</span>`);
  return parts.join(" ");
}

const TIER = { uncommon: "ไม่ธรรมดา", story: "เรื่องราว", rare: "หายาก", world: "เหตุการณ์โลก" };

// The decision itself opens as a card over the stage (#choice); the side panel then only says one is waiting.
export function choiceCard(s, waitingAuto, foldStart = false) {
  const k = C.eventKind(s);
  return `<div class="card t-${k.tier}" role="dialog" aria-modal="true" aria-label="${esc(s.ev.tag ?? "เหตุการณ์")}">`
    + `<div class="foldbar">${btn("fold", "พับไว้ดูก่อน ▾", 'class="sm"')}</div>${eventCard(s, waitingAuto)}`
    + `<label class="foldstart dim"><input type="checkbox" data-c="foldStart" ${foldStart ? "checked" : ""}>`
    + " เปิดเรื่องใหม่แบบพับไว้</label></div>";
}

export function eventPanel(s, waitingAuto, result, asking = false) {
  const res = result ? `<div class="result ${result.tone === "bad" ? "bad" : "good"}">${esc(result.text)}</div>` : "";
  // phones show the character card below everything, so the essentials ride here (CSS shows it only there)
  const m = `<div class="mstat">อายุ <b>${C.ageY(s)}</b> สุขภาพ <b>${Math.round(s.hp)}</b> จิต <b>${Math.round(s.mind)}</b>`
    + ` เงิน <b>${money(s.gold)}</b></div>`;
  const body = asking ? `<div class="evwait"><p>มีเรื่องรอคุณตัดสินใจ</p>${btn("unfold", "เปิดตัวเลือก")}</div>`
    : eventCard(s, waitingAuto);
  return m + res + storyLine(s) + body;
}

function eventCard(s, waitingAuto) {
  if (!s.ev) {
    const op = s.op ? `<p>กำลังดำเนินการ: ${esc(s.op.def.t)}</p>${opStatus(s)}` : `<p class="dim">ยังไม่มีเรื่องเข้ามา เมื่อมีเหตุการณ์หรือทางเลือกจะขึ้นที่ช่องนี้</p>`;
    return `<div class="ev"><span class="tag">เหตุการณ์</span>${op}<p class="dim">1–9 เลือก · Space หยุด · +/− ความเร็ว · A เปลี่ยนโหมดออโต้</p></div>`;
  }
  const ev = s.ev;
  let n = 0;
  const rows = ev.opts.map((o, i) => {
    const v = C.optionView(s, o);
    if (!v.visible) return "";
    n++;
    const lock = v.locked ? `<div class="lockrow">🔒 ${esc(v.lockText)} ${btn("pin:" + i, "📌 ปักเป้าหมาย", 'class="sm"')}</div>` : "";
    return `<div><button class="opt ${v.locked ? "lock" : ""}" data-a="choose:${i}" ${v.locked ? "disabled" : ""}>
      <span><kbd>${n}</kbd>${esc(v.label)}${v.desc ? `<small>${esc(v.desc)}</small>` : ""}${chips(v.fx)}</span><span>${badge(v)}</span></button>${lock}</div>`;
  }).join("");
  const prep = ev.id === "gateChoice" ? prepPanel(s) : "";
  const wait = waitingAuto ? `<div class="waitchip">⏸ เกมหยุดรอคุณเลือก</div>` : "";
  const k = C.eventKind(s);
  const tier = TIER[k.tier] && TIER[k.tier] !== ev.tag ? `<span class="tier ${k.tier}">${TIER[k.tier]}</span>` : "";
  const head = `<div class="evhead">${tier}${tag(ev.tag)}${k.part ? `<small class="dim">${k.part}</small>` : ""}</div>`;
  // your own numbers for the stats this choice tests (no odds beyond the badges already shown)
  const keys = [...new Set(ev.opts.map((o) => o.s).filter((x) => x && STATS[x]))];
  const strip = keys.length ? `<div class="evstats">${keys.map((x) => `${STATS[x]} <b>${Math.floor(s.st[x])}</b>`).join(" · ")}</div>` : "";
  const fate = !s.op && n > 1 && ev.id !== "gateChoice" ? `<button class="opt fate" data-a="fate">🎲 ให้ชะตาเลือก</button>` : "";
  return `<div class="ev ${ev.important ? "big" : ""} t-${k.tier}">${head}<p>${esc(ev.t)}</p>${strip}${prep}
    <div class="opts">${rows}${fate}</div>${wait}${s.op ? opStatus(s) : ""}</div>`;
}

function opStatus(s) {
  const o = s.op;
  const foes = o.foes.filter((f) => f.cur > 0).map((f) => `${esc(f.n)}${f.boss ? " (บอส)" : ""}`).join(", ");
  return `<div class="opbar"><div class="kv"><span>พลังชีวิตของคุณ</span><b>${Math.max(0, Math.round(o.hp))}/${Math.round(o.maxHp)}</b></div>
    ${bar("hp", o.hp, o.maxHp)}${foes ? `<div class="dim">ศัตรูที่เหลือ: ${foes}</div>` : ""}</div>`;
}

export function controls(ui) {
  const sp = SPEEDS.map((n) => btn("speed:" + n, n + "×", ui.speed === n && !ui.paused ? 'class="on"' : "")).join("");
  const pol = Object.entries(POLICIES).map(([k, n]) => `<option value="${k}" ${ui.policy === k ? "selected" : ""}>${n}</option>`).join("");
  return `${btn("pause", ui.paused ? "เล่นต่อ" : "หยุด")}${sp}
    <select data-c="policy" aria-label="โหมดออโต้">${pol}</select><span class="sp"></span>${btn("settings", "ตั้งค่า")}`;
}

export const TABS = [
  ["log", "บันทึก", () => true],
  ["me", "ตัวฉัน", () => true],
  ["items", "ของ", (s) => C.stageOf(s) !== "kid"],
  ["team", "ทีม", (s) => C.stageOf(s) !== "kid"],
  ["work", "งานและเงิน", (s) => C.ageY(s) >= 15 || !!s.job],
  ["world", "โลก", () => true],
  ["book", "สมุดสะสม", () => true],
];

export const tabsBar = (s, cur) =>
  TABS.filter(([, , ok]) => ok(s)).map(([k, n]) => btn("tab:" + k, n, cur === k ? 'class="on"' : "")).join("");

export { ROLES };
