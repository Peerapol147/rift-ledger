// Bot playtest: lives played by different kinds of player, every event and state checked for bugs, and a few
// signs of fun measured. node tools/playtest.mjs [lives=200]
import * as C from "../src/core/index.js";
import { mk, rnd } from "../src/core/rng.js";

const N = +process.argv[2] || 200;
const PERSONAS = {
  curious: (s, open) => open.find((x) => !(s.c["tried:" + s.ev.id + ":" + x.i])) ?? open[0], // tries what it has not
  careful: (s, open) => open.slice().sort((a, b) => (b.v.odds ?? 90) - (a.v.odds ?? 90) || (a.v.risk ?? 0) - (b.v.risk ?? 0))[0],
  greedy: (s, open) => open.slice().sort((a, b) => worth(b.o) - worth(a.o))[0],
  fate: (s, open, R) => open[Math.floor(rnd(R) * open.length)],
};
// The monthly plan, as each kind of player would set it about twice a year.
const PLANS = {
  curious: (s, ids, R) => ids[Math.floor(rnd(R) * ids.length)],
  careful: (s, ids) => (ids.includes("work") ? "work" : ids.includes("study") ? "study" : ids[0]),
  greedy: (s, ids) => (ids.includes("hunt") ? "hunt" : ids.includes("work") ? "work" : ids[0]),
  fate: (s, ids, R) => ids[Math.floor(rnd(R) * ids.length)],
};
const worth = (o) => (o.y?.gold ?? 0) / 100 + (o.y?.fame ?? 0) * 3 + (o.y?.loot ?? 0) * 5 + (o.s ? 1 : 0);
const BAD_TEXT = /undefined|NaN|null|\{[a-z]+\}|\[object/;
const bugs = new Map(), fun = { lives: 0, choices: 0, distinct: 0, rare: 0, hunters: 0, ages: [], causes: {}, silences: [] };
const bug = (kind, detail) => { const k = kind + " · " + detail; bugs.set(k, (bugs.get(k) ?? 0) + 1); };

function checkState(s, where) {
  for (const k of ["gold", "fame", "hp", "mind", "ageM"]) if (!Number.isFinite(s[k])) bug("ค่าเสีย", `${k}=${s[k]} @${where}`);
  for (const [k, v] of Object.entries(s.st)) if (!Number.isFinite(v)) bug("ค่าเสีย", `stat ${k} @${where}`);
  if (s.hp > 100 || s.mind > 100 || s.mind < 0) bug("ค่าเกินขอบ", `hp ${s.hp} mind ${s.mind} @${where}`);
  if (s.gold < -1e6) bug("เงินติดลบหนัก", `${Math.round(s.gold)} @${where}`);
}

for (const [pname, pick] of Object.entries(PERSONAS)) {
  for (let i = 0; i < N / 4; i++) {
    const s = C.newLife(`pt-${pname}-${i}`), R = mk(s.seed, "bot"), seen = new Set();
    let lastChoiceM = 0, worstGap = 0;
    for (let step = 0; step < 6000 && !s.dead; step++) {
      try {
        if (!s.ev) {
          if (s.ageM % 6 === 0 && !s.op) {
            const ids = C.focusList(s).map((f) => f.id);
            const want = PLANS[pname](s, ids, R);
            if (ids.includes("hunt") && pname !== "careful" && rnd(R) < 0.6) C.setFocus(s, "hunt"); else C.setFocus(s, want);
          }
          C.advance(s); continue;
        }
        const ev = s.ev, id = String(ev.id);
        if (BAD_TEXT.test(ev.t)) bug("ข้อความเพี้ยน", `${id}: ${ev.t.slice(0, 60)}`);
        const open = ev.opts.map((o, j) => ({ o, i: j, v: C.optionView(s, o) })).filter((x) => x.v.visible && !x.v.locked);
        for (const x of open) if (!x.v.label || BAD_TEXT.test(x.v.label)) bug("ตัวเลือกเพี้ยน", `${id}: "${x.v.label}"`);
        if (!open.length) { bug("ไม่มีทางเลือก", id); s.ev = null; continue; }
        const x = pick(s, open, R);
        s.c["tried:" + id + ":" + x.i] = 1;
        seen.add(id.split(":")[0]);
        if (!ev.op) { worstGap = Math.max(worstGap, s.ageM - lastChoiceM); lastChoiceM = s.ageM; fun.choices++; }
        if (/^(sq|fachi|facbad|heir|truth)/.test(id)) fun.rare++;
        const before = s.ev;
        C.choose(s, x.i);
        if (s.ev === before) { bug("เลือกแล้วไม่ไปต่อ", id); s.ev = null; }
        checkState(s, id);
      } catch (e) {
        bug("โค้ดพัง", `${String(s.ev?.id ?? "tick")}: ${e.message}`);
        s.ev = null; if (s.op) s.op = null;
      }
    }
    if (!s.dead) bug("ชีวิตไม่จบ", `${s.seed} อายุ ${C.ageY(s)}`);
    for (const l of s.log) if (BAD_TEXT.test(l.text)) bug("บันทึกเพี้ยน", l.text.slice(0, 70));
    fun.lives++; fun.distinct += seen.size; if (s.hunter) fun.hunters++;
    fun.ages.push(C.ageY(s)); fun.silences.push(worstGap);
    const cause = s.dead?.cause ?? "?"; fun.causes[cause] = (fun.causes[cause] ?? 0) + 1;
  }
}

const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
console.log(`เล่น ${fun.lives} ชีวิต (${Object.keys(PERSONAS).join(", ")})`);
console.log(`ต่อชีวิต: เลือกเอง ${(fun.choices / fun.lives).toFixed(0)} ครั้ง · เรื่องไม่ซ้ำ ${(fun.distinct / fun.lives).toFixed(0)}`
  + ` · เรื่องหายาก ${(fun.rare / fun.lives).toFixed(1)} · ฮันเตอร์ ${Math.round(fun.hunters / fun.lives * 100)}%`);
console.log(`อายุตอนตาย (มัธยฐาน) ${med(fun.ages)} · ช่วงที่ไม่มีให้เลือกนานสุด (มัธยฐาน) ${Math.round(med(fun.silences) / 12)} ปี`);
console.log("สาเหตุการตาย:", Object.entries(fun.causes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(" · "));
console.log(bugs.size ? `บั๊ก ${bugs.size} แบบ:` : "ไม่เจอบั๊ก");
for (const [k, v] of [...bugs].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`  ${v}×  ${k}`);
process.exitCode = bugs.size ? 1 : 0;
