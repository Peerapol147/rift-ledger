// The cast across 100 worlds where the player never touches them: alive, retired and mean rank at world years 30,
// 60 and 90 (main cast design §10). Usage: node tools/cast-cohort.mjs [worlds=100]
import * as C from "../src/core/index.js";
import { CAST, } from "../src/data/cast.js";
import { RANKS } from "../src/data/world.js";

const N = Number(process.argv[2] ?? 100);
for (const year of [30, 60, 90]) {
  const rows = Object.fromEntries(Object.keys(CAST).map((id) => [id, { alive: 0, retired: 0, rank: 0, over: 0 }]));
  for (let i = 0; i < N; i++) {
    const s = C.newLife("cohort-" + i); s.ageM = year * 12; C.updatePeople(s);
    for (const p of Object.values(s.world.people).filter((x) => x.cast)) {
      const r = rows[p.cast];
      if (p.diedWorldM == null) r.alive++;
      if (p.retired) r.retired++;
      r.rank += p.rank; if (p.rank > p.ceiling) r.over++;
    }
  }
  console.log(`world year ${year}:`);
  for (const [id, r] of Object.entries(rows)) {
    console.log(`  ${CAST[id].name.padEnd(20)} alive ${Math.round((r.alive / N) * 100)}% · retired ${Math.round((r.retired / N) * 100)}%`
      + ` · mean rank ${RANKS[Math.round(r.rank / N)]}${r.over ? ` · OVER CEILING ${r.over}` : ""}`);
  }
}
