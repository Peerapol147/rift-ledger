// Paired-choice cohort for the office story (owner's pack §05 C1): the same 100 seeds played three ways (help, duty,
// gain). Reports every life — started, completed, died first, still waiting — and how many seeds ended differently.
// Lives start as office workers at 24 (a fixture start, not a natural birth-to-death playthrough).
// Usage: node tools/story-cohort.mjs [seeds=100]
import * as C from "../src/core/index.js";
import { firstOpen } from "../test/helpers.mjs";

const N = Number(process.argv[2] ?? 100);
const HELP = { intake: "อ่านแฟ้มทั้งคืน", "seek-help": "ทำเองให้เสร็จ", claim: "ใช้สิ่งที่คุณเจอช่วยเขา",
  appeal: "ช่วยรวบรวมเอกสาร", paid: "ปฏิเสธของฝากอย่างสุภาพ", "paid-late": "ช่วยหาอุปกรณ์มือสอง",
  "routine-review": "ไล่ดูตัวเลขที่ไม่ตรง", audit: "ปฏิเสธ", pushback: "ลาออก", "independent-offer": "เปิดบริษัทที่ปรึกษา",
  "client-return": "เปิดกิจการ", "client-search": "เปิดแล้วหาลูกค้าเอง" };
const DUTY = { intake: "ทำตามแบบฟอร์ม", routine: "อยู่ในขอบเขตงานตัวเอง", "routine-review": "อยู่ต่อ" };
const GAIN = { intake: "อ่านแฟ้มทั้งคืน", "seek-help": "ทำเองให้เสร็จ", claim: "ปฏิเสธตามสัญญา", denied: "ไม่ออกไปพบ",
  "routine-review": "ไล่ดูตัวเลขที่ไม่ตรง", audit: "ยอมแก้ตัวเลข", "cover-up": "รับเงิน", liability: "เก็บเงียบ" };
const POLICIES = [["help", HELP, 30000], ["duty", DUTY, 0], ["gain", GAIN, 0]];

function life(seed, want, gold, forced) {
  const s = C.newLife(seed); s.ageM = 24 * 12; s.ev = null; s.job = { id: "office", tier: 1, xp: 0 }; s.gold = gold;
  if (forced) for (const k of Object.keys(s.st)) s.st[k] = 40;
  const st = () => s.narrative.stories.office;
  for (let n = 0; n < 60000 && !s.dead && C.ageY(s) < 75 && st()?.status !== "done"; n++) {
    if (!s.ev) { C.advance(s); continue; }
    const k = s.ev.story?.id === "office" ? s.ev.opts.findIndex((o) => o.l === want[s.ev.story.node]) : -1;
    C.choose(s, k >= 0 ? k : Math.max(0, firstOpen(s)));
  }
  const x = st();
  return { started: !!x, done: x?.status === "done", ending: x?.ending ?? null, died: !!s.dead && x?.status !== "done",
    waiting: !!x && x.status !== "done" && !s.dead };
}

for (const forced of [false, true]) {
  const count = { started: 0, done: 0, died: 0, waiting: 0, lives: 0 }, ends = {};
  let comparable = 0, differ = 0;
  for (let i = 0; i < N; i++) {
    const seed = "narrative-" + String(i).padStart(3, "0");
    const got = POLICIES.map(([, want, gold]) => life(seed, want, gold, forced));
    for (const g of got) {
      count.lives++;
      for (const k of ["started", "done", "died", "waiting"]) if (g[k]) count[k]++;
      if (g.ending) ends[g.ending] = (ends[g.ending] ?? 0) + 1;
    }
    if (got.every((g) => g.done)) { comparable++; if (new Set(got.map((g) => g.ending)).size >= 2) differ++; }
  }
  console.log(`${forced ? "forced stats 40" : "natural stats"}: ${JSON.stringify(count)}`);
  console.log(`  endings ${JSON.stringify(ends)}`);
  console.log(`  seeds where all three finished: ${comparable}/${N}; of those with ≥2 endings: ${differ} `
    + `(${comparable ? Math.round((differ / comparable) * 100) : 0}%)`);
}
