import { weatherFor } from "./weather-art.js";
// DOM layer. Clicks use one delegated pointerdown, so re-rendering between press and release can't lose them.
import * as E from "./engine.js";
import * as D from "./data.js";
import { initStage, setScene, setHero, trigger, stage as ST, skip } from "./stage.js";
const { fmt, age, stat, mod } = E, { STATS, RANKS, CLASSES, SPECIALS, LATENTS, CAREERS, ELEMENTS, WEAPONS, ARMORS, CHARMS, GRADES, QUAL, MATS, HALLS, LVCAP } = D;
const $ = (q) => document.querySelector(q), KEY = "riftledger.save.v1", HALL = "riftledger.hall.v1";
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: (k) => { try { localStorage.removeItem(k); } catch {} } };
let s = null, tab = "log", speed = 2, paused = false, auto = false, acc = 0, last = 0, autoT = 0, dirty = true, tip = null, onlyImp = false, craftForm = { slot: "weapon", t: 0, g: 0 }, ticks = 0;
const SPEEDS = { 1: 0.8, 2: 0.4, 4: 0.17, 8: 0.07 };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const bar = (v, c = "") => `<div class="bar ${c}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
const btn = (l, a, c = "", off = false) => `<button class="${c}" data-a="${a}"${off ? " disabled" : ""}>${l}</button>`;

function save() { const j = JSON.stringify(s), p = store.get(KEY); store.set(KEY + ".tmp", j); store.set(KEY, j); store.del(KEY + ".tmp"); if (p) store.set(KEY + ".bak", p); }
function load() { for (const k of [KEY, KEY + ".bak"]) { try { const v = JSON.parse(store.get(k)); if (v && v.v === 1 && v.st) return v; } catch {} } return null; }
const hallList = () => { try { return JSON.parse(store.get(HALL)) || []; } catch { return []; } };
const randSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase();

function start(seed, name, legacy) { s = E.newLife(seed, name, legacy); tab = "log"; paused = false; $("#start").hidden = true; $("#end").hidden = true; $("#game").hidden = false; dirty = true; save(); draw(); }
function menu() {
  const sv = load(), n = D.GIVEN[(Math.random() * D.GIVEN.length) | 0]; $("#game").hidden = true; $("#end").hidden = true; $("#start").hidden = false;
  const h = hallList().slice(0, 6);
  $("#start").innerHTML = `<div class="st-card"><p class="kicker">สมาคมฮันเตอร์ · แฟ้มทะเบียนผู้อยู่อาศัย</p><h1>บันทึกหลังรอยแยก</h1><p class="lede">เกิดหนึ่งครั้งในเมืองที่ฟ้าแตกไปแล้ว Seed กำหนดพลังแฝง คลาส เควส หอคอย และปฏิทินภัยพิบัติของชีวิตนี้ ที่เหลือคือสิ่งที่คุณเลือก</p>
  <label>ชื่อ<input id="iname" maxlength="20" value="${n}"></label><label>Seed ของชีวิต<span class="row"><input id="iseed" maxlength="24" value="${randSeed()}">${btn("สุ่ม", "reseed", "ghost")}</span></label>
  <div class="row">${btn("เริ่มชีวิตใหม่", "new", "pri")}${sv ? btn(`เล่นต่อ: ${esc(sv.name)} อายุ ${E.age(sv)}`, "cont", "ghost") : ""}</div>
  ${h.length ? `<h3>ชีวิตที่ผ่านมา</h3><ul class="hall">${h.map((x) => `<li><b>${esc(x.n)}</b> · ${esc(x.title)} · ${x.age} ปี · ${fmt(x.score)} แต้ม <small>Seed ${esc(x.seed)}</small></li>`).join("")}</ul>` : ""}</div>`;
}
function ended() {
  const d = s.dead, h = hallList(); if (!s.saved) { s.saved = 1; h.unshift({ n: s.name, title: d.title, age: d.age, score: d.score, seed: s.seed }); store.set(HALL, JSON.stringify(h.slice(0, 30))); } store.del(KEY); store.del(KEY + ".bak");
  $("#end").hidden = false; $("#end").innerHTML = `<div class="st-card"><p class="kicker">ปิดแฟ้มทะเบียน</p><h1>${esc(s.name)}</h1><p class="title">${esc(d.title)}</p><p class="lede">จากไปเมื่ออายุ ${d.age} ปี · ${esc(d.cause)}</p><div class="sum"><span>${s.hunter ? `แรงก์ ${RANKS[s.rank]} · Lv.${s.lv}` : esc(s.career ? CAREERS[s.career].t[s.cr] : "ไม่มีอาชีพ")}</span><span>หอชั้น ${s.floor}</span><span>ชื่อเสียง ${fmt(s.fame)}</span><span>กรรม ${s.karma}</span><span>เงิน ₡${fmt(s.gold)}</span><span>${fmt(d.score)} แต้ม</span></div><div class="row">${btn("ชีวิตใหม่", "menu", "pri")}${btn("เล่น Seed เดิม", "same", "ghost")}${s.kids.length ? btn(`สืบต่อเป็น ${esc(s.kids[0])}`, "heir", "ghost") : ""}</div></div>`;
}
// Which picture the stage shows comes from what the character is doing.
const CAREER_SCENE = { doc: "clinic", smith: "forge", trader: "market", pawn: "market", cook: "market", press: "market", cop: "wall", barrier: "wall", signal: "wall", rescue: "wall", mortician: "ruins", ruin: "ruins", medium: "ruins", arena: "arena", porter: "rift", clerk: "guild", lawyer: "guild" };
// Hunt scenery changes every half year so a long life does not sit in one backdrop.
function sceneFor() { const st = E.stage(s); if (st === "k") return "home"; if (s.ev?.tag === "โลก") return "rift"; if (st === "c") return s.focus === "craft" ? "forge" : CAREER_SCENE[s.career] || "street"; const b = Math.floor(s.ageM / 6); return { hunt: s.at ? E.placeOf(s).sc : ["rift", "ruins", "frost", "ember"][b % 4], tower: "tower", guild: "guild", craft: "forge", train: b % 2 ? "arena" : "city", rest: "home" }[s.focus] || "city"; }
function card() {
  const st = E.stage(s), d = E.derive(s), cl = s.cls ? CLASSES[s.cls] : null, L = E.lifespan(s), rank = s.hunter ? RANKS[s.rank] : st === "k" ? "—" : "ปชช";
  const role = s.hunter ? `${s.spc ? SPECIALS.find((x) => x.id === s.spc).n : cl.n}` : s.career ? `${CAREERS[s.career].t[s.cr]} · ${CAREERS[s.career].n}` : "เด็กในเมืองหลังแนวกั้น";
  const prog = s.hunter ? `<div class="kv"><span>Lv.${s.lv} / ${LVCAP[s.rank]}</span><b>EXP ${fmt(s.xp)}/${fmt(E.xpNeed(s.lv))}</b></div>${bar((s.xp / E.xpNeed(s.lv)) * 100, "xp")}` : s.career ? `<div class="kv"><span>ผลงาน</span><b>${fmt(s.cxp)}</b></div>` : "";
  const stats = Object.entries(STATS).map(([k, n]) => `<button class="stat${tip === k ? " on" : ""}" data-a="tip:${k}"><small>${n}</small><b>${Math.floor(stat(s, k))}</b></button>`).join("");
  return `<div class="lic"><div class="stamp ${s.hunter ? "r" + s.rank : ""}">${rank}</div><p class="kicker">${s.hunter ? "ใบอนุญาตฮันเตอร์" : "บัตรผู้อยู่อาศัย"}</p><h2>${esc(s.name)}</h2><p class="role" style="${cl ? `color:${cl.c}` : ""}">${esc(role)}</p><p class="meta">${age(s)} ปี · ${E.dateText(s)}</p></div>
  <div class="kv"><span>สุขภาพ</span><b>${Math.round(s.health)}/100</b></div>${bar(s.health, "hp")}<div class="kv"><span>อายุขัย</span><b>${age(s)}/${Math.round(L)} ปี</b></div>${bar((age(s) / L) * 100, "age")}${prog}
  <div class="stats">${stats}</div>${tip ? `<div class="tip"><b>${STATS[tip]} มาจาก</b>${E.breakdown(s, tip).map((x) => `<div class="kv"><span>${esc(x.n)}</span><b>${x.v > 0 ? "+" : ""}${x.v}</b></div>`).join("")}</div>` : ""}
  <div class="vit"><span title="เงิน">₡ <b>${fmt(s.gold)}</b></span><span>ชื่อเสียง <b>${fmt(s.fame)}</b></span><span>กรรม <b>${s.karma > 0 ? "+" : ""}${Math.round(s.karma)}</b></span>${s.hunter ? `<span>พลังรบ <b>${fmt(d.power)}</b></span>` : ""}</div>

  `;
}
const chip = (e) => { if (!e) return ""; const a = []; if (e.gold) a.push(`${e.gold > 0 ? "+" : "−"}เงิน`); if (e.xp) a.push("EXP"); if (e.hp) a.push(`สุขภาพ ${e.hp > 0 ? "+" : ""}${e.hp}`); if (e.fame) a.push("ชื่อเสียง"); if (e.karma) a.push(`กรรม ${e.karma > 0 ? "+" : ""}${e.karma}`); if (e.skill) a.push("วิชา"); if (e.gear) a.push("อุปกรณ์"); if (e.mat) a.push("วัตถุดิบ"); if (e.rankUp) a.push("เลื่อนแรงก์"); if (e.setSpc) a.push("คลาสพิเศษ"); if (e.awaken) a.push("ตื่นพลัง"); if (e.main) a.push("สัญญาหลัก"); return a.join(" · "); };
// With no event pending, the same panel holds the monthly decision and the next milestone.
function desk() {
  const st = E.stage(s), fs = E.FOCUS[st], ex = E.examInfo(s), R = RANKS[s.rank + 1], next = s.career && CAREERS[s.career].t[s.cr + 1];
  const goal = st === "k" ? "ทุกเดือนในวัยเด็กจะกลายเป็นค่าสถานะติดตัวไปตอนโต" : s.hunter ? (!R ? "ไม่มีแรงก์ให้ไต่อีกแล้ว เหลือแต่ชื่อที่จะทิ้งไว้" : ex.ready ? `พร้อมสอบแรงก์ ${R} แล้ว รอซองเรียกจากสมาคม${s.bank ? ` · EXP สะสมรอ ${fmt(s.bank)}` : ""}` : `สู่แรงก์ ${R}: Lv.${s.lv}/${LVCAP[s.rank] - 2} · สัญญาหลัก ${ex.have}/${ex.need}`) : next ? `สู่ตำแหน่ง ${next}: สัญญาหลัก ${ex.have}/${ex.need}` : s.career ? "ถึงจุดสูงสุดของสายงานแล้ว" : "ยังไม่มีงานประจำ รอโอกาสที่จะผ่านเข้ามา";
  const warn = st !== "k" && s.health < 35 && s.focus !== "rest" ? `<p class="bad">สุขภาพเหลือน้อย เปลี่ยนไปที่ "${fs.rest.n}" ก่อนจะล้มไปเอง</p>` : "";
  // Hunter plans sit under their own headings; farm, travel and tower details live in their own tabs.
  const fb = (k) => (fs[k] ? btn(fs[k].n, `focus:${k}`, s.focus === k ? "on" : "") : ""), grp = (t, ks, note = "") => `<div class="fgrp"><span class="gl">${t}${note ? ` <small>${note}</small>` : ""}</span><div class="focus">${ks.map(fb).join("")}</div></div>`;
  const plan = st === "h" ? `${grp("ฟาร์ม", ["hunt"], esc(E.placeOf(s).n))}${grp("หอ", ["tower"], s.run ? `รอบนี้ ${s.run.n} ชั้น` : `ชั้น ${s.floor}${s.floor < 100 ? "/100" : ""}`)}${grp("ฝึกฝน", ["train", "body", "mind", "soc", "craft"])}${grp("ชีวิต", ["guild", "rest"])}` : `<div class="focus">${Object.keys(fs).map(fb).join("")}</div>`;
  return `<div class="ev desk"><span class="tag">แผนเดือนนี้</span><p>${esc(goal)}</p>${warn}${plan}</div>`;
}
// Typical local foe for a place, the same level rule hunt() uses, so the odds shown match what you will meet.
const placeFoe = (P) => E.enemy({ n: P.n, lv: Math.max(1, s.lv - 1, P.lv - 2), m: P.m, el: P.el || "metal" });
function eventBox() {
  if (!s.ev) return `<div class="ev desk idle"><span class="tag">เหตุการณ์</span><p class="dim">ยังไม่มีเรื่องเข้ามา เมื่อมีเหตุการณ์หรือทางเลือก จะขึ้นที่ช่องนี้</p></div>`; const big = ["โลก", "คลาสพิเศษ", "ปลุกพลัง", "แรงก์"].includes(s.ev.tag);
  return `<div class="ev ${big ? "big" : ""}"><span class="tag">${esc(s.ev.tag)}</span>${auto && KEY_EV.has(s.ev.tag) ? ` <span class="dim">ออโต้รอให้คุณเลือกเรื่องนี้เอง</span>` : ""}<p>${esc(s.ev.t)}</p><div class="opts">${s.ev.o.map((o, i) => { const p = E.optOdds(s, o), cls = p == null ? "" : p >= 70 ? "g" : p >= 40 ? "m" : "b", why = o.fight ? "โอกาสชนะ" : o.s ? `ทดสอบ${STATS[o.s]}` : "โอกาส"; return `<button data-a="opt:${i}"><span>${o.who ? "★ " : o.need ? "◆ " : o.ap ? "◇ " : ""}${esc(o.l)}<small>${esc(o.note || (o.ap ? `อีกวิธีสำหรับเรื่องเดียวกัน · ทดสอบ${STATS[o.s]} · ${chip(o.y)}` : o.who ? `ทางเลือกจากสายงานของคุณ · ${chip(o.y)}` : o.need ? `ทางเลือกจากสเตตัส ${Object.entries(o.need).map(([k, v]) => `${STATS[k]} ${v}+`).join(" ")} · ${chip(o.y)}` : chip(o.y)))}${E.habitHit(s, o) ? " · ใช้วิธีนี้ซ้ำจนคนเริ่มอ่านทางออก" : ""}</small></span>${p != null ? `<em class="${cls}" title="${why}">${why} ${p}%</em>` : ""}</button>`; }).join("")}</div></div>`;
}
const VIEWS = {
  log() { const L = s.log.filter((x) => !onlyImp || ["imp", "leg", "bad"].includes(x.cls)).slice(-160).reverse(); let y = -1, out = `<div class="row end">${btn(onlyImp ? "แสดงทั้งหมด" : "เฉพาะเรื่องสำคัญ", "imp", "ghost sm")}</div>`; for (const x of L) { if (x.y !== y) { y = x.y; out += `<h4>อายุ ${y}</h4>`; } out += `<p class="l ${x.cls}">${x.tag ? `<span>${esc(x.tag)}</span>` : ""}${esc(x.t)}${x.r ? `<em>${x.r}</em>` : ""}${x.d ? `<b class="dl">${esc(x.d)}</b>` : ""}</p>`; } return out; },
  self() {
    const sp = s.w.specials.map((id) => SPECIALS.find((x) => x.id === id)).filter((x) => x), rows = sp.map((x) => { const need = Object.entries({ ...x.need, ...(x.max || {}) }).map(([k, v]) => `<span class="${(x.max && k in x.max ? E.val(s, k) <= v : E.val(s, k) >= v) ? "ok" : ""}">${E.NEED_LABEL[k] || k} ${x.max && k in x.max ? "≤" : ""}${v} (${Math.floor(E.val(s, k))})</span>`).join(""); return `<div class="item"><b>${s.spc === x.id ? "★ " : ""}${x.n}</b><small>${x.d}</small><div class="needs">${need}</div></div>`; }).join("");
    const job = (t, x, m = x.m) => `<div class="item"><b>${esc(t)}</b><small>${esc(x.d)}</small><small>${esc(E.perkText(m))}</small></div>`, jobs = `${s.cls ? job(`คลาส: ${CLASSES[s.cls].n}`, CLASSES[s.cls]) : ""}${s.career ? job(`อาชีพ: ${CAREERS[s.career].n}`, CAREERS[s.career]) : ""}${(s.paths || []).map((id) => { const p = D.PATHS[id]; return job(`วัยเด็ก: ${p.n}`, p); }).join("")}${(s.perks || []).map((id) => { const p = D.perkOf(id); return job(`สายฝึก: ${p.n}`, p); }).join("")}${s.pastJob ? job(`อาชีพเดิม: ${CAREERS[s.pastJob].n} (ติดตัวครึ่งเดียว)`, CAREERS[s.pastJob], E.halve(CAREERS[s.pastJob].m)) : ""}`;
    return `<h3>ที่มา</h3><p>${esc(D.FAMILIES[s.fam].n)}: ${esc(D.FAMILIES[s.fam].d)}</p><p class="dim">Seed <b>${esc(s.seed)}</b> · ธาตุถนัด ${s.w.aff.map((e) => ELEMENTS[e].n).join(", ")}${s.hunter ? ` · ศักยภาพเพดานแรงก์ ${RANKS[s.w.ceil]}` : ""}</p>${jobs ? `<h3>สายงาน</h3>${jobs}` : ""}
    <h3>พลังแฝง</h3>${s.latent.map((i, x) => (x < s.rev ? `<div class="item"><b>${LATENTS[i].n}</b><small>${LATENTS[i].d}</small></div>` : `<div class="item dim"><b>???</b><small>ยังไม่ตื่น</small></div>`)).join("")}
    <h3>คลาสพิเศษที่ชะตาเปิดให้ชีวิตนี้</h3><p class="dim">ทำเงื่อนไขครบก่อนอายุ ${E.SPC_AGE} เควสพิเศษจะมาหาคุณเอง · บททดสอบพลาดได้ 2 ครั้งต่อทาง</p>${rows}
    <h3>ผู้คนรอบตัว</h3><div class="grid2">${s.npcs.filter((n) => n.alive).sort((a, b) => b.rel - a.rel).slice(0, 10).map((n) => `<div class="item"><b>${esc(n.n)}</b><small>${esc(n.job)} ${n.hun ? `· Lv.${n.lv}` : ""} · ความสัมพันธ์ ${Math.round(n.rel)}</small></div>`).join("")}</div>${s.spouse != null ? `<p>คู่ชีวิต: ${esc(s.npcs[s.spouse].n)}${s.kids.length ? ` · ลูก: ${s.kids.map(esc).join(", ")}` : ""}</p>` : ""}`;
  },
  skills() {

    const list = s.sk.map((x) => E.sk(s, x.id)).sort((a, b) => b.g - a.g || b.p - a.p), pc = (v) => `${Math.round(v * 100)}%`;
    const effect = (x) => x.k === "atk" ? `พลังโจมตี +${pc(x.p)}` : x.k === "guard" ? `พลังป้องกัน +${pc(x.p)}` : x.k === "step" ? `โอกาสหลบ +${pc(x.p)} · เพดาน ${pc(E.skCap.step(x.g))}` : `เลือดต่ำกว่า 40% ฟื้น ${pc(Math.min(E.skCap.heal(x.g), x.p * 1.2))} ครั้งเดียวต่อศึก · เพดาน ${pc(E.skCap.heal(x.g))}`;
    const card = (x) => `<button class="item sel skc ${x.g >= 5 ? "top" : ""} ${s.eq.includes(x.id) ? "on" : ""}" style="--r:${x.gc}" data-a="sk:${x.id}"><b style="color:${ELEMENTS[x.el].c}">${x.n}</b><i class="rar">${x.gn}</i><small>${D.SKILL_KINDS[x.k].n} · ธาตุ${ELEMENTS[x.el].n} · ชำนาญ ${Math.floor(x.m)}/100</small><small class="eff">${effect(x)}${x.m < 100 && x.k !== "heal" && x.k !== "step" ? ` (สูงสุด +${pc(x.max)})` : ""}</small><small class="flv">${x.gd}</small></button>`;
    const group = (t, note, xs) => `<h4>${t} <small class="dim">${note}</small></h4>${xs.length ? `<div class="grid2">${xs.map(card).join("")}</div>` : `<p class="dim">ยังไม่มีวิชาในกลุ่มนี้</p>`}`;
    const isAct = (x) => D.SKILL_KINDS[x.k].t === "Active";
    return `<p class="dim">ติดตั้งได้: โจมตี 3 · ป้องกัน 1 · หลบ 1 · ฟื้นฟู 1 วิชาธาตุถนัดแรงขึ้น 25%${s.eqManual ? " · จัดวิชาเองแล้ว วิชาใหม่จะลงเฉพาะช่องที่ว่าง" : ""}</p><div class="rars">${D.SKILL_GRADES.map((G) => `<span style="--r:${G.c}">${G.n}</span>`).join("")}</div>${group("Active", "ใช้สลับกันทีละท่าระหว่างต่อสู้", list.filter(isAct))}${group("Passive", "ทำงานเองตลอดการต่อสู้", list.filter((x) => !isAct(x)))}`;
  },
  forge() {
    const slotOpts = { weapon: WEAPONS.map((x) => x.n), armor: ARMORS, charm: CHARMS }, f = craftForm, c = E.recipeCost(f.g), have = (k) => s.mat[k + f.g] || 0;
    const shop = E.SHOP.filter((x) => !x.hunter || s.hunter).map((x) => btn(`${x.n} ₡${fmt(x.price(s))}<small>${x.d}${x.id === "anvil" ? ` (ขั้น ${s.anvil})` : ""}</small>`, `buy:${x.id}`, "shop")).join("");
    const gear = s.gear.slice().sort((a, b) => E.gearPw(b) - E.gearPw(a)).map((g) => { const on = s.wear[g.slot] === g.id; return `<div class="item gear q${g.q}"><b>${on ? "▣ " : ""}${esc(E.gearName(g))}</b><small>${QUAL[g.q].n} · พลัง ${fmt(E.gearPw(g))}${g.affix != null ? ` · ${E.perkText(D.AFFIX[g.affix].m)}` : ""}</small><div class="row">${on ? "" : btn("สวม", `eq:${g.id}`, "sm")}${g.plus < 15 ? btn(`ตีบวก ${E.enhOdds(s, g)}% · ₡${fmt(E.enhCost(g))}`, `enh:${g.id}`, "sm amber") : ""}${on ? "" : btn("ขาย", `sell:${g.id}`, "sm ghost")}</div></div>`; }).join("");
    return `<h3>ตีอาวุธ</h3><div class="row wrap">${["weapon", "armor", "charm"].map((k) => btn({ weapon: "อาวุธ", armor: "เกราะ", charm: "เครื่องราง" }[k], `cs:${k}`, f.slot === k ? "on sm" : "sm ghost")).join("")}</div><div class="row wrap">${slotOpts[f.slot].map((n, i) => btn(n, `ct:${i}`, f.t === i ? "on sm" : "sm ghost")).join("")}</div><div class="row wrap">${GRADES.map((g, i) => btn(g.n, `cg:${i}`, f.g === i ? "on sm" : "sm ghost", i > s.anvil)).join("")}</div>
    <p class="dim">ใช้ ${MATS.ore} ${c.ore} (${have("ore")}) · ${MATS.hide} ${c.hide} (${have("hide")}) · ${MATS.core} ${c.core} (${have("core")}) · ₡${fmt(c.gold)} · สำเร็จ ${E.craftOdds(s, f.g)}% · ฝีมือช่าง ${Math.floor(s.craft)}</p>${btn("ลงมือตี", "craft", "pri")}
    <h3>ตลาดสมาคม</h3><p class="dim">ยา ${s.pot} · หินกันแตก ${s.stone} · แผ่นย้ายชีพ ${s.token}</p><div class="grid2">${shop}</div><h3>คลังอุปกรณ์</h3><p class="dim">ตีบวกล้ม: +5 ขึ้นไปลดระดับ · +10 ขึ้นไปอาวุธแตก เว้นแต่มีหินกันแตก</p>${gear || `<p class="dim">ยังไม่มีอุปกรณ์</p>`}`;
  },
  farm() {
    const P = E.placeOf(s), pay = E.placePay(s), y = s.ty || { n: 0, f: {} }, top = Object.entries(y.f).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const mats = Object.entries(MATS).map(([k, n]) => `<div class="kv"><span>${n}</span><b>${GRADES.map((_, g) => s.mat[k + g] || 0).join(" · ")}</b></div>`).join("");
    return `<h3>ฟาร์มที่ ${esc(P.n)}</h3><p>${esc(P.d)}</p><div class="vit"><span>เลเวลพื้นที่ <b>${P.lv}+</b></span><span>ค่าตอบแทน <b>×${pay.toFixed(2)}</b></span><span>โอกาสชนะ <b>${E.winOdds(s, placeFoe(P))}%</b></span>${P.el ? `<span>ศัตรูธาตุ <b>${ELEMENTS[P.el].n}</b></span>` : ""}${P.mat ? `<span>วัตถุดิบ <b>+${P.mat}%</b></span>` : ""}</div>
    ${pay < P.pay ? `<p class="dim">ที่นี่ง่ายเกินฝีมือคุณ ค่าตอบแทนลดลง ลองดูแท็บเดินทาง</p>` : ""}${s.lv < P.lv ? `<p class="bad">เลเวลต่ำกว่าพื้นที่ แพ้บ่อยและบาดเจ็บหนัก</p>` : ""}
    <div class="row">${btn(s.focus === "hunt" ? "กำลังล่าที่นี่ทุกเดือน" : "ตั้งแผน: ล่ารอยแยก", "focus:hunt", s.focus === "hunt" ? "on" : "pri")}</div>
    <h3>ผลล่าปีนี้</h3><p class="dim">ล่าสำเร็จ ${y.n} ครั้ง · ทั้งชีวิต ${fmt(s.c.hunts || 0)} ครั้ง</p>${top.map(([n, c]) => `<div class="kv"><span>${esc(n)}</span><b>${c}</b></div>`).join("")}
    <h3>วัตถุดิบในคลัง</h3><p class="dim">ตามเกรด ${GRADES.map((g) => g.n).join(" · ")}</p>${mats}`;
  },
  travel() {
    const cur = s.at || 0;
    // Places shown: everything up to a little past your level, so the next danger is visible before you can survive it.
    const rows = D.PLACES.map((p, i) => { if (p.lv > s.lv + 20 && i !== cur) return ""; const here = i === cur, risk = s.lv < p.lv; return `<div class="item${here ? " on" : ""}"><b>${here ? "▣ " : ""}${esc(p.n)}</b><small>${esc(p.d)}</small><small>Lv.${p.lv}+ · ค่าตอบแทน ×${p.pay}${p.mat ? ` · วัตถุดิบ +${p.mat}%` : ""}${p.el ? ` · ธาตุ${ELEMENTS[p.el].n}` : ""} · โอกาสชนะ ${E.winOdds(s, placeFoe(p))}%</small><div class="row">${here ? `<span class="dim">อยู่ที่นี่</span>` : btn(`${risk ? "เสี่ยง · " : ""}เดินทาง ${p.fare ? `₡${fmt(p.fare)}` : "ฟรี"}`, `go:${i}`, risk ? "sm risk" : "sm", s.gold < p.fare)}</div></div>`; }).join("");
    const hidden = D.PLACES.filter((p, i) => p.lv > s.lv + 20 && i !== cur).length;
    return `<h3>เดินทาง · สถานที่</h3><p class="dim">ค่าเดินทางจ่ายครั้งเดียว ที่ที่คุณอยู่กำหนดศัตรู ค่าตอบแทน และเหตุการณ์ท้องถิ่น · กลับรอยแยกรอบแนวกั้นฟรี</p><div class="grid2">${rows}</div>${hidden ? `<p class="dim">อีก ${hidden} แห่งยังไกลเกินฝีมือ จะเห็นเมื่อเลเวลใกล้ถึง</p>` : ""}`;
  },
  tower() {
    // A run in progress shows where it stands; otherwise the next run starts at the last boss checkpoint. Past 100 the grid shows the current block of 100.
    const R = s.run, f = R ? R.f : E.diveGate(s), F = E.floorAt(s, f), base = Math.floor((f - 1) / 100) * 100, foe = E.enemy(E.floorFoe(s, f)), rank = [...s.npcs.filter((n) => n.alive && n.hun).map((n) => ({ n: n.n, f: n.floor })), { n: s.name + " (คุณ)", f: s.floor }].sort((a, b) => b.f - a.f).slice(0, 8);
    const cells = Array.from({ length: 100 }, (_, i) => { const x = E.floorAt(s, base + i + 1), n = base + i + 1; return `<i class="f-${x.t} ${n <= s.floor ? "done" : ""} ${n === f ? "cur" : ""}" title="ชั้น ${n}: ${x.name} · ${x.mod.n}"></i>`; }).join("");
    const fightF = F.t === "fight" || F.t === "elite" || F.t === "boss";
    return `<h3>หอไร้ฟ้า · ชั้นสูงสุด ${s.floor}${s.floor < 100 ? "/100" : " · เหนือหลังคาโลก"}</h3><div class="tower">${cells}</div><p class="dim">ไต่ทีละชั้น ผ่านแต่ละชั้นแล้วเลือกว่าจะไปต่อหรือกลับพร้อมของ · ยิ่งไปต่อในรอบเดียว ศัตรูยิ่งแรงขึ้น +${Math.round(E.DIVE.press * 100)}% ต่อชั้น แต่ของดรอปยิ่งมากและคุณภาพดีขึ้น · แพ้แล้วของในถุงหายครึ่งหนึ่ง · รอบใหม่เริ่มที่จุดเช็คพอยต์ (ชั้นหลังบอสล่าสุด) · ชั้นที่เคยผ่านแล้วให้ของน้อยลง</p>${R ? `<p>รอบนี้ผ่านมาแล้ว <b>${R.n}</b> ชั้น · ในถุง ${E.bagText(R.bag)}</p>` : ""}<p class="dim">${R ? "ชั้นถัดไป" : "รอบหน้าเริ่ม"}: ชั้น ${f} · ${E.FLOOR_KIND[F.t]}${fightF ? ` · ${esc(F.name)}` : ""} · ${F.mod.n} · ธาตุ${ELEMENTS[F.el].n}${s.hunter && fightF ? ` · โอกาสชนะ <b>${E.winOdds(s, foe)}%</b>` : ""}</p>${s.hunter ? `<div class="row">${btn(s.focus === "tower" ? "กำลังไต่หอทุกเดือน" : "ตั้งแผน: ไต่หอ", "focus:tower", s.focus === "tower" ? "on" : "pri")}</div>` :`<p class="dim">หอเปิดเฉพาะผู้ตื่นพลัง คุณได้แต่ดูชื่อบนจอไฟในตลาด</p>`}<h3>กระดานจัดอันดับ</h3><ol class="rank">${rank.map((r) => `<li><span>${esc(r.n)}</span><b>ชั้น ${r.f}</b></li>`).join("")}</ol>`;
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
  world() {
    const up = s.w.cal.filter((c) => c.ann && !c.done).concat(s.w.cal.filter((c) => !c.ann).slice(0, 0)), W = (id) => D.WORLD.find((x) => x.id === id);
    return `<h3>ปฏิทินสมาคม</h3>${up.length ? up.map((c) => `<div class="item"><b>${W(c.id).n}</b><small>อีกราว ${Math.max(1, c.at - s.ageM)} เดือน · ${esc(W(c.id).d.replace("{z}", c.z))}</small></div>`).join("") : `<p class="dim">ยังไม่มีประกาศล่วงหน้า</p>`}${s.w.price > 1 ? `<p class="bad">ค่าครองชีพ ×${s.w.price} อีก ${s.w.priceT} เดือน</p>` : ""}<h3>ศิลาจารึกชีวิตก่อนๆ</h3><ul class="hall">${hallList().slice(0, 10).map((x) => `<li><b>${esc(x.n)}</b> · ${esc(x.title)} · ${x.age} ปี · ${fmt(x.score)} แต้ม</li>`).join("") || "<li>ยังว่างเปล่า</li>"}</ul>`;
  },
};
const TABS = { log: "บันทึก", self: "ตัวตน", skills: "วิชา", farm: "ฟาร์ม", travel: "เดินทาง", tower: "หอ", forge: "โรงตี", guild: "กิลด์", world: "โลก" };
// Tabs follow the life stage: children have no forge, and only hunters have skills, farming, travel or a guild.
const HUNTER_TABS = new Set(["skills", "guild", "farm", "travel"]);
const tabsFor = () => Object.entries(TABS).filter(([k]) => (k !== "forge" || E.stage(s) !== "k") && (s.hunter || !HUNTER_TABS.has(k)));
function draw() {
  if (!s) return; if (!tabsFor().some(([k]) => k === tab)) tab = "log"; { const sc = sceneFor(); setScene(sc, 7, weatherFor(s.y0 * 12 + s.mon0 + s.ageM, sc)); } setHero(s.cls ? CLASSES[s.cls].c : "#7fa8c9", E.stage(s) === "k", s.ageM, s.hunter ? null : s.career, s.hunter ? s.cls : null);
  $("#card").innerHTML = card() + desk(); $("#event").innerHTML = eventBox(); $("#tabs").innerHTML = tabsFor().map(([k, n]) => btn(n, `tab:${k}`, tab === k ? "on" : "")).join("");
  // A broken tab shows a note instead of taking the event box and controls down with it.
  if (document.activeElement?.id !== "gname") { let v; try { v = VIEWS[tab](); } catch (e) { console.error("tab " + tab, e); v = `<p class="bad">แท็บนี้แสดงไม่ได้ชั่วคราว</p>`; } $("#view").innerHTML = v; }
  $("#ctrl").innerHTML = `${btn(paused ? "เล่นต่อ" : "หยุด", "pause", paused ? "on" : "")}${[1, 2, 4, 8].map((v) => btn(v + "×", `spd:${v}`, speed === v ? "on" : "")).join("")}${btn(auto ? "ออโต้ เปิด" : "ออโต้ ปิด", "auto", auto ? "on" : "")}${btn("เมนู", "menu", "ghost")}`;
  dirty = false;
}
function flushFx() { while (E.fxOut.length) { const f = E.fxOut.shift(); trigger(f); if (f.n !== "minor" && f.n !== "coin") dirty = true; } }
const ACT = {
  new: () => start($("#iseed").value.trim() || randSeed(), $("#iname").value.trim() || "ไร้นาม"), cont: () => { s = load(); if (s) { $("#start").hidden = true; $("#game").hidden = false; draw(); } }, reseed: () => ($("#iseed").value = randSeed()), menu: () => { if (s && !s.dead) save(); s = null; menu(); },
  same: () => start(s.seed, s.name), heir: () => { const w = E.gearOf(s, s.wear.weapon); start(`${s.seed}/${s.kids[0]}`, s.kids[0], { gold: Math.max(0, s.gold * 0.3), from: s.name, gear: w ? { ...w, plus: Math.max(0, w.plus - 2) } : null }); },
  pause: () => (paused = !paused), auto: () => (auto = !auto), imp: () => (onlyImp = !onlyImp), craft: () => E.craft(s, craftForm.slot, craftForm.t, craftForm.g), found: () => { const n = $("#gname").value.trim(); if (n) { E.foundGuild(s, n); $("#gname").blur(); } }, leave: () => E.leaveGuild(s),
  tab: (v) => (tab = v), spd: (v) => (speed = +v), tip: (v) => (tip = tip === v ? null : v), focus: (v) => (s.focus = v), opt: (v) => { if (!s.ev) return; E.choose(s, +v); save(); }, sk: (v) => E.toggleSkill(s, v), eq: (v) => E.equip(s, +v), enh: (v) => E.enhance(s, +v, s.stone > 0), sell: (v) => E.sell(s, +v), buy: (v) => E.buy(s, v), cs: (v) => { craftForm.slot = v; craftForm.t = 0; }, ct: (v) => (craftForm.t = +v), cg: (v) => (craftForm.g = +v), join: (v) => E.joinGuild(s, +v), go: (v) => E.travel(s, +v), hall: (v) => E.upgradeHall(s, v), rec: (v) => E.recruit(s, +v), don: (v) => E.donate(s, +v),
};
// Spending and gear changes save at once, so a reload can't undo a bad result.
const SAVES = new Set("craft found leave focus sk eq enh sell buy join hall rec don go".split(" "));
function act(el) { const [k, v] = el.dataset.a.split(":"); ACT[k]?.(v); if (s && !s.dead && SAVES.has(k)) save(); flushFx(); if (s) { dirty = true; draw(); } if (s?.dead) ended(); }
// Mouse acts on press. Touch waits for a tap that didn't scroll, or dragging a list would press whatever is under the finger.
let tap = null;
document.addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; if (e.pointerType === "mouse") { if (e.button === 0) act(b); return; } tap = { a: b.dataset.a, x: e.clientX, y: e.clientY, id: e.pointerId, ev: s?.ev }; });
document.addEventListener("pointercancel", () => (tap = null));
document.addEventListener("pointerup", (e) => { const t = tap; tap = null; if (t && t.id === e.pointerId && t.ev === s?.ev && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 12) act({ dataset: { a: t.a } }); });
window.addEventListener("pagehide", () => { if (s && !s.dead) save(); });
document.addEventListener("click", (e) => { if (e.detail !== 0) return; const b = e.target.closest("[data-a]"); if (b && !b.disabled) act(b); });
document.addEventListener("keydown", (e) => { if (e.code === "Space" && !["INPUT", "BUTTON"].includes(e.target.tagName)) { e.preventDefault(); paused = !paused; dirty = true; } });
// Life-shaping choices are the player's: auto waits on these instead of picking for you.
const KEY_EV = new Set(["สายทาง", "ปั้นสเตตัส", "แรงก์", "คลาสพิเศษ", "ปลุกพลัง", "อาชีพ"]);
// The next frame is booked first, so one bad frame can never stop the life from running.
function loop(now) {
  requestAnimationFrame(loop);
  try { step(now); } catch (e) { dirty = true; if (!loop.warned) { loop.warned = 1; console.error("game loop", e); } }
}
function step(now) {
  const dt =Math.min(0.25, (now - last) / 1000 || 0); last = now; ST.speed = 1 + (speed - 1) * 0.5;
  if (s && !s.dead) {
    if (!ST.busy) {
      if (s.ev) { if (auto && !paused && !KEY_EV.has(s.ev.tag) && (autoT += dt) > SPEEDS[speed] * 2.5) { autoT = 0; E.choose(s, E.autoChoice(s)); dirty = true; save(); } }
      else if (!paused) { acc += dt; while (acc >= SPEEDS[speed] && !s.ev && !s.dead) { acc -= SPEEDS[speed]; if (auto) E.autoPlan(s); E.tick(s); dirty = true; if (++ticks % 24 === 0) save(); } if (s.ev) acc = 0; }
    }
    flushFx();
    if (s.dead && !ST.busy) { draw(); ended(); }
    else if (dirty && now - (loop.t || 0) > 120) { loop.t = now; draw(); }
  }
}
initStage($("#cv"), $("#ov")); $("#stagewrap").addEventListener("pointerdown", skip); menu(); requestAnimationFrame(loop);
