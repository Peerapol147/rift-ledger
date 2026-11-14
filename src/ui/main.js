// Boot, the play loop, input and rendering. Reads core state; changes it only through core functions.
import * as C from "../core/index.js";

import { initStage, setScene, setHero, trigger, stage } from "../stage.js";
import { weatherFor } from "../weather-art.js";
import { $, esc, btn, store } from "./dom.js";
import { classArt, careerArt, sceneOf, isNight } from "./art.js";
import { SPEEDS, STEP_S, cleanCfg } from "./cfg.js";
import { card, eventPanel, choiceCard, controls, tabsBar, TABS, POLICIES } from "./layout.js";
import { toggleSlot } from "./prep.js";
import { settingsView, FONT } from "./settings.js";
import { logTab } from "./tabs/log.js";
import { meTab } from "./tabs/me.js";
import { itemsTab } from "./tabs/items.js";
import { teamTab } from "./tabs/team.js";
import { workTab } from "./tabs/work.js";
import { worldTab } from "./tabs/world.js";
import { bookTab } from "./tabs/book.js";

const CFG = "riftledger.cfg.v2";
const POLICY_ORDER = Object.keys(POLICIES);
const slots = C.slots(store), book = C.collection(store);

const loadCfg = () => { try { return cleanCfg(JSON.parse(store.get(CFG) ?? "{}")); } catch { return cleanCfg(null); } };
const cfg0 = loadCfg();
const ui = {
  speed: cfg0.speed, policy: cfg0.policy, fs: cfg0.fs, foldStart: cfg0.fold, paused: false, tab: "log", onlyImp: false,
  slot: 0, settings: false, exportText: "", itemFilter: { kind: "", sort: "rarity", q: "" }, junk: 1, importText: "",
};
const saveCfg = () => store.set(CFG, JSON.stringify({ speed: ui.speed, policy: ui.policy, fs: ui.fs, fold: ui.foldStart }));
let s = null, acc = 0, last = 0, dirty = true, prev = null, bannerT = 0, bannerUrgent = false;

// ---- Start, load, death
// A new life takes the first empty slot, else the first finished one; -1 when every slot holds a life in progress.
function freeSlot() {
  const list = slots.list();
  const empty = list.findIndex((x) => !x);
  return empty >= 0 ? empty : list.findIndex((x) => x.dead);
}

function begin(life) {
  s = life;
  for (const id of book.get().seen.cal ?? []) s.flags["knowCal:" + id] = true;
  s.prefs ??= { plan: "careful" };
  prev = snap();
  $("#start").hidden = true; $("#end").hidden = true; $("#game").hidden = false;
  ui.tab = "log"; dirty = true;
}

function startScreen() {
  const list = slots.list();
  const rows = list.map((x, i) => (x?.locked ? `<div class="item"><span>ช่อง ${i + 1}: `
    + `<span class="dim">เซฟจากเกมเวอร์ชันใหม่กว่า เปิดในตั้งค่าเพื่อส่งออกได้</span></span></div>`
    : x ? `<div class="item"><span>ช่อง ${i + 1}: ${esc(x.name)} อายุ ${Math.floor(x.ageM / 12)}${x.dead ? " (จบแล้ว)" : ""}</span>
    <span>${x.dead ? "" : btn("load:" + i, "เล่นต่อ", 'class="sm"')}${btn("del:" + i, "ลบ", 'class="sm"')}</span></div>` : "")).join("");
  $("#start").innerHTML = `<div class="st-card"><div class="dim">ปีที่ 21 หลังวันฟ้าแตก</div><h1>บันทึกหลังรอยแยก</h1>
    <p class="lede">เกิดในโลกที่เกตและหอคอยเปิดมาแล้วยี่สิบเอ็ดปี ใช้ชีวิตตั้งแต่เกิดจนวันสุดท้าย จะตื่นพลังหรือไม่ก็ได้</p>
    <div class="row"><input data-c="seed" placeholder="Seed (เว้นว่างเพื่อสุ่ม)" style="flex:1">${btn("new", "เริ่มชีวิตใหม่", 'class="pri"')}</div>
    <details class="howto"${book.get().lives ? "" : " open"}><summary>เล่นยังไง</summary>
      <p>ทุกเดือนเลือก <b>แผนเดือนนี้</b> ทางซ้าย เช่น เรียน ทำงาน ฝึกฝน หรือล่าเกตเมื่อตื่นพลังแล้ว</p>
      <p>เมื่อมีเรื่องเข้ามา เลือกทางในช่องเหตุการณ์ ตัวเลข % คือโอกาสสำเร็จตามค่าสถานะของคุณ</p>
      <p>ตอนเริ่ม เกมหยุดรอคุณเลือกเองทุกเรื่อง ถ้าอยากให้เร็วขึ้น เปิดออโต้ได้ที่ช่องข้างปุ่มความเร็ว ให้เลือกเรื่องเล็กแทนคุณ</p>
      <p>ชีวิตจบได้หลายแบบ สิ่งที่ได้เห็นจะถูกจดในสมุดสะสมและเปิดทางให้ชีวิตถัดไป</p>
    </details>
    ${rows ? `<h3>เซฟ</h3>${rows}` : ""}<p style="margin-top:12px">${feedbackLink}</p><p class="dim" style="margin-top:6px">ชีวิตที่ผ่านมา ${book.get().lives}</p></div>`;
  $("#start").hidden = false; $("#game").hidden = true; $("#end").hidden = true;
}

function endScreen() { showEnd(true); }

function legacyRows() {
  const L = C.legacyOf(s);
  return `<div class="kv"><span>มรดกทั้งหมด</span><b>₿${L.assets.toLocaleString("en-US")}</b></div>
    ${L.kids ? `<div class="kv"><span>ลูก</span><b>${L.kids} คน</b></div>` : ""}
    ${L.guild ? `<div class="kv"><span>กิลด์ที่ก่อตั้ง</span><b>${esc(L.guild)}</b></div>` : ""}
    ${L.enemies.length ? `<div class="kv"><span>ศัตรูที่ทิ้งไว้</span><b>${esc(L.enemies.join(", "))}</b></div>` : ""}`;
}

// game-feel: what your choice did shows for a few seconds where you made it (the log keeps it too)
function showResult(n0) {
  const l = s.log.slice(n0).find((x) => x.text.includes(" → "));
  if (!l) return;
  ui.result = { text: l.text.split(" → ").slice(1).join(" → "), tone: l.tone, until: performance.now() + 4000 };
  dirty = true;
}

// items stay put while a fight or a choice is open
function busy() { if (s.ev || s.op) { banner("จัดการเรื่องที่ค้างอยู่ก่อน"); return true; } return false; }

// record: true the first time a life ends (collection + save); false when re-opening a finished save
function showEnd(record) {
  const d = C.deathSummary(s);
  if (record) {
    book.addLife();
    book.setLegacy(C.legacyOf(s));
    book.addTitle(d.role);
    for (const [kind, id] of C.lifeRecord(s)) book.addSeen(kind, id);
    autosave();
  }
  $("#end").innerHTML = `<div class="st-card"><div class="dim">${esc(C.dateText(s))}</div><h1>${esc(d.name)}</h1>
    <div class="leg">${esc(d.role)}</div><p>จากไปเมื่ออายุ ${d.ageY} ปี · ${esc(d.cause)}</p>
    <div class="kv"><span>ทรัพย์สินสุดท้าย</span><b>₿${d.gold.toLocaleString("en-US")}</b></div>
    <div class="kv"><span>ชื่อเสียง</span><b>${d.fame}</b></div>${legacyRows()}${d.floor ? `<div class="kv"><span>ชั้นหอคอยสูงสุด</span><b>${d.floor}</b></div>` : ""}
    <p class="dim" style="margin-top:10px">ชีวิตนี้มีทางที่คุณไม่ได้เห็น ${d.unseen} ทาง</p>
    <p style="margin-top:10px">${feedbackLink}</p>
    <div class="row">${C.canHeir(s) ? btn("heir", `เล่นต่อเป็น${C.heirWord(s)}`, 'class="pri"') : ""}${btn("new", "เริ่มชีวิตใหม่", C.canHeir(s) ? "" : 'class="pri"')}${btn("quit", "หน้าแรก")}</div></div>`;
  $("#end").hidden = false;
}

// ---- Effects on the stage, from differences between frames
const snap = () => ({
  hunter: !!s.hunter, rank: s.hunter?.rank, lv: s.hunter?.lv, gold: s.gold, year: C.ageY(s),
  op: s.op && s.op.def.kind !== "job" ? s.op.def.id : null, ev: s.ev?.id ?? null, evTag: s.ev?.tag,
});
const BREAK_EVENTS = new Set(["adultBreakNear", "hunterBreakCall", "cal24", "cal27", "cal48"]);
function fx() {
  const now = snap();
  // a gate tears open when a gate or tower run starts; a gate breaks when a gate-break event opens
  if (now.op && now.op !== prev.op) trigger({ n: "gateOpen" });
  if (now.ev && now.ev !== prev.ev && BREAK_EVENTS.has(now.ev)) trigger({ n: "gateBreak" });
  if (now.hunter && !prev.hunter) trigger({ n: "awaken" });
  else if (now.rank > prev.rank) trigger({ n: "rank" });
  else if (now.lv > prev.lv) trigger({ n: "levelup" });
  if (s.lastFight) { trigger({ n: "fight", a: { ...s.lastFight, wfx: "melee/claw-swipe" } }); delete s.lastFight; }
  else if (now.gold - prev.gold > 500) trigger({ n: "coin" });
  if (now.year > prev.year) autosave();
  prev = now;
}

// ---- Rendering
const TAB_VIEW = {
  log: () => logTab(s, ui), me: () => meTab(s), items: () => itemsTab(s, ui), team: () => teamTab(s),
  work: () => workTab(s), world: () => worldTab(s), book: () => bookTab(book),
};

function reveal() {
  for (const [k, n, ok] of TABS) {
    if (!ok(s) || s.flags["seenTab:" + k]) continue;
    s.flags["seenTab:" + k] = true;
    if (s.ageM > 0 && k !== "log") banner(`เปิดแท็บใหม่: ${n}`, "news");
  }
}

// Every save the player did not ask for: says so once if it fails, instead of losing progress in silence.
let saveFailing = false;
const NEWER = "อีกแท็บเล่นชีวิตนี้ไปไกลกว่าแล้ว เซฟนี้ไม่ได้บันทึกทับ และจะไม่บันทึกอัตโนมัติจนกว่าจะเลือกช่องในตั้งค่า";
function autosave() {
  if (!s || ui.slot < 0) return;
  const ok = slots.save(ui.slot, s);
  // another tab is further on: stop writing to this slot at all, or this tab would take it once it passes that age
  if (ok === "newer") { ui.slot = -1; banner(NEWER, "urgent"); return; }
  if (!ok && !saveFailing) banner("บันทึกอัตโนมัติไม่สำเร็จ เปิดตั้งค่าเพื่อบันทึกลงช่องอื่นหรือส่งออกเซฟ", "urgent");
  saveFailing = !ok;
}
// kind: "urgent" (a save that did not happen), "news" (birthdays, new tabs: the game talking on its own), or the
// answer to something the player just did. News waits while an urgent banner has its time; a player's action never.
function banner(text, kind = "act") {
  if (bannerUrgent && bannerT > 0 && kind === "news") return;
  const b = $("#banner"); b.textContent = text; b.hidden = false; bannerT = 3.5; bannerUrgent = kind === "urgent";
}

// Only touch the DOM when the markup changed, so buttons under the pointer stay put.
const shown = {};
function put(sel, html) {
  if (shown[sel] === html) return;
  shown[sel] = html;
  // a redraw must not take keyboard focus away from the control the player is on
  const box = $(sel), a = document.activeElement, key = box.contains(a) && a !== box
    && (a.dataset.a ? `[data-a="${a.dataset.a}"]` : a.dataset.c ? `[data-c="${a.dataset.c}"]` : null);
  box.innerHTML = html;
  if (key && document.activeElement === document.body) box.querySelector(key)?.focus({ preventScroll: true });
}

// The card never covers the controls bar (pause, speeds, settings): it takes the larger free part of the screen.
function placeCard(ch) {
  const r = $("#ctrl").getBoundingClientRect(), h = innerHeight, below = h - r.bottom, above = r.top;
  const onScreen = r.bottom > 0 && r.top < h;
  if (!onScreen) { ch.style.setProperty("--ctop", "12px"); ch.style.setProperty("--cmax", `${h - 24}px`); return; }
  if (below >= above) {
    ch.style.setProperty("--ctop", `${Math.round(r.bottom + 8)}px`); ch.style.setProperty("--cmax", `${Math.round(below - 20)}px`);
  } else {
    ch.style.setProperty("--ctop", "12px"); ch.style.setProperty("--cmax", `${Math.round(above - 20)}px`);
  }
}

function render() {
  dirty = false;
  document.documentElement.style.setProperty("--fs", FONT[ui.fs]);
  $("#modal").hidden = !ui.settings || !s;
  if (!s || s.dead) return;
  reveal();
  if (!TABS.some(([k, , ok]) => k === ui.tab && ok(s))) ui.tab = "log";
  const waiting = !!s.ev && C.autoDecide(s, ui.policy) < 0;
  put("#card", card(s));
  if (ui.result && performance.now() > ui.result.until) ui.result = null;
  put("#event", eventPanel(s, waiting && ui.policy !== "stop", ui.result, waiting));
  // the decision card: a new event opens folded or not by the setting; folded, the screen behind is usable
  if (s.ev !== ui.foldEv) { ui.foldEv = s.ev; ui.folded = !!ui.foldStart; }
  const ch = $("#choice");
  ch.hidden = !waiting;
  ch.classList.toggle("folded", waiting && ui.folded);
  put("#choice", waiting ? choiceCard(s, ui.policy !== "stop")
    + (ui.folded ? btn("unfold", `เปิดตัวเลือก · ${esc(s.ev.tag ?? "")}`, 'id="unfold" class="primary"') : "") : "");
  if (waiting) placeCard(ch);
  put("#ctrl", controls(ui));
  put("#tabs", tabsBar(s, ui.tab));
  const view = $("#view"), keep = view.scrollTop;
  const typing = view.contains(document.activeElement) && document.activeElement.matches("input,textarea,select");
  if (!typing) put("#view", TAB_VIEW[ui.tab]());
  view.scrollTop = keep;
  const st = C.stageOf(s), sc = sceneOf(s, st);
  setScene(sc, 7, weatherFor((s.mon0 ?? 0) + s.ageM, sc), null, "");
  stage.night = isNight(s.ev?.t);
  setHero(s.hunter ? "#c86bff" : "#7fa8c9", st === "kid", s.ageM, s.hunter ? null : careerArt(s.job?.id), s.hunter ? classArt(s.hunter.cls) : null);
  const m = $("#modal");
  m.hidden = !ui.settings;
  if (ui.settings) {
    m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "ตั้งค่า");
    const html = `<div>${settingsView(ui, slots.list())}</div>`;
    if (m.dataset.html !== html) {
      const a = document.activeElement, key = m.contains(a) && (a.dataset.a ? `[data-a="${a.dataset.a}"]`
        : a.dataset.c ? `[data-c="${a.dataset.c}"]` : null);
      m.innerHTML = html; m.dataset.html = html;
      if (key && document.activeElement === document.body) m.querySelector(key)?.focus({ preventScroll: true });
    }
    if (ui.focusModal) { m.querySelector("button")?.focus(); ui.focusModal = false; }
  } else delete m.dataset.html;
}

// The owner's private feedback form (an artifact on claude.ai): experience only, nothing from the game is sent.
const FEEDBACK_URL = "https://claude.ai/artifact/A3cDSFiDyyLiSPaEWeEKPw";
const feedbackLink = `<a class="fblink" href="${FEEDBACK_URL}" target="_blank" rel="noopener">เล่นแล้วรู้สึกยังไง บอกได้ที่นี่ ↗</a>`;

// ---- Loop
function step() {
  if (s.ev) {
    if (ui.policy === "stop") return false;
    const i = C.autoDecide(s, ui.policy);
    if (i < 0) return false;
    C.choose(s, i);
  } else {
    const y = C.ageY(s);
    C.advance(s);
    const n = !s.dead && C.ageY(s) > y ? C.yearSummary(s, y).lines.length : 0;
    if (n) banner(`ครบ ${y + 1} ขวบ · ปีที่ผ่านมามี ${n} เรื่องสำคัญ`, "news");
  }
  return true;
}

function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.25, (t - last) / 1000 || 0); last = t;
  if (bannerT > 0 && (bannerT -= dt) <= 0) $("#banner").hidden = true;
  if (s && !s.dead && !ui.paused && !ui.settings) {
    acc += dt;
    while (acc >= STEP_S[ui.speed]) { acc -= STEP_S[ui.speed]; if (!step()) { acc = 0; break; } fx(); dirty = true; if (s.dead) break; }
  }
  if (s?.dead && $("#end").hidden && !s.endShown) { s.endShown = true; endScreen(); }
  if (dirty) render();
}

// ---- Input
function act(a, el) {
  const [k, v] = a.split(/:(.*)/s);
  const A = {
    new: () => {
      const seed = $("[data-c=seed]")?.value.trim() || Math.random().toString(36).slice(2, 8);
      ui.slot = freeSlot();
      const life = C.newLife(seed);
      C.applyUnlocks(life, book.get());
      begin(life);
      if (ui.slot < 0) banner("ช่องเซฟเต็ม ชีวิตนี้จะไม่บันทึกอัตโนมัติ บันทึกเองได้ในตั้งค่า");
    },
    heir: () => {
      if (!s?.dead || !C.canHeir(s)) return;
      const life = C.newHeir(s, s.seed + "-g" + ((s.gen ?? 1) + 1));
      C.applyUnlocks(life, book.get());
      const was = ui.slot;
      ui.slot = freeSlot();
      begin(life);
      if (ui.slot < 0) banner("ช่องเซฟเต็ม ชีวิตนี้จะไม่บันทึกอัตโนมัติ บันทึกเองได้ในตั้งค่า");
      else if (ui.slot === was) banner("ชีวิตใหม่บันทึกต่อในช่องเดียวกับชีวิตก่อน");
    },
    load: () => {
      const life = slots.load(+v);
      if (!life) return banner("โหลดเซฟไม่สำเร็จ");
      ui.slot = +v; ui.settings = false;
      begin(life);
      if (life.dead) showEnd(false); // a finished life: show its end, do not count it again
    },
    save: () => {
      const r = slots.save(+v, s);
      if (r === "newer") { if (ui.slot === +v) ui.slot = -1; return banner(NEWER, "urgent"); }
      if (!r) return banner("บันทึกไม่สำเร็จ ลองช่องอื่น หรือส่งออกเซฟเก็บไว้ก่อน", "urgent");
      ui.slot = +v; banner("บันทึกแล้ว");
    },
    del: () => {
      const x = slots.list()[+v];
      if (!confirm(`ลบเซฟช่อง ${+v + 1}${x?.name ? ` (${x.name})` : ""} จริงไหม? ลบแล้วกู้คืนไม่ได้`)) return;
      slots.del(+v);
      if (s && !s.dead && ui.slot === +v) { ui.slot = -1; banner("ชีวิตนี้จะไม่บันทึกจนกว่าจะเลือกช่องใหม่ในตั้งค่า"); }
      if (!s || s.dead) startScreen();
    },
    export: () => { ui.exportText = slots.exportStr(+v) ?? ""; },
    import: () => {
      const i = +v, x = slots.list()[i];
      if (x && !x.locked && !confirm(`ช่อง ${i + 1} มีชีวิตของ ${x.name} อยู่ นำเข้าทับไหม? ชีวิตเดิมจะเก็บเป็นเซฟสำรอง`)) return;
      const r = slots.importStr(i, ui.importText);
      if (r.ok && s && !s.dead && ui.slot === i) {
        ui.slot = -1; // the imported life now owns this slot; the running one must not save over it
        return banner(`นำเข้าลงช่อง ${i + 1} แล้ว ชีวิตที่เล่นอยู่จะไม่บันทึกจนกว่าจะเลือกช่องใหม่`);
      }
      banner(r.ok ? `นำเข้าลงช่อง ${i + 1} แล้ว` : `นำเข้าไม่ได้: ${r.reason}`);
    },
    quit: () => { if (s && !s.dead) autosave(); s = null; ui.settings = false; startScreen(); },
    choose: () => { const n0 = s.log.length; C.choose(s, +v); showResult(n0); fx(); },
    fate: () => { const n0 = s.log.length; if (C.chooseByFate(s)) { showResult(n0); fx(); } },
    pin: () => { if (s.ev?.opts[+v]) C.pinFromOption(s, s.ev.opts[+v]); },
    unpin: () => C.unpinGoal(s, v),
    focus: () => C.setFocus(s, v),
    focus2: () => C.setFocus2(s, v === "none" ? null : v),
    speed: () => { if (SPEEDS.includes(+v)) ui.speed = +v; ui.paused = false; saveCfg(); },
    pause: () => { ui.paused = !ui.paused; },
    policy: () => { ui.policy = v; saveCfg(); },
    fs: () => { ui.fs = +v; saveCfg(); },
    fold: () => { ui.folded = true; },
    unfold: () => { ui.folded = false; },
    settings: () => { ui.opener = document.activeElement; ui.settings = true; ui.exportText = ""; ui.focusModal = true; },
    close: () => {
      ui.settings = false;
      // the button that opened settings may have been drawn again meanwhile: go back to the one on screen now
      const back = ui.opener?.isConnected ? ui.opener : document.querySelector('[data-a="settings"]');
      back?.focus?.(); ui.opener = null;
    },
    tab: () => { ui.tab = v; },
    onlyImp: () => { ui.onlyImp = !ui.onlyImp; },
    plan: () => { s.prefs.plan = v; },
    slot: () => toggleSlot(s, v),
    equip: () => C.equip(s, v), lock: () => { const it = s.items.find((i) => i.uid === v); C.lockItem(s, v, !it.lock); },
    sell: () => C.sellItem(s, v), use: () => C.useItem(s, v),
    guildLeave: () => { if (busy()) return; if (confirm("ออกจากกิลด์จริงไหม? ของในตู้กิลด์จะถูกขนกลับบ้าน")) C.leaveGuild(s); },
    guildFound: () => { if (busy()) return; if (confirm(s.guild ? "ตั้งกิลด์ของตัวเองจริงไหม? คุณจะออกจากกิลด์เดิม และของในตู้กิลด์จะถูกขนกลับบ้าน" : "ตั้งกิลด์ของตัวเองจริงไหม?")) banner(C.foundGuild(s) ? "ตั้งกิลด์แล้ว" : "ยังตั้งกิลด์ไม่ได้"); },
    stashGuild: () => busy() || C.stash(s, $("[data-c=vaultPick]")?.value, "guild") || banner("เก็บไม่ได้"),
    takeGuild: () => busy() || C.take(s, v, "guild") || banner("กระเป๋าเต็ม"),
    forge: () => { if (busy()) return; const r = C.forge(s, v); banner(r === "ok" ? "ตีบวกสำเร็จ" : r === "fail" ? "ตีบวกไม่สำเร็จ" : "ตีบวกไม่ได้"); },
    stashHome: () => busy() || C.stash(s, v, "home") || banner("เก็บไม่ได้"), stashVault: () => busy() || C.stash(s, $("[data-c=vaultPick]")?.value, "vault") || banner("เก็บไม่ได้"),
    takeHome: () => busy() || C.take(s, v, "home") || banner("กระเป๋าเต็ม"), takeVault: () => busy() || C.take(s, v, "vault") || banner("หยิบไม่ได้"),
    junk: () => banner(`ขายไป ${C.autoJunk(s, { belowRarity: ui.junk })} ชิ้น`),
    loadSave: () => { const n = "ชุด " + (Object.keys(s.loadouts ?? {}).length + 1); C.saveLoadout(s, n); },
    loadUse: () => C.useLoadout(s, v),
    borrow: () => banner(C.borrow(s, 1000) ? "กู้แล้ว ₿1,000" : "วงเงินกู้ไม่พอ"),
    repay: () => banner(C.repay(s, 1000) ? "ชำระแล้ว" : "ไม่มีเงินพอชำระ"),
    hire: () => { const m = C.recruitOffers(s).find((x) => x.id === v); if (m) banner(C.hire(s, m) ? `${m.n} เข้าทีมแล้ว` : "จ้างไม่ได้"); },
    dismiss: () => { if (s.ev || s.op) return banner("จัดการเรื่องที่ค้างอยู่ก่อน"); if (confirm("ให้ลูกทีมคนนี้ออกจริงไหม?")) C.dismiss(s, v); },
    party: () => { if (s.ev || s.op) return banner("จัดการเรื่องที่ค้างอยู่ก่อน"); if (confirm("แน่ใจไหม? ทางนี้ย้อนกลับไม่ได้")) C.leaveParty(s, v); },
    hireStaff: () => { const w = C.staffOffers(s).find((x) => x.id === v); if (w) banner(C.hireStaff(s, w) ? `${w.n} เริ่มงานแล้ว` : "จ้างไม่ได้"); },
    fireStaff: () => { if (s.ev || s.op) return banner("จัดการเรื่องที่ค้างอยู่ก่อน"); if (confirm("ให้ลูกน้องคนนี้ออกจริงไหม?")) C.fireStaff(s, v); },
    quitJob: () => { if (confirm("ลาออกจากงานจริงไหม?")) C.quitJob(s); },
    jobHunt: () => { if (!s.ev && !s.op) C.openJobChoice(s); },
    move: () => { if (confirm("ย้ายที่อยู่จริงไหม? ค่าย้ายจ่ายทันที")) banner(C.moveCity(s, v) ? "ย้ายแล้ว" : "ย้ายไม่ได้"); },
  };
  A[k]?.();
  dirty = true;
}

// Event options act on pointerdown, so the event panel re-rendering mid-press cannot swallow the choice.
// Everything else acts on click, so starting a scroll on a phone never fires a button.
const target = (e) => { const el = e.target.closest("[data-a]"); return el && !el.disabled ? el : null; };
const FAST = /^choose:/;
document.addEventListener("pointerdown", (e) => {
  const el = target(e);
  if (e.pointerType === "mouse" && e.button === 0 && el && FAST.test(el.dataset.a)) {
    el.dataset.done = "1"; act(el.dataset.a, el);
  }
});
document.addEventListener("click", (e) => {
  const el = target(e);
  if (!el) return;
  if (el.dataset.done) { delete el.dataset.done; return; }
  act(el.dataset.a, el);
});
document.addEventListener("change", (e) => {
  const c = e.target.dataset?.c;
  if (c === "policy") { ui.policy = e.target.value; saveCfg(); }
  if (c === "kind" || c === "sort") ui.itemFilter[c] = e.target.value;
  if (c === "junk") ui.junk = +e.target.value;
  dirty = true;
});
document.addEventListener("input", (e) => {
  const c = e.target.dataset?.c;
  if (c === "q") { ui.itemFilter.q = e.target.value; }
  if (c === "importText") ui.importText = e.target.value;
});
document.addEventListener("keydown", (e) => {
  const modal = $("#modal");
  if (!modal.hidden) {
    if (e.key === "Escape") return act("close");
    if (e.key === "Tab") { // focus stays inside the dialog
      const f = [...modal.querySelectorAll("button,input,select,textarea,a[href]")].filter((x) => !x.disabled);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && (i < 0 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    }
    return; // no game shortcuts while the dialog is open
  }
  if (!s || s.dead || e.target.matches("input,textarea,select")) return;
  // Space presses the focused button now, so a redraw between key down and key up cannot swallow it
  if (e.key === " " && e.target.matches("button[data-a]")) {
    e.preventDefault();
    if (e.repeat || e.target.disabled) return; // holding Space acts once, like a real button press
    e.target.dataset.done = "1"; // some browsers still send a click on key up: the click handler skips it
    act(e.target.dataset.a, e.target);
    return;
  }
  if (e.key === " " && e.target.matches("button,a")) return;
  if (e.key === " ") { e.preventDefault(); ui.paused = !ui.paused; }
  else if (e.key === "+" || e.key === "=") ui.speed = SPEEDS.find((n) => n > ui.speed) ?? SPEEDS.at(-1);
  else if (e.key === "-") ui.speed = [...SPEEDS].reverse().find((n) => n < ui.speed) ?? SPEEDS[0];
  else if (e.key === "a" || e.key === "A") ui.policy = POLICY_ORDER[(POLICY_ORDER.indexOf(ui.policy) + 1) % 3];
  else if (/^[1-9]$/.test(e.key) && s.ev) {
    const vis = s.ev.opts.map((o, i) => [i, C.optionView(s, o)]).filter(([, v]) => v.visible);
    const pick = vis[+e.key - 1];
    if (pick && !pick[1].locked) { C.choose(s, pick[0]); fx(); }
  } else return;
  saveCfg(); dirty = true;
});

initStage($("#cv"), $("#ov"));
startScreen();
requestAnimationFrame(loop);

