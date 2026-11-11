import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, secretMonth, choose, awakenCheck } from "../src/core/index.js";
import { SECRETS } from "../src/data/index.js";

test("each life draws three secret quests, fixed by seed", () => {
  const a = newLife("sq1"), b = newLife("sq1");
  assert.equal(a.secrets.length, 3);
  assert.deepEqual(a.secrets, b.secrets);
  for (const id of a.secrets) assert.ok(SECRETS[id]);
});

const run = (s, months) => { const seen = []; for (let i = 0; i < months; i++) { s.ageM++; secretMonth(s); if (s.ev) { seen.push(s.ev.id); choose(s, 0); } } return seen; };

test("steps open in order and only after the previous step advanced; the token comes once", () => {
  const s = newLife("sq2"); s.ageM = 30 * 12; awakenCheck(s, "event"); s.secrets = ["phoenix"];
  const seen = run(s, 120);
  assert.deepEqual(seen.filter((x) => x.startsWith("sq:phoenix")), ["sq:phoenix:0", "sq:phoenix:1", "sq:phoenix:2"]);
  assert.equal(s.items.filter((i) => i.id === "phoenixToken").length, 1);
  s.c["sq:phoenix"] = 0; s.c["sqo:phoenix"] = 0; run(s, 120);
  assert.equal(s.items.filter((i) => i.id === "phoenixToken").length, 1);
});

test("a declined step stalls the quest", () => {
  const s = newLife("sq3"); s.ageM = 30 * 12; s.secrets = ["seven"];
  for (let i = 0; i < 60 && !s.ev; i++) { s.ageM++; secretMonth(s); }
  assert.equal(s.ev.id, "sq:seven:0");
  choose(s, 1);
  assert.deepEqual(run(s, 200).filter((x) => x.startsWith("sq:seven")), []);
});
