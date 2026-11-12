import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, awakenCheck, startOp, stepOp, choose, foe } from "../src/core/index.js";
import { GATES } from "../src/data/index.js";

// A boss gate at the hunter's own level, fought with the retreat plan and never picking a flee option in the
// decisions: the only way out is the plan's retreat below 35% hp. It must actually happen, not be skipped by a
// boss that takes you from above 35% to zero in one turn.
const decisions = GATES[0].decisions.map((d) => ({ ...d, o: d.o.filter((o) => !o.y?.flee && !o.need && !o.nerve) }));
function bossFight(seed, lv) {
  const s = newLife(seed); s.ageM = 25 * 12;
  awakenCheck(s, "event"); s.hunter.lv = lv;
  const def = { id: "t", kind: "gate", t: "test", decisions, boss: true, rewards: { gold: 100, items: [] },
    foes: [foe("สุนัขท่อระบาย", lv, "wood"), foe("สุนัขท่อระบาย", lv, "wood"), foe("ราชาลานจอด", lv + 4, "metal", true)] };
  startOp(s, def, { plan: "retreat", skills: s.hunter.slots, quick: [], team: [] });
  let r = "running", ranAway = false;
  for (let i = 0; i < 300 && s.op; i++) {
    if (s.ev) { choose(s, 0); continue; }
    ranAway = !!s.op.ranAway; r = stepOp(s);
  }
  return { r, ranAway, dead: !!s.dead };
}

test("retreating from a boss below 35% hp happens instead of a loss", () => {
  for (const lv of [10, 30, 55]) {
    let lost = 0, fled = 0;
    for (let i = 0; i < 60; i++) {
      const f = bossFight(`br${lv}-${i}`, lv);
      if (f.r === "lost") lost++;
      if (f.r === "fled") fled++;
    }
    assert.ok(fled > 0, `lv ${lv}: no boss retreat ever happened`);
    assert.ok(lost <= fled, `lv ${lv}: ${lost} losses vs ${fled} retreats: the boss kills before you can leave`);
  }
});
