import { weatherFor } from "./weather-art.js";
// DOM layer. Clicks use one delegated pointerdown, so re-rendering between press and release can't lose them.
import * as E from "./engine.js";
import * as D from "./data.js";
import { initStage, setScene, setHero, trigger, stage as ST, skip } from "./stage.js";
import { monsterIcon, monsterCss } from "./monster-art.js";
import { MONSTERS, KINDS } from "./monsters.js";
const { fmt, age, stat, mod } = E, { STATS, RANKS, CLASSES, SPECIALS, LATENTS, CAREERS, ELEMENTS, WEAPONS, ARMORS, CHARMS, GRADES, QUAL, MATS, HALLS, LVCAP } = D;
const $ = (q) => document.querySelector(q), KEY = "riftledger.save.v1", HALL = "riftledger.hall.v1";
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } }, del: (k) => { try { localStorage.removeItem(k); } catch {} } };
let s = null, tab = "log", speed = 2, paused = false, auto = false, acc = 0, last = 0, autoT = 0, dirty = true, tip = null, onlyImp = false, craftForm = { slot: "weapon", t: 0, g: 0 }, ticks = 0;
const SPEEDS = { 1: 0.8, 2: 0.4, 4: 0.17, 8: 0.07 }, SND = "riftledger.snd";
// Feel layer state: last choice result, the short beat after it, when the current event appeared, and number-change flashes.
const subAt = {};
let res = null, holdT = 0, shownEv = null, evAt = 0, snd = store.get(SND) !== "0", seen = {}, chg = {}, wasBusy = false, moT = 0, moE = null;
// Player settings live apart from the life save, so they outlast a death: sound, text size, calm mode (no shake or white flashes), last speed.
const CFG = "riftledger.cfg.v1", ZOOM = [1, 1.12, 1.25], ZOOM_N = ["ปกติ", "ใหญ่", "ใหญ่มาก"];
const cfg = (() => { let c = {}; try { c = JSON.parse(store.get(CFG)) || {}; } catch {} return { snd: typeof c.snd === "boolean" ? c.snd : store.get(SND) !== "0", font: [0, 1, 2].includes(c.font) ? c.font : 0, calm: !!c.calm, speed: [1, 2, 4, 8].includes(c.speed) ? c.speed : 2 }; })();
const saveCfg = () => store.set(CFG, JSON.stringify(cfg));
function applyCfg() { snd = cfg.snd; document.documentElement.style.setProperty("--z", ZOOM[cfg.font]); document.body.style.zoom = ZOOM[cfg.font]; document.body.classList.toggle("calm", cfg.calm); ST.calm = cfg.calm; }
let cfgOpen = false;
// Input as named actions: gameplay asks for an action, and which physical keys reach it is this table (e.code, so layouts don't matter).
// To rebind, change `codes`; the on-screen hints are written from the same rows.
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((n) => [`Digit${n}`, `Numpad${n}`]);
const BIND = [
  { a: "pick", n: "เลือกตัวเลือกตามเลขหน้าข้อ", hint: "เลือก", keys: ["1", "9"], codes: digits },
  { a: "pause", n: "หยุด / เล่นต่อ", hint: "หยุด", keys: ["Space"], codes: ["Space"] },
  { a: "faster", n: "เร่งเวลา", hint: "", keys: ["+"], codes: ["Equal", "NumpadAdd", "BracketRight"] },
  { a: "slower", n: "ชะลอเวลา", hint: "ความเร็ว", keys: ["−"], codes: ["Minus", "NumpadSubtract", "BracketLeft"] },
  { a: "auto", n: "เปิด / ปิดออโต้", hint: "ออโต้", keys: ["A"], codes: ["KeyA"] },
  { a: "cfg", n: "เปิด / ปิดตั้งค่า", hint: "", keys: ["Esc"], codes: ["Escape"] },
];
const keyCap = (b) => (b.a === "pick" ? `<kbd>${b.keys[0]}</kbd>–<kbd>${b.keys[1]}</kbd>` : b.keys.map((k) => `<kbd>${k}</kbd>`).join(""));
const keyHint = () => BIND.filter((b) => b.a !== "cfg").map((b) => keyCap(b) + (b.hint ? ` ${b.hint} ` : "")).join("");
// A region is only rewritten when its HTML changed, so hover, scroll and running animations survive the monthly redraw.
const put = (q, html) => { const el = $(q); if (el._h === html) return false; el._h = html; el.innerHTML = html; return true; };
// Tiny synth, no audio files: every sound is a few shaped oscillator notes.
let AC = null; const sfxAt = {};
function tone(f, t0, d, type = "triangle", g = 0.05, f2 = 0) { const o = AC.createOscillator(), a = AC.createGain(), t = AC.currentTime + t0; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(a).connect(AC.destination); o.start(t); o.stop(t + d + 0.03); }
const SFX = { tap: () => tone(540, 0, 0.05, "square", 0.012), ev: () => tone(700, 0, 0.1, "sine", 0.03), ok: () => { tone(523, 0, 0.12); tone(784, 0.09, 0.2); }, fail: () => tone(210, 0, 0.3, "sawtooth", 0.03, 105), lv: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.15)), big: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.34, "triangle", 0.06)), dead: () => [330, 262, 196, 131].forEach((f, i) => tone(f, i * 0.24, 0.55, "sine", 0.06)) };
function sfx(n) { if (!snd) return; try { const now = performance.now(); if (now - (sfxAt[n] || 0) < 90) return; sfxAt[n] = now; AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state !== "running") { AC.resume(); return; } SFX[n]?.(); } catch {} } // a context the browser hasn't unlocked yet would only pile up notes that never play
// A number that just moved shows its change for a moment. The negative delay keeps the animation running across redraws.
function dl(k, v, min = 1) {
  const now = performance.now(), p = seen[k]; seen[k] = v;
  if (p != null && Math.abs(v - p) >= min) { chg[k] = { d: v - p, t: now }; setTimeout(() => (dirty = true), 1550); }
  const c = chg[k]; if (!c || now - c.t > 1500) return "";
  return `<i class="dv ${c.d > 0 ? "up" : "dn"}" style="animation-delay:-${Math.floor((now - c.t) / 100) * 100}ms">${c.d > 0 ? "+" : "−"}${fmt(Math.abs(Math.round(c.d)))}</i>`;
}
// Stage banner for the few moments a life turns on.
function moment(k, title, sub = "", c = "var(--leg)", hold = 1.3, long = false) { const now = performance.now(); if (long && now - (moment.at || 0) < 1800) return; moment.at = now; $("#moment").innerHTML = `<div class="mo" style="--c:${c}"><small>${esc(k)}</small><b class="${long ? "long" : ""}">${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>`; clearTimeout(moT); moT = setTimeout(() => ($("#moment").innerHTML = ""), 2600); holdT = Math.max(holdT, hold); }
function milestone(n) {
  const tags = n === "awaken" ? ["ปลุกพลัง", "คลาสพิเศษ"] : n === "rank" ? ["แรงก์", "อาชีพ"] : ["วิชา", "ของ", "ปั้นสเตตัส"]; let e = null;
  for (let i = s.log.length - 1; i >= Math.max(0, s.log.length - 8) && !e; i--) if (tags.includes(s.log[i].tag)) e = s.log[i];
  if (!e || e === moE) return false; if (n !== "awaken" && n !== "rank" && e.cls !== "leg") return false; moE = e;
  if (e.tag === "ปลุกพลัง") moment("ตื่นพลัง", CLASSES[s.cls].n, `ฮันเตอร์แรงก์ ${RANKS[s.rank]}`, CLASSES[s.cls].c, 1.8);
  else if (e.tag === "คลาสพิเศษ") moment("คลาสพิเศษ", SPECIALS.find((x) => x.id === s.spc)?.n || "", "ชะตาเปิดทางใหม่ให้ชีวิตนี้", "#c86bff", 1.8);
  else if (e.tag === "แรงก์") moment("เลื่อนแรงก์", `แรงก์ ${RANKS[s.rank]}`, "สมาคมบันทึกชื่อคุณแล้ว", "#ffd76a", 1.5);
  else if (e.tag === "อาชีพ") { if (!s.career || !/^เลื่อนตำแหน่ง/.test(e.t)) return false; moment("เลื่อนตำแหน่ง", CAREERS[s.career].t[s.cr], CAREERS[s.career].n, "#62e0a1", 1.2); }
  else moment(e.tag === "ของ" ? "ของหายาก" : e.tag === "วิชา" ? "วิชาหายาก" : "สายฝึกหายาก", e.t, "", "#ffd76a", 0.8, true);
  return true;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const bar = (v, c = "") => `<div class="bar ${c}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
const btn = (l, a, c = "", off = false) => `<button class="${c}" data-a="${a}"${off ? " disabled" : ""}>${l}</button>`;

// Save format. Bump SAVE_VERSION when the shape of a life changes, and add MIGRATE[old] = (life) => life in the new shape; loads then walk old saves up one version at a time.
// New optional fields (s.marks, s.bst, s.hl...) need no bump: the code reads them with a default.
const SAVE_VERSION = 1, MIGRATE = {};
let saveErr = false, newerSave = false;
// Written to a temp key first, the previous good save kept as .bak. A failed write (storage full or blocked) is told to the player, not swallowed.
function save() { const j = JSON.stringify(s), p = store.get(KEY), ok = store.set(KEY + ".tmp", j) && store.set(KEY, j); store.del(KEY + ".tmp"); if (ok && p && goodRaw(p)) store.set(KEY + ".bak", p); /* a damaged save is never promoted to the backup */ if (saveErr === ok) { saveErr = !ok; dirty = true; } }
// Only what the game cannot run without is checked, so a hand-edited or cut-off save falls through to the backup.
const validSave = (v) => v && typeof v === "object" && typeof v.name === "string" && Number.isFinite(v.ageM) && v.st && Object.keys(STATS).every((k) => Number.isFinite(v.st[k])) && Array.isArray(v.log) && Array.isArray(v.npcs) && v.w && typeof v.w === "object" && v.c && typeof v.c === "object";
const goodRaw = (raw) => { try { return validSave(JSON.parse(raw)); } catch { return false; } };
function load() {
  newerSave = false;
  for (const k of [KEY, KEY + ".bak"]) { try { let v = JSON.parse(store.get(k)); if (!v || !Number.isInteger(v.v)) continue; if (v.v > SAVE_VERSION) { newerSave = true; continue; } // from a newer build: never guessed at, never overwritten silently
    while (v.v < SAVE_VERSION) { v = MIGRATE[v.v](v); v.v++; } if (validSave(v)) return v; } catch {} }
  return null;
}
const hallList = () => { try { return JSON.parse(store.get(HALL)) || []; } catch { return []; } };
const randSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const fresh = () => { res = null; seen = {}; chg = {}; holdT = 0; moE = null; $("#moment").innerHTML = ""; };
function start(seed, name, legacy) { if (newerSave) { const raw = store.get(KEY); if (raw) store.set(KEY + ".newer", raw); newerSave = false; } s = E.newLife(seed, name, legacy); fresh(); tab = "log"; paused = false; $("#start").hidden = true; $("#end").hidden = true; $("#game").hidden = false; dirty = true; save(); draw(); }
function menu() {
  const sv = load(), n = D.GIVEN[(Math.random() * D.GIVEN.length) | 0]; $("#game").hidden = true; $("#end").hidden = true; $("#start").hidden = false;
  const h = hallList().slice(0, 6);
  $("#start").innerHTML = `<div class="st-card"><p class="kicker">สมาคมฮันเตอร์ · แฟ้มทะเบียนผู้อยู่อาศัย</p><h1>บันทึกหลังรอยแยก</h1><p class="lede">เกิดหนึ่งครั้งในเมืองที่ฟ้าแตกไปแล้ว Seed กำหนดพลังแฝง คลาส เควส หอคอย และปฏิทินภัยพิบัติของชีวิตนี้ ที่เหลือคือสิ่งที่คุณเลือก</p>
  <label>ชื่อ<input id="iname" maxlength="20" value="${n}"></label><label>Seed ของชีวิต<span class="row"><input id="iseed" maxlength="24" value="${randSeed()}">${btn("สุ่ม", "reseed", "ghost")}</span></label>
  <div class="row">${btn("เริ่มชีวิตใหม่", "new", "pri")}${sv ? btn(`เล่นต่อ: ${esc(sv.name)} อายุ ${E.age(sv)}`, "cont", "ghost") : ""}</div>
  <ul class="how"><li><b>วางแผนรายเดือน</b> เลือกว่าจะใช้เวลากับอะไร เวลาเดินเองจนกว่าจะมีเรื่องเข้ามา</li><li><b>เหตุการณ์คือทางแยก</b> อ่านโอกาสและสิ่งที่เดิมพันก่อนเลือก ผลจะประทับลงแฟ้มทันที</li><li><b>คีย์ลัด</b> ${keyHint()}</li></ul>${newerSave ? `<p class="bad">พบเซฟจากเกมรุ่นใหม่กว่านี้ รุ่นนี้เปิดไม่ได้ ถ้าเริ่มชีวิตใหม่ เซฟนั้นจะถูกเก็บสำรองไว้ ไม่ถูกลบ</p>` : ""}
  ${h.length ? `<h3>ชีวิตที่ผ่านมา</h3><ul class="hall">${h.map((x) => `<li><b>${esc(x.n)}</b> · ${esc(x.title)} · ${x.age} ปี · ${fmt(x.score)} แต้ม <small>Seed ${esc(x.seed)}</small></li>`).join("")}</ul>` : ""}</div>`;
  $("#start [data-a='new']")?.focus(); // a screen always opens with its main action focused, so Enter alone starts a life
}
function ended() {
  const d = s.dead, h = hallList(); if (!s.saved) { s.saved = 1; h.unshift({ n: s.name, title: d.title, age: d.age, score: d.score, seed: s.seed }); store.set(HALL, JSON.stringify(h.slice(0, 30))); } store.del(KEY); store.del(KEY + ".bak");
  // The life in a few lines: the earliest turning points and the last ones.
  const all = (s.hl || s.log.filter((x) => x.cls === "leg")).filter((x) => x.tag !== "จบชีวิต" && !/^ข่าว|^โลก$/.test(x.tag || "")), hl = all.length > 8 ? [...all.slice(0, 3), ...all.slice(-5)] : all;
  $("#end").hidden = false; $("#end").innerHTML = `<div class="st-card fin"><p class="kicker">ปิดแฟ้มทะเบียน</p><h1>${esc(s.name)}</h1><p class="title">${esc(d.title)}</p><p class="lede">จากไปเมื่ออายุ ${d.age} ปี · ${esc(d.cause)}</p>${hl.length ? `<ul class="hl">${hl.map((x) => `<li><i>อายุ ${x.y}</i>${esc(x.t)}</li>`).join("")}</ul>` : ""}<ul class="hl">${E.fatesOf(s).map((t) => `<li><i>หลังจากนั้น</i>${esc(t)}</li>`).join("")}</ul><div class="sum"><span>${s.hunter ? `แรงก์ ${RANKS[s.rank]} · Lv.${s.lv}` : esc(s.career ? CAREERS[s.career].t[s.cr] : "ไม่มีอาชีพ")}</span><span>หอชั้น ${s.floor}</span><span>ชื่อเสียง ${fmt(s.fame)}</span><span>กรรม ${s.karma}</span><span>เงิน ₡${fmt(s.gold)}</span><span>${fmt(d.score)} แต้ม</span></div><div class="row">${btn("ชีวิตใหม่", "menu", "pri")}${btn("เล่น Seed เดิม", "same", "ghost")}${s.kids.length ? btn(`สืบต่อเป็น ${esc(s.kids[0])}`, "heir", "ghost") : ""}</div></div>`; $("#end [data-a='menu']")?.focus();
}
// Which picture the stage shows comes from what the character is doing.
const CAREER_SCENE = { doc: "clinic", smith: "forge", trader: "market", pawn: "market", cook: "market", press: "market", cop: "wall", barrier: "wall", signal: "wall", rescue: "wall", mortician: "ruins", ruin: "ruins", medium: "ruins", arena: "arena", porter: "rift", clerk: "guild", lawyer: "guild" };
// Hunt scenery changes every half year so a long life does not sit in one backdrop.
function sceneFor() { const st = E.stage(s); if (st === "k") return "home"; if (s.ev?.tag === "โลก") return "rift"; if (st === "c") return s.focus === "craft" ? "forge" : CAREER_SCENE[s.career] || "street"; const b = Math.floor(s.ageM / 6); return { hunt: s.at ? E.placeOf(s).sc : ["rift", "ruins", "frost", "ember"][b % 4], tower: "tower", guild: "guild", craft: "forge", train: b % 2 ? "arena" : "city", rest: "home" }[s.focus] || "city"; }
// What the seed leans toward and how the trained stats bend it: a kid reads it to plan the years, a civilian to see if a late awakening would still land there.
function aptBox() {
  const T = s.w.tal; if (!T) return "";
  const card = (id, secret) => { const x = E.talOf(id), tr = D.TALENT_TIERS[x.t]; return `<div class="item on"><b style="color:${tr.c}">${secret ? "🔒 " : ""}${esc(x.n)} <small>(${tr.n})</small></b><small>${esc(x.d)} · ${esc(E.perkText(x.m))}</small></div>`; };
  const sec = T.sec ? (E.talSecretOut(s) ? card(T.sec, true) : `<div class="item"><b>??? พรสวรรค์ลับ</b><small>บางอย่างหลับอยู่ในตัว จะปรากฏเมื่อถึงวัยตื่นพลัง</small></div>`) : "";
  return `<h3>พรสวรรค์ติดตัว</h3><p class="dim">ของขวัญที่ติดมาตั้งแต่เกิด มีผลตลอดชีวิต${s.hunter || !s.career ? "" : ` · ตื่นพลังภายหลังปีละ ${(E.lateP(s) * 100).toFixed(1)}%`}</p><div class="grid2">${card(T.open)}${sec}</div>`;
}
function card() {
  const st = E.stage(s), d = E.derive(s), cl = s.cls ? CLASSES[s.cls] : null, L = E.lifespan(s), rank = s.hunter ? RANKS[s.rank] : st === "k" ? "—" : "ปชช";
  const role = s.hunter ? `${s.spc ? SPECIALS.find((x) => x.id === s.spc).n : cl.n}` : s.career ? `${CAREERS[s.career].t[s.cr]} · ${CAREERS[s.career].n}` : "เด็กในเมืองหลังแนวกั้น";
  const prog = s.hunter ? `<div class="kv"><span>Lv.${s.lv} / ${LVCAP[s.rank]}</span><b>EXP ${fmt(s.xp)}/${fmt(E.xpNeed(s.lv))}</b></div>${bar((s.xp / E.xpNeed(s.lv)) * 100, "xp")}` : s.career ? `<div class="kv"><span>ผลงาน</span><b>${fmt(s.cxp)}</b></div>` : "";
  const stats = Object.entries(STATS).map(([k, n]) => `<button class="stat${tip === k ? " on" : ""}" data-a="tip:${k}"><small>${n}</small><b>${Math.floor(stat(s, k))}</b>${dl(k, Math.floor(stat(s, k)))}</button>`).join("");
  return `<div class="lic"><div class="stamp ${s.hunter ? "r" + s.rank : ""}">${rank}</div><p class="kicker">${s.hunter ? "ใบอนุญาตฮันเตอร์" : "บัตรผู้อยู่อาศัย"}</p><h2>${esc(s.name)}</h2><p class="role" style="${cl ? `color:${cl.c}` : ""}">${esc(role)}</p><p class="meta">${age(s)} ปี · ${E.dateText(s)}</p></div>
  <p class="sec">ร่างกายและเส้นทาง</p><div class="kv"><span>สุขภาพ</span><b>${Math.round(s.health)}/100</b>${dl("hp", Math.round(s.health), 6)}</div>${bar(s.health, s.health < 35 ? "hp low" : "hp")}<div class="kv"><span>อายุขัย</span><b>${age(s)}/${Math.round(L)} ปี</b></div>${bar((age(s) / L) * 100, "age")}<div class="kv"><span>แรงใจ · ${E.willBand(s)}</span><b>${E.willOf(s)}/${D.WILL.max}</b></div>${bar((Math.max(0, E.willOf(s)) / D.WILL.max) * 100, E.willOf(s) < 0 ? "hp low" : "amb")}<div class="kv"><span>งวดชีวิต</span><b>${s.loans || 0}/${D.LOANS.length}</b></div><p class="dim">${E.traitText(s)}</p><p class="dim">ครอบครัว ${E.val(s, "home")}/10 · ${E.val(s, "side") >= 0 ? `ฝั่งผู้คน ${E.val(s, "side")}` : `ฝั่งสมาคม ${-E.val(s, "side")}`}</p>${prog}
  <p class="sec">ค่าสถานะ <small>แตะเพื่อดูที่มา</small></p><div class="stats">${stats}</div>${tip ? `<div class="tip"><b>${STATS[tip]} มาจาก</b>${E.breakdown(s, tip).map((x) => `<div class="kv"><span>${esc(x.n)}</span><b>${x.v > 0 ? "+" : ""}${x.v}</b></div>`).join("")}</div>` : ""}
  ${E.markList(s).length ? `<p class="sec">สิ่งที่ติดตัวจากการเลือก</p>${E.markList(s).map((m) => `<div class="mk ${m.bad ? "bad" : "ok"}"><b>${esc(m.n)}</b><small>${esc(E.perkText(m.m))} · อีก ${m.left} เดือน</small></div>`).join("")}` : ""}<p class="sec">ทรัพย์และชื่อ</p><div class="vit"><span title="เงิน">₡<b>${fmt(s.gold)}</b>${dl("gold", s.gold, Math.max(200, Math.abs(s.gold) * 0.08))}</span><span>ชื่อเสียง <b>${fmt(s.fame)}</b>${dl("fame", Math.floor(s.fame))}</span><span>กรรม <b>${s.karma > 0 ? "+" : ""}${Math.round(s.karma)}</b>${dl("karma", Math.round(s.karma))}</span>${s.hunter ? `<span>พลังรบ <b>${fmt(d.power)}</b></span>` : ""}</div>

  `;
}
const chip = (e) => { if (!e) return ""; const a = []; if (e.gold) a.push(`${e.gold > 0 ? "+" : "−"}เงิน`); if (e.xp) a.push("EXP"); if (e.hp) a.push(`สุขภาพ ${e.hp > 0 ? "+" : ""}${e.hp}`); if (e.fame) a.push("ชื่อเสียง"); if (e.karma) a.push(`กรรม ${e.karma > 0 ? "+" : ""}${e.karma}`); if (e.skill) a.push("วิชา"); if (e.gear) a.push("อุปกรณ์"); if (e.mat) a.push("วัตถุดิบ"); if (e.rankUp) a.push("เลื่อนแรงก์"); if (e.setSpc) a.push("คลาสพิเศษ"); if (e.awaken) a.push("ตื่นพลัง"); if (e.main) a.push("สัญญาหลัก"); if (e.sta) for (const k in e.sta) a.push(`${STATS[k]} ${e.sta[k] > 0 ? "+" : "−"}${Math.abs(Math.round(e.sta[k] * 100) / 100)}`); if (e.mark && D.MARKS[e.mark[0]]) a.push(`ติดตัว ${e.mark[1]} เดือน: ${D.MARKS[e.mark[0]].n} (${E.perkText(D.MARKS[e.mark[0]].m)})`); if (e.next) a.push("มีเรื่องตามมา"); if (e.disc) a.push("คืบหน้าวิถี"); if (e.rel) a.push(`ความสัมพันธ์ ${e.rel > 0 ? "+" : ""}${e.rel}`); if (e.cxp) a.push("ผลงาน"); if (e.will) a.push(`แรงใจ ${e.will > 0 ? "+" : ""}${e.will}`); if (e.home) a.push(`ครอบครัว ${e.home > 0 ? "+" : ""}${e.home}`); if (e.side) a.push(`${e.side > 0 ? "ฝั่งผู้คน" : "ฝั่งสมาคม"} ${Math.abs(e.side)}`); if (e.tr) a.push(`นิสัย: ${Object.keys(e.tr).map((k) => D.TRAITS[k]).join(" ")}`); return a.join(" · "); };
// What a tested option asks for and what each outcome brings, so the risk is read before the click.
const stakes = (o, p) => { if (p == null) return ""; const win = o.s && !o.fight ? { ...o.y, sta: { ...(o.y?.sta || {}), [o.s]: (o.y?.sta?.[o.s] || 0) + E.growOf(s, o.s) } } : o.y, need = o.s && !o.fight ? E.needOf(s, o.s, o.d) : 0, have = need ? Math.floor(stat(s, o.s)) : 0; return `${need ? `<i class="${have >= need ? "g" : "b"}">เงื่อนไข ${STATS[o.s]} ${need} · คุณมี ${have}${have >= need ? " ✓" : " (ยังเสี่ยงพลาด)"}</i>` : ""}<i><b class="g">${o.fight ? "ชนะ" : "สำเร็จ"}: ${esc(chip(win) || "เรื่องเดินต่อ")}</b> · <b class="b">${o.fight ? "แพ้" : "พลาด"}: ${esc(chip(o.n) || "ไม่เสียอะไร")}</b></i>`; };
// With no event pending, the same panel holds the monthly decision and the next milestone.
function desk() {
  const st = E.stage(s), fs = E.FOCUS[st], ex = E.examInfo(s), R = RANKS[s.rank + 1], next = s.career && CAREERS[s.career].t[s.cr + 1];
  const goal = st === "k" ? `ทุกเดือนในวัยเด็กจะกลายเป็นค่าสถานะติดตัวไปตอนโต${E.aptOdds(s)[0] ? ` · แววพลังนำอยู่: ${E.aptOdds(s)[0].n} (${STATS[E.aptOdds(s)[0].st]}) ดูที่ ตัวละคร › พลัง` : ""}` : s.hunter ? (!R ? "ไม่มีแรงก์ให้ไต่อีกแล้ว เหลือแต่ชื่อที่จะทิ้งไว้" : ex.ready ? `พร้อมสอบแรงก์ ${R} แล้ว รอซองเรียกจากสมาคม${s.bank ? ` · EXP สะสมรอ ${fmt(s.bank)}` : ""}` : `สู่แรงก์ ${R}: Lv.${s.lv}/${LVCAP[s.rank] - 2} · สัญญาหลัก ${ex.have}/${ex.need}`) : next ? (ex.ready ? `พร้อมเลื่อนเป็น ${next} แล้ว รอคำสั่งจากที่ทำงาน` : `สู่ตำแหน่ง ${next}: สัญญาหลัก ${ex.have}/${ex.need} · ผลงาน ${ex.cxp}/${ex.cxpNeed}${ex.have >= ex.need ? " · รอผลงาน" : ""}`) : s.career ? "ถึงจุดสูงสุดของสายงานแล้ว" : "ยังไม่มีงานประจำ รอโอกาสที่จะผ่านเข้ามา";
  const warn = st !== "k" && s.health < 35 && s.focus !== "rest" ? `<p class="bad">สุขภาพเหลือน้อย เปลี่ยนไปที่ "${fs.rest.n}" ก่อนจะล้มไปเอง</p>` : "";
  // Hunter plans sit under their own headings; farm, travel and tower details live in their own tabs.
  const shut = (k) => k === "tower" && !E.towerOk(s), fb = (k) => (fs[k] ? btn(fs[k].n + (shut(k) ? ` 🔒 ${E.TOWER_AGE}+` : ""), `focus:${k}`, s.focus === k ? "on" : "", shut(k)) : ""), grp = (t, ks, note = "") => `<div class="fgrp"><span class="gl">${t}${note ? ` <small>${note}</small>` : ""}</span><div class="focus">${ks.map(fb).join("")}</div></div>`;
  const plan = st === "h" ? `${grp("ฟาร์ม", ["hunt"], esc(E.placeOf(s).n))}${grp("หอ", ["tower"], s.run ? `รอบนี้ ${s.run.n} ชั้น` : `ชั้น ${s.floor}${s.floor < 100 ? "/100" : ""}`)}${grp("ฝึกฝน", ["train", "body", "mind", "soc", "craft"])}${grp("ชีวิต", ["guild", "rest"])}` : `<div class="focus">${Object.keys(fs).map(fb).join("")}</div>`;
  // The road to the next rank as two meters, so progress is seen without reading the sentence.
  const meter = s.hunter && R && !ex.ready ? `<div class="goalm"><span>เลเวล</span>${bar((s.lv / (LVCAP[s.rank] - 2)) * 100, "xp")}<span>สัญญาหลัก</span>${bar((ex.have / ex.need) * 100, "amb")}</div>` : !s.hunter && next && !ex.ready ? `<div class="goalm"><span>สัญญาหลัก</span>${bar((ex.have / ex.need) * 100, "amb")}<span>ผลงาน</span>${bar((ex.cxp / ex.cxpNeed) * 100, "xp")}</div>` : "";
  return `<div class="ev desk"><span class="tag">แผนเดือนนี้</span><p>${esc(goal)}</p>${meter}${warn}${plan}</div>`;
}
// Typical local foe for a place, the same level rule hunt() uses, so the odds shown match what you will meet.
const placeFoe = (P) => E.enemy({ n: P.n, lv: Math.max(1, s.lv - 1, P.lv - 2), m: P.m, el: P.el || "metal" });
const KEYS = `<p class="keys">${keyHint()}</p>`;
const chips = (d) => (d ? `<div class="chips">${d.split(" · ").map((c) => `<i class="${c.includes("−") ? "dn" : "up"}">${esc(c)}</i>`).join("")}</div>` : "");
// Runs a choice and keeps what came of it, so the answer lands where the player is looking and not only in the log.
function pick(i, byAuto) {
  if (!s.ev || !s.ev.o[i] || s.ev.o[i].locked || (res?.live && ST.busy)) return; if (!byAuto && performance.now() - evAt < 220) return; // a just-appeared event can't be hit by a click meant for something else
  const ev = s.ev, o = ev.o[i], lastOld = s.log[s.log.length - 1]; E.choose(s, i);
  const news = s.log.slice(s.log.lastIndexOf(lastOld) + 1), e = news[0];
  if (e) { const L = o.l.replace(/^บททดสอบ: /, "รับบททดสอบ"), at = e.t.lastIndexOf(L); res = { e, l: o.l, tag: ev.tag, fight: !!o.fight, live: !!o.fight, m: at >= 0 ? e.t.slice(at + L.length).trim() : "", more: news.slice(1).filter((x) => x.cls).slice(0, 3), am: s.ageM }; if (!o.fight) sfx(e.r ? (e.cls === "bad" ? "fail" : "ok") : "tap"); }
  holdT = byAuto ? 0.25 : Math.min(0.9, Math.max(0.35, SPEEDS[speed] * 2.2));
  if (res && !byAuto && MAJOR.has(ev.tag)) { res.major = true; holdT = 1e9; } // a milestone waits for "ตกลง" so the story is actually read
  save();
}
// Milestones open as a popup with their choices, then a popup with the story and what it gave.
const MAJOR = new Set(["แรงก์", "คลาสพิเศษ", "ปลุกพลัง", "โลก", "อาชีพ", "งวดชีวิต"]), M_ICON = { แรงก์: "🏅", คลาสพิเศษ: "✨", ปลุกพลัง: "⚡", โลก: "🌀", อาชีพ: "💼", งวดชีวิต: "📕" };
{ const st = document.createElement("style"); st.textContent = `#mdl{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:#000a;backdrop-filter:blur(3px)}#mdl[hidden]{display:none}#mdl .mcard{width:min(460px,100%);max-height:88vh;overflow:auto;background:#f7f4ee;color:#1d1a24;border-radius:22px;padding:18px 18px 16px;box-shadow:0 20px 60px #000c;animation:evin .26s both}#mdl .mh{display:flex;align-items:center;gap:12px;margin-bottom:10px}#mdl .mi{width:46px;height:46px;border-radius:50%;background:#f3e1d3;display:grid;place-items:center;font-size:22px}#mdl .mh b{font-size:18px}#mdl .mc{font-size:12px;color:#7b7385;margin:6px 0 2px}#mdl .mt{font-size:16px;line-height:1.7;margin:8px 0 12px}#mdl .chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#mdl .chips i{font-style:normal;font-size:13px;padding:3px 9px;border-radius:12px;background:#e8f5e9;color:#1b6b34}#mdl .chips i.dn{background:#fdeaea;color:#b3261e}#mdl .ev{background:none;border:0;box-shadow:none;padding:0;min-height:0}#mdl .ev .tag{display:none}#mdl .ev p.t{color:#1d1a24}#mdl .ev button{color:#1d1a24;background:#fff;border:1px solid #d9d2c6;border-radius:12px}#mdl .ok{width:100%;padding:13px;border-radius:14px;border:2px solid #d9a441;background:#3b2a6b;color:#fff;font-size:17px;font-weight:700;cursor:pointer;margin-top:6px}`; document.head.appendChild(st); const m = document.createElement("div"); m.id = "mdl"; m.hidden = true; document.body.appendChild(m); document.addEventListener("keydown", (e) => { if (!m.hidden && e.key === "Enter" && m.querySelector(".ok")) ACT.resok(); }); }
function modalHtml() {
  // Settings sit on top of everything and stop the clock while open.
  if (cfgOpen) { const tog = (on, a, yes = "เปิด", no = "ปิด") => btn(on ? yes : no, a, on ? "on" : "");
    return `<div class="mcard cfg"><div class="mh"><div class="mi">⚙</div><b>ตั้งค่า</b></div>
    <div class="cr"><span>เสียงเอฟเฟกต์</span>${tog(cfg.snd, "set:snd")}</div>
    <div class="cr"><span>ขนาดตัวอักษร</span><span class="cg">${ZOOM_N.map((n, i) => btn(n, `set:font${i}`, cfg.font === i ? "on" : "")).join("")}</span></div>
    <div class="cr"><span>ลดการสั่นและแสงวาบ<small>ปิดจอสั่น แฟลชขาว และภาพเคลื่อนไหวของหน้าจอ</small></span>${tog(cfg.calm, "set:calm")}</div>
    <p class="mc">ปุ่มลัด</p>${BIND.map((b) => `<div class="cr sm"><span>${b.n}</span><span>${keyCap(b)}</span></div>`).join("")}
    ${saveErr ? `<p class="mc" style="color:#b3261e">บันทึกเกมไม่สำเร็จ: พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็มหรือถูกปิด</p>` : ""}<button class="ok" data-a="cfg">ปิด</button></div>`; }
  if (s?.ev && MAJOR.has(s.ev.tag)) return `<div class="mcard"><div class="mh"><div class="mi">${M_ICON[s.ev.tag] || "📜"}</div><b>${esc(s.ev.tag)}</b></div>${eventBox(true)}</div>`;
  const r = res; if (!s?.ev && r?.major && !r.ack && !r.live && !ST.busy) return `<div class="mcard"><div class="mh"><div class="mi">${M_ICON[r.tag] || "📜"}</div><b>${esc(r.tag)}${r.e.r ? ` · ${esc(r.e.r)}` : ""}</b></div><div class="mc">คุณเลือก: ${esc(r.l)}</div><p class="mt">${esc(r.m || r.e.t)}</p>${chips(r.e.d)}${r.more.map((x) => `<p class="mc">${esc(x.t)}</p>`).join("")}<button class="ok" data-a="resok">ตกลง</button></div>`;
  return "";
}
const resKind = (r) => (r.e.r ? (r.e.cls === "bad" ? "fail" : "ok") : "plain");
function eventBox(inModal) {
  if (s.ev && MAJOR.has(s.ev.tag) && !inModal) return `<div class="ev desk idle"><span class="tag">${esc(s.ev.tag)}</span><p class="dim">เหตุการณ์สำคัญ รอการตัดสินใจจากหน้าต่างที่เด้งขึ้นมา</p></div>`;
  const r = res, waitFight = r && r.live && ST.busy;
  if (waitFight) return `<div class="ev res wait in"><span class="tag">ปะทะ</span><p class="pickl">▸ ${esc(r.l)}</p><p>การต่อสู้กำลังดำเนินอยู่…</p><p class="dim">แตะที่ฉากเพื่อข้ามไปดูผล</p></div>`;
  if (!s.ev) return r ? `<div class="ev res ${resKind(r)} in"><span class="tag">ผลลัพธ์ · ${esc(r.tag)}</span>${r.e.r ? `<span class="rstamp">${esc(r.e.r)}</span>` : ""}<p class="pickl">▸ ${esc(r.l)}</p>${r.m ? `<p class="t">${esc(r.m)}</p>` : ""}${chips(r.e.d)}${r.more.map((x) => `<p class="l ${x.cls}">${x.tag ? `<span>${esc(x.tag)}</span>` : ""}${esc(x.t)}</p>`).join("")}${KEYS}</div>` : `<div class="ev desk idle"><span class="tag">เหตุการณ์</span><p class="dim">ยังไม่มีเรื่องเข้ามา เมื่อมีเหตุการณ์หรือทางเลือก จะขึ้นที่ช่องนี้</p>${KEYS}</div>`;
  const big = BIG_EV.includes(s.ev.tag);
  // A result that led straight into this event (tower floors, chained scenes) stays as a strip above it.
  const strip = r && s.ageM - r.am <= 3 ? `<div class="strip ${resKind(r)}">${r.e.r ? `<b>${esc(r.e.r)}</b>` : ""}<span>${esc(r.m || r.l)}</span>${chips(r.e.d)}</div>` : "";
  return `<div class="ev in ${big ? "big" : ""}">${strip}<span class="tag">${esc(s.ev.tag)}</span>${auto && (KEY_EV.has(s.ev.tag) || E.autoChoice(s) < 0) ? ` <span class="dim">ออโต้รอให้คุณเลือกเรื่องนี้เอง</span>` : ""}<p class="t">${esc(s.ev.t)}</p><div class="opts">${s.ev.o.map((o, i) => { if (o.locked) return `<button class="o-lock" disabled><kbd>🔒</kbd><span>${esc(o.l)}<small>ต้องมี ${Object.entries(o.need).map(([k, v]) => `${STATS[k] || E.NEED_LABEL[k]} ${v}+ (มี ${E.needHave(s, k)})`).join(" · ")}</small></span></button>`; const p = E.optOdds(s, o), cls = p == null ? "" : p >= 70 ? "g" : p >= 40 ? "m" : "b", why = o.fight ? "โอกาสชนะ" : o.s ? `ทดสอบ${STATS[o.s]}` : "โอกาส"; return `<button class="o-${cls}" data-a="opt:${i}"><kbd>${i + 1}</kbd>${o.fight?.n ? monsterIcon(o.fight.n, o.fight.boss) : ""}<span>${o.push ? "✦ " : o.who ? "★ " : o.need ? "◆ " : o.ap ? "◇ " : ""}${esc(o.l)}<small>${esc(o.note || (o.ap ? `อีกวิธีสำหรับเรื่องเดียวกัน · ทดสอบ${STATS[o.s]} · ${chip(o.y)}` : o.who ? `ทางเลือกจากสายงานของคุณ · ${chip(o.y)}` : o.need ? (Object.keys(o.need).every((k) => STATS[k]) ? `ทางเลือกจากสเตตัส ${Object.entries(o.need).map(([k, v]) => `${STATS[k]} ${v}+`).join(" ")}` : "ทางนี้เปิดเพราะสิ่งที่คุณเคยเลือกหรือมีอยู่") + ` · ${chip(o.y)}` : p != null ? "" : chip(o.y)))}${E.habitHit(s, o) ? " · ใช้วิธีนี้ซ้ำจนคนเริ่มอ่านทางออก" : ""}${stakes(o, p)}</small></span>${p != null ? `<em class="${cls}" title="${why}">${why} ${p}%</em>` : ""}</button>`; }).join("")}</div></div>`;
}
// A creature as a small card. Until you have met it, it is only a shape and a question.
const monCard = (n, boss) => { const b = s.bst?.[n], m = MONSTERS[n]; return `<div class="monc${b ? "" : " unk"}${(boss ?? m?.kind === "boss") ? " boss" : ""}">${monsterIcon(n, boss ?? m?.kind === "boss", !b)}<b>${b ? esc(n) : "???"}</b><small>${b ? `พบ ${fmt(b[0])} · ชนะ ${fmt(b[1])}` : "ยังไม่เคยพบ"}</small></div>`; };
const VIEWS = {
  // The picture book: every creature of this world by kind, filled in as the life meets them.
  quests() {
    const L = E.questLog(s), row = (q) => `<div class="item"><b>${esc(q.tier)} · ${esc(q.n)}</b><small>${q.done ? `ผลลัพธ์: ${esc(q.end)} · คะแนน ${q.sc}${q.item ? ` · ได้รับ ${esc(q.item)}` : ""}` : `กำลังดำเนินอยู่ · ตัวแปร: ${esc(q.keys)}`}</small></div>`;
    return `<h3>สมุดเควส</h3><p class="dim">เควสหลักจะมาหาคุณเมื่อถึงเงื่อนไข ผลของแต่ละเรื่องขึ้นกับทางเลือก สเตตัส และทางผสมของชีวิตนี้</p>${L.length ? L.map(row).join("") : `<p class="dim">ยังไม่มีเควสที่มีชื่อเข้ามาในชีวิตนี้</p>`}`;
  },
  book() {
    const B = s.bst || {}, all = Object.keys(MONSTERS), met = all.filter((n) => B[n]).length, where = {}; for (const p of D.PLACES) for (const n of p.mon || []) where[n] = p.n;
    const group = (k) => { const ns = all.filter((n) => MONSTERS[n].kind === k), got = ns.filter((n) => B[n]).length; return `<h4>${KINDS[k]} <small class="dim" style="display:inline">${got}/${ns.length}</small></h4><div class="monrow">${ns.map((n) => monCard(n).replace("</small></div>", `${B[n] && where[n] ? ` · ${esc(where[n])}` : ""}</small></div>`)).join("")}</div>`; };
    const other = Object.keys(B).filter((n) => !MONSTERS[n]);
    return `<h3>สมุดภาพสิ่งที่มาจากรอยแยก</h3><p class="dim">พบแล้ว ${met}/${all.length} ชนิด · สู้มาแล้ว ${fmt(s.c.fights || 0)} ครั้ง · เงาดำคือสิ่งที่ชีวิตนี้ยังไม่เคยเจอ</p><div class="goalm"><span>ความครบ</span>${bar((met / all.length) * 100, "xp")}</div>${Object.keys(KINDS).map(group).join("")}${other.length ? `<h4>ไม่มีในทะเบียนสมาคม</h4><div class="monrow">${other.map((n) => monCard(n)).join("")}</div>` : ""}`;
  },
  log() { const L = s.log.filter((x) => !onlyImp || ["imp", "leg", "bad"].includes(x.cls)).slice(-160).reverse(); let y = -1, out = `<div class="row end">${btn(onlyImp ? "แสดงทั้งหมด" : "เฉพาะเรื่องสำคัญ", "imp", "ghost sm")}</div>`; for (const x of L) { if (x.y !== y) { y = x.y; out += `<h4>อายุ ${y}</h4>`; } out += `<p class="l ${x.cls}">${x.tag ? `<span>${esc(x.tag)}</span>` : ""}${esc(x.t)}${x.r ? `<em>${x.r}</em>` : ""}${x.d ? `<b class="dl">${esc(x.d)}</b>` : ""}</p>`; } return out; },
  // The character pages share one pass over the same data: a = history, b = power, c = people.
  self: () => VIEWS._me().a, power: () => VIEWS._me().b, people: () => VIEWS._me().c,
  _me() {
    const sp = s.w.specials.map((id) => SPECIALS.find((x) => x.id === id)).filter((x) => x), rows = sp.map((x) => { if (s.spc !== x.id) return `<div class="item dim"><b>????</b><small>ชะตายังไม่เผยทางนี้</small></div>`; const need = Object.entries({ ...x.need, ...(x.max || {}) }).map(([k, v]) => `<span class="${(x.max && k in x.max ? E.val(s, k) <= v : E.val(s, k) >= v) ? "ok" : ""}">${E.NEED_LABEL[k] || k} ${x.max && k in x.max ? "≤" : ""}${v} (${Math.floor(E.val(s, k))})</span>`).join(""); return `<div class="item"><b>${s.spc === x.id ? "★ " : ""}${x.n}</b><small>${x.d}</small><div class="needs">${need}</div></div>`; }).join("");
    const gradeTag = (g) => `<i class="rar" style="color:${D.SKILL_GRADES[g].c}">${D.SKILL_GRADES[g].n}</i>`, job = (t, x, m = x.m, g = null, gs = null) => `<div class="item"><b>${esc(t)}${g != null ? " " + gradeTag(g) : ""}${gs ? ` <span class="dots">${gs.map((q) => `<i style="color:${D.SKILL_GRADES[q].c}" title="${D.SKILL_GRADES[q].n}">●</i>`).join("")}</span>` : ""}</b><small>${esc(x.d)}</small><small>${esc(E.perkText(m))}</small></div>`, jobs = `${s.cls ? job(`คลาส: ${CLASSES[s.cls].n}`, CLASSES[s.cls]) : ""}${s.career ? job(`อาชีพ: ${CAREERS[s.career].n}`, CAREERS[s.career]) : ""}${(s.paths || []).map((id) => { const p = D.PATHS[id]; return job(`วัยเด็ก: ${p.n}`, p); }).join("")}${(s.perks || []).map((id) => { const p = D.perkOf(id); return job(`สายฝึก: ${p.n}`, p, E.perkM(s, id), E.perkGrade(s, id)); }).join("")}${E.discList(s).map((x) => job(x.n, x, x.m, null, x.gs)).join("")}${s.pastJob ? job(`อาชีพเดิม: ${CAREERS[s.pastJob].n} (ติดตัวครึ่งเดียว)`, CAREERS[s.pastJob], E.halve(CAREERS[s.pastJob].m)) : ""}`;
    return { a: `<h3>ที่มา</h3><p>${esc(D.FAMILIES[s.fam].n)}: ${esc(D.FAMILIES[s.fam].d)}</p><p class="dim">Seed <b>${esc(s.seed)}</b> · ธาตุถนัด ${s.w.aff.map((e) => ELEMENTS[e].n).join(", ")}${s.hunter ? ` · ศักยภาพเพดานแรงก์ ${RANKS[s.w.ceil]}` : ""}</p>${jobs ? `<h3>สายงานและสิ่งที่ฝึกมา</h3>${jobs}` : ""}`, b: `${aptBox()}
    <h3>พลังแฝง</h3>${s.latent.map((i, x) => (x < s.rev ? `<div class="item"><b>${LATENTS[i].n}</b><small>${LATENTS[i].d}</small></div>` : `<div class="item dim"><b>???</b><small>ยังไม่ตื่น</small></div>`)).join("")}
    <h3>คลาสพิเศษที่ชะตาเปิดให้ชีวิตนี้</h3><p class="dim">ชีวิตนี้มีทางซ่อนอยู่ ${sp.length} ทาง ไม่มีใครบอกได้ว่าคืออะไร จนกว่าเควสพิเศษจะมาหาคุณเองก่อนอายุ ${E.SPC_AGE} · บททดสอบพลาดได้ 2 ครั้งต่อทาง</p>${rows}`, c: `<h3>ผู้คนรอบตัว</h3><div class="grid2">${s.npcs.filter((n) => n.alive).sort((a, b) => b.rel - a.rel).slice(0, 10).map((n) => `<div class="item"><b>${esc(n.n)}</b><small>${esc(n.job)} ${n.hun ? `· Lv.${n.lv}` : ""} · ${n.rel <= -60 ? "เกลียด" : n.rel <= -20 ? "ไม่ชอบ" : n.rel < 20 ? "เฉยๆ" : n.rel < 60 ? "เอ็นดู" : "สนิท"} ${Math.round(n.rel)}</small></div>`).join("")}</div>${s.spouse != null ? `<p>คู่ชีวิต: ${esc(s.npcs[s.spouse].n)}${s.kids.length ? ` · ลูก: ${s.kids.map(esc).join(", ")}` : ""}</p>` : ""}` };
  },
  skills() {

    const list = s.sk.map((x) => E.sk(s, x.id)).sort((a, b) => b.g - a.g || b.p - a.p), pc = (v) => `${Math.round(v * 100)}%`;
    const effect = (x) => x.k === "atk" ? `พลังโจมตี +${pc(x.p)}` : x.k === "guard" ? `พลังป้องกัน +${pc(x.p)}` : x.k === "step" ? `โอกาสหลบ +${pc(x.p)} · เพดาน ${pc(E.skCap.step(x.g))}` : `เลือดต่ำกว่า 40% ฟื้น ${pc(Math.min(E.skCap.heal(x.g), x.p * 1.2))} ครั้งเดียวต่อศึก · เพดาน ${pc(E.skCap.heal(x.g))}`;
    const card = (x) => `<button class="item sel skc ${x.g >= 5 ? "top" : ""} ${s.eq.includes(x.id) ? "on" : ""}" style="--r:${x.gc}" data-a="sk:${x.id}"><b style="color:${ELEMENTS[x.el].c}">${x.n}</b><i class="rar">${x.gn}</i><small>${D.SKILL_KINDS[x.k].n} · ธาตุ${ELEMENTS[x.el].n} · ชำนาญ ${Math.floor(x.m)}/100</small><small class="eff">${effect(x)}${x.m < 100 && x.k !== "heal" && x.k !== "step" ? ` (สูงสุด +${pc(x.max)})` : ""}</small><small class="flv">${x.gd}</small></button>`;
    const group = (t, note, xs) => `<h4>${t} <small class="dim">${note}</small></h4>${xs.length ? `<div class="grid2">${xs.map(card).join("")}</div>` : `<p class="dim">ยังไม่มีวิชาในกลุ่มนี้</p>`}`;
    const isAct = (x) => D.SKILL_KINDS[x.k].t === "Active";
    return `<p class="dim">ติดตั้งได้: โจมตี 3 · ป้องกัน 1 · หลบ 1 · ฟื้นฟู 1 วิชาธาตุถนัดแรงขึ้น 25%${s.eqManual ? " · จัดวิชาเองแล้ว วิชาใหม่จะลงเฉพาะช่องที่ว่าง" : ""}</p><div class="rars">${D.SKILL_GRADES.map((G) => `<span style="--r:${G.c}">${G.n}</span>`).join("")}</div>${group("Active", "ใช้สลับกันทีละท่าระหว่างต่อสู้", list.filter(isAct))}${group("Passive", "ทำงานเองตลอดการต่อสู้", list.filter((x) => !isAct(x)))}`;
  },
  // Gear, forge and market are three pages over one pass: a = forge, b = market, c = gear.
  craft: () => VIEWS._base().a, shop: () => VIEWS._base().b, gear: () => VIEWS._base().c,
  _base() {
    const mats = Object.entries(MATS).map(([k, n]) => `<div class="kv"><span>${n}</span><b>${GRADES.map((_, g) => s.mat[k + g] || 0).join(" · ")}</b></div>`).join("");
    const slotOpts = { weapon: WEAPONS.map((x) => x.n), armor: ARMORS, charm: CHARMS }, f = craftForm, c = E.recipeCost(f.g), have = (k) => s.mat[k + f.g] || 0;
    const shop = E.SHOP.filter((x) => !x.hunter || s.hunter).map((x) => btn(`${x.n} ₡${fmt(x.price(s))}<small>${x.d}${x.id === "anvil" ? ` (ขั้น ${s.anvil})` : ""}</small>`, `buy:${x.id}`, "shop")).join("");
    const gear = s.gear.slice().sort((a, b) => E.gearPw(b) - E.gearPw(a)).map((g) => { const on = s.wear[g.slot] === g.id; return `<div class="item gear q${g.q}"><b>${on ? "▣ " : ""}${esc(E.gearName(g))}</b><small>${QUAL[g.q].n} · พลัง ${fmt(E.gearPw(g))}${g.affix != null ? ` · ${E.perkText(D.AFFIX[g.affix].m)}` : ""}</small><div class="row">${on ? "" : btn("สวม", `eq:${g.id}`, "sm")}${g.plus < 15 ? btn(`ตีบวก ${E.enhOdds(s, g)}% · ₡${fmt(E.enhCost(g))}`, `enh:${g.id}`, "sm amber") : ""}${on ? "" : btn("ขาย", `sell:${g.id}`, "sm ghost")}</div></div>`; }).join("");
    return { a: `<h3>ตีอาวุธ</h3><div class="row wrap">${["weapon", "armor", "charm"].map((k) => btn({ weapon: "อาวุธ", armor: "เกราะ", charm: "เครื่องราง" }[k], `cs:${k}`, f.slot === k ? "on sm" : "sm ghost")).join("")}</div><div class="row wrap">${slotOpts[f.slot].map((n, i) => btn(n, `ct:${i}`, f.t === i ? "on sm" : "sm ghost")).join("")}</div><div class="row wrap">${GRADES.map((g, i) => btn(g.n, `cg:${i}`, f.g === i ? "on sm" : "sm ghost", i > s.anvil)).join("")}</div>
    <p class="dim">ใช้ ${MATS.ore} ${c.ore} (${have("ore")}) · ${MATS.hide} ${c.hide} (${have("hide")}) · ${MATS.core} ${c.core} (${have("core")}) · ₡${fmt(c.gold)} · สำเร็จ ${E.craftOdds(s, f.g)}% · ฝีมือช่าง ${Math.floor(s.craft)}</p>${btn("ลงมือตี", "craft", "pri")}<h3>วัตถุดิบในคลัง</h3><p class="dim">ตามเกรด ${GRADES.map((g) => g.n).join(" · ")}</p>${mats}`,
      b: `<h3>ตลาดสมาคม</h3><p class="dim">มีอยู่: ยา ${s.pot} · หินกันแตก ${s.stone} · แผ่นย้ายชีพ ${s.token} · เงิน ₡${fmt(s.gold)}</p><div class="grid2">${shop}</div>`,
      c: `<h3>คลังอุปกรณ์</h3><p class="dim">▣ คือชิ้นที่สวมอยู่ · ตีบวกล้ม: +5 ขึ้นไปลดระดับ · +10 ขึ้นไปอาวุธแตก เว้นแต่มีหินกันแตก (มี ${s.stone})</p>${gear || `<p class="dim">ยังไม่มีอุปกรณ์</p>`}` };
  },
  farm() {
    const P = E.placeOf(s), pay = E.placePay(s), y = s.ty || { n: 0, f: {} }, top = Object.entries(y.f).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `<h3>ฟาร์มที่ ${esc(P.n)}</h3><p>${esc(P.d)}</p><div class="vit"><span>เลเวลพื้นที่ <b>${P.lv}+</b></span><span>ค่าตอบแทน <b>×${pay.toFixed(2)}</b></span><span>โอกาสชนะ <b>${E.winOdds(s, placeFoe(P))}%</b></span>${P.el ? `<span>ศัตรูธาตุ <b>${ELEMENTS[P.el].n}</b></span>` : ""}${P.mat ? `<span>วัตถุดิบ <b>+${P.mat}%</b></span>` : ""}</div>
    ${pay < P.pay ? `<p class="dim">ที่นี่ง่ายเกินฝีมือคุณ ค่าตอบแทนลดลง ${btn("ดูที่อื่น", "nav:hunt.travel", "sm ghost")}</p>` : ""}${s.lv < P.lv ? `<p class="bad">เลเวลต่ำกว่าพื้นที่ แพ้บ่อยและบาดเจ็บหนัก</p>` : ""}
    <div class="row">${btn(s.focus === "hunt" ? "กำลังล่าที่นี่ทุกเดือน" : "ตั้งแผน: ล่ารอยแยก", "focus:hunt", s.focus === "hunt" ? "on" : "pri")}</div>
    <h3>สิ่งที่อยู่แถวนี้</h3><div class="monrow">${(P.mon || D.MON).map((n) => monCard(n)).join("")}</div>
    <h3>ผลล่าปีนี้</h3><p class="dim">ล่าสำเร็จ ${y.n} ครั้ง · ทั้งชีวิต ${fmt(s.c.hunts || 0)} ครั้ง</p>${top.map(([n, c]) => `<div class="kv"><span>${esc(n)}</span><b>${c}</b></div>`).join("")}`;
  },
  travel() {
    const cur = s.at || 0;
    // Places shown: everything up to a little past your level, so the next danger is visible before you can survive it.
    const rows = D.PLACES.map((p, i) => { if (p.lv > s.lv + 20 && i !== cur) return ""; const here = i === cur, risk = s.lv < p.lv, young = !E.placeOk(s, p); return `<div class="item${here ? " on" : ""}"><b>${here ? "▣ " : ""}${esc(p.n)}</b><small>${esc(p.d)}</small><small>Lv.${p.lv}+${p.age ? ` · อายุ ${p.age}+` : ""} · ค่าตอบแทน ×${p.pay}${p.mat ? ` · วัตถุดิบ +${p.mat}%` : ""}${p.el ? ` · ธาตุ${ELEMENTS[p.el].n}` : ""} · โอกาสชนะ ${E.winOdds(s, placeFoe(p))}%</small><div class="row">${here ? `<span class="dim">อยู่ที่นี่</span>` : young ? `<span class="dim">🔒 สมาคมไม่ออกใบผ่านให้ผู้อายุต่ำกว่า ${p.age} ปี</span>` : btn(`${risk ? "เสี่ยง · " : ""}เดินทาง ${p.fare ? `₡${fmt(p.fare)}` : "ฟรี"}`, `go:${i}`, risk ? "sm risk" : "sm", s.gold < p.fare)}</div></div>`; }).join("");
    const hidden = D.PLACES.filter((p, i) => p.lv > s.lv + 20 && i !== cur).length;
    return `<h3>เดินทาง · สถานที่</h3><p class="dim">ค่าเดินทางจ่ายครั้งเดียว ที่ที่คุณอยู่กำหนดศัตรู ค่าตอบแทน และเหตุการณ์ท้องถิ่น · กลับรอยแยกรอบแนวกั้นฟรี</p><div class="grid2">${rows}</div>${hidden ? `<p class="dim">อีก ${hidden} แห่งยังไกลเกินฝีมือ จะเห็นเมื่อเลเวลใกล้ถึง</p>` : ""}`;
  },
  tower() {
    // A run in progress shows where it stands; otherwise the next run starts at the last boss checkpoint. Past 100 the grid shows the current block of 100.
    const R = s.run, f = R ? R.f : E.diveGate(s), F = E.floorAt(s, f), base = Math.floor((f - 1) / 100) * 100, foe = E.enemy(E.floorFoe(s, f)), rank = [...s.npcs.filter((n) => n.alive && n.hun).map((n) => ({ n: n.n, f: n.floor })), { n: s.name + " (คุณ)", f: s.floor }].sort((a, b) => b.f - a.f).slice(0, 8);
    const cells = Array.from({ length: 100 }, (_, i) => { const x = E.floorAt(s, base + i + 1), n = base + i + 1; return `<i class="f-${x.t} ${n <= s.floor ? "done" : ""} ${n === f ? "cur" : ""}" title="ชั้น ${n}: ${x.name} · ${x.mod.n}"></i>`; }).join("");
    const fightF = F.t === "fight" || F.t === "elite" || F.t === "boss";
    return `<h3>หอไร้ฟ้า · ชั้นสูงสุด ${s.floor}${s.floor < 100 ? "/100" : " · เหนือหลังคาโลก"}</h3><div class="tower">${cells}</div><p class="dim">ไต่ทีละชั้น ผ่านแต่ละชั้นแล้วเลือกว่าจะไปต่อหรือกลับพร้อมของ · ยิ่งไปต่อในรอบเดียว ศัตรูยิ่งแรงขึ้น +${Math.round(E.DIVE.press * 100)}% ต่อชั้น แต่ของดรอปยิ่งมากและคุณภาพดีขึ้น · แพ้แล้วของในถุงหายครึ่งหนึ่ง · รอบใหม่เริ่มที่จุดเช็คพอยต์ (ชั้นหลังบอสล่าสุด) · ชั้นที่เคยผ่านแล้วให้ของน้อยลง</p>${R ? `<p>รอบนี้ผ่านมาแล้ว <b>${R.n}</b> ชั้น · ในถุง ${E.bagText(R.bag)}</p>` : ""}${fightF ? `<div class="monrow">${monCard(F.name, F.t === "boss")}</div>` : ""}<p class="dim">${R ? "ชั้นถัดไป" : "รอบหน้าเริ่ม"}: ชั้น ${f} · ${E.FLOOR_KIND[F.t]}${fightF ? ` · ${esc(F.name)}` : ""} · ${F.mod.n} · ธาตุ${ELEMENTS[F.el].n}${s.hunter && fightF ? ` · โอกาสชนะ <b>${E.winOdds(s, foe)}%</b>` : ""}</p>${E.towerOk(s) ? `<div class="row">${btn(s.focus === "tower" ? "กำลังไต่หอทุกเดือน" : "ตั้งแผน: ไต่หอ", "focus:tower", s.focus === "tower" ? "on" : "pri")}</div>` : s.hunter ? `<p class="bad">🔒 บัตรผ่านหอออกให้ฮันเตอร์อายุ ${E.TOWER_AGE} ปีขึ้นไป · อีก ${E.TOWER_AGE - age(s)} ปี ระหว่างนี้ล่ารอยแยกเก็บเลเวลไปก่อน</p>` : `<p class="dim">หอเปิดเฉพาะผู้ตื่นพลัง คุณได้แต่ดูชื่อบนจอไฟในตลาด</p>`}<h3>กระดานจัดอันดับ</h3><ol class="rank">${rank.map((r) => `<li><span>${esc(r.n)}</span><b>ชั้น ${r.f}</b></li>`).join("")}</ol>`;
  },
  guild() {

    const g = s.guild;
    if (!g) return `<h3>เข้าร่วมกิลด์</h3>${s.w.guilds.map((x, i) => `<div class="item"><b>${esc(x.n)}</b><small>ต้องการแรงก์ ${RANKS[x.req]} · ${E.perkText(x.m)}</small><div class="row">${btn("สมัคร", `join:${i}`, "sm", s.rank < x.req)}</div></div>`).join("")}<h3>ก่อตั้งกิลด์ของตัวเอง</h3><p class="dim">ต้องแรงก์ C ขึ้นไป · ค่าจดทะเบียน ₡${fmt(E.foundCost)}</p><div class="row"><input id="gname" maxlength="20" placeholder="ชื่อกิลด์">${btn("ก่อตั้ง", "found", "pri")}</div>`;
    if (!g.own) return `<h3>${esc(g.n)}</h3><p>ตำแหน่ง: <b>${E.guildRole(g)}</b> · ผลงาน ${fmt(g.rep)}</p><p class="dim">ตั้งเวลาไปที่ "งานกิลด์" เพื่อไต่ตำแหน่ง</p>${btn("ออกจากกิลด์", "leave", "ghost")}`;
    const cand = s.npcs.map((n, i) => ({ n, i })).filter((x) => x.n.alive && x.n.hun && !g.mem.includes(x.i)).sort((a, b) => b.n.rel - a.n.rel).slice(0, 6);
    return `<h3>${esc(g.n)} · หัวหน้ากิลด์</h3><div class="vit"><span>คลัง <b>₡${fmt(g.funds)}</b></span><span>ชื่อเสียงกิลด์ <b>${fmt(g.rep)}</b></span><span>ความภักดี <b>${Math.round(g.loy)}</b></span><span>สมาชิก <b>${g.mem.length}</b></span></div><div class="row">${btn("เติมคลัง ₡1,000", "don:1000", "sm")}${btn("เติมคลัง ₡10,000", "don:10000", "sm")}</div>
    <h3>สิ่งปลูกสร้าง</h3><div class="grid2">${Object.entries(HALLS).map(([k, h]) => `<div class="item"><b>${h.n} Lv.${g.hall[k]}</b><small>${h.d}</small><div class="row">${btn(`อัปเกรด ₡${fmt(E.hallCost(g, k))}`, `hall:${k}`, "sm", g.hall[k] >= 5)}</div></div>`).join("")}</div>
    <h3>ทาบทามสมาชิก</h3>${cand.map((x) => `<div class="item"><b>${esc(x.n.n)}</b><small>Lv.${x.n.lv} · ความสัมพันธ์ ${Math.round(x.n.rel)}</small><div class="row">${btn(`ทาบทาม ₡${fmt(E.recruitCost(s, x.i))}`, `rec:${x.i}`, "sm")}</div></div>`).join("")}`;
  },
  hall: () => `<h3>ศิลาจารึกชีวิตก่อนๆ</h3><ul class="hall">${hallList().slice(0, 30).map((x) => `<li><b>${esc(x.n)}</b> · ${esc(x.title)} · ${x.age} ปี · ${fmt(x.score)} แต้ม <small>Seed ${esc(x.seed)}</small></li>`).join("") || "<li>ยังว่างเปล่า</li>"}</ul>`,
  cal() {
    const up = s.w.cal.filter((c) => c.ann && !c.done).concat(s.w.cal.filter((c) => !c.ann).slice(0, 0)), W = (id) => D.WORLD.find((x) => x.id === id);
    return `<h3>ปฏิทินสมาคม</h3>${up.length ? up.map((c) => `<div class="item"><b>${W(c.id).n}</b><small>อีกราว ${Math.max(1, c.at - s.ageM)} เดือน · ${esc(W(c.id).d.replace("{z}", c.z))}</small></div>`).join("") : `<p class="dim">ยังไม่มีประกาศล่วงหน้า</p>`}${s.w.price > 1 ? `<p class="bad">ค่าครองชีพ ×${s.w.price} อีก ${s.w.priceT} เดือน</p>` : ""}<h3>กฎอายุของสมาคม</h3><p class="dim">หอไร้ฟ้า ${E.TOWER_AGE} ปีขึ้นไป · ${D.PLACES.filter((p) => p.age).map((p) => `${esc(p.n)} ${p.age}+`).join(" · ")}</p>`;
  },
};
// Five main headings, each opening its own sub-headings. A page is listed only when this life can use it:
// children have no gear or market, only hunters have skills, hunting grounds, a guild or the picture book, and the tower page waits for adulthood.
const NAV = [
  { k: "log", n: "บันทึก" },
  { k: "me", n: "ตัวละคร", sub: [["self", "ประวัติ"], ["power", "พลัง"], ["skills", "วิชา"], ["people", "ผู้คน"]] },
  { k: "hunt", n: "ออกล่า", sub: [["farm", "พื้นที่ล่า"], ["travel", "เดินทาง"], ["tower", "หอไร้ฟ้า"], ["book", "สมุดภาพ"]] },
  { k: "base", n: "คลังและกิลด์", sub: [["gear", "อุปกรณ์"], ["craft", "โรงตี"], ["shop", "ตลาด"], ["guild", "กิลด์"]] },
  { k: "world", n: "โลก", sub: [["quests", "สมุดเควส"], ["cal", "ปฏิทิน"], ["tower", "กระดานหอ"], ["hall", "ศิลาจารึก"]] },
];
const HUNTER_TABS = new Set(["skills", "guild", "farm", "travel", "book"]);
const canSee = (v) => (HUNTER_TABS.has(v) || v === "tower" ? s.hunter : ["gear", "craft", "shop"].includes(v) ? E.stage(s) !== "k" : true);
// A grown civilian can still read the tower board, under the world heading.
const subsOf = (m) => (m.sub || []).filter(([v]) => (m.k === "world" && v === "tower" ? !s.hunter && E.stage(s) !== "k" : canSee(v)));
const tabsFor = () => NAV.filter((m) => !m.sub || subsOf(m).length);
// The page on screen: the remembered sub-heading of the open main heading, or its first one.
const viewNow = () => { const m = NAV.find((x) => x.k === tab); if (!m?.sub) return "log"; const ss = subsOf(m); return (ss.find(([v]) => v === subAt[tab]) || ss[0])[0]; };
const subNav = () => { const m = NAV.find((x) => x.k === tab), ss = m?.sub ? subsOf(m) : [], v = viewNow(); return ss.length > 1 ? `<nav class="subs">${ss.map(([k, n]) => btn(n + (k === "tower" && !E.towerOk(s) ? " 🔒" : ""), `sub:${k}`, k === v ? "on" : "")).join("")}</nav>` : ""; };
function draw() {
  if (!s) return; if (!tabsFor().some((m) => m.k === tab)) tab = "log"; { const sc = sceneFor(), pl = s.hunter && s.focus === "hunt" && s.at && sc === E.placeOf(s).sc ? E.placeOf(s) : null; setScene(sc, 7, weatherFor(s.y0 * 12 + s.mon0 + s.ageM, sc), pl?.id, pl?.n); } setHero(s.cls ? CLASSES[s.cls].c : "#7fa8c9", E.stage(s) === "k", s.ageM, s.hunter ? null : s.career, s.hunter ? s.cls : null);
  if (s.ev !== shownEv) { shownEv = s.ev; evAt = performance.now(); if (s.ev && !(auto && !KEY_EV.has(s.ev.tag))) sfx("ev"); }
  put("#cardtop", card()); put("#deskbox", desk()); if (put("#event", eventBox())) $("#event").scrollTop = 0; put("#tabs", tabsFor().map((m) => btn(m.n, `tab:${m.k}`, tab === m.k ? "on" : "")).join("")); put("#subtabs", subNav()); { const h = modalHtml(), m = $("#mdl"); m.hidden = !h; put("#mdl", h); }
  // A broken tab shows a note instead of taking the event box and controls down with it.
  if (document.activeElement?.id !== "gname") { let v; try { v = VIEWS[viewNow()](); } catch (e) { console.error("tab " + tab, e); v = `<p class="bad">แท็บนี้แสดงไม่ได้ชั่วคราว</p>`; } put("#view", v); }
  put("#ctrl", `${btn(paused ? "เล่นต่อ" : "หยุด", "pause", paused ? "on" : "")}${[1, 2, 4, 8].map((v) => btn(v + "×", `spd:${v}`, speed === v ? "on" : "")).join("")}${btn(auto ? "ออโต้ เปิด" : "ออโต้ ปิด", "auto", auto ? "on" : "")}${btn("ตั้งค่า", "cfg", cfgOpen ? "on" : "")}${btn("เมนู", "menu", "ghost")}${saveErr ? `<p class="bad savewarn">บันทึกเกมไม่สำเร็จ พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็มหรือถูกปิด ความคืบหน้าล่าสุดอาจหายถ้าปิดหน้านี้</p>` : ""}`);
  dirty = false;
}
const FX_SND = { levelup: "lv", enh_ok: "ok", enh_fail: "fail", break: "fail", death: "dead" };
function flushFx() { while (E.fxOut.length) { const f = E.fxOut.shift(); trigger(f); if (f.n !== "minor" && f.n !== "coin") dirty = true; if (!s) continue; if (FX_SND[f.n]) sfx(FX_SND[f.n]); if (["awaken", "rank", "skill", "loot"].includes(f.n) && milestone(f.n)) sfx("big"); } }
const ACT = {
  resok: () => { if (res) { res.ack = true; holdT = 0; } },
  new: () => start($("#iseed").value.trim() || randSeed(), $("#iname").value.trim() || "ไร้นาม"), cont: () => { s = load(); if (s) { fresh(); $("#start").hidden = true; $("#game").hidden = false; draw(); } }, cfg: () => { cfgOpen = !cfgOpen; }, set: (v) => { if (v === "snd") cfg.snd = !cfg.snd; else if (v === "calm") cfg.calm = !cfg.calm; else if (v.startsWith("font")) cfg.font = +v.slice(4); saveCfg(); applyCfg(); }, reseed: () => ($("#iseed").value = randSeed()), menu: () => { if (s && !s.dead) save(); s = null; menu(); },
  same: () => start(s.seed, s.name), heir: () => { const w = E.gearOf(s, s.wear.weapon); start(`${s.seed}/${s.kids[0]}`, s.kids[0], { gold: Math.max(0, s.gold * 0.3), from: s.name, gear: w ? { ...w, plus: Math.max(0, w.plus - 2) } : null }); },
  pause: () => (paused = !paused), auto: () => (auto = !auto), imp: () => (onlyImp = !onlyImp), craft: () => E.craft(s, craftForm.slot, craftForm.t, craftForm.g), found: () => { const n = $("#gname").value.trim(); if (n) { E.foundGuild(s, n); $("#gname").blur(); } }, leave: () => E.leaveGuild(s),
  tab: (v) => (tab = v), sub: (v) => (subAt[tab] = v), nav: (v) => { const [m, k] = v.split("."); tab = m; if (k) subAt[m] = k; }, spd: (v) => { speed = +v; cfg.speed = speed; saveCfg(); }, tip: (v) => (tip = tip === v ? null : v), focus: (v) => (s.focus = v), opt: (v) => pick(+v, false), sk: (v) => E.toggleSkill(s, v), eq: (v) => E.equip(s, +v), enh: (v) => E.enhance(s, +v, s.stone > 0), sell: (v) => E.sell(s, +v), buy: (v) => E.buy(s, v), cs: (v) => { craftForm.slot = v; craftForm.t = 0; }, ct: (v) => (craftForm.t = +v), cg: (v) => (craftForm.g = +v), join: (v) => E.joinGuild(s, +v), go: (v) => E.travel(s, +v), hall: (v) => E.upgradeHall(s, v), rec: (v) => E.recruit(s, +v), don: (v) => E.donate(s, +v),
};
// Spending and gear changes save at once, so a reload can't undo a bad result.
const SAVES = new Set("craft found leave focus sk eq enh sell buy join hall rec don go".split(" "));
function act(el) { const [k, v] = el.dataset.a.split(":"); if (k !== "opt") sfx("tap"); ACT[k]?.(v); if (s && !s.dead && SAVES.has(k)) save(); flushFx(); if (s) { dirty = true; draw(); } if (s?.dead && !ST.busy) ended(); }
// Mouse acts on press. Touch waits for a tap that didn't scroll, or dragging a list would press whatever is under the finger.
let tap = null;
document.addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; if (e.pointerType === "mouse") { if (e.button === 0) act(b); return; } tap = { a: b.dataset.a, x: e.clientX, y: e.clientY, id: e.pointerId, ev: s?.ev }; });
document.addEventListener("pointercancel", () => (tap = null));
document.addEventListener("pointerup", (e) => { const t = tap; tap = null; if (t && t.id === e.pointerId && t.ev === s?.ev && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 12) act({ dataset: { a: t.a } }); });
window.addEventListener("pagehide", () => { if (s && !s.dead) save(); });
document.addEventListener("click", (e) => { if (e.detail !== 0) return; const b = e.target.closest("[data-a]"); if (b && !b.disabled) act(b); });
// Keys go by physical position (e.code), so they work on a Thai layout too.
document.addEventListener("keydown", (e) => {
  if (!s || s.dead || e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.target.tagName === "INPUT") return; const c = e.code, V = [1, 2, 4, 8], at = V.indexOf(speed);
  const b = BIND.find((x) => x.codes.includes(c)); if (!b) return;
  if (cfgOpen && b.a !== "cfg") return; // the top screen owns the keys
  if (b.a === "pause" && e.target.tagName === "BUTTON") return; // Space on a focused button presses that button
  const a = { pick: () => (s.ev ? `opt:${+c.slice(-1) - 1}` : null), pause: () => "pause", faster: () => `spd:${V[Math.min(3, at + 1)]}`, slower: () => `spd:${V[Math.max(0, at - 1)]}`, auto: () => "auto", cfg: () => "cfg" }[b.a]();
  if (a) { e.preventDefault(); act({ dataset: { a } }); }
});
// Life-shaping choices are the player's: auto waits on these instead of picking for you.
// BIG_EV is the one list of events the screen treats as big; everything big is also the player's to choose, so the two can't drift apart.
// World events belong here above all: a lost fight in one can kill.
const BIG_EV = ["โลก", "คลาสพิเศษ", "ปลุกพลัง", "แรงก์", "งวดชีวิต", "เควสตำนาน"];
const KEY_EV = new Set([...BIG_EV, "สายทาง", "ปั้นสเตตัส", "อาชีพ", "เควสหายาก"]);
// The next frame is booked first, so one bad frame can never stop the life from running.
function loop(now) {
  requestAnimationFrame(loop);
  try { step(now); } catch (e) { dirty = true; if (!loop.warned) { loop.warned = 1; console.error("game loop", e); } }
}
function step(now) {
  const dt =Math.min(0.25, (now - last) / 1000 || 0); last = now; ST.speed = 1 + (speed - 1) * 0.5;
  if (s && !s.dead) {
    // The fight result is told when the fight on stage ends, not before.
    if (wasBusy !== ST.busy) { wasBusy = ST.busy; dirty = true; }
    if (!ST.busy && res?.live) { res.live = false; dirty = true; sfx(res.e.cls === "bad" ? "fail" : "ok"); }
    const halt = paused || cfgOpen;
    if (!ST.busy) {
      if (s.ev) { if (auto && !halt && !KEY_EV.has(s.ev.tag) && (autoT += dt) > SPEEDS[speed] * 2.5) { autoT = 0; pick(E.autoChoice(s), true); dirty = true; } }
      else if (!halt && holdT > 0) holdT -= dt; // a short beat so the result is read before the months roll on
      else if (!halt) { acc += dt; while (acc >= SPEEDS[speed] && !s.ev && !s.dead) { acc -= SPEEDS[speed]; if (auto) E.autoPlan(s); E.tick(s); dirty = true; if (++ticks % 24 === 0) save(); } if (s.ev) acc = 0; }
    }
    flushFx();
    if (s.dead && !ST.busy) { draw(); ended(); }
    else if (dirty && now - (loop.t || 0) > 120) { loop.t = now; draw(); }
  }
  // A death inside a staged fight waits for the fight to play out, then closes the file (it used to never close in auto mode).
  else if (s && !ST.busy && $("#end").hidden) { flushFx(); draw(); ended(); }
}
document.head.append(Object.assign(document.createElement("style"), { textContent: monsterCss() }));
speed = cfg.speed; applyCfg();
initStage($("#cv"), $("#ov")); $("#stagewrap").addEventListener("pointerdown", skip); menu(); requestAnimationFrame(loop);
