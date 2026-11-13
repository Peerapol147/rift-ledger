// Plays many lives and lists rule breaks: random events repeating beyond what they declare, broken text, and events
// that contradict the life. node tools/lifecheck.mjs [lives=200]. Exits 1 if any list is not empty.
import { checkLives } from "../test/lifecheck-rules.mjs";

const n = +process.argv[2] || 200;
const r = checkLives(n, "lifecheck");
const top = (m) => [...m].sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log(`เล่น ${n} ชีวิต`);
console.log(`\nเหตุการณ์ที่มาซ้ำเกินที่ประกาศ (จำนวนชีวิต): ${r.repeats.size}`);
for (const [id, k] of top(r.repeats)) console.log(`  ${k}\t${id}`);
console.log(`\nข้อความเพี้ยน: ${r.badText.size}`);
for (const [t, k] of top(r.badText)) console.log(`  ${k}\t${t}`);
console.log(`\nเหตุการณ์ที่ไม่เข้ากับชีวิต: ${r.ageMisfits.length}`);
for (const t of r.ageMisfits.slice(0, 25)) console.log(`  ${t}`);
process.exit(r.repeats.size || r.badText.size || r.ageMisfits.length ? 1 : 0);
