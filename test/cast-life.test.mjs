// The cast live their own lives, a little different in every world (P2a Task 2; spec §5–§6).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";
import { CAST } from "../src/data/cast.js";

const castOf = (s) => Object.values(s.world.people).filter((p) => p.cast);
const at = (seed, years) => { const s = C.newLife(seed); s.ageM = years * 12; return s; };
const strip = (s) => JSON.stringify(castOf(s).map(({ id, ...p }) => p));

test("batched years equal monthly steps", () => {
  const a = C.newLife("cl1"), b = C.newLife("cl1");
  a.ageM = 120; C.updatePeople(a);
  for (let m = 1; m <= 120; m++) { b.ageM = m; C.updatePeople(b); }
  assert.equal(strip(a), strip(b));
  assert.deepEqual(a.r["cast:poramet"], b.r["cast:poramet"]);
});

test("a month already processed changes nothing", () => {
  const s = at("cl2", 30); C.updatePeople(s);
  const once = strip(s), r = JSON.stringify(s.r);
  C.updatePeople(s);
  assert.equal(strip(s), once);
  assert.equal(JSON.stringify(s.r), r);
});

test("ranks never pass the ceiling", () => {
  for (let i = 0; i < 200; i++) {
    const s = at("cl3-" + i, 70); C.updatePeople(s);
    for (const p of castOf(s)) assert.ok(p.rank <= p.ceiling && p.rank >= 0, `${p.cast} ${p.rank}`);
  }
});

test("lives differ across seeds", () => {
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const s = at("cl4-" + i, 60); C.updatePeople(s);
    seen.add(castOf(s).map((p) => `${p.cast}:${p.rank}:${p.diedWorldM == null}:${p.retired ? 1 : 0}`).join("|"));
  }
  assert.ok(seen.size >= 10, `only ${seen.size} different worlds`);
});

test("the peers awaken at eighteen and join a guild of their country", () => {
  const s = at("cl5", 25); C.updatePeople(s);
  const lalin = castOf(s).find((p) => p.cast === "lalin");
  assert.ok(lalin.hunter);
  assert.ok(["chaophraya", "saengnuea"].includes(lalin.guild));
});

test("the pulse and world streams are untouched", () => {
  const a = at("cl6", 10), b = at("cl6", 10);
  C.updatePeople(a);
  assert.deepEqual(a.r.pulse, b.r.pulse);
  assert.deepEqual(a.r.world, b.r.world);
});

test("someone who trusts you and lives in your city dies in gates less often", () => {
  let near = 0, far = 0;
  for (let i = 0; i < 400; i++) {
    const a = at("cl7-" + i, 1); a.city = "bkk"; C.updatePeople(a);
    const lalin = castOf(a).find((p) => p.cast === "lalin");
    C.changeRelation(a, lalin.id, { trust: 80 });
    a.ageM = 60 * 12; C.updatePeople(a);
    const b = at("cl7-" + i, 60); b.city = "cnx"; C.updatePeople(b);
    if (castOf(a).find((p) => p.cast === "lalin").diedWorldM != null) near++;
    if (castOf(b).find((p) => p.cast === "lalin").diedWorldM != null) far++;
  }
  assert.ok(near < far, `near ${near} far ${far}`);
});

test("a rescued member does not die in a gate for ten years", () => {
  const s = at("cl8", 25);
  const p = castOf(s).find((x) => x.cast === "dohyun");
  p.savedUntilWM = C.worldMonth(s) + 120;
  s.ageM = 35 * 12; C.updatePeople(s);
  assert.ok(p.diedWorldM == null || p.diedCause !== "gate");
});
