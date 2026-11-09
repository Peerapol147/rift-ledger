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
  const d = s.dead, h = hallList(); if (!s.saved) { s.saved = 1; h.unshift({ n: s.name, title: d.title, age: d.age, score: d.score, seed: s.seed }); store.set(HALL, JSON.stringify(h.slice(0, 30))); } store.del(KEY);
  $("#end").hidden = false; $("#end").innerHTML = `<div class="st-card"><p class="kicker">ปิดแฟ้มทะเบียน</p><h1>${esc(s.name)}</h1><p class="title">${esc(d.title)}</p><p class="lede">จากไปเมื่ออายุ ${d.age} ปี · ${esc(d.cause)}</p><div class="sum"><span>${s.hunter ? `แรงก์ ${RANKS[s.rank]} · Lv.${s.lv}` : esc(s.career ? CAREERS[s.career].t[s.cr] : "ไม่มีอาชีพ")}</span><span>หอชั้น ${s.floor}</span><span>ชื่อเสียง ${fmt(s.fame)}</span><span>กรรม ${s.karma}</span><span>เงิน ₡${fmt(s.gold)}</span><span>${fmt(d.score)} แต้ม</span></div><div class="row">${btn("ชีวิตใหม่", "menu", "pri")}${btn("เล่น Seed เดิม", "same", "ghost")}${s.kids.length ? btn(`สืบต่อเป็น ${esc(s.kids[0])}`, "heir", "ghost") : ""}</div></div>`;
}
// Which picture the stage shows comes from what the character is doing.
function sceneFor() { const st = E.stage(s); if (st === "k") return "home"; if (s.ev?.tag === "โลก") return "rift"; if (st === "c") return s.focus === "craft" ? "forge" : "street"; return { hunt: "rift", tower: "tower", guild: "guild", craft: "forge", train: "city", rest: "home" }[s.focus] || "city"; }
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
  const goal = st === "k" ? "ทุกเดือนในวัยเด็กจะกลายเป็นค่าสถานะติดตัวไปตอนโต" : s.hunter ? (!R ? "ไม่มีแรงก์ให้ไต่อีกแล้ว เหลือแต่ชื่อที่จะทิ้งไว้" : ex.ready ? `พร้อมสอบแรงก์ ${R} แล้ว รอซองเรียกจากสมาคม` : `สู่แรงก์ ${R}: Lv.${s.lv}/${LVCAP[s.rank] - 2} · สัญญาหลัก ${ex.have}/${ex.need}`) : next ? `สู่ตำแหน่ง ${next}: สัญญาหลัก ${ex.have}/${ex.need}` : s.career ? "ถึงจุดสูงสุดของสายงานแล้ว" : "ยังไม่มีงานประจำ รอโอกาสที่จะผ่านเข้ามา";
  const warn = st !== "k" && s.health < 35 && s.focus !== "rest" ? `<p class="bad">สุขภาพเหลือน้อย เปลี่ยนไปที่ "${fs.rest.n}" ก่อนจะล้มไปเอง</p>` : "";
  return `<div class="ev desk"><span class="tag">แผนเดือนนี้</span><p>${esc(goal)}</p>${warn}<div class="focus">${Object.entries(fs).map(([k, v]) => btn(v.n, `focus:${k}`, s.focus === k ? "on" : "")).join("")}</div></div>`;
}
function eventBox() {
  if (!s.ev) return desk(); const big = ["โลก", "คลาสพิเศษ", "ปลุกพลัง", "แรงก์"].includes(s.ev.tag);
  return `<div class="ev ${big ? "big" : ""}"><span class="tag">${esc(s.ev.tag)}</span><p>${esc(s.ev.t)}</p><div class="opts">${s.ev.o.map((o, i) => { const p = E.optOdds(s, o), cls = p == null ? "" : p >= 70 ? "g" : p >= 40 ? "m" : "b", why = o.fight ? "โอกาสชนะ" : o.s ? `ทดสอบ${STATS[o.s]}` : "โอกาส"; return `<button data-a="opt:${i}"><span>${o.who ? "★ " : ""}${esc(o.l)}<small>${esc(o.note || (o.who ? `ทางเลือกจากสายงานของคุณ · ${chip(o.y)}` : chip(o.y)))}</small></span>${p != null ? `<em class="${cls}" title="${why}">${why} ${p}%</em>` : ""}</button>`; }).join("")}</div></div>`;
}
const VIEWS = {
  log() { const L = s.log.filter((x) => !onlyImp || ["imp", "leg", "bad"].includes(x.cls)).slice(-160).reverse(); let y = -1, out = `<div class="row end">${btn(onlyImp ? "แสดงทั้งหมด" : "เฉพาะเรื่องสำคัญ", "imp", "ghost sm")}</div>`; for (const x of L) { if (x.y !== y) { y = x.y; out += `<h4>อายุ ${y}</h4>`; } out += `<p class="l ${x.cls}">${x.tag ? `<span>${esc(x.tag)}</span>` : ""}${esc(x.t)}${x.r ? `<em>${x.r}</em>` : ""}</p>`; } return out; },
  self() {
    const sp = s.w.specials.map((id) => SPECIALS.find((x) => x.id === id)).filter((x) => x), rows = sp.map((x) => { const need = Object.entries({ ...x.need, ...(x.max || {}) }).map(([k, v]) => `<span class="${(x.max && k in x.max ? E.val(s, k) <= v : E.val(s, k) >= v) ? "ok" : ""}">${E.NEED_LABEL[k] || k} ${x.max && k in x.max ? "≤" : ""}${v} (${Math.floor(E.val(s, k))})</span>`).join(""); return `<div class="item"><b>${s.spc === x.id ? "★ " : ""}${x.n}</b><small>${x.d}</small><div class="needs">${need}</div></div>`; }).join("");
    const job = (t, x, m = x.m) => `<div class="item"><b>${esc(t)}</b><small>${esc(x.d)}</small><small>${esc(E.perkText(m))}</small></div>`, jobs = `${s.cls ? job(`คลาส: ${CLASSES[s.cls].n}`, CLASSES[s.cls]) : ""}${s.career ? job(`อาชีพ: ${CAREERS[s.career].n}`, CAREERS[s.career]) : ""}${s.pastJob ? job(`อาชีพเดิม: ${CAREERS[s.pastJob].n} (ติดตัวครึ่งเดียว)`, CAREERS[s.pastJob], E.halve(CAREERS[s.pastJob].m)) : ""}`;
    return `<h3>ที่มา</h3><p>${esc(D.FAMILIES[s.fam].n)}: ${esc(D.FAMILIES[s.fam].d)}</p><p class="dim">Seed <b>${esc(s.seed)}</b> · ธาตุถนัด ${s.w.aff.map((e) => ELEMENTS[e].n).join(", ")}${s.hunter ? ` · ศักยภาพเพดานแรงก์ ${RANKS[s.w.ceil]}` : ""}</p>${jobs ? `<h3>สายงาน</h3>${jobs}` : ""}
    <h3>พลังแฝง</h3>${s.latent.map((i, x) => (x < s.rev ? `<div class="item"><b>${LATENTS[i].n}</b><small>${LATENTS[i].d}</small></div>` : `<div class="item dim"><b>???</b><small>ยังไม่ตื่น</small></div>`)).join("")}
    <h3>คลาสพิเศษที่ชะตาเปิดให้ชีวิตนี้</h3><p class="dim">ทำเงื่อนไขครบ เควสพิเศษจะมาหาคุณเอง</p>${rows}
    <h3>ผู้คนรอบตัว</h3><div class="grid2">${s.npcs.filter((n) => n.alive).sort((a, b) => b.rel - a.rel).slice(0, 10).map((n) => `<div class="item"><b>${esc(n.n)}</b><small>${esc(n.job)} ${n.hun ? `· Lv.${n.lv}` : ""} · ความสัมพันธ์ ${Math.round(n.rel)}</small></div>`).join("")}</div>${s.spouse != null ? `<p>คู่ชีวิต: ${esc(s.npcs[s.spouse].n)}${s.kids.length ? ` · ลูก: ${s.kids.map(esc).join(", ")}` : ""}</p>` : ""}`;
  },
  skills() {

    const list = s.sk.map((x) => E.sk(s, x.id)).sort((a, b) => b.p - a.p), KN = { atk: "โจมตี", guard: "ป้องกัน", step: "หลบ", heal: "ฟื้นฟู" };
    return `<p class="dim">ติดตั้งได้: โจมตี 3 · ป้องกัน 1 · หลบ 1 · ฟื้นฟู 1 วิชาธาตุถนัดแรงขึ้น 25%</p><div class="grid2">${list.map((x) => `<button class="item sel ${s.eq.includes(x.id) ? "on" : ""}" data-a="sk:${x.id}"><b style="color:${ELEMENTS[x.el].c}">${x.n}</b><small>${x.gn} · ${KN[x.k]} · พลัง ${(x.p * 100).toFixed(0)}% · ชำนาญ ${Math.floor(x.m)}</small></button>`).join("")}</div>`;
  },
  forge() {
    const slotOpts = { weapon: WEAPONS.map((x) => x.n), armor: ARMORS, charm: CHARMS }, f = craftForm, c = E.recipeCost(f.g), have = (k) => s.mat[k + f.g] || 0;
    const shop = E.SHOP.filter((x) => !x.hunter || s.hunter).map((x) => btn(`${x.n} ₡${fmt(x.price(s))}<small>${x.d}${x.id === "anvil" ? ` (ขั้น ${s.anvil})` : ""}</small>`, `buy:${x.id}`, "shop")).join("");
    const gear = s.gear.slice().sort((a, b) => E.gearPw(b) - E.gearPw(a)).map((g) => { const on = s.wear[g.slot] === g.id; return `<div class="item gear q${g.q}"><b>${on ? "▣ " : ""}${esc(E.gearName(g))}</b><small>${QUAL[g.q].n} · พลัง ${fmt(E.gearPw(g))}${g.affix != null ? ` · ${E.perkText(D.AFFIX[g.affix].m)}` : ""}</small><div class="row">${on ? "" : btn("สวม", `eq:${g.id}`, "sm")}${g.plus < 15 ? btn(`ตีบวก ${E.enhOdds(s, g)}% · ₡${fmt(E.enhCost(g))}`, `enh:${g.id}`, "sm amber") : ""}${btn("ขาย", `sell:${g.id}`, "sm ghost")}</div></div>`; }).join("");
    return `<h3>ตีอาวุธ</h3><div class="row wrap">${["weapon", "armor", "charm"].map((k) => btn({ weapon: "อาวุธ", armor: "เกราะ", charm: "เครื่องราง" }[k], `cs:${k}`, f.slot === k ? "on sm" : "sm ghost")).join("")}</div><div class="row wrap">${slotOpts[f.slot].map((n, i) => btn(n, `ct:${i}`, f.t === i ? "on sm" : "sm ghost")).join("")}</div><div class="row wrap">${GRADES.map((g, i) => btn(g.n, `cg:${i}`, f.g === i ? "on sm" : "sm ghost", i > s.anvil)).join("")}</div>
    <p class="dim">ใช้ ${MATS.ore} ${c.ore} (${have("ore")}) · ${MATS.hide} ${c.hide} (${have("hide")}) · ${MATS.core} ${c.core} (${have("core")}) · ₡${fmt(c.gold)} · สำเร็จ ${E.craftOdds(s, f.g)}% · ฝีมือช่าง ${Math.floor(s.craft)}</p>${btn("ลงมือตี", "craft", "pri")}
    <h3>ตลาดสมาคม</h3><p class="dim">ยา ${s.pot} · หินกันแตก ${s.stone} · แผ่นย้ายชีพ ${s.token}</p><div class="grid2">${shop}</div><h3>คลังอุปกรณ์</h3><p class="dim">ตีบวกล้ม: +5 ขึ้นไปลดระดับ · +10 ขึ้นไปอาวุธแตก เว้นแต่มีหินกันแตก</p>${gear || `<p class="dim">ยังไม่มีอุปกรณ์</p>`}`;
  },
  tower() {
    const f = Math.min(100, s.floor + 1), F = s.w.tower[f - 1], foe = E.enemy(E.floorFoe(s, f)), rank = [...s.npcs.filter((n) => n.alive && n.hun).map((n) => ({ n: n.n, f: n.floor })), { n: s.name + " (คุณ)", f: s.floor }].sort((a, b) => b.f - a.f).slice(0, 8), cells = s.w.tower.map((x, i) => `<i class="f-${x.t} ${i < s.floor ? "done" : i === s.floor ? "cur" : ""}" title="ชั้น ${i + 1}: ${x.name} · ${x.mod.n}"></i>`).join("");
    return `<h3>หอไร้ฟ้า · ชั้นสูงสุด ${s.floor}/100</h3><div class="tower">${cells}</div><p class="dim">ถัดไป: ชั้น ${f} · ${F.name} · ${F.mod.n} · ธาตุ${ELEMENTS[F.el].n}${s.hunter ? ` · โอกาสชนะ <b>${E.winOdds(s, foe)}%</b>` : ""}</p>${s.hunter ? "" : `<p class="dim">หอเปิดเฉพาะผู้ตื่นพลัง คุณได้แต่ดูชื่อบนจอไฟในตลาด</p>`}<h3>กระดานจัดอันดับ</h3><ol class="rank">${rank.map((r) => `<li><span>${esc(r.n)}</span><b>ชั้น ${r.f}</b></li>`).join("")}</ol>`;
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
const TABS = { log: "บันทึก", self: "ตัวตน", skills: "วิชา", forge: "โรงตี", tower: "หอ", guild: "กิลด์", world: "โลก" };
// Tabs follow the life stage: children have no forge, and only hunters have skills or a guild.
const tabsFor = () => Object.entries(TABS).filter(([k]) => (k !== "forge" || E.stage(s) !== "k") && (s.hunter || (k !== "skills" && k !== "guild")));
function draw() {
  if (!s) return; if (!tabsFor().some(([k]) => k === tab)) tab = "log"; setScene(sceneFor(), 7 + (s.ageM % 3)); setHero(s.cls ? CLASSES[s.cls].c : "#7fa8c9", E.stage(s) === "k");
  $("#card").innerHTML = card(); $("#event").innerHTML = eventBox(); $("#tabs").innerHTML = tabsFor().map(([k, n]) => btn(n, `tab:${k}`, tab === k ? "on" : "")).join("");
  if (document.activeElement?.id !== "gname") $("#view").innerHTML = VIEWS[tab]();
  $("#ctrl").innerHTML = `${btn(paused ? "เล่นต่อ" : "หยุด", "pause", paused ? "on" : "")}${[1, 2, 4, 8].map((v) => btn(v + "×", `spd:${v}`, speed === v ? "on" : "")).join("")}${btn(auto ? "ออโต้ เปิด" : "ออโต้ ปิด", "auto", auto ? "on" : "")}${btn("เมนู", "menu", "ghost")}`;
  dirty = false;
}
function flushFx() { while (E.fxOut.length) { const f = E.fxOut.shift(); trigger(f); if (f.n !== "minor" && f.n !== "coin") dirty = true; } }
const ACT = {
  new: () => start($("#iseed").value.trim() || randSeed(), $("#iname").value.trim() || "ไร้นาม"), cont: () => { s = load(); if (s) { $("#start").hidden = true; $("#game").hidden = false; draw(); } }, reseed: () => ($("#iseed").value = randSeed()), menu: () => { if (s && !s.dead) save(); s = null; menu(); },
  same: () => start(s.seed, s.name), heir: () => { const w = E.gearOf(s, s.wear.weapon); start(`${s.seed}/${s.kids[0]}`, s.kids[0], { gold: Math.max(0, s.gold * 0.3), from: s.name, gear: w ? { ...w, plus: Math.max(0, w.plus - 2) } : null }); },
  pause: () => (paused = !paused), auto: () => (auto = !auto), imp: () => (onlyImp = !onlyImp), craft: () => E.craft(s, craftForm.slot, craftForm.t, craftForm.g), found: () => { const n = $("#gname").value.trim(); if (n) E.foundGuild(s, n); }, leave: () => E.leaveGuild(s),
  tab: (v) => (tab = v), spd: (v) => (speed = +v), tip: (v) => (tip = tip === v ? null : v), focus: (v) => (s.focus = v), opt: (v) => { E.choose(s, +v); save(); }, sk: (v) => E.toggleSkill(s, v), eq: (v) => E.equip(s, +v), enh: (v) => E.enhance(s, +v, s.stone > 0), sell: (v) => E.sell(s, +v), buy: (v) => E.buy(s, v), cs: (v) => { craftForm.slot = v; craftForm.t = 0; }, ct: (v) => (craftForm.t = +v), cg: (v) => (craftForm.g = +v), join: (v) => E.joinGuild(s, +v), hall: (v) => E.upgradeHall(s, v), rec: (v) => E.recruit(s, +v), don: (v) => E.donate(s, +v),
};
function act(el) { const [k, v] = el.dataset.a.split(":"); ACT[k]?.(v); flushFx(); if (s) { dirty = true; draw(); } if (s?.dead) ended(); }
document.addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-a]"); if (b && !b.disabled) act(b); });
document.addEventListener("click", (e) => { if (e.detail !== 0) return; const b = e.target.closest("[data-a]"); if (b && !b.disabled) act(b); });
document.addEventListener("keydown", (e) => { if (e.code === "Space" && !["INPUT", "BUTTON"].includes(e.target.tagName)) { e.preventDefault(); paused = !paused; dirty = true; } });
function loop(now) {
  const dt = Math.min(0.25, (now - last) / 1000 || 0); last = now; ST.speed = 1 + (speed - 1) * 0.5;
  if (s && !s.dead) {
    if (!ST.busy) {
      if (s.ev) { if (auto && !paused && (autoT += dt) > SPEEDS[speed] * 2.5) { autoT = 0; E.choose(s, E.autoChoice(s)); dirty = true; save(); } }
      else if (!paused) { acc += dt; while (acc >= SPEEDS[speed] && !s.ev && !s.dead) { acc -= SPEEDS[speed]; E.tick(s); dirty = true; if (++ticks % 24 === 0) save(); } if (s.ev) acc = 0; }
    }
    flushFx();
    if (s.dead && !ST.busy) { draw(); ended(); }
    else if (dirty && now - (loop.t || 0) > 120) { loop.t = now; draw(); }
  }
  requestAnimationFrame(loop);
}
initStage($("#cv"), $("#ov")); $("#stagewrap").addEventListener("pointerdown", skip); menu(); requestAnimationFrame(loop);
