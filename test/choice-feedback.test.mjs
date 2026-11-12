// What a choice did is kept on its log line, and the player can see where starting stats came from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLife, openEvent, choose, serialize, deserialize, statOrigin } from "../src/core/index.js";
import { FAMILIES } from "../src/data/families.js";

const adult = () => { const s = newLife("fx"); s.ageM = 30 * 12; s.ev = null; s.gold = 1000; return s; };
const lastChoice = (s) => s.log.filter((l) => l.text.includes(" → ")).at(-1);

test("a choice's log line lists what changed: stats, money, mind", () => {
  const s = adult(), str0 = s.st.str;
  openEvent(s, { id: "t", t: "เรื่อง", o: [{ l: "ทำ", y: { m: "ok", st: { str: 1 }, gold: -500, mind: -6 } }] });
  choose(s, 0);
  const fx = Object.fromEntries(lastChoice(s).fx.map((e) => [e.k, e.d]));
  assert.equal(fx.str, 1);
  assert.equal(fx.gold, -500);
  assert.equal(fx.mind, -6);
  assert.equal(s.st.str, str0 + 1);
});

test("a choice that changes nothing carries no result list", () => {
  const s = adult();
  openEvent(s, { id: "t", t: "เรื่อง", o: [{ l: "เฉยๆ", y: { m: "ไม่มีอะไร" } }] });
  choose(s, 0);
  assert.equal(lastChoice(s).fx, undefined);
});

test("a save keeps valid results and drops anything else", () => {
  const s = adult();
  openEvent(s, { id: "t", t: "เรื่อง", o: [{ l: "ทำ", y: { gold: 200 } }] });
  choose(s, 0);
  s.log.push({ m: 1, tag: "ชีวิต", text: "x → y", tone: "", fx: [{ k: "<b>", d: 5 }, { k: "gold", d: "9" }, "junk"] });
  const back = deserialize(serialize(s));
  assert.deepEqual(back.log.at(-2).fx, [{ k: "gold", d: 200 }]);
  assert.deepEqual(back.log.at(-1).fx, [{ k: "gold", d: 9 }]);
});

test("starting stats are explained: birth roll plus the family's bonus", () => {
  for (const seed of ["a", "b", "c", "d"]) {
    const s = newLife(seed), fam = FAMILIES.find((f) => f.id === s.family);
    const o = statOrigin(s);
    for (const k of Object.keys(s.st)) {
      assert.equal(o[k].fam, fam.st[k] ?? 0);
      assert.equal(o[k].born, s.st[k]);
      assert.ok(o[k].roll >= 4 && o[k].roll <= 7, `${k} roll ${o[k].roll}`);
      assert.equal(o[k].roll + o[k].fam, o[k].born);
    }
  }
});

test("an heir's birth roll is explained against the family the heir is born into", async () => {
  const { newHeir } = await import("../src/core/index.js");
  for (const seed of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const P = newLife("p-" + seed); P.ageM = 60 * 12; P.dead = { cause: "x" }; P.c.kids = 1;
    const h = newHeir(P, seed), o = statOrigin(h);
    for (const k of Object.keys(h.st)) assert.ok(o[k].roll >= 4 && o[k].roll <= 7, `${seed} ${k} roll ${o[k].roll}`);
  }
});
